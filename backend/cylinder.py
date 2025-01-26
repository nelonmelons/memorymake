import numpy as np
from scipy.spatial import Delaunay
import open3d as o3d

def cartesian_to_cylindrical(points):
    """
    Convert Cartesian coordinates to cylindrical coordinates.
    Args:
        points (np.ndarray): Nx3 array of points (x, y, z).
    Returns:
        np.ndarray: Nx3 array of cylindrical coordinates (r, theta, z).
    """
    x, y, z = points[:, 0], points[:, 1], points[:, 2]
    r = np.sqrt(x**2 + y**2)
    theta = np.arctan2(y, x)
    return np.column_stack((r, theta, z))

def triangulate_slice(slice_points):
    """
    Perform 2D Delaunay triangulation on a slice.
    Args:
        slice_points (np.ndarray): Nx3 array of cylindrical points (r, theta, z).
    Returns:
        scipy.spatial.Delaunay: Delaunay triangulation object.
    """
    if len(slice_points) < 3:
        return None  # Not enough points for triangulation

    r_z = slice_points[:, [0, 2]]  # Project to 2D plane (r, z)
    return Delaunay(r_z)

def connect_slices(slice1, slice2):
    """
    Connect points between two adjacent slices to form tetrahedra.
    Args:
        slice1 (np.ndarray): Points from the first slice.
        slice2 (np.ndarray): Points from the second slice.
    Returns:
        list: List of tetrahedra (4 indices each).
    """
    connections = []
    for i, p1 in enumerate(slice1):
        distances = np.linalg.norm(slice2 - p1, axis=1)
        closest_idx = np.argmin(distances)
        connections.append((i, closest_idx))

    # Convert connections to tetrahedra (you may need to refine this logic)
    tetrahedra = []
    for c in connections:
        tetrahedra.append([c[0], c[1], (c[0] + 1) % len(slice1), (c[1] + 1) % len(slice2)])
    return tetrahedra

def create_cylindrical_mesh(points, num_slices=10):
    """
    Create a cylindrical mesh using radial Delaunay triangulation.
    Args:
        points (np.ndarray): Nx3 array of Cartesian points.
        num_slices (int): Number of angular slices.
    Returns:
        o3d.geometry.TriangleMesh: The cylindrical mesh.
    """
    # Convert points to cylindrical coordinates
    cylindrical_points = cartesian_to_cylindrical(points)

    # Slice the points into angular segments
    

    theta = cylindrical_points[:, 1]  # Theta values
    slice_indices = np.digitize(theta, np.linspace(-np.pi, np.pi, num_slices + 1))
    slices = [points[slice_indices == i] for i in range(1, num_slices + 1)]
    

    # Perform Delaunay triangulation on each slice
    triangles = []
    vertices = []
    vertex_offset = 0

    for slice_points in slices:
        if len(slice_points) < 3:
            continue

        delaunay = triangulate_slice(slice_points)
        if delaunay is not None:
            # Append triangles with the vertex offset
            triangles.extend(delaunay.simplices + vertex_offset)
            vertices.extend(slice_points)
            vertex_offset += len(slice_points)

    # Convert triangles to a NumPy array
    triangles = np.array(triangles, dtype=np.int32)

    # Convert vertices to a NumPy array
    vertices = np.array(vertices, dtype=np.float32)

    # Convert to Open3D mesh
    mesh = o3d.geometry.TriangleMesh()
    mesh.vertices = o3d.utility.Vector3dVector(vertices[:, :3])  # Convert back to Cartesian
    mesh.triangles = o3d.utility.Vector3iVector(triangles)
    mesh.compute_vertex_normals()
    return mesh

def visualize_mesh(mesh):
    """
    Visualize the mesh using Open3D.
    Args:
        mesh (o3d.geometry.TriangleMesh): The mesh to visualize.
    Returns:
        None
    """
    o3d.visualization.draw_geometries([mesh])

if __name__ == "__main__":
    # Example point cloud: Randomly distributed points on a cylinder
    num_points = 1000
    theta = np.random.uniform(-np.pi, np.pi, num_points)
    z = np.random.uniform(-1, 1, num_points)
    r = np.random.uniform(0.5, 1, num_points)
    x = r * np.cos(theta)
    y = r * np.sin(theta)
    points = np.column_stack((x, y, z))
    print(points.shape)

    # Generate the cylindrical mesh
    mesh = create_cylindrical_mesh(points, num_slices=20)

    # Visualize the mesh
    visualize_mesh(mesh)