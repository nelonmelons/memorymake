#!/usr/bin/env python3
"""
Test script for the real NVIDIA DiFix model integration
"""

import sys
import os
import torch

# Add the current directory to the path
sys.path.append('.')

from stable_diffusion import generate_image_difix

def test_nvidia_difix():
    print("🚀 Testing Real NVIDIA DiFix Model")
    print("=" * 50)
    
    # System info
    print(f"PyTorch Version: {torch.__version__}")
    print(f"CUDA Available: {torch.cuda.is_available()}")
    
    if torch.cuda.is_available():
        print(f"GPU: {torch.cuda.get_device_name(0)}")
        print(f"Memory: {torch.cuda.get_device_properties(0).total_memory / (1024**3):.1f}GB")
    
    # Test parameters matching your example
    prompt = "Astronaut in a jungle"
    style = "cold color palette, muted colors"
    save_path = "nvidia_difix_test.png"
    
    print(f"\n🧑‍🚀 Testing NVIDIA DiFix with:")
    print(f"   Prompt: {prompt}")
    print(f"   Style: {style}")
    print(f"   Output: {save_path}")
    print("-" * 50)
    
    try:
        generate_image_difix(
            prompt=prompt,
            style=style,
            save_path=save_path,
            use_cuda=True
        )
        
        # Check if file was created
        if os.path.exists(save_path):
            file_size = os.path.getsize(save_path)
            print(f"\n✅ SUCCESS: NVIDIA DiFix test completed!")
            print(f"📁 File: {save_path}")
            print(f"📊 Size: {file_size:,} bytes")
            
            # Optional: Show some file info
            from PIL import Image
            try:
                img = Image.open(save_path)
                print(f"🖼️  Dimensions: {img.size[0]}x{img.size[1]}")
                print(f"🎨 Mode: {img.mode}")
            except Exception as e:
                print(f"ℹ️  Could not read image details: {e}")
                
        else:
            print("❌ FAILED: Image file not created")
            
    except Exception as e:
        print(f"❌ FAILED: {e}")
        print(f"Error type: {type(e).__name__}")
        print("\nThis might be expected if:")
        print("- First time downloading the model (large download)")
        print("- Internet connection issues")
        print("- Model not yet available publicly")

if __name__ == "__main__":
    test_nvidia_difix()
