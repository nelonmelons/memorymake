from fastapi import FastAPI, File, UploadFile
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define directories for uploads and rendered files
UPLOAD_FOLDER = 'uploads'
RENDERED_FOLDER = 'rendered_files'
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'bmp', 'tiff'}

# Ensure the upload and rendered directories exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RENDERED_FOLDER, exist_ok=True)

def allowed_file(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.post("/upload")  # Removed trailing slash to match frontend
async def upload_file(file: UploadFile = File(...)):
    try:
        if not file:
            return {"error": "No file provided"}, 400
            
        if not allowed_file(file.filename):
            return {"error": "Invalid file format"}, 400

        # Create a unique filename
        file_extension = file.filename.rsplit('.', 1)[1].lower()
        unique_filename = f"upload_{os.urandom(8).hex()}.{file_extension}"
        
        # Save the uploaded file
        file_location = os.path.join(UPLOAD_FOLDER, unique_filename)
        with open(file_location, "wb+") as f:
            shutil.copyfileobj(file.file, f)

        # Process the file (dummy processing step here)
        # Imagine calling a function like `process_image_to_3d(file_location)`
        output_filename = f"output_mesh.obj"
        rendered_file_path = os.path.join(RENDERED_FOLDER, output_filename)

        # Dummy operation: just copy the file to the rendered folder for now
        # In reality, you would process the image to create the OBJ file here
        shutil.copy(file_location, rendered_file_path)

        return {
            "message": "File uploaded and processed successfully",
            "original_file": unique_filename,
            "rendered_file": output_filename
        }
    except Exception as e:
        return {"error": str(e)}, 500

@app.get("/rendered_file/{file_name}")
async def get_rendered_file(file_name: str):
    file_path = os.path.join(RENDERED_FOLDER, file_name)
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type='application/octet-stream', filename=file_name)
    return {"error": "File not found"}, 404