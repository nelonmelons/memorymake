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

    base_prompt = "A 180-degree panorama of a landscape or architecture with a planar composition, where the foreground, middle ground, and background are clearly separated into horizontal planes. \
                The scene is captured in a wide, continuous panoramic view under natural daylight, with soft shadows and even lighting, ensuring clean depth segmentation. \
                No distracting elements or converging depth; the focus is on planar horizontal layering. Should be suitable for 3D modelling and visualization."
    
    # Define the final prompt based on the style
    final_prompt = f"Create a {style} style image of {prompt}. {base_prompt}"

    # Generate the image with the created prompt
    image = client.text_to_image(
        final_prompt,
        model="stabilityai/stable-diffusion-xl-base-1.0",  # SDXL model
        height=512,  # Height of the image
        width=1024,  # Width of the image
        num_inference_steps=50,  # Increase steps for higher quality
        guidance_scale=7.5, # Adjust to a higher value for better adherence to the prompt
        negative_prompt="Do not include any deep perspective effects, objects receding into the middle, or significant depth convergence. \
                    Avoid side-focused elements, uneven terrain, or cluttered foregrounds. \
                    Exclude distractions like people, animals, or modern artifacts. \
                    Do not generate any skewed, asymmetric, or chaotic scenes. \
                    Avoid harsh lighting, strong shadows, fog, or haziness that obscures the planes. \
                    Ensure the layout is horizontally aligned and planar, avoiding complexity or extreme variations in elevation."
    )

    image.save(save_path)

    print(f"Image generated with the prompt: '{final_prompt}'")
