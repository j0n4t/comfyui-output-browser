import os
import server
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

@server.PromptServer.instance.routes.post("/comfyui-output-browser/delete")
async def delete_images(request):
    data = await request.json()
    files = data.get("files", [])
    output_dir = folder_paths.get_output_directory()
    deleted = []
    
    for f in files:
        file_path = get_safe_path(output_dir, f)
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
                deleted.append(f)
            except Exception as e:
                print(f"Failed to delete {f}: {e}")
                
    return web.json_response({"deleted": deleted})

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
            return web.json_response({"success": False, "error": "Target file path already exists."})
            
        try:
            os.makedirs(os.path.dirname(new_path), exist_ok=True)
            os.rename(old_path, new_path)
            # Standardize returned path separator to forward slashes for URLs
            clean_new_name = os.path.relpath(new_path, os.path.abspath(output_dir)).replace("\\", "/")
            return web.json_response({"success": True, "new_name": clean_new_name})
        except Exception as e:
            return web.json_response({"success": False, "error": str(e)})
            
    return web.json_response({"success": False, "error": "Source file not found."})