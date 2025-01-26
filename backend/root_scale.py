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

