import os
import json
import math
import server
import folder_paths
from aiohttp import web
from PIL import Image

# Register the web directory for the frontend JavaScript
WEB_DIRECTORY = "./web"
NODE_CLASS_MAPPINGS = {}
NODE_DISPLAY_NAME_MAPPINGS = {}

def sanitize_nans(obj):
    """Recursively replaces float('nan') and infinities with None for valid JSON serialization."""
    if isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
        return None
    elif isinstance(obj, dict):
        return {k: sanitize_nans(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [sanitize_nans(v) for v in obj]
    return obj

@server.PromptServer.instance.routes.get("/comfyui-output-browser/images")
async def get_images(request):
    output_dir = folder_paths.get_output_directory()
    
    if not os.path.exists(output_dir):
        return web.json_response([])
        
    # Get all PNGs and sort by modification time (newest first)
    files = [f for f in os.listdir(output_dir) if f.lower().endswith('.png')]
    files.sort(key=lambda x: os.path.getmtime(os.path.join(output_dir, x)), reverse=True)
    
    images = []
    for f in files:
        file_path = os.path.join(output_dir, f)
        try:
            # PIL lazy-loads the file, reading only the header metadata (iTXt chunks)
            with Image.open(file_path) as img:
                images.append({
                    "name": f,
                    "url": f"/view?filename={f}&type=output",
                    "prompt": json.loads(img.info.get("prompt", "null")),
                    "workflow": json.loads(img.info.get("workflow", "null"))
                })
        except Exception:
            pass
            
    return web.json_response(sanitize_nans(images))