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