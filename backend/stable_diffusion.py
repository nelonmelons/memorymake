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

    base_prompt = "A 180-degree panoramic view of a landscape or architecture with clear, layered depth, where the foreground, " \
         "middle ground, and background feature distinct objects placed at varying distances. The scene includes elements " \
         "that span across different depth levels, creating a sense of dimensionality. The foreground objects are closer " \
         "to the viewer, while those in the middle ground and background recede with noticeable separation. The scene is " \
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
        guidance_scale=7.5, # Adjust to a higher value for better adherence to the prompt
        negative_prompt = "Do not include any deep perspective effects, objects receding into the middle, or significant depth convergence. " \
                 "Avoid side-focused elements, excessive small objects, uneven terrain, or cluttered foregrounds. " \
                 "Exclude distractions like people, animals, or modern artifacts. " \
                 "Do not include any object too close to the sides or create excessive side elements that disrupt the depth layers. " \
                 "Avoid harsh lighting, strong shadows, fog, or haziness that obscures the planes, maintaining clean and clear depth segmentation. " \
                 "Focus on medium to large-sized objects, avoiding too many small items that would make it harder for precise rendering."
    )

    image.save(save_path)

    print(f"Image generated with the prompt: '{final_prompt}'")
