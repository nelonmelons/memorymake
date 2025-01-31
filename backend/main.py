from fastapi import FastAPI, File, UploadFile, Form, BackgroundTasks
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
import asyncio, time
from open_3d import open_3d_main
import stable_diffusion
from neural_style_transfer import apply_style_transfer

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define directories for uploads and rendered files
UPLOAD_FOLDER = 'uploads'
RENDERED_FOLDER = 'rendered'
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'bmp', 'tiff'}
PUBLIC_DIR = os.path.join(os.getcwd(), "public")

# Ensure the upload and rendered directories exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RENDERED_FOLDER, exist_ok=True)

def allowed_file(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.post("/upload")  # Removed trailing slash to match frontend
async def upload_file(file: UploadFile = File(...), style: str = Form(...), background_tasks: BackgroundTasks = None):
    try:
        if not file or not style:
            return {"error": "Both file and style are required"}, 400
            
        if not allowed_file(file.filename):
            return {"error": "Invalid file format"}, 400

        # Create a unique filename
        file_extension = file.filename.rsplit('.', 1)[1].lower()
        unique_file_first = f"upload_{os.urandom(8).hex()}"
        unique_filename = f"{unique_file_first}.{file_extension}"
        
        # Save the uploaded file
        file_location = os.path.join(UPLOAD_FOLDER, unique_filename)
        with open(file_location, "wb+") as f:
            shutil.copyfileobj(file.file, f)

        print("File saved at: ", file_location)
        print("Style: ", style)

        output_filename = os.path.join(RENDERED_FOLDER, f"{unique_file_first}.obj")
        await asyncio.to_thread(open_3d_main, file_location, save_path=output_filename, style=style)
        print('Processing complete.')

        # Clean up the uploaded file after processing
        background_tasks.add_task(cleanup, file_location)

        # Cleanup the rendered file after a certain time
        background_tasks.add_task(cleanup, output_filename)

        return FileResponse(output_filename, media_type='application/octet-stream', filename=unique_file_first + '.obj')
    except Exception as e:
        return {"error": str(e)}, 500

@app.post("/generate")
async def generate_from_prompt(obj: dict, background_tasks: BackgroundTasks = None):
    try:
        prompt = obj.get("prompt")
        style = obj.get("style").lower()
        if not prompt or not style:
            return {"error": "Prompt and style are required"}, 400

        # Generate file paths
        file_id = os.urandom(4).hex()
        save_image_path = f"uploads/generated_{file_id}.png"
        output_filename = f"rendered/generated_{file_id}.obj"

        # NOTE: This uses the Hugging Face Inference API, which is not provided with the code
        stable_diffusion.generate_image(prompt, style, save_image_path)

        # TODO: If you wish to run the generative model locally,
        # uncomment the line below and comment the above line
        # stable_diffusion.generate_image_local(prompt, style, save_image_path)

        print(f"Image saved at: {save_image_path}")

        # Process the image to generate 3D object
        await asyncio.to_thread(open_3d_main, save_image_path, save_path=output_filename, style="photorealistic")
            
        print(f"Processing complete. OBJ saved at: {output_filename}")

        # Clean up the generated image file after processing
        background_tasks.add_task(cleanup, save_image_path)

        # Cleanup the rendered file after a certain time
        background_tasks.add_task(cleanup, output_filename)

        return FileResponse(output_filename, media_type='application/octet-stream', filename=f"generated_{file_id}.obj")
    except Exception as e:
        return {"error": str(e)}, 500

@app.get("/rendered_file/{file_name}")
async def get_rendered_file(file_name: str):
    file_path = os.path.join(RENDERED_FOLDER, file_name)
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type='application/octet-stream', filename=file_name)
    return {"error": "File not found"}, 404

# Background task to clean up the image file
def cleanup(path: str):
    if os.path.exists(path):
        os.remove(path)
        print(f"Cleaned up file: {path}")

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run('main:app', host="127.0.0.1",
#                 port=8000,
#                 ssl)