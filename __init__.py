import base64
import os
import time
from aiohttp import web

# Attempt to load ComfyUI context, fallback if running standalone
try:
    import server
    import folder_paths
    COMFYUI_AVAILABLE = True
except ImportError:
    COMFYUI_AVAILABLE = False

WEB_DIRECTORY = "./web"
NODE_CLASS_MAPPINGS = {}
NODE_DISPLAY_NAME_MAPPINGS = {}
__all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS']

def get_safe_path(base_dir, req_path):
    """Resolves target path and prevents directory traversal outside base_dir."""
    abs_base = os.path.abspath(base_dir)
    abs_target = os.path.abspath(os.path.join(abs_base, req_path))
    try:
        if os.path.commonpath([abs_base, abs_target]) == abs_base:
            return abs_target
    except ValueError:
        pass
    return None

def get_output_dir():
    if COMFYUI_AVAILABLE:
        return folder_paths.get_output_directory()
    return os.path.abspath(os.environ.get("COMFYUI_OUTPUT_DIR", "../../output"))

async def get_images(request):
    output_dir = get_output_dir()
    
    if not os.path.exists(output_dir):
        return web.json_response([])
        
    files = []
    for root, _, filenames in os.walk(output_dir):
        for f in filenames:
            if f.lower().endswith('.png'):
                full_path = os.path.join(root, f)
                rel_path = os.path.relpath(full_path, output_dir).replace("\\", "/")
                files.append((rel_path, os.path.getmtime(full_path)))
    
    files.sort(key=lambda x: x[1], reverse=True)
    return web.json_response([{"name": f[0], "mtime": f[1]} for f in files])

async def upload_image(request):
    data = await request.json()
    filename = data.get("filename", "").strip()
    image_data = data.get("image_data", "")

    if not filename or not image_data:
        return web.json_response({"success": False, "error": "Invalid filename or image data provided."})

    if not filename.lower().endswith('.png'):
        filename += '.png'

    output_dir = get_output_dir()
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
        mtime = os.path.getmtime(target_path)
        return web.json_response({"success": True, "name": clean_name, "mtime": mtime})
    except Exception as e:
        return web.json_response({"success": False, "error": str(e)})

async def delete_images(request):
    data = await request.json()
    files = data.get("files", [])
    output_dir = get_output_dir()
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

async def rename_image(request):
    data = await request.json()
    old_name = data.get("old_name", "").strip()
    new_name = data.get("new_name", "").strip()
    
    if not old_name or not new_name:
        return web.json_response({"success": False, "error": "Invalid file names provided."})

    if "/" not in new_name and "\\" not in new_name:
        old_dir = os.path.dirname(old_name.replace("\\", "/"))
        new_name = os.path.join(old_dir, new_name) if old_dir else new_name

    if not new_name.lower().endswith('.png'):
        new_name += '.png'
        
    output_dir = get_output_dir()
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
            clean_new_name = os.path.relpath(new_path, os.path.abspath(output_dir)).replace("\\", "/")
            mtime = os.path.getmtime(new_path)
            return web.json_response({"success": True, "new_name": clean_new_name, "mtime": mtime})
        except Exception as e:
            return web.json_response({"success": False, "error": str(e)})
            
    return web.json_response({"success": False, "error": "Source file not found."})

async def move_images(request):
    data = await request.json()
    files = data.get("files", [])
    dest_folder = data.get("dest_folder", "").strip()

    if not files:
        return web.json_response({"success": False, "error": "No files provided."})

    output_dir = get_output_dir()
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
            mtime = os.path.getmtime(new_path)
            moved.append({"old_name": f, "new_name": clean_new_name, "mtime": mtime})
        except Exception as e:
            errors.append(f"{f}: {str(e)}")
            
    return web.json_response({"success": True, "moved": moved, "errors": errors})

# Map endpoints for ComfyUI vs Standalone
if COMFYUI_AVAILABLE:
    server.PromptServer.instance.routes.get("/comfyui-output-browser/images")(get_images)
    server.PromptServer.instance.routes.post("/comfyui-output-browser/upload")(upload_image)
    server.PromptServer.instance.routes.post("/comfyui-output-browser/delete")(delete_images)
    server.PromptServer.instance.routes.post("/comfyui-output-browser/rename")(rename_image)
    server.PromptServer.instance.routes.post("/comfyui-output-browser/move")(move_images)
else:
    def run_standalone():
        app = web.Application()
        
        # API Routes
        app.router.add_get("/comfyui-output-browser/images", get_images)
        app.router.add_post("/comfyui-output-browser/upload", upload_image)
        app.router.add_post("/comfyui-output-browser/delete", delete_images)
        app.router.add_post("/comfyui-output-browser/rename", rename_image)
        app.router.add_post("/comfyui-output-browser/move", move_images)
        
        # Internal preview routing (replicates ComfyUI's standard behavior)
        async def view_image(request):
            filename = request.query.get("filename")
            subfolder = request.query.get("subfolder", "")
            
            if not filename: 
                return web.Response(status=404)
            
            # Reconstruct the relative path if a subfolder is provided
            if subfolder:
                rel_path = os.path.join(subfolder, filename)
            else:
                rel_path = filename
                
            file_path = get_safe_path(get_output_dir(), rel_path)
            
            if not file_path or not os.path.exists(file_path): 
                return web.Response(status=404)
                
            return web.FileResponse(file_path)

        app.router.add_get("/view", view_image)
        
        # Static file mounting & UI Shell
        current_dir = os.path.dirname(os.path.abspath(__file__))
        web_dir_path = os.path.join(current_dir, WEB_DIRECTORY.strip('./'))
        
        async def index(request):
            html = """<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>ComfyUI Output Browser</title>
                <style>
                    body { margin: 0; background: var(--color-background, #121212); color: #fff; font-family: sans-serif; overflow: hidden; }
                    #cfob-root { display: flex !important; width: 100vw !important; height: 100vh !important; }
                    .floating { display: none !important; }
                </style>
                <!-- Explicitly flag standalone mode -->
                <script>window.CFOB_STANDALONE = true;</script>
                
                <script type="module" src="/web/ComfyOutputBrowser.js"></script>
            </head>
            <body></body>
            </html>"""
            return web.Response(text=html, content_type='text/html')

        app.router.add_get("/", index)
        if os.path.exists(web_dir_path):
            app.router.add_static("/web", web_dir_path)
        
        port = int(os.environ.get("PORT", 8189))
        print(f"Starting standalone Output Browser on http://localhost:{port}")
        print(f"Serving output from: {get_output_dir()}")
        print("Press Ctrl+C to exit.")
        web.run_app(app, port=port, print=None)

    if __name__ == "__main__":
        run_standalone()