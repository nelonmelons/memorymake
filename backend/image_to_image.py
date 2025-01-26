from huggingface_hub import InferenceClient
from PIL import Image
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Load the image to be processed
image_path = "island.jpg"

prompt = "Transform this island panoramic view into a dramatic, surreal scene. Change the weather to a violent, apocalyptic storm, with dark clouds swirling above and intense rain flooding the beach. Add large, jagged cliffs rising from the water, with towering, alien-like rock formations. The island should now appear otherworldly, with glowing bioluminescent plants and futuristic structures emerging from the landscape. The sky should be illuminated by lightning strikes, casting an eerie glow over the scene, and the ocean should appear tumultuous with massive waves crashing against the shore. The overall style should be dark, moody, and hyper-realistic, resembling a scene from a dystopian sci-fi movie."

input = {
    "prompt": prompt,
    "image": image_path,
    "strength": 0.9, 
    "guidance_scale": 18, 
    "num_inference_steps": 100, 
}

# Initialize the InferenceApi 
client = InferenceClient(
    model="stabilityai/stable-diffusion-xl-refiner-1.0",
    api_key=os.getenv("HF_TOKEN")
) 

# Make the API call
output = client.image_to_image(**input)

# Save the output image
output.save("output_image.jpg")