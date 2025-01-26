from huggingface_hub import InferenceClient
from dotenv import load_dotenv
import os

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

    base_prompt = "Generate a 180-degree panoramic view with a balanced composition of foreground, middle ground, and background. " \
              "The middle ground should serve as the central focus, with prominent details and spatial coherence. The foreground " \
              "should not dominate the view but provide context and depth, while the background adds subtle depth and completes " \
              "the composition. Ensure the middle ground and background are aligned to maintain a consistent sense of depth. " \
              "Lighting and textures should be realistic, with all elements rendered in a way suitable for 3D reconstruction, " \
              "including rich details, clear geometry, and seamless continuity across the panorama."
    
    # Define the final prompt based on the style
    final_prompt = f"Create a {style} image of {prompt}. {base_prompt}"

    # Generate the image with the created prompt
    image = client.text_to_image(
        final_prompt,
        model="stabilityai/stable-diffusion-xl-base-1.0",  # SDXL model
        height=512,  # Height of the image
        width=1024,  # Width of the image
        num_inference_steps=50,  # Increase steps for higher quality
        guidance_scale=7.5, # Adjust to a higher value for better adherence to the prompt
        negative_prompt="Exclude abstract, distorted, or inconsistent features. Avoid any compositional imbalance, such as an overly " \
                  "dominant foreground or a lack of distinction between foreground, middle ground, and background. Prevent " \
                  "artifacts or mismatched depth planes that disrupt spatial coherence. Exclude obstructions and overly complex " \
                  "or cluttered elements that detract from the intended panoramic scene."
    )

    image.save(save_path)

    print(f"Image generated with the prompt: '{final_prompt}'")
