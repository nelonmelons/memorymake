import open3d as o3d
import numpy as np
import cv2
from scipy.spatial import Delaunay
from midas_depth_map import midas_main
from root_scale import root_scaling
from cylinder import create_cylindrical_mesh

@DeprecationWarning
def compute_point_cloud(color_image_path, scale=1.5):

    color_raw = cv2.imread(color_image_path, cv2.IMREAD_COLOR)  # Shape: (H, W, 3)
    # depth_raw = cv2.imread(depth_image_path, cv2.IMREAD_UNCHANGED)
    depth_raw = midas_main(color_image_path, None, model_type="DPT_Large", model_path="models/midas/dpt_large-midas-2f21e586.pt")

    color_raw = cv2.cvtColor(color_raw, cv2.COLOR_BGR2RGB)

    depth_raw = depth_raw.astype(np.float32)

    depth_raw = depth_raw + (np.max(depth_raw) - depth_raw) * scale # Arbitrary and experimental

    # color_raw = transformations.cylindrical_projection(color_raw)
    # depth_raw = transformations.cylindrical_projection(depth_raw)

    # Convert to Open3D Image objects
    o3d_color = o3d.geometry.Image(color_raw)
    o3d_depth = o3d.geometry.Image(depth_raw)

    rgbd_image = o3d.geometry.RGBDImage.create_from_color_and_depth(
        color=o3d_color,
        depth=o3d_depth,
        depth_scale=1,       # No additional scaling assumed
        depth_trunc=1000.0,    # Max depth to consider (in meters)
        convert_rgb_to_intensity=False  # Keep original RGB
    )

    height, width, _ = color_raw.shape
    fx = 500.0  # Example focal length
    fy = 500.0
    cx = width / 2.0
    cy = height / 2.0

    intrinsics = o3d.camera.PinholeCameraIntrinsic(width, height, fx, fy, cx, cy)

    # Generate point cloud
    pcd = o3d.geometry.PointCloud.create_from_rgbd_image(
        rgbd_image,
        intrinsics
    )

    # Optional: Remove outliers
    pcd, _ = pcd.remove_statistical_outlier(nb_neighbors=20, std_ratio=2.0)

    pcd.estimate_normals(
        search_param=o3d.geometry.KDTreeSearchParamHybrid(radius=1.0, max_nn=30)
    )

    return pcd





def cylindrical_projection(color_image_path, 
                          depth_scale_factor=1.0, vertical_scale=0.7):
    """
    Convert a panoramic color + depth image into a point cloud wrapped in cylindrical space.

    Args:
        color_image_path (str): Path to the color (panorama) image.
        depth_image_path (str): Path to the depth (panorama) image (same width/height).
        vertical_scale (float): Factor to scale the vertical axis in the output point cloud.
        depth_scale_factor (float): An optional global multiplier on the depth values
                                    (sometimes required if depth is in different units).

    Returns:
        pcd (o3d.geometry.PointCloud): The cylindrical-wrapped point cloud.
    """

    # Load images with OpenCV
    color_raw = cv2.imread(color_image_path, cv2.IMREAD_COLOR)   # BGR
    depth_raw = midas_main(color_image_path, None, model_type="DPT_Large", model_path="models/midas/dpt_large-midas-2f21e586.pt")
    print('midas done')


    # Convert BGR -> RGB for Open3D consistency
    color_raw = cv2.cvtColor(color_raw, cv2.COLOR_BGR2RGB)

    # Convert depth to float; apply any scaling if needed
    depth_raw = depth_raw.astype(np.float32) * depth_scale_factor

    height, width, _ = color_raw.shape

    # Prepare arrays for the 3D points and their colors
    points = []
    colors = []
    half_w = width / 2.0
    half_h = height / 2.0

    # Loop through each pixel in the panorama
  # Adjust this value to control the effect
    bias = 30
    original_r = (np.max(depth_raw) - depth_raw + bias) * 10
    r = root_scaling(original_r)
    # r = (np.max(depth_raw) - depth_raw) * 10
    valid_mask = r > 0  # Mask to skip invalid or zero depth

    # Create a grid of x and y coordinates
    x = np.arange(width)
    y = np.arange(height)
    x_grid, y_grid = np.meshgrid(x, y)

    # Shift x and y coordinates to center
    x_prime = x_grid - half_w
    y_prime = y_grid - half_h
    theta_max = np.pi / 2.0
    # Compute theta and Cartesian coordinates
    theta = (x_prime / half_w) * (np.pi / 2.0)
    
    exceed_mask = (theta < -theta_max) | (theta > theta_max)  # Logical OR for exceeding values

# Print the exceeding theta values
    exceeding_thetas = theta[exceed_mask]
    print("Theta values exceeding the limits:", exceeding_thetas)

    X = r * np.sin(theta)
    Z = r * np.cos(theta)
    Y = y_prime * vertical_scale

    # Apply the valid mask
    X = X[valid_mask]
    Y = Y[valid_mask]
    Z = Z[valid_mask]

    # Stack the points into a single array
    points = np.vstack((X, Y, Z)).T

    # Normalize colors and apply the mask
    colors = (color_raw / 255.0).reshape(-1, 3)
    colors = colors[valid_mask.flatten()]

    # Convert arrays to Open3D format
    points = np.array(points, dtype=np.float32)
    colors = np.array(colors, dtype=np.float32)
    print('before loading pcd')
    pcd = o3d.geometry.PointCloud()
    pcd.points = o3d.utility.Vector3dVector(points)
    pcd.colors = o3d.utility.Vector3dVector(colors)
    print('after loading pcd')

    pcd = pcd.voxel_down_sample(voxel_size=0.1)  # Adjust voxel size as needed
    

    pcd.estimate_normals(
        search_param=o3d.geometry.KDTreeSearchParamHybrid(radius=1.0, max_nn=30)
    )

    return pcd


def delauny_method(pcd, save_path=None):
    # Extract points from the point cloud
    points = np.asarray(pcd.points)
    print('after points, before triangulation')


    # Perform Delaunay triangulation
    triangulation = Delaunay(points[:, :2])  # Perform Delaunay triangulation in 2D (xy-plane)
    # # For 3D, you may need to use a more sophisticated triangulation method like Delaunay in 3D
    # # triangulation = Delaunay(points) # This can be computationally expensive for large datasets


    vertices = points
    triangles = triangulation.simplices  # The simplices (triangles) from Delaunay

    # # Create the mesh using Open3D
    mesh = o3d.geometry.TriangleMesh()
    mesh.vertices = o3d.utility.Vector3dVector(vertices)
    mesh.triangles = o3d.utility.Vector3iVector(triangles)
    print('finish loading mesh')
    # # Optionally, compute vertex normals
    mesh = mesh.simplify_vertex_clustering(voxel_size=0.5)
    mesh.compute_vertex_normals()

    # # Assign colors from point cloud to mesh vertices
    pcd_tree = o3d.geometry.KDTreeFlann(pcd)
    mesh_colors = []
    for v in mesh.vertices:
        [_, idx, _] = pcd_tree.search_knn_vector_3d(v, 1)
        nearest_color = pcd.colors[idx[0]]
        mesh_colors.append(nearest_color)

    # # Assign vertex colors to the mesh
    mesh.vertex_colors = o3d.utility.Vector3dVector(mesh_colors)

    # # Smooth the mesh (optional)
    # print(f"Before smoothing: Vertices = {len(mesh.vertices)}, Faces = {len(mesh.triangles)}")
    # mesh.filter_smooth_laplacian(number_of_iterations=10)
    # print(f"After smoothing: Vertices = {len(mesh.vertices)}, Faces = {len(mesh.triangles)}")

    # # Flip the orientation of the mesh by reversing the order of the triangles (if necessary)
    mesh.triangles = o3d.utility.Vector3iVector(np.asarray(mesh.triangles)[..., ::-1])

    # # Recompute vertex normals after flipping the triangles
    mesh.compute_vertex_normals()

    if save_path:
        o3d.io.write_triangle_mesh(save_path, mesh)
        print(f"Mesh saved to {save_path}")

    # Visualize the mesh
    # o3d.visualization.draw_geometries([mesh])
        

def open_3d_main(color_image_path, save_path, scale=1.5):
    pcd = cylindrical_projection(color_image_path, depth_scale_factor=scale)
    delauny_method(pcd, save_path=save_path)
    return None

if __name__ == "__main__":
    color_image_path = "assets/jet2.png"
    depth_image_path = "assets/panorama_depth.png"
    save_path = "panorama_mesh.obj"
    open_3d_main(color_image_path, save_path, scale=1.0)
