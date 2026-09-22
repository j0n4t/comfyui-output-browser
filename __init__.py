import os
import server
import time
import folder_paths
from aiohttp import web

WEB_DIRECTORY = "./web"
NODE_CLASS_MAPPINGS = {}
NODE_DISPLAY_NAME_MAPPINGS = {}

def get_safe_path(base_dir, req_path):
    """Resolves target path and prevents directory traversal outside base_dir."""
    abs_base = os.path.abspath(base_dir)
    abs_target = os.path.abspath(os.path.join(abs_base, req_path))
    if abs_target.startswith(abs_base):
        return abs_target
    return None

@server.PromptServer.instance.routes.get("/comfyui-output-browser/images")
async def get_images(request):
    output_dir = folder_paths.get_output_directory()
    
    if not os.path.exists(output_dir):
        return web.json_response([])
        
    files = []
    for root, _, filenames in os.walk(output_dir):
        for f in filenames:
            if f.lower().endswith('.png'):
                full_path = os.path.join(root, f)
                rel_path = os.path.relpath(full_path, output_dir).replace("\\", "/")
                files.append((rel_path, os.path.getmtime(full_path)))
    
    # Sort files by newest modification time first
    files.sort(key=lambda x: x[1], reverse=True)
    return web.json_response([f[0] for f in files])

import base64
import time
import os

@server.PromptServer.instance.routes.post("/comfyui-output-browser/upload")
async def upload_image(request):
    data = await request.json()
    filename = data.get("filename", "").strip()
    image_data = data.get("image_data", "")

    if not filename or not image_data:
        return web.json_response({"success": False, "error": "Invalid filename or image data provided."})

    if not filename.lower().endswith('.png'):
        filename += '.png'

    output_dir = folder_paths.get_output_directory()
    target_path = get_safe_path(output_dir, filename)

    if not target_path:
        return web.json_response({"success": False, "error": "Access denied: Path outside output directory."})

    # If file already exists, append a timestamp to the filename
    if os.path.exists(target_path):
        base, ext = os.path.splitext(filename)
        timestamp = int(time.time())
        filename = f"{base}_{timestamp}{ext}"
        target_path = get_safe_path(output_dir, filename)

    try:
        os.makedirs(os.path.dirname(target_path), exist_ok=True)
        
        if "," in image_data:
            image_data = image_data.split(",")[1]

        binary_data = base64.b64decode(image_data)
        with open(target_path, "wb") as f:
            f.write(binary_data)

        clean_name = os.path.relpath(target_path, os.path.abspath(output_dir)).replace("\\", "/")
        return web.json_response({"success": True, "name": clean_name})
    except Exception as e:
        return web.json_response({"success": False, "error": str(e)})

@server.PromptServer.instance.routes.post("/comfyui-output-browser/delete")
async def delete_images(request):
    data = await request.json()
    files = data.get("files", [])
    output_dir = folder_paths.get_output_directory()
    trash_dir = os.path.join(output_dir, ".trash")
    
    deleted = []
    trashed = []
    
    for f in files:
        file_path = get_safe_path(output_dir, f)
        if not file_path or not os.path.exists(file_path):
            continue
            
        clean_f = f.replace("\\", "/")
        
        try:
            # If the file is already inside .trash, permanently delete it
            if clean_f.startswith(".trash/") or "/.trash/" in clean_f:
                os.remove(file_path)
                deleted.append(f)
            else:
                # Move to .trash folder
                os.makedirs(trash_dir, exist_ok=True)
                filename = os.path.basename(file_path)
                dest_path = os.path.join(trash_dir, filename)
                
                # Prevent overwriting if a file with the same name already exists in trash
                if os.path.exists(dest_path):
                    base, ext = os.path.splitext(filename)
                    dest_path = os.path.join(trash_dir, f"{base}_{int(time.time())}{ext}")
                    
                os.rename(file_path, dest_path)
                trashed.append(f)
        except Exception as e:
            print(f"Failed to process delete/trash for {f}: {e}")
                
    return web.json_response({"success": True, "deleted": deleted, "trashed": trashed})

@server.PromptServer.instance.routes.post("/comfyui-output-browser/rename")
async def rename_image(request):
    data = await request.json()
    old_name = data.get("old_name", "").strip()
    new_name = data.get("new_name", "").strip()
    
    if not old_name or not new_name:
        return web.json_response({"success": False, "error": "Invalid file names provided."})

    if not new_name.lower().endswith('.png'):
        new_name += '.png'
        
    output_dir = folder_paths.get_output_directory()
    old_path = get_safe_path(output_dir, old_name)
    new_path = get_safe_path(output_dir, new_name)
    
    if not old_path or not new_path:
        return web.json_response({"success": False, "error": "Access denied: Path outside output directory."})
        
    if os.path.exists(old_path):
        if os.path.exists(new_path):
            base, ext = os.path.splitext(new_name)
            timestamp = int(time.time())
            new_name = f"{base}_{timestamp}{ext}"
            new_path = get_safe_path(output_dir, new_name)
        try:
            os.makedirs(os.path.dirname(new_path), exist_ok=True)
            os.rename(old_path, new_path)
            # Standardize returned path separator to forward slashes for URLs
            clean_new_name = os.path.relpath(new_path, os.path.abspath(output_dir)).replace("\\", "/")
            return web.json_response({"success": True, "new_name": clean_new_name})
        except Exception as e:
            return web.json_response({"success": False, "error": str(e)})
            
    return web.json_response({"success": False, "error": "Source file not found."})

@server.PromptServer.instance.routes.post("/comfyui-output-browser/move")
async def move_images(request):
    data = await request.json()
    files = data.get("files", [])
    dest_folder = data.get("dest_folder", "").strip()

    if not files or not dest_folder:
        return web.json_response({"success": False, "error": "Invalid files or destination folder provided."})

    output_dir = folder_paths.get_output_directory()
    safe_dest_dir = get_safe_path(output_dir, dest_folder)
    
    if not safe_dest_dir:
        return web.json_response({"success": False, "error": "Access denied: Destination outside output directory."})

    os.makedirs(safe_dest_dir, exist_ok=True)

    moved = []
    errors = []
    
    for f in files:
        old_path = get_safe_path(output_dir, f)
        if not old_path or not os.path.exists(old_path):
            errors.append(f"{f}: Source not found or invalid.")
            continue
            
        filename = os.path.basename(old_path)
        new_path = os.path.join(safe_dest_dir, filename)
        
        if os.path.exists(new_path):
            base, ext = os.path.splitext(filename)
            timestamp = int(time.time())
            filename = f"{base}_{timestamp}{ext}"
            new_path = get_safe_path(safe_dest_dir, filename)
            
        try:
            os.rename(old_path, new_path)
            clean_new_name = os.path.relpath(new_path, os.path.abspath(output_dir)).replace("\\", "/")
            moved.append({"old_name": f, "new_name": clean_new_name})
        except Exception as e:
            errors.append(f"{f}: {str(e)}")
            
    return web.json_response({"success": True, "moved": moved, "errors": errors})