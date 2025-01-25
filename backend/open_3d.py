import open3d as o3d
import numpy as np
import cv2
from scipy.spatial import Delaunay

def compute_point_cloud(color_image_path, depth_image_path, scale=1.5):

    color_raw = cv2.imread(color_image_path, cv2.IMREAD_COLOR)  # Shape: (H, W, 3)
    depth_raw = cv2.imread(depth_image_path, cv2.IMREAD_UNCHANGED)

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
        depth_scale=1.0,       # No additional scaling assumed
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

def compute_meshes(pcd, save_path=None):

    # Poisson reconstruction
    mesh, densities = o3d.geometry.TriangleMesh.create_from_point_cloud_poisson(
        pcd,
        depth=9
    )

    # # Filter low-density vertices
    dens_thresh = np.quantile(densities, 0.3)  # Remove lowest 10%
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
    # mesh.filter_smooth_laplacian(number_of_iterations=7)
    print(f"After smoothing: Vertices = {len(mesh.vertices)}, Faces = {len(mesh.triangles)}")

    # Flip the orientation of the mesh by reversing the order of the triangles
    mesh.triangles = o3d.utility.Vector3iVector(np.asarray(mesh.triangles)[..., ::-1])

    # Recompute vertex normals after flipping the triangles
    mesh.compute_vertex_normals()

    # transformations.curve_mesh(mesh_poisson)

    if save_path:
        o3d.io.write_triangle_mesh(save_path, mesh)
        print(f"Mesh saved to {save_path}")
        
    # Visualize the final mesh
    o3d.visualization.draw_geometries([mesh])
    o3d.visualization.draw_geometries([pcd, mesh])

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
        
    # Visualize the final mesh
    o3d.visualization.draw_geometries([mesh])

def main(color_image_path, depth_image_path, save_path, scale=1.5):
    pcd = compute_point_cloud(color_image_path, depth_image_path, scale=scale)
    delauny_method(pcd, save_path=save_path)

if __name__ == "__main__":
    color_image_path = "assets/building.png"
    depth_image_path = "assets/building_depth.png"
    save_path = "panorama_mesh.obj"
    main(color_image_path, depth_image_path, save_path, scale=1.5)
