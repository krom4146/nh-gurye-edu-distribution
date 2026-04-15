import os
from PIL import Image

def create_padded_icon(source_path, output_path, target_size, logo_ratio=0.7):
    try:
        # Open the source image
        img = Image.open(source_path).convert("RGBA")
        
        # Calculate the size of the logo within the target canvas
        logo_size = int(target_size * logo_ratio)
        
        # Resize the logo maintaining aspect ratio
        img.thumbnail((logo_size, logo_size), Image.Resampling.LANCZOS)
        
        # Create a new transparent image
        new_img = Image.new("RGBA", (target_size, target_size), (0, 0, 0, 0))
        
        # Calculate position to center the logo
        left = (target_size - img.width) // 2
        top = (target_size - img.height) // 2
        
        # Paste the logo onto the transparent background
        new_img.paste(img, (left, top), img)
        
        # Save the result
        new_img.save(output_path, "PNG")
        print(f"Created {output_path} ({target_size}x{target_size})")
        
    except Exception as e:
        print(f"Error creating {output_path}: {e}")

def main():
    source_logo = "public/logo.png"
    
    if not os.path.exists(source_logo):
        print(f"Error: {source_logo} not found.")
        return

    # Define the icons to generate
    icons = [
        ("public/pwa-512x512.png", 512),
        ("public/pwa-192x192.png", 192),
        ("public/pwa-64x64.png", 64),
        ("public/maskable-icon-512x512.png", 512)
    ]

    for path, size in icons:
        create_padded_icon(source_logo, path, size)

if __name__ == "__main__":
    main()
