import tensorflow as tf
import tensorflow_hub as hub
import numpy as np
import matplotlib.pyplot as plt
from PIL import Image

import ssl
import urllib.request

# Disable SSL verification
ssl._create_default_https_context = ssl._create_unverified_context

# Load the pre-trained Neural Style Transfer model from TensorFlow Hub
def load_model():
    # Load the pre-trained model from tfhub (e.g., fast-style-transfer model)
    model = hub.load('https://tfhub.dev/google/magenta/arbitrary-image-stylization-v1-256/2')
    return model

# Resize an image to fit a dynamically calculated target size based on the content image
def resize_image(image, content_size):
    width, height = image.size
    content_width, content_height = content_size

    # Calculate new size while maintaining aspect ratio
    scale = content_width / width
    new_width = int(width * scale)
    new_height = int(height * scale)

    # Resize the image
    resized_image = image.resize((new_width, new_height), Image.LANCZOS)

    # Center crop or pad to fit the 2:1 target aspect ratio
    left = (new_width - content_width) // 2
    top = (new_height - content_height) // 2
    right = left + content_width
    bottom = top + content_height
    
    resized_image = resized_image.crop((left, top, right, bottom))
    return resized_image

# Load and preprocess an image
def load_and_process_image(image_path, content_size):
    img = Image.open(image_path)
    
    # Resize the image based on the content size (aspect ratio 2:1)
    img = resize_image(img, content_size)
    
    # Convert image to array and normalize to [0, 1]
    img = np.array(img) / 255.0
    img = img[tf.newaxis, ...]  # Add batch dimension
    return img

# Convert tensor to image for displaying
def tensor_to_image(tensor):
    tensor = tensor * 255
    tensor = np.array(tensor, dtype=np.uint8)
    if tensor.shape[0] == 1:  # Remove batch dimension
        tensor = tensor[0]
    return Image.fromarray(tensor)

# Perform Neural Style Transfer
def neural_style_transfer(content_image, style_image, model):
    # Convert images to float32
    content_image = tf.cast(content_image, tf.float32)
    style_image = tf.cast(style_image, tf.float32)

    # Apply style transfer
    stylized_image = model(content_image, style_image)[0]
    
    return stylized_image

# Display an image
def display_image(image, title='Image'):
    plt.imshow(image)
    plt.title(title)
    plt.axis('off')
    plt.show()

# Main function to run style transfer
def apply_style_transfer(content_image_path, style_image_path):
    # Load content image to determine target size based on its dimensions
    content_image = Image.open(content_image_path)
    content_width, content_height = content_image.size

    # Dynamically calculate the target size with a 2:1 aspect ratio
    target_width = content_width
    target_height = content_width // 2  # Ensuring a 2:1 aspect ratio

    # Load and process content and style images
    content_image = load_and_process_image(content_image_path, (target_width, target_height))
    style_image = load_and_process_image(style_image_path, (target_width, target_height))

    # Load the pre-trained model from TensorFlow Hub
    model = load_model()

    # Perform style transfer
    stylized_image = neural_style_transfer(content_image, style_image, model)

    # Convert stylized image tensor to image
    output_image = tensor_to_image(stylized_image)

    # Display the result
    # display_image(output_image, title="Stylized Image")

    # Save the output image
    # output_image.save("output.jpg")
    output_image.save(content_image_path)

if __name__ == '__main__':
    # Example usage (adjust the paths to your images)
    apply_style_transfer('assets/osakatest.png', 'nst_styles/cubism.jpg')
