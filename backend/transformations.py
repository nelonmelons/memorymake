import open3d as o3d
import numpy as np
import math

def root_scaling(depth_raw, steepness=10):
    """
    Apply sigmoid scaling to depth values to emphasize middle-range depths.

    Args:
        depth_raw (np.ndarray): The raw depth values (2D array).
        midpoint (float): The midpoint of the sigmoid (default is the mean depth).
        steepness (float): Controls the steepness of the sigmoid curve (higher = steeper).
        scale (float): A scaling factor to stretch the output values.

    Returns:
        np.ndarray: The scaled depth values.
    """
    max_r = np.max(depth_raw) # Use mean depth as the default midpoint

    # Scale the result to the desired range
    scale2 = np.sqrt(depth_raw / max_r) + 0.7  # Optional: apply a square root to the sigmoid result

    return depth_raw * scale2

def fisheye_distortion(image, k1=0.00001, k2=0.000001):
    """
    Usage:
        image = cv2.imread('input.jpg')
        distorted_image = fisheye_distortion(image, k1, k2)
    """

    h, w = image.shape[:2]
    cx, cy = w / 2, h / 2  # Image center
    distorted = np.zeros_like(image)

    for y in range(h):
        for x in range(w):
            dx, dy = x - cx, y - cy  # Distance from center
            r = np.sqrt(dx**2 + dy**2)  # Radius
            r_distorted = r * (1 + k1 * r**2 + k2 * r**4)  # Apply distortion
            if r > 0:  # Avoid division by zero
                x_distorted = int(round(cx + dx * r_distorted / r))
                y_distorted = int(round(cy + dy * r_distorted / r))
                if 0 <= x_distorted < w and 0 <= y_distorted < h:  # Boundary check
                    distorted[y, x] = image[y_distorted, x_distorted]

    return distorted

def spherical_warp(mesh):
    """
    Usage:
        mesh = o3d.io.read_triangle_mesh("mesh.obj")
        warped_mesh = spherical_warp(mesh)
        o3d.io.write_triangle_mesh("warped_mesh.obj", warped_mesh)
    """

    points = np.asarray(mesh.vertices)
    warped_points = []
    for x, y, z in points:
        r = np.sqrt(x**2 + y**2 + z**2)
        theta = np.arctan2(x, z)
        phi = np.arctan2(y, np.sqrt(x**2 + z**2))
        x_ = r * np.cos(phi) * np.sin(theta)
        y_ = r * np.sin(phi)
        z_ = r * np.cos(phi) * np.cos(theta)
        warped_points.append([x_, y_, z_])
    mesh.vertices = o3d.utility.Vector3dVector(np.array(warped_points))
    return mesh

def cylindrical_projection(image, fx=500, fy=500):
    """
    Apply a cylindrical projection to an image.
    :param image: Input image as a NumPy array.
    :param fx: Focal length in the x-direction.
    :param fy: Focal length in the y-direction.
    :return: Transformed image as a NumPy array.
    """
    h, w = image.shape[:2]
    cx, cy = w / 2, h / 2  # Image center
    output = np.zeros_like(image)

    for y in range(h):
        for x in range(w):
            # Calculate cylindrical coordinates
            theta = (x - cx) / fx  # Horizontal angle
            h_cyl = (y - cy) / fy  # Vertical scale

            # Project back to 2D
            x_proj = int(cx + fx * np.sin(theta))
            y_proj = int(cy + fy * h_cyl)
            if 0 <= x_proj < w and 0 <= y_proj < h:
                output[y_proj, x_proj] = image[y, x]

    return output

def curve_mesh(mesh):
    """
    Modify a TriangleMesh object in place to transform its vertices into a curved (hemispherical) shape.
    :param mesh: An open3d.geometry.TriangleMesh object to be modified.
    """
    vertices = np.asarray(mesh.vertices)

    # Transform vertices
    for i in range(vertices.shape[0]):
        x, y, z = vertices[i]

        # Convert Cartesian to spherical coordinates
        r = np.sqrt(x**2 + y**2 + z**2)
        theta = np.arctan2(y, x)  # Longitude
        phi = np.arcsin(z / r)    # Latitude

        # Project onto a hemisphere (adjust radius as needed)
        r_new = r  # Keep radius consistent
        x_new = r_new * np.cos(phi) * np.cos(theta)
        y_new = r_new * np.cos(phi) * np.sin(theta)
        z_new = r_new * np.sin(phi)

        # Update the vertex in place
        vertices[i] = [x_new, y_new, z_new]

    # Update the mesh with transformed vertices
    mesh.vertices = o3d.utility.Vector3dVector(vertices)

    # Recompute normals for visualization
    mesh.compute_vertex_normals()
    mesh.compute_triangle_normals()