import numpy as np
import matplotlib.pyplot as plt

def root_scaling_analysis():
    """Analyze the bias in root_scaling function"""
    
    # Create test depth values from 0 to 1000 (simulating Marigold output range)
    depth_raw = np.linspace(0, 1000, 1000)
    max_r = np.max(depth_raw)
    
    # Apply root scaling transformation
    scale2 = np.sqrt(depth_raw / max_r) + 0.7
    final_depth = depth_raw * scale2
    
    # Calculate the scaling factor (how much each depth gets amplified)
    scaling_factor = final_depth / depth_raw
    scaling_factor[0] = scale2[0]  # Handle division by zero for first element
    
    # Print some key values
    print("Root Scaling Analysis:")
    print("=" * 40)
    print(f"Min depth (0): scale2 = {scale2[0]:.3f}, final = {final_depth[0]:.1f}")
    print(f"25% depth: scale2 = {scale2[250]:.3f}, final = {final_depth[250]:.1f}")
    print(f"50% depth: scale2 = {scale2[500]:.3f}, final = {final_depth[500]:.1f}")
    print(f"75% depth: scale2 = {scale2[750]:.3f}, final = {final_depth[750]:.1f}")
    print(f"Max depth: scale2 = {scale2[999]:.3f}, final = {final_depth[999]:.1f}")
    print()
    print("Scaling Factor Analysis:")
    print(f"Min scaling factor: {np.min(scaling_factor):.3f}")
    print(f"Max scaling factor: {np.max(scaling_factor):.3f}")
    print(f"Ratio (max/min): {np.max(scaling_factor)/np.min(scaling_factor):.3f}x")
    
    # Calculate relative depth differences
    min_final = np.min(final_depth[final_depth > 0])
    max_final = np.max(final_depth)
    original_range = np.max(depth_raw) - np.min(depth_raw)
    final_range = max_final - min_final
    
    print(f"\nDepth Range Analysis:")
    print(f"Original range: {original_range:.1f}")
    print(f"Final range: {final_range:.1f}")
    print(f"Range amplification: {final_range/original_range:.3f}x")

if __name__ == "__main__":
    root_scaling_analysis()
