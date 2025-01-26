from huggingface_hub import InferenceClient
from dotenv import load_dotenv
import os
from enum import Enum

# Enum for styles
class Style(Enum):
    PHOTOREALISTIC = "Photorealistic"
    PAINTING = "Painting"
    CYBERPUNK = "Cyberpunk"

# Load environment variables (ensure your HF_TOKEN is stored in a .env file)
load_dotenv()

# Initialize the Hugging Face InferenceClient
client = InferenceClient(api_key=os.getenv("HF_TOKEN"))

# Function to create a suitable prompt
def create_prompt(base_prompt: str, style: Style) -> str:
    # Ensure the base prompt includes aspects for a panoramic view with aspect ratio 2:1
    prompt = f"A {style.value.lower()} photo of {base_prompt}, panoramic view, 180 degree view, aspect ratio 2:1, wide landscape"
    return prompt

# User input for the base prompt and style
base_prompt = input("Enter the base description of the scene (e.g., 'a castle on a hill'): ")
print("\nSelect a style from the options below:")
for idx, style in enumerate(Style):
    print(f"{idx + 1}. {style.value}")
style_choice = int(input("Enter the number for your chosen style: ")) - 1

# Create the final prompt
chosen_style = list(Style)[style_choice]
final_prompt = create_prompt(base_prompt, chosen_style)

# Generate the image with the created prompt
image = client.text_to_image(
    final_prompt,
    model="stabilityai/stable-diffusion-xl-base-1.0",  # SDXL model
    target_size="1024x512",  # 2:1 aspect ratio
    height=512,  # Height of the image
    width=1024,  # Width of the image
    num_inference_steps=50,  # Increase steps for higher quality
    guidance_scale=7.5, # Adjust to a higher value for better adherence to the prompt
    negative_prompt="Do not include any large foreground elements like large rocks, \
        wide paths, or excessive vegetation. Avoid distracting details like animals, people, \
        or unnatural objects in the foreground or background. No cluttered, busy elements in the scene. \
        Exclude harsh lighting, overly bright colors, or unrealistic textures. No heavy fog, haze, or clouds \
        obstructing the view of the castle or distant mountains. \
        Do not generate any modern structures or technology; keep the scene strictly medieval \
        and natural. Do not generate any people or animals in the scene."
)

# Show and save the generated image
image.show()
image.save("generated_sdxl.png")

print(f"Image generated with the prompt: '{final_prompt}'")
