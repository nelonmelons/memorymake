import open3d as o3d
import numpy as np
import cv2
from scipy.spatial import Delaunay
from midas_depth_map import midas_main

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
                          depth_scale_factor=1.0, vertical_scale=1.0):
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
    for y in range(height):
        for x in range(width):
            r = (np.max(depth_raw) - depth_raw[y, x]) * 10
            # Skip invalid or zero depth
            if r <= 0:
                continue

            # Shift x so the center of the image is x' = 0
            x_prime = x - half_w

            # Map x' in [-half_w, +half_w] to theta in [-pi/2, +pi/2]
            theta = (x_prime / half_w) * (np.pi / 2.0)

            # Convert to Cartesian, where theta=0 is forward (+Z)
            X = r * np.sin(theta)  # left-right
            Z = r * np.cos(theta)  # forward-back

            # For vertical, shift row so the middle is Y=0
            y_prime = y - half_h
            Y = y_prime * vertical_scale

            points.append([X, Y, Z])

            # Normalize color to [0, 1]
            c = color_raw[y, x] / 255.0
            colors.append(c)

    # Convert arrays to Open3D format
    points = np.array(points, dtype=np.float32)
    colors = np.array(colors, dtype=np.float32)

    pcd = o3d.geometry.PointCloud()
    pcd.points = o3d.utility.Vector3dVector(points)
    pcd.colors = o3d.utility.Vector3dVector(colors)

    pcd.estimate_normals(
        search_param=o3d.geometry.KDTreeSearchParamHybrid(radius=1.0, max_nn=30)
    )
    
    # pcd.orient_normals_consistent_tangent_plane(30)

    return pcd


def compute_meshes(pcd, save_path=None, visualize=False):

    # Poisson reconstruction
    mesh, densities = o3d.geometry.TriangleMesh.create_from_point_cloud_poisson(
        pcd,
        depth=9
    )

    # Filter low-density vertices
    dens_thresh = np.quantile(densities, 0.1)  # Remove lowest 10%
    vertices_to_remove = densities < dens_thresh
    mesh.remove_vertices_by_mask(vertices_to_remove)

    # Build a KD-tree from the point cloud
    pcd_tree = o3d.geometry.KDTreeFlann(pcd)

    # Transfer colors from the point cloud to the mesh
    mesh_colors = []
    for v in mesh.vertices:
        # Find nearest neighbor for each mesh vertex in the point cloud
        [_, idx, _] = pcd_tree.search_knn_vector_3d(v, 1)
        nearest_color = pcd.colors[idx[0]]
        mesh_colors.append(nearest_color)

    # Assign vertex colors to the mesh
    mesh.vertex_colors = o3d.utility.Vector3dVector(mesh_colors)

    # Subdivide the mesh
    # for _ in range(2):
    #     mesh_poisson = mesh_poisson.subdivide_loop(number_of_iterations=1)

    # Smooth the mesh
    print(f"Before smoothing: Vertices = {len(mesh.vertices)}, Faces = {len(mesh.triangles)}")
    mesh.filter_smooth_laplacian(number_of_iterations=7)
    print(f"After smoothing: Vertices = {len(mesh.vertices)}, Faces = {len(mesh.triangles)}")

    # Flip the orientation of the mesh by reversing the order of the triangles
    mesh.triangles = o3d.utility.Vector3iVector(np.asarray(mesh.triangles)[..., ::-1])

    # Recompute vertex normals after flipping the triangles
    mesh.compute_vertex_normals()

    # transformations.curve_mesh(mesh_poisson)

    if save_path:
        o3d.io.write_triangle_mesh(save_path, mesh)
        print(f"Mesh saved to {save_path}")
        
    if visualize:
        # Visualize the final mesh
        o3d.visualization.draw_geometries([mesh])

def delauny_method(pcd, save_path=None):
    # Extract points from the point cloud
    points = np.asarray(pcd.points)

    # Perform Delaunay triangulation
    triangulation = Delaunay(points[:, :2])  # Perform Delaunay triangulation in 2D (xy-plane)
    # For 3D, you may need to use a more sophisticated triangulation method like Delaunay in 3D
    # triangulation = Delaunay(points) # This can be computationally expensive for large datasets

    # Convert Delaunay triangulation to a mesh
    vertices = points
    triangles = triangulation.simplices  # The simplices (triangles) from Delaunay

    # Create the mesh using Open3D
    mesh = o3d.geometry.TriangleMesh()
    mesh.vertices = o3d.utility.Vector3dVector(vertices)
    mesh.triangles = o3d.utility.Vector3iVector(triangles)

    # Optionally, compute vertex normals
    mesh.compute_vertex_normals()

    # Assign colors from point cloud to mesh vertices
    pcd_tree = o3d.geometry.KDTreeFlann(pcd)
    mesh_colors = []
    for v in mesh.vertices:
        [_, idx, _] = pcd_tree.search_knn_vector_3d(v, 1)
        nearest_color = pcd.colors[idx[0]]
        mesh_colors.append(nearest_color)

    # Assign vertex colors to the mesh
    mesh.vertex_colors = o3d.utility.Vector3dVector(mesh_colors)

    # Smooth the mesh (optional)
    print(f"Before smoothing: Vertices = {len(mesh.vertices)}, Faces = {len(mesh.triangles)}")
    mesh.filter_smooth_laplacian(number_of_iterations=10)
    print(f"After smoothing: Vertices = {len(mesh.vertices)}, Faces = {len(mesh.triangles)}")

    # Flip the orientation of the mesh by reversing the order of the triangles (if necessary)
    mesh.triangles = o3d.utility.Vector3iVector(np.asarray(mesh.triangles)[..., ::-1])

    # Recompute vertex normals after flipping the triangles
    mesh.compute_vertex_normals()

    if save_path:
        o3d.io.write_triangle_mesh(save_path, mesh)
        print(f"Mesh saved to {save_path}")
        

def open_3d_main(color_image_path, save_path, scale=1.5):
    pcd = cylindrical_projection(color_image_path, depth_scale_factor=scale)
    delauny_method(pcd, save_path=save_path)
    return None

if __name__ == "__main__":
    color_image_path = "output.jpg"
    depth_image_path = "depth_map.png"
    save_path = "panorama_mesh.obj"
    open_3d_main(color_image_path, save_path, scale=1.0)
