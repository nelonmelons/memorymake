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




# Create an SSL context that ignores certificate verification
ssl._create_default_https_context = ssl._create_unverified_context

def load_midas_model(model_type="DPT_Large", model_path="models/dpt_swin2_large_384.pt"):
    """
    Loads the MiDaS model architecture and weights manually.
    
    Args:
        model_type (str): Type of MiDaS model to load. Options are 'DPT_Large', 'DPT_Hybrid', 'MiDaS_small'.
        model_path (str): Path to the downloaded .pt model weights.
        
    Returns:
        model, transform: The loaded model and its corresponding transformation.
    """
    # Import MiDaS architecture from the repository
    # Ensure you have cloned the MiDaS repository or have access to the model definitions
    # For simplicity, we can use torch.hub's implementation but load weights manually
    
    # Define the hub URL
    hub_url = "intel-isl/MiDaS"
    
    model = torch.hub.load(hub_url, model_type, source='github', trust_repo=True)
    print('finished')
    # # Load the local weights
    # state_dict = torch.load(model_path, map_location=torch.device('cpu'))
    # model.load_state_dict(state_dict)
    model.eval()
    
    # Define the appropriate transform
    if model_type in ["DPT_Large", "DPT_Hybrid"]:
        transform = Compose([
            Resize((384, 384), interpolation=InterpolationMode.BICUBIC),

            ToTensor(),
            Normalize(mean=[0.485, 0.456, 0.406],
                      std=[0.229, 0.224, 0.225]),
        ])
    else:  # MiDaS_small
        transform = Compose([
            Resize(256, 256),
            ToTensor(),
            Normalize(mean=[0.485, 0.456, 0.406],
                      std=[0.229, 0.224, 0.225]),
        ])
    
    return model, transform


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

def estimate_depth(midas, transform, image, device):
    """
    Estimates the depth map of an image using MiDaS.
    
    Args:
        midas: The MiDaS model.
        transform: The transformation to apply to the image.
        image (PIL.Image): The input image (as a PIL.Image object).
        device: The device to run the model on.
        
    Returns:
        depth_map (numpy.ndarray): The estimated depth map.
    """
    input_batch = transform(image).to(device).unsqueeze(0)
    
    with torch.no_grad():
        prediction = midas(input_batch)
    
    # Interpolate to the original image size
    prediction = torch.nn.functional.interpolate(
        prediction.unsqueeze(1),
        size=image.size[::-1],  # Reverse (width, height) to (height, width)
        mode="bicubic",
        align_corners=False,
    ).squeeze()
    
    depth_map = prediction.cpu().numpy() 

    
    # Normalize the depth map for visualization
    depth_min = depth_map.min()
    depth_max = depth_map.max()
    depth_map_normalized = (depth_map - depth_min) / (depth_max - depth_min)
    
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


def midas_main(input_image_path, output_mesh_path, model_type="DPT_Large", model_path="models/midas/dpt_large-midas-2f21e586.pt"):
    """
    Main function to process the image and generate the 3D mesh.
    
    Args:
        input_image_path (str): Path to the input image.
        output_mesh_path (str): Path to save the output mesh (e.g., 'output_mesh.gltf').
        model_type (str): Type of MiDaS model ('DPT_Large', 'DPT_Hybrid', 'MiDaS_small').
        model_path (str): Path to the downloaded model weights.
    """
    # Check if CUDA is available
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    # Load MiDaS model with local weights
    midas, transform = load_midas_model(model_type=model_type, model_path=model_path)
    midas.to(device)
    print("MiDaS model loaded with local weights.")

    # url, filename = ("https://github.com/pytorch/hub/raw/master/images/dog.jpg", "dog.jpg")
    # request.urlretrieve(url, filename)
    # Read the image
    image = cv2.imread(input_image_path)
    if image is None:
        raise FileNotFoundError(f"Image not found at {input_image_path}")
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    # Convert numpy.ndarray (OpenCV image) to PIL.Image
    image = Image.fromarray(image)

    # Estimate depth
    depth_map, depth_map_normalized = estimate_depth(midas, transform, image, device)
    # save_depth_map_as_png(depth_map_normalized)

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

    parser = argparse.ArgumentParser(description="Convert 2D image to 3D mesh using MiDaS and Open3D")
    parser.add_argument("--input", type=str, default="osaka.jpg", required=True)
    parser.add_argument("--output", type=str, default="output_mesh.gltf", help="Path to save the output mesh (glTF format recommended)")
    parser.add_argument("--model_type", type=str, default="DPT_Large", choices=["DPT_Large", "DPT_Hybrid", "MiDaS_small"], help="Type of MiDaS model to use")
    parser.add_argument("--model_path", type=str, default="models/midas/dpt_large-midas-2f21e586.pt", help="Path to the downloaded MiDaS model weights")
    args = parser.parse_args()

    midas_main(args.input, args.output, model_type=args.model_type, model_path=args.model_path)
