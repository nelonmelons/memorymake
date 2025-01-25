from fastapi import FastAPI, File, UploadFile
from fastapi.responses import FileResponse
import os
import shutil

app = FastAPI()

# Define directories for uploads and rendered files
UPLOAD_FOLDER = 'uploads'
RENDERED_FOLDER = 'rendered_files'
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'bmp', 'tiff'}

# Ensure the upload and rendered directories exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RENDERED_FOLDER, exist_ok=True)

def allowed_file(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    if not allowed_file(file.filename):
        return {"error": "Invalid file format"}, 400

    # Save the uploaded file
    file_location = os.path.join(UPLOAD_FOLDER, file.filename)
    with open(file_location, "wb") as f:
        f.write(await file.read())

    # Process the file (dummy processing step here)
    # Imagine calling a function like `process_image_to_3d(file_location)`
    rendered_file_path = os.path.join(RENDERED_FOLDER, f"{file.filename.split('.')[0]}.obj")

    # Dummy operation: just move the file to the rendered folder for now
    shutil.copy(file_location, rendered_file_path)

    return {"message": "File uploaded successfully", "rendered_file": rendered_file_path}

@app.get("/rendered_file/{file_name}")
async def get_rendered_file(file_name: str):
    file_path = os.path.join(RENDERED_FOLDER, file_name)
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type='application/octet-stream', filename=file_name)
    else:
        return {"error": "File not found"}, 404