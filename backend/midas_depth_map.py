import torch
import cv2
import numpy as np
import open3d as o3d
import matplotlib.pyplot as plt
import os
from torchvision.transforms import Compose, Normalize, Resize, ToTensor, InterpolationMode
import ssl
from urllib import request
from PIL import Image
from diffusers import MarigoldDepthPipeline




# Create an SSL context that ignores certificate verification
ssl._create_default_https_context = ssl._create_unverified_context

def load_marigold_model():
    """
    Loads the Marigold depth estimation model from Hugging Face.
    
    Returns:
        pipe: The loaded Marigold pipeline.
    """
    try:
        # Check if CUDA is available and use appropriate dtype
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        if torch.cuda.is_available():
            # Use fp16 for CUDA
            pipe = MarigoldDepthPipeline.from_pretrained(
                "prs-eth/marigold-depth-v1-1", 
                variant="fp16", 
                torch_dtype=torch.float16
            ).to(device)
        else:
            # Use default for CPU
            pipe = MarigoldDepthPipeline.from_pretrained(
                "prs-eth/marigold-depth-v1-1"
            ).to(device)
        
        print(f"Marigold model loaded successfully on {device}")
        return pipe
    except Exception as e:
        print(f"Error loading Marigold model: {e}")
        raise e


def save_depth_map_as_png(depth_map, output_path="depth_map_test.png"):
    # Normalize the depth map for visualization (0-255 range for 8-bit)
    depth_map_normalized = (depth_map - depth_map.min()) / (depth_map.max() - depth_map.min())
    depth_map_uint8 = (depth_map_normalized * 255).astype(np.uint8)

    # Save as PNG
    plt.imsave(output_path, depth_map_uint8, cmap='plasma')
    return output_path

def save_depth_values_as_image(depth_array, output_path="panorama_depth.png"):
    """
    Save depth information in an image format preserving the original values.
    
    Args:
        depth_array (numpy.ndarray): Depth values (2D array).
        output_path (str): Path to save the image.
    """
    # Convert the array to 16-bit to preserve precision (scaled by 1 to avoid changes)
    depth_array_16bit = depth_array.astype(np.uint16)
    
    # Save as a 16-bit PNG
    cv2.imwrite(output_path, depth_array_16bit)
    return output_path

def estimate_depth(pipe, image, device):
    """
    Estimates the depth map of an image using Marigold.
    
    Args:
        pipe: The Marigold pipeline.
        image (PIL.Image): The input image (as a PIL.Image object).
        device: The device to run the model on.
        
    Returns:
        depth_map (numpy.ndarray): The estimated depth map.
        depth_map_normalized (numpy.ndarray): The normalized depth map.
    """
    try:
        # Use Marigold to estimate depth
        # The Marigold pipeline expects a PIL image and returns a depth prediction
        depth_result = pipe(image)
        
        # Extract the depth prediction tensor
        depth_prediction = depth_result.prediction
        
        # Convert tensor to numpy array
        # depth_prediction is typically a tensor with shape [1, 1, H, W]
        if isinstance(depth_prediction, torch.Tensor):
            depth_map = depth_prediction.squeeze().cpu().numpy()
        else:
            # If it's already a numpy array
            depth_map = depth_prediction.squeeze()
        
        # Ensure depth map is 2D
        if len(depth_map.shape) > 2:
            depth_map = depth_map[0] if depth_map.shape[0] == 1 else np.mean(depth_map, axis=0)
        
        # Resize to match input image dimensions if necessary
        if depth_map.shape != (image.height, image.width):
            depth_map = cv2.resize(depth_map, (image.width, image.height), interpolation=cv2.INTER_LINEAR)
        
        # Convert to float32
        depth_map = depth_map.astype(np.float32)
        
        # The Marigold model outputs depth values in [0, 1] range
        # We need to scale them appropriately for the 3D pipeline
        # Since the original MiDaS values were used with specific scaling,
        # we'll scale the [0,1] range to a reasonable depth range
        depth_scale = 1000.0  # Scale to reasonable depth values
        depth_map = depth_map * depth_scale
        
        # Create normalized version for visumkalization (0-1 range)
        depth_min = depth_map.min()
        depth_max = depth_map.max()
        
        if depth_max > depth_min:
            depth_map_normalized = (depth_map - depth_min) / (depth_max - depth_min)
        else:
            depth_map_normalized = np.ones_like(depth_map) * 0.5
        
        return depth_map, depth_map_normalized
        
    except Exception as e:
        print(f"Error in depth estimation: {e}")
        # Fallback: create a dummy depth map
        depth_map = np.ones((image.height, image.width), dtype=np.float32) * 100.0
        depth_map_normalized = np.ones((image.height, image.width), dtype=np.float32) * 0.5
        return depth_map, depth_map_normalized


def create_point_cloud(image, depth_map, focal_length=1.0):
    """
    Creates a point cloud from an image and its corresponding depth map.
    
    Args:
        image (numpy.ndarray): The input RGB image.
        depth_map (numpy.ndarray): The depth map corresponding to the image.
        focal_length (float): The focal length for camera intrinsic parameters.
        
    Returns:
        pcd (open3d.geometry.PointCloud): The generated point cloud.
    """
    height, width = depth_map.shape
    i, j = np.meshgrid(np.arange(width), np.arange(height), indexing='xy')
    
    # Assuming the principal point is at the center
    i = i - width / 2
    j = j - height / 2
    
    # Normalize the coordinates
    X = i / focal_length * depth_map
    Y = j / focal_length * depth_map
    Z = depth_map
    
    # Stack into a (N, 3) array
    points = np.stack((X, Y, Z), axis=-1).reshape(-1, 3)
    
    # Get colors from the image
    colors = image.reshape(-1, 3) / 255.0  # Normalize to [0,1]
    
    # Create Open3D point cloud
    pcd = o3d.geometry.PointCloud()
    pcd.points = o3d.utility.Vector3dVector(points)
    pcd.colors = o3d.utility.Vector3dVector(colors)
    
    return pcd

def create_mesh_from_point_cloud(pcd, depth=8):
    """
    Creates a mesh from a point cloud using Poisson surface reconstruction.
    
    Args:
        pcd (open3d.geometry.PointCloud): The input point cloud.
        depth (int): Depth parameter for Poisson reconstruction (controls the resolution of the mesh).
        
    Returns:
        mesh (open3d.geometry.TriangleMesh): The generated mesh.
    """
    # Estimate normals
    pcd.estimate_normals(search_param=o3d.geometry.KDTreeSearchParamHybrid(radius=0.1, max_nn=30))
    
    # Poisson reconstruction
    mesh, densities = o3d.geometry.TriangleMesh.create_from_point_cloud_poisson(pcd, depth=depth)
    
    # Remove low-density vertices
    densities = np.asarray(densities)
    density_threshold = np.percentile(densities, 5)
    vertices_to_remove = densities < density_threshold
    mesh.remove_vertices_by_mask(vertices_to_remove)
    
    return mesh


def save_mesh(mesh, filename):
    """
    Saves the mesh to a glTF file.
    
    Args:
        mesh (open3d.geometry.TriangleMesh): The mesh to save.
        filename (str): The output filename.
    """
    # Export as glTF
    o3d.io.write_triangle_mesh(filename, mesh, write_ascii=True)
    print(f"Mesh saved to {filename}")


def visualize_depth_map(depth_map_normalized):
    """
    Visualizes the normalized depth map and optionally saves it as grayscale.

    Args:
        depth_map_normalized (numpy.ndarray): The normalized depth map.
    """
    # Save as grayscale image
    
    fig, ax = plt.subplots()
    cax = ax.imshow(depth_map_normalized, cmap='plasma')
    fig.colorbar(cax)
    ax.set_title("Normalized Depth Map (Colormapped)")
    fig.savefig("depth_map.png")
    plt.close(fig)

def save_marigold_depth_visualization(pipe, depth_result, output_path="marigold_depth_vis.png"):
    """
    Save depth visualization using Marigold's built-in visualization method.
    
    Args:
        pipe: The Marigold pipeline.
        depth_result: The depth result from Marigold pipeline.
        output_path (str): Path to save the visualization.
    """
    try:
        vis = pipe.image_processor.visualize_depth(depth_result.prediction)
        vis[0].save(output_path)
        print(f"Marigold depth visualization saved to {output_path}")
        return output_path
    except Exception as e:
        print(f"Error saving Marigold depth visualization: {e}")
        return None
    

def midas_main(input_image_path, output_mesh_path, model_type="DPT_Large", model_path="models/midas/dpt_large-midas-2f21e586.pt"):
    """
    Main function to process the image and generate the depth map using Marigold.
    Note: model_type and model_path parameters are kept for backward compatibility but not used.
    
    Args:
        input_image_path (str): Path to the input image.
        output_mesh_path (str): Path to save the output mesh (e.g., 'output_mesh.gltf').
        model_type (str): Kept for compatibility, not used with Marigold.
        model_path (str): Kept for compatibility, not used with Marigold.
    
    Returns:
        depth_map (numpy.ndarray): The estimated depth map.
    """
    # Check if CUDA is available
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    # Load Marigold model
    try:
        pipe = load_marigold_model()
        print("Marigold model loaded successfully.")
    except Exception as e:
        print(f"Failed to load Marigold model: {e}")
        raise e

    # Read the image
    image = cv2.imread(input_image_path)
    if image is None:
        raise FileNotFoundError(f"Image not found at {input_image_path}")
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    # Convert numpy.ndarray (OpenCV image) to PIL.Image
    image = Image.fromarray(image)

    # Estimate depth using Marigold
    depth_result = pipe(image)
    depth_map, depth_map_normalized = estimate_depth(pipe, image, device)
    print("Depth estimation completed with Marigold.")
    
    # Optional: Save Marigold's built-in depth visualization
    # save_marigold_depth_visualization(pipe, depth_result, "marigold_depth_vis.png")
    
    # Optional: Save custom depth map visualization
    # visualize_depth_map(depth_map_normalized)

    # Optional: Visualize depth map
    # image_np = np.array(image)
    # # Create point cloud
    # pcd = create_point_cloud(image_np, depth_map)
    # print("Point cloud created.")

    # # Optional: Visualize point cloud
    # o3d.visualization.draw_geometries([pcd], window_name="Point Cloud")

    # # Create mesh from point cloud
    # mesh = create_mesh_from_point_cloud(pcd)
    # print("Mesh generated from point cloud.")

    # # Optional: Visualize mesh
    # o3d.visualization.draw_geometries([mesh], window_name="3D Mesh")

    # # Save mesh
    # save_mesh(mesh, output_mesh_path)

    return depth_map

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Convert 2D image to depth map using Marigold and Open3D")
    parser.add_argument("--input", type=str, default="osaka.jpg", required=True, help="Path to input image")
    parser.add_argument("--output", type=str, default="output_mesh.gltf", help="Path to save the output mesh (glTF format recommended)")
    parser.add_argument("--model_type", type=str, default="DPT_Large", choices=["DPT_Large", "DPT_Hybrid", "MiDaS_small"], help="Legacy parameter - kept for compatibility but not used with Marigold")
    parser.add_argument("--model_path", type=str, default="models/midas/dpt_large-midas-2f21e586.pt", help="Legacy parameter - kept for compatibility but not used with Marigold")
    args = parser.parse_args()

    midas_main(args.input, args.output, model_type=args.model_type, model_path=args.model_path)
