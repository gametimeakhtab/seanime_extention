import os
from PIL import Image, ImageDraw, ImageFilter

def create_logo(output_path):
    size = (512, 512)
    # Create base image with alpha
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 1. Background squircle / rounded rect
    margin = 24
    radius = 96
    bg_box = [margin, margin, size[0] - margin, size[1] - margin]
    
    # Gradient background simulation
    base_bg = Image.new("RGBA", size, (0, 0, 0, 0))
    base_draw = ImageDraw.Draw(base_bg)
    base_draw.rounded_rectangle(bg_box, radius=radius, fill=(15, 23, 42, 255), outline=(99, 102, 241, 180), width=6)
    img = Image.alpha_composite(img, base_bg)
    draw = ImageDraw.Draw(img)

    # 2. Glowing outer circle / watch track
    cx, cy = 256, 256
    r = 150
    # Outer ring background
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(30, 41, 59, 255), width=24)
    # Highlight arc (history progress ring: e.g. 270 degrees)
    draw.arc([cx - r, cy - r, cx + r, cy + r], start=210, end=140, fill=(99, 102, 241, 255), width=24)
    # Secondary neon cyan arc
    draw.arc([cx - r, cy - r, cx + r, cy + r], start=330, end=90, fill=(56, 189, 248, 255), width=24)

    # 3. Center clock / play symbol
    # Play triangle with checkmark / clock hands
    # Play button triangle in center
    poly = [(225, 190), (315, 256), (225, 322)]
    draw.polygon(poly, fill=(244, 244, 245, 255))

    # Checkmark badge in bottom-right corner of the squircle
    cr_cx, cr_cy = 365, 365
    cr_r = 54
    draw.ellipse([cr_cx - cr_r, cr_cy - cr_r, cr_cx + cr_r, cr_cy + cr_r], fill=(16, 185, 129, 255), outline=(15, 23, 42, 255), width=8)
    # Checkmark icon lines
    draw.line([(cr_cx - 22, cr_cy), (cr_cx - 6, cr_cy + 16)], fill=(255, 255, 255, 255), width=9)
    draw.line([(cr_cx - 6, cr_cy + 16), (cr_cx + 22, cr_cy - 16)], fill=(255, 255, 255, 255), width=9)

    img.save(output_path, "PNG")
    print(f"Saved logo to {output_path}")

if __name__ == "__main__":
    out_dir = r"d:\apps\seanime exten\extensions\watch-history-manager"
    create_logo(os.path.join(out_dir, "icon.png"))
