#!/usr/bin/env python3
"""
Test script for NVIDIA DiFix model integration.
Run this to verify the DiFix model works before using it in the main pipeline.
"""

import os
import sys
from stable_diffusion import generate_image_difix, generate_image_with_model_selection, check_system_capabilities

def print_system_info():
    """Print detailed system information for debugging"""
    print("🔍 System Diagnostics")
    print("-" * 30)
    
    info = check_system_capabilities()
    
    print(f"PyTorch Version: {info['pytorch_version']}")
    print(f"CUDA Available: {info['cuda_available']}")
    print(f"CUDA Device Count: {info['cuda_device_count']}")
    
    if info['cuda_available']:
        print(f"CUDA Version: {info.get('cuda_version', 'Unknown')}")
        if 'gpu_name' in info:
            print(f"GPU: {info['gpu_name']}")
            print(f"GPU Memory: {info['gpu_memory']:.1f} GB")
    
    print("\n📋 Recommendations:")
    for rec in info['recommendations']:
        print(f"  • {rec}")
    
    print("\n" + "="*50)

def test_difix_model():
    """Test the Enhanced SDXL model integration (DiFix alternative)"""
    
    # Test parameters
    test_prompt = "A serene mountain landscape with a lake"
    test_style = "photorealistic"
    test_output = "test_enhanced_output.png"
    
    print("🧪 Testing Enhanced SDXL model integration (DiFix alternative)...")
    print(f"Prompt: {test_prompt}")
    print(f"Style: {test_style}")
    print(f"Output: {test_output}")
    print("-" * 50)
    
    try:
        # Test the Enhanced SDXL function (formerly DiFix)
        print("Testing generate_image_difix() [Enhanced SDXL]...")
        generate_image_difix(test_prompt, test_style, test_output)
        
        if os.path.exists(test_output):
            print(f"✅ SUCCESS: Image generated and saved to {test_output}")
            file_size = os.path.getsize(test_output)
            print(f"File size: {file_size} bytes")
        else:
            print("❌ FAILED: Image file not created")
            return False
            
    except Exception as e:
        print(f"❌ ERROR in generate_image_difix(): {e}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        print("Full traceback:")
        print(traceback.format_exc())
        return False
    
    try:
        # Test the model selection function
        print("\n🔄 Testing generate_image_with_model_selection()...")
        test_output_2 = "test_enhanced_selection.png"
        generate_image_with_model_selection(test_prompt, test_style, test_output_2, model="enhanced")
        
        if os.path.exists(test_output_2):
            print(f"✅ SUCCESS: Model selection works, image saved to {test_output_2}")
            file_size = os.path.getsize(test_output_2)
            print(f"File size: {file_size} bytes")
        else:
            print("❌ FAILED: Model selection did not create image")
            return False
            
    except Exception as e:
        print(f"❌ ERROR in generate_image_with_model_selection(): {e}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        print("Full traceback:")
        print(traceback.format_exc())
        return False
    
    print("\n🎉 All tests passed! Enhanced SDXL integration is working correctly.")
    
    # Cleanup test files
    for file in [test_output, test_output_2]:
        if os.path.exists(file):
            os.remove(file)
            print(f"Cleaned up: {file}")
    
    return True

def test_fallback():
    """Test the fallback mechanism when DiFix is not available"""
    
    print("\n🔧 Testing fallback mechanism...")
    
    # This will test if the fallback works when DiFix model is not available
    test_prompt = "A cyberpunk cityscape"
    test_style = "futuristic"
    test_output = "test_fallback.png"
    
    print(f"Prompt: {test_prompt}")
    print(f"Style: {test_style}")
    print(f"Output: {test_output}")
    print(f"Model: invalid_model (should trigger fallback)")
    
    try:
        # Try with an invalid model name to trigger fallback
        print("Attempting generation with invalid model...")
        generate_image_with_model_selection(test_prompt, test_style, test_output, model="invalid_model")
        
        if os.path.exists(test_output):
            print("✅ SUCCESS: Fallback mechanism works")
            file_size = os.path.getsize(test_output)
            print(f"Generated file size: {file_size} bytes")
            os.remove(test_output)
            print(f"Cleaned up: {test_output}")
            return True
        else:
            print("❌ FAILED: Fallback did not generate image")
            return False
            
    except Exception as e:
        print(f"❌ ERROR in fallback test: {e}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        print("Full traceback:")
        print(traceback.format_exc())
        return False

if __name__ == "__main__":
    print("Enhanced SDXL (DiFix Alternative) Integration Test")
    print("=" * 50)
    
    # Print system diagnostics first
    print_system_info()
    
    # Check if we're in the right directory
    if not os.path.exists("stable_diffusion.py"):
        print("❌ ERROR: Please run this script from the backend directory")
        sys.exit(1)
    
    # Test Enhanced SDXL integration
    success = test_difix_model()
    
    # Test fallback mechanism
    fallback_success = test_fallback()
    
    if success and fallback_success:
        print("\n🚀 Enhanced SDXL integration is ready for production!")
        print("✅ Main generation works")
        print("✅ Fallback mechanism works")
        print("You can now use the enhanced model in your 2D-to-3D pipeline.")
    elif success:
        print("\n⚠️  Enhanced SDXL works but fallback has issues.")
        print("✅ Main generation works")
        print("❌ Fallback mechanism needs attention")
        print("This might not be critical for production.")
    else:
        print("\n⚠️  Enhanced SDXL integration needs debugging.")
        print("Check the error messages above and ensure all dependencies are installed.")
        print("\n💡 Common solutions:")
        print("  • For CUDA issues: Install CUDA toolkit and GPU-enabled PyTorch")
        print("  • For CPU-only: The model will work slower but still functional")
        print("  • For model loading: Enhanced SDXL uses existing diffusers models")
        print("  • For NoneType errors: Check input validation and pipeline results")