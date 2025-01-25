import open3d as o3d
import numpy as np

def depth_map_to_point_cloud(depth_image_path, intrinsic_matrix):
    # Load the depth image
    depth_image = o3d.io.read_image(depth_image_path)
    
    # Extract the intrinsic parameters from the matrix
    fx = intrinsic_matrix[0, 0]  # fx
    fy = intrinsic_matrix[1, 1]  # fy
    cx = intrinsic_matrix[0, 2]  # cx
    cy = intrinsic_matrix[1, 2]  # cy

    # Create the intrinsic camera object
    intrinsic = o3d.camera.PinholeCameraIntrinsic()
    
    height, width = np.array(depth_image).shape

    intrinsic.set_intrinsics(width, height, fx, fy, cx, cy)

    # Convert depth image to point cloud
    pcd = o3d.geometry.PointCloud.create_from_depth_image(depth_image, intrinsic)
    return pcd

def point_cloud_to_mesh(point_cloud, smooth=True, decimate=False):
    # Estimate normals of the point cloud
    point_cloud.estimate_normals(search_param=o3d.geometry.KDTreeSearchParamHybrid(radius=0.1, max_nn=30))

    # Apply Poisson Surface Reconstruction
    mesh, densities = o3d.geometry.TriangleMesh.create_from_point_cloud_poisson(point_cloud, depth=9)

    if smooth:
        mesh = mesh.filter_smooth_laplacian(number_of_iterations=10)

    if decimate:
        mesh = mesh.simplify_quadric_decimation(100000)

    return mesh

def export_mesh(mesh, file_path):
    o3d.io.write_triangle_mesh(file_path, mesh)

def depth_image_to_mesh(depth_image_path, 
                        intrinsic_matrix, 
                        output_mesh_path, 
                        rgb_image_path=None,
                        visualize=False):
    # Step 1: Convert depth image to point cloud
    point_cloud = depth_map_to_point_cloud(depth_image_path, intrinsic_matrix)

    if visualize:
        o3d.visualization.draw_geometries([point_cloud])

    if rgb_image_path is not None:
        # Load the RGB image
        color_image = o3d.io.read_image(rgb_image_path)

        # Convert the RGB image to a numpy array and normalize
        color_array = np.array(color_image) / 255.0

        # Map RGB values to the point cloud based on the number of points
        point_cloud.colors = o3d.utility.Vector3dVector(color_array.reshape(-1, 3))

    # Step 2: Convert point cloud to mesh using Poisson Surface Reconstruction
    mesh = point_cloud_to_mesh(point_cloud)

    if visualize:
        o3d.visualization.draw_geometries([mesh])
    
    # Step 3: Export the mesh to the desired file format (e.g., .obj)
    export_mesh(mesh, output_mesh_path)
    
    return output_mesh_path

if __name__ == "__main__":
    # Example usage:
    depth_image_path = '00000_depth.png'
    rgb_image_path = '00000_colors.png'
    output_mesh_path = 'rendered_files/output_mesh.obj'

    intrinsic_matrix = np.array([
        [500, 0, 320],
        [0, 500, 240],
        [0, 0, 1]
    ])

    depth_image_to_mesh(depth_image_path, intrinsic_matrix, output_mesh_path, rgb_image_path=rgb_image_path, visualize=True)