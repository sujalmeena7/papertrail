import os
from PIL import Image, ImageDraw

def create_favicon(size):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Scale parameter
    scale = size / 120.0
    
    # Background squircle
    radius = int(30 * scale)
    draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=(59, 130, 246, 255))
    
    # Coordinates scaling from 120x120
    p1 = (38 * scale, 28 * scale)
    p2 = (66 * scale, 28 * scale)
    p3 = (82 * scale, 44 * scale)
    p4 = (82 * scale, 86 * scale)
    p5 = (76 * scale, 92 * scale)
    p6 = (44 * scale, 92 * scale)
    p7 = (38 * scale, 86 * scale)
    
    stroke_w = max(1, int(7.5 * scale))
    
    # Draw outer document path
    points = [p1, p2, p3, p4, p5, p6, p7, p1]
    for i in range(len(points) - 1):
        draw.line([points[i], points[i+1]], fill=(255, 255, 255, 255), width=stroke_w)
        
    # Draw fold lines: (66, 28) -> (66, 44) -> (82, 44)
    f1 = (66 * scale, 28 * scale)
    f2 = (66 * scale, 44 * scale)
    f3 = (82 * scale, 44 * scale)
    draw.line([f1, f2], fill=(255, 255, 255, 255), width=stroke_w)
    draw.line([f2, f3], fill=(255, 255, 255, 255), width=stroke_w)
    
    return img

def create_high_quality_favicon(target_size):
    supersample_factor = 4
    large_size = target_size * supersample_factor
    large_img = create_favicon(large_size)
    return large_img.resize((target_size, target_size), Image.Resampling.LANCZOS)

os.makedirs("public", exist_ok=True)
os.makedirs("app", exist_ok=True)

img_32 = create_high_quality_favicon(32)
img_32.save("public/icon-light-32x32.png")
img_32.save("public/icon-dark-32x32.png")

img_180 = create_high_quality_favicon(180)
img_180.save("public/apple-icon.png")

img_32.save("public/favicon.ico", format="ICO", sizes=[(32, 32)])
img_32.save("app/favicon.ico", format="ICO", sizes=[(32, 32)])

print("Successfully generated all favicon assets!")
