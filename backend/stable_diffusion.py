from huggingface_hub import InferenceClient
from dotenv import load_dotenv
import os
from diffusers import StableDiffusionPipeline
import torch

# Load environment variables (ensure your HF_TOKEN is stored in a .env file)
load_dotenv()

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

def generate_image_local(prompt: str, style: str, save_path: str) -> None:
    """
    Generate an image based on the prompt and style using the locally downloaded Stable Diffusion XL model.
    
    Args:
        prompt (str): The prompt describing the image.
        style (str): The style of the generated image.
        save_path (str): Path to save the generated image.
    """
    # Define the final prompt based on the style
    base_prompt = "A 180-degree panoramic view of a landscape or architecture with clear, layered depth, where the foreground, " \
                  "middle ground, and background feature distinct objects placed at varying distances. The scene includes elements " \
                  "that span across different depth levels, creating a sense of dimensionality. The scene is " \
                  "captured in wide, continuous panoramic view with natural daylight, soft shadows, and even lighting to enhance " \
                  "depth perception and ensure clean segmentation. Avoid flat or converging depth, focusing on creating a natural, " \
                  "layered composition with depth variation, making it suitable for 3D modeling and visualization. Place the key " \
                  "elements prominently at the front center, with medium to large objects, and appropriate spatial separation between layers."

    final_prompt = f"Create a {style} style image of {prompt}. {base_prompt}"

    # Load the locally stored Stable Diffusion XL model and pipeline
    pipe = StableDiffusionPipeline.from_pretrained("stabilityai/stable-diffusion-xl-base-1.0", 
                                                   torch_dtype=torch.float16)  # For faster inference on supported hardware
    pipe.to("cuda")  # Use GPU if available

    # Generate the image
    image = pipe(final_prompt, num_inference_steps=50, guidance_scale=7.5).images[0]

    # Save the image
    image.save(save_path)

    print(f"Image generated and saved to: {save_path}")