import os
import server
import folder_paths
from aiohttp import web

WEB_DIRECTORY = "./web"
NODE_CLASS_MAPPINGS = {}
NODE_DISPLAY_NAME_MAPPINGS = {}

@server.PromptServer.instance.routes.get("/comfyui-output-browser/images")
async def get_images(request):
    output_dir = folder_paths.get_output_directory()
    
    if not os.path.exists(output_dir):
        return web.json_response([])
        
    files = [f for f in os.listdir(output_dir) if f.lower().endswith('.png')]
    files.sort(key=lambda x: os.path.getmtime(os.path.join(output_dir, x)), reverse=True)
            
    return web.json_response(files)

@server.PromptServer.instance.routes.post("/comfyui-output-browser/delete")
async def delete_images(request):
    data = await request.json()
    files = data.get("files", [])
    output_dir = folder_paths.get_output_directory()
    deleted = []
    
    for f in files:
        safe_f = os.path.basename(f)
        file_path = os.path.join(output_dir, safe_f)
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
                deleted.append(safe_f)
            except Exception as e:
                print(f"Failed to delete {safe_f}: {e}")
                
    return web.json_response({"deleted": deleted})

@server.PromptServer.instance.routes.post("/comfyui-output-browser/rename")
async def rename_image(request):
    data = await request.json()
    old_name = os.path.basename(data.get("old_name", ""))
    new_name = os.path.basename(data.get("new_name", ""))
    
    output_dir = folder_paths.get_output_directory()
    old_path = os.path.join(output_dir, old_name)
    new_path = os.path.join(output_dir, new_name)
    
    if not new_name.lower().endswith('.png'):
        new_name += '.png'
        new_path += '.png'
        
    if os.path.exists(old_path) and not os.path.exists(new_path):
        try:
            os.rename(old_path, new_path)
            return web.json_response({"success": True, "new_name": new_name})
        except Exception as e:
            return web.json_response({"success": False, "error": str(e)})
            
    return web.json_response({"success": False, "error": "File not found or new name already exists."})