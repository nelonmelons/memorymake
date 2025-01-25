import open3d as o3d
import numpy as np
import cv2

def depth_map_to_point_cloud(depth_image_path, intrinsic_matrix, rgb_image_path = None):
    # Load the depth image
    depth_image = o3d.io.read_image(depth_image_path)
    depth_image_np = np.array(depth_image)
    print(depth_image_np)
    
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

    if rgb_image_path is not None:
        # Load the RGB image
        color_image = o3d.io.read_image(rgb_image_path)

        # Convert the RGB image to a numpy array and normalize
        color_array = np.array(color_image) / 255.0

        # Map RGB values to the point cloud based on the number of points
        pcd.colors = o3d.utility.Vector3dVector(color_array.reshape(-1, 3))

    return pcd

def depth_map_to_color_point_cloud(depth_image_path, intrinsic_matrix, rgb_image_path):
    
    depth_image = o3d.io.read_image(depth_image_path)
    rgb_image = o3d.io.read_image(rgb_image_path)

    # Intrinsic camera parameters
    fx, fy, cx, cy = intrinsic_matrix[0, 0], intrinsic_matrix[1, 1], intrinsic_matrix[0, 2], intrinsic_matrix[1, 2]

    # Generate point cloud and map colors
    points = []
    colors = []
    for v in range(depth_image.shape[0]):  # Height
        for u in range(depth_image.shape[1]):  # Width
            z = depth_image[v, u] # Convert depth to meters if needed
            x = (u - cx) * z / fx
            y = (v - cy) * z / fy
            points.append([x, y, z])
            colors.append(rgb_image[v, u] / 255.0)  # Normalize RGB

    # Create point cloud
    point_cloud = o3d.geometry.PointCloud()
    point_cloud.points = o3d.utility.Vector3dVector(np.array(points))
    # Map colors
    point_cloud.colors = o3d.utility.Vector3dVector(np.array(colors))

    # downsample the point cloud to remove noise
    point_cloud = point_cloud.voxel_down_sample(voxel_size=0.05)

    # remove outliers to clean the point cloud
    # point_cloud, ind = point_cloud.remove_statistical_outlier(nb_neighbors=20, std_ratio=2.0)

    return point_cloud

def point_cloud_to_mesh(point_cloud, smooth=True, decimate=False):
    # # Estimate normals of the point cloud
    point_cloud.estimate_normals(search_param=o3d.geometry.KDTreeSearchParamHybrid(radius=0.1, max_nn=30))
    
    # point_cloud, ind = point_cloud.remove_statistical_outlier(nb_neighbors=20, std_ratio=2.0)
    # point_cloud = point_cloud.voxel_down_sample(voxel_size=0.05)

    # Apply Poisson Surface Reconstruction
    mesh, densities = o3d.geometry.TriangleMesh.create_from_point_cloud_poisson(
        point_cloud, depth=9
    )

    # radii = [0.005, 0.01, 0.02, 0.04]
    # mesh = o3d.geometry.TriangleMesh.create_from_point_cloud_ball_pivoting(
    #     point_cloud, o3d.utility.DoubleVector(radii))

    if smooth:
        mesh = mesh.filter_smooth_laplacian(number_of_iterations=8)

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
    point_cloud = depth_map_to_point_cloud(depth_image_path, intrinsic_matrix, rgb_image_path)

    # if visualize:
    #     o3d.visualization.draw_geometries([point_cloud])

    # Save the point cloud to a file
    o3d.io.write_point_cloud("rendered_files/output_point_cloud.ply", point_cloud)

    # Step 2: Convert point cloud to mesh using Poisson Surface Reconstruction
    mesh = point_cloud_to_mesh(point_cloud)

    if visualize:
        o3d.visualization.draw_geometries([point_cloud, mesh])
    
    # Step 3: Export the mesh to the desired file format (e.g., .obj)
    export_mesh(mesh, output_mesh_path)
    
    return output_mesh_path

if __name__ == "__main__":
    # Example usage:
    depth_image_path = 'osaka_depth.png'
    rgb_image_path = 'osakatest.png'
    output_mesh_path = 'rendered_files/output_mesh.obj'

    intrinsic_matrix = np.array([
        [500, 0, 320],
        [0, 500, 240],
        [0, 0, 1]
    ])

    depth_image_to_mesh(depth_image_path, intrinsic_matrix, output_mesh_path, rgb_image_path=rgb_image_path, visualize=True)
