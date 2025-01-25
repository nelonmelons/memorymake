import open3d as o3d
import numpy as np
import cv2

def cylindrical_projection(color_image_path, depth_image_path,
                          vertical_scale=1.0, depth_scale_factor=1.0):
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
    depth_raw = cv2.imread(depth_image_path, cv2.IMREAD_UNCHANGED)

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
    pcd.orient_normals_consistent_tangent_plane(30)

    return pcd

def compute_meshes(pcd, save_path=None):
    print('its getting here')
    # Estimate normals (important for Poisson)

    
    # Poisson reconstruction
    mesh_poisson, densities = o3d.geometry.TriangleMesh.create_from_point_cloud_poisson(
        pcd,
        depth=10  # Might adjust based on density
    )

    # Filter low-density vertices
    dens_thresh = np.quantile(densities, 0.1)  # Remove lowest 10%
    vertices_to_remove = densities < dens_thresh
    mesh_poisson.remove_vertices_by_mask(vertices_to_remove)

    # Transfer colors from the original point cloud to the mesh
    pcd_tree = o3d.geometry.KDTreeFlann(pcd)
    mesh_colors = []
    for v in mesh_poisson.vertices:
        [_, idx, _] = pcd_tree.search_knn_vector_3d(v, 1)
        nearest_color = pcd.colors[idx[0]]
        mesh_colors.append(nearest_color)
    mesh_poisson.vertex_colors = o3d.utility.Vector3dVector(mesh_colors)

    if save_path:
        o3d.io.write_triangle_mesh(save_path, mesh_poisson)
        print(f"Mesh saved to {save_path}")

    # Visualize
    o3d.visualization.draw_geometries([pcd, mesh_poisson])
    return mesh_poisson


def main(color_image_path, depth_image_path, save_path,
         vertical_scale=1.0, depth_scale_factor=1.0):
    # 1. Convert the panorama into a cylindrical point cloud
    pcd = cylindrical_projection(
        color_image_path,
        depth_image_path,
        vertical_scale=vertical_scale,
        depth_scale_factor=depth_scale_factor
    )

    # 2. Generate the Poisson mesh (and optionally save it)
    mesh = compute_meshes(pcd, save_path=save_path)

if __name__ == "__main__":
    color_image_path = "assets/panorama.jpg"
    depth_image_path = "assets/panorama_depth.png"
    save_path = "panorama_mesh.obj"

    # Example scale values; tweak as needed
    main(color_image_path, depth_image_path, save_path,
         vertical_scale=0.5,
         depth_scale_factor=1.0)

