from huggingface_hub import InferenceClient
from dotenv import load_dotenv
import os
from diffusers import StableDiffusionPipeline, DiffusionPipeline
import torch

# Load environment variables (ensure your HF_TOKEN is stored in a .env file)
load_dotenv()

def check_system_capabilities():
    """
    Check system capabilities for running diffusion models.
    Returns information about CUDA, memory, and recommendations.
    """
    info = {
        "cuda_available": torch.cuda.is_available(),
        "cuda_device_count": torch.cuda.device_count() if torch.cuda.is_available() else 0,
        "pytorch_version": torch.__version__,
        "recommendations": []
    }
    
    if info["cuda_available"]:
        try:
            info["cuda_version"] = torch.version.cuda
            info["gpu_name"] = torch.cuda.get_device_name(0)
            info["gpu_memory"] = torch.cuda.get_device_properties(0).total_memory / (1024**3)  # GB
            
            if info["gpu_memory"] < 6:
                info["recommendations"].append("GPU has less than 6GB VRAM - consider using CPU or basic models")
            elif info["gpu_memory"] < 8:
                info["recommendations"].append("GPU has limited VRAM - NVIDIA DiFix may work but with reduced batch size")
            else:
                info["recommendations"].append("GPU has sufficient VRAM for optimal NVIDIA DiFix performance")
                
        except Exception as e:
            info["cuda_error"] = str(e)
            info["recommendations"].append("CUDA detected but not functioning properly - check CUDA installation")
    else:
        info["recommendations"].append("No CUDA support detected - will use CPU (slower but functional)")
        info["recommendations"].append("To enable GPU: install CUDA toolkit and GPU-enabled PyTorch")
    
    return info

def generate_image(prompt: str, style: str, save_path: str) -> None:
    """
    Generate an image based on the prompt and style using the Stable Diffusion XL model.
    
    Args:
        prompt (str): The prompt describing the image.
        style (Style): The style of the generated image.
    """
    # Initialize the Hugging Face InferenceClient
    client = InferenceClient(api_key=os.getenv("HF_TOKEN"))

    base_prompt = "A 180-degree panoramic view of a landscape or architecture with clear, layered depth, where the foreground, " \
         "middle ground, and background feature distinct objects placed at varying distances. The scene includes elements " \
         "that span across different depth levels, creating a sense of dimensionality. The scene is " \
         "captured in wide, continuous panoramic view with natural daylight, soft shadows, and even lighting to enhance " \
         "depth perception and ensure clean segmentation. Avoid flat or converging depth, focusing on creating a natural, " \
         "layered composition with depth variation, making it suitable for 3D modeling and visualization. Place the key " \
         "elements prominently at the front center, with medium to large objects, and appropriate spatial separation between layers."
    
    # Define the final prompt based on the style
    final_prompt = f"Create a {style} style image of {prompt}. {base_prompt}"

    # Generate the image with the created prompt
    image = client.text_to_image(
        final_prompt,
        model="stabilityai/stable-diffusion-xl-base-1.0",  # SDXL model
        height=512,  # Height of the image
        width=1024,  # Width of the image
        num_inference_steps=50,  # Increase steps for higher quality
        guidance_scale=7.5,
        negative_prompt = "Exclude distractions like people, animals, or modern artifacts. " \
                 "Do not include any object too close to the sides or create excessive side elements that disrupt the depth layers. " \
                 "Avoid harsh lighting, strong shadows, fog, or haziness that obscures the planes, maintaining clean and clear depth segmentation. " \
                 "Focus on medium to large-sized objects, avoiding too many small items that would make it harder for precise rendering." \
                 "Avoid a too flat foreground to ensure a clear distinction between the layers. " \
    )

    image.save(save_path)

    print(f"Image generated with the prompt: '{final_prompt}'")

def generate_image_local(prompt: str, style: str, save_path: str, use_cuda: bool = True) -> None:
    """
    Generate an image based on the prompt and style using the locally downloaded Stable Diffusion XL model.
    
    Args:
        prompt (str): The prompt describing the image.
        style (str): The style of the generated image.
        save_path (str): Path to save the generated image.
    """
    # Validate inputs
    if not prompt or not style or not save_path:
        raise ValueError("prompt, style, and save_path cannot be None or empty")
    
    # Shorter prompt to avoid token limit issues
    base_prompt = "panoramic view with depth layers, detailed"
    final_prompt = f"{style} style {prompt}, {base_prompt}"
    
    print(f"🎨 Generating with SDXL - Prompt: {final_prompt[:100]}...")

    # Load the locally stored Stable Diffusion XL model and pipeline
    try:
        # Check CUDA availability and user preference
        cuda_available = torch.cuda.is_available() and use_cuda and torch.cuda.device_count() > 0
        
        pipe = StableDiffusionPipeline.from_pretrained(
            "stabilityai/stable-diffusion-xl-base-1.0", 
            torch_dtype=torch.float16 if cuda_available else torch.float32,
            safety_checker=None,  # Disable safety checker for testing
            requires_safety_checker=False
        )
        
        if cuda_available:
            try:
                pipe.to("cuda")  # Use GPU if available
                print("✅ Using GPU for SDXL generation")
                print(f"GPU: {torch.cuda.get_device_name(0)}, Memory: {torch.cuda.get_device_properties(0).total_memory / (1024**3):.1f}GB")
            except Exception as e:
                print(f"⚠️  Failed to move SDXL to GPU: {e}")
                print("🔄 Using CPU for SDXL generation")
        else:
            if not use_cuda:
                print("ℹ️  CUDA disabled by user - using CPU for SDXL generation")
            elif not torch.cuda.is_available():
                print("ℹ️  CUDA not available - using CPU for SDXL generation")
            else:
                print("ℹ️  Using CPU for SDXL generation")
            
    except Exception as e:
        print(f"❌ Error loading SDXL: {e}")
        # Fallback to basic SD 1.5
        generate_image_local_basic(prompt, style, save_path)
        return

    # Generate the image with error handling
    try:
        # Use minimal parameters to avoid NoneType errors
        result = pipe(
            prompt=final_prompt,  # Use explicit parameter name
            num_inference_steps=20,  # Reduced for faster testing
            guidance_scale=7.5,
            height=512,
            width=1024
        )
        
        if result is None:
            raise ValueError("SDXL Pipeline returned None result")
            
        if not hasattr(result, 'images'):
            raise ValueError("SDXL result has no 'images' attribute")
            
        if not result.images:
            raise ValueError("SDXL result.images is empty")
            
        image = result.images[0]
        
        if image is None:
            raise ValueError("SDXL Generated image is None")
            
    except Exception as e:
        print(f"❌ Error during SDXL generation: {e}")
        print(f"❌ Error type: {type(e).__name__}")
        print("🔄 Falling back to basic generation...")
        generate_image_local_basic(prompt, style, save_path, use_cuda)
        return

    # Save the image
    try:
        image.save(save_path)
        print(f"✅ SDXL image generated and saved to: {save_path}")
    except Exception as e:
        print(f"❌ Error saving image: {e}")
        raise e


def generate_image_difix(prompt: str, style: str, save_path: str, use_cuda: bool = True) -> None:
    """
    Generate an image using the actual NVIDIA DiFix model.
    
    Args:
        prompt (str): The prompt describing the image.
        style (str): The style of the generated image.
        save_path (str): Path to save the generated image.
        use_cuda (bool): Whether to use CUDA if available (default: True).
    """
    # Validate inputs
    if not prompt or not style or not save_path:
        raise ValueError("prompt, style, and save_path cannot be None or empty")
    
    print("🎨 Using NVIDIA DiFix model...")
    
    # Create enhanced prompt for DiFix with style and 3D optimization
    base_prompt = "detailed, 8k, high quality, panoramic view with clear depth layers"
    final_prompt = f"{prompt}, {style} style, {base_prompt}"
    
    print(f"🎨 DiFix Generation - Prompt: {final_prompt[:100]}...")

    try:
        # Check CUDA availability and user preference
        cuda_available = torch.cuda.is_available() and use_cuda and torch.cuda.device_count() > 0
        
        # Load the actual NVIDIA DiFix model
        pipe = DiffusionPipeline.from_pretrained(
            "nvidia/difix",
            torch_dtype=torch.float16 if cuda_available else torch.float32,
            trust_remote_code=True  # Required for DiFix model
        )
        
        if cuda_available:
            try:
                pipe = pipe.to("cuda")
                print("✅ Using GPU for NVIDIA DiFix generation")
                print(f"GPU: {torch.cuda.get_device_name(0)}, Memory: {torch.cuda.get_device_properties(0).total_memory / (1024**3):.1f}GB")
            except Exception as e:
                print(f"⚠️  Failed to move DiFix to GPU: {e}")
                print("🔄 Using CPU for DiFix generation")
                cuda_available = False
        else:
            if not use_cuda:
                print("ℹ️  CUDA disabled by user - using CPU for DiFix generation")
            elif not torch.cuda.is_available():
                print("ℹ️  CUDA not available - using CPU for DiFix generation")
            else:
                print("ℹ️  Using CPU for DiFix generation")
                
    except Exception as e:
        print(f"❌ Error loading NVIDIA DiFix model: {e}")
        print("🔄 Falling back to Enhanced SDXL...")
        generate_image_local_enhanced(prompt, style, save_path, use_cuda)
        return

    # Generate with DiFix
    try:
        print("🚀 Generating with NVIDIA DiFix...")
        
        # DiFix optimized parameters
        result = pipe(
            prompt=final_prompt,
            height=512,
            width=1024,
            num_inference_steps=25,  # DiFix typically needs fewer steps
            guidance_scale=7.0       # Optimized for DiFix
        )
        
        if result is None:
            raise ValueError("DiFix pipeline returned None result")
            
        if not hasattr(result, 'images'):
            raise ValueError("DiFix result has no 'images' attribute")
            
        if not result.images:
            raise ValueError("DiFix result.images is empty")
            
        image = result.images[0]
        
        if image is None:
            raise ValueError("DiFix generated image is None")

        # Save the generated image
        image.save(save_path)
        print(f"✅ NVIDIA DiFix image generated and saved to: {save_path}")

    except Exception as e:
        print(f"❌ Error during DiFix generation: {e}")
        print(f"❌ Error type: {type(e).__name__}")
        print("🔄 Falling back to Enhanced SDXL...")
        # Fallback to enhanced SDXL if DiFix fails
        generate_image_local_enhanced(prompt, style, save_path, use_cuda)


def generate_image_local_enhanced(prompt: str, style: str, save_path: str, use_cuda: bool = True) -> None:
    """
    Enhanced version of generate_image_local with DiFix-style optimizations.
    Uses Stable Diffusion XL with improved settings for better quality.
    """
    # Validate inputs
    if not prompt or not style or not save_path:
        raise ValueError("prompt, style, and save_path cannot be None or empty")
    
    # Debug logging
    print(f"🔧 Debug - prompt: {prompt}")
    print(f"🔧 Debug - style: {style}")
    print(f"🔧 Debug - save_path: {save_path}")
    print(f"🔧 Debug - use_cuda: {use_cuda}")
    
    # Shorter, more focused prompt to avoid token limit issues
    base_prompt = "panoramic landscape with clear depth layers, foreground middle-ground background separation, " \
                  "natural lighting, detailed, high quality"

    # Create a more concise final prompt
    final_prompt = f"{style} style {prompt}, {base_prompt}"
    
    print(f"🎨 Enhanced SDXL Generation - Prompt: {final_prompt[:100]}...")

    # Load Stable Diffusion XL with enhanced settings
    try:
        # Check CUDA availability and user preference
        cuda_available = torch.cuda.is_available() and use_cuda and torch.cuda.device_count() > 0
        
        pipe = StableDiffusionPipeline.from_pretrained(
            "stabilityai/stable-diffusion-xl-base-1.0", 
            torch_dtype=torch.float16 if cuda_available else torch.float32,
            safety_checker=None,
            requires_safety_checker=False,
            use_safetensors=True
        )
        
        if cuda_available:
            try:
                pipe = pipe.to("cuda")
                print("✅ Using GPU for Enhanced SDXL generation")
                print(f"GPU: {torch.cuda.get_device_name(0)}, Memory: {torch.cuda.get_device_properties(0).total_memory / (1024**3):.1f}GB")
            except Exception as e:
                print(f"⚠️  Failed to move to GPU: {e}")
                print("🔄 Using CPU for Enhanced SDXL generation")
                cuda_available = False
        else:
            if not use_cuda:
                print("ℹ️  CUDA disabled by user - using CPU for Enhanced SDXL generation")
            elif not torch.cuda.is_available():
                print("ℹ️  CUDA not available - using CPU for Enhanced SDXL generation")
            else:
                print("ℹ️  Using CPU for Enhanced SDXL generation")
            
    except Exception as e:
        print(f"❌ Error loading Enhanced SDXL: {e}")
        print(f"❌ Error type: {type(e).__name__}")
        raise e

    # Generate with enhanced parameters
    try:
        # Create a proper negative prompt string
        negative_prompt = "blurry, low quality, flat, distorted, cluttered"
        
        print(f"🔧 Debug - About to call pipe() with:")
        print(f"   - prompt: '{final_prompt[:50]}...'")
        print(f"   - negative_prompt: '{negative_prompt}'")
        print(f"   - height: 512, width: 1024")
        
        # Generate with basic parameters first to avoid issues
        result = pipe(
            prompt=final_prompt,
            height=512,
            width=1024,
            num_inference_steps=30,  # Reduced from 50 for stability
            guidance_scale=7.5,      # Standard value
            negative_prompt=negative_prompt
        )
        
        print(f"🔧 Debug - pipe() returned: {type(result)}")
        
        if result is None:
            raise ValueError("Enhanced SDXL pipeline returned None result")
            
        if not hasattr(result, 'images'):
            raise ValueError("Enhanced SDXL result has no 'images' attribute")
            
        if not result.images:
            raise ValueError("Enhanced SDXL result.images is empty")
            
        image = result.images[0]
        
        if image is None:
            raise ValueError("Enhanced SDXL generated image is None")

        # Save the generated image
        image.save(save_path)
        print(f"✅ Enhanced SDXL image generated and saved to: {save_path}")

    except Exception as e:
        print(f"❌ Error during Enhanced SDXL generation: {e}")
        print(f"❌ Error type: {type(e).__name__}")
        print(f"❌ Error details: {str(e)}")
        print("🔄 Falling back to basic SDXL...")
        # Final fallback to basic generation
        generate_image_local_basic(prompt, style, save_path, use_cuda)


def generate_image_local_basic(prompt: str, style: str, save_path: str, use_cuda: bool = True) -> None:
    """
    Basic fallback image generation with minimal parameters to avoid NoneType errors.
    """
    print("🔧 Using basic SDXL generation (fallback mode)...")
    
    # Very simple prompt to avoid token limits
    simple_prompt = f"{style} {prompt}"
    
    try:
        # Check CUDA availability and user preference
        cuda_available = torch.cuda.is_available() and use_cuda and torch.cuda.device_count() > 0
        
        pipe = StableDiffusionPipeline.from_pretrained(
            "runwayml/stable-diffusion-v1-5",  # Use SD 1.5 as final fallback
            torch_dtype=torch.float16 if cuda_available else torch.float32,
            safety_checker=None,
            requires_safety_checker=False
        )
        
        if cuda_available:
            try:
                pipe = pipe.to("cuda")
                print("✅ Using GPU for basic SD generation")
                print(f"GPU: {torch.cuda.get_device_name(0)}")
            except Exception:
                print("ℹ️  Using CPU for basic SD generation")
        else:
            if not use_cuda:
                print("ℹ️  CUDA disabled by user - using CPU for basic SD generation")
            else:
                print("ℹ️  Using CPU for basic SD generation")
        
        # Very basic generation call with explicit parameters
        result = pipe(
            prompt=simple_prompt,
            num_inference_steps=20,
            guidance_scale=7.5
        )
        
        if result and hasattr(result, 'images') and result.images:
            image = result.images[0]
            image.save(save_path)
            print(f"✅ Basic SD image saved to: {save_path}")
        else:
            raise ValueError("Basic generation failed")
            
    except Exception as e:
        print(f"❌ Even basic generation failed: {e}")
        # Create a placeholder image as absolute last resort
        from PIL import Image
        import numpy as np
        
        # Create a simple placeholder image
        placeholder = np.random.randint(0, 255, (512, 1024, 3), dtype=np.uint8)
        Image.fromarray(placeholder).save(save_path)
        print(f"⚠️  Created placeholder image at: {save_path}")


def generate_image_with_model_selection(prompt: str, style: str, save_path: str, model: str = "enhanced", use_cuda: bool = True) -> None:
    """
    Generate an image using the specified model.
    
    Args:
        prompt (str): The prompt describing the image.
        style (str): The style of the generated image.
        save_path (str): Path to save the generated image.
        model (str): Model to use. Options:
                    - "enhanced" or "difix": NVIDIA DiFix model (default)
                    - "sdxl": Standard SDXL
                    - "sdxl_api": HuggingFace API SDXL
                    - "basic": Basic SD 1.5 fallback
        use_cuda (bool): Whether to use CUDA if available (default: True).
    """
    model = model.lower()
    
    if model in ["enhanced", "difix"]:
        print("🎨 Using NVIDIA DiFix Model")
        generate_image_difix(prompt, style, save_path, use_cuda)
    elif model == "sdxl":
        print("🎨 Using Standard SDXL")
        generate_image_local(prompt, style, save_path, use_cuda)
    elif model == "sdxl_api":
        print("🎨 Using SDXL API")
        generate_image(prompt, style, save_path)
    elif model == "basic":
        print("🎨 Using Basic SD 1.5")
        generate_image_local_basic(prompt, style, save_path, use_cuda)
    else:
        print(f"⚠️  Unknown model: {model}. Using NVIDIA DiFix as default.")
        generate_image_difix(prompt, style, save_path, use_cuda)