import zlib
import struct
import math
import os

def write_png(filename, width, height, pixels):
    """pixels is a list of bytearrays or bytes of RGBA values per pixel"""
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0) # filter type 0 (None)
        row_start = y * width * 4
        raw_data.extend(pixels[row_start : row_start + width * 4])
    
    compressed = zlib.compress(bytes(raw_data), 9)
    
    def make_chunk(chunk_type, data):
        length = struct.pack('>I', len(data))
        crc = struct.pack('>I', zlib.crc32(chunk_type + data) & 0xffffffff)
        return length + chunk_type + data + crc

    png_bytes = bytearray(b'\x89PNG\r\n\x1a\n')
    # IHDR: width, height, bit_depth=8, color_type=6 (RGBA), compression=0, filter=0, interlace=0
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    png_bytes.extend(make_chunk(b'IHDR', ihdr_data))
    png_bytes.extend(make_chunk(b'IDAT', compressed))
    png_bytes.extend(make_chunk(b'IEND', b''))
    
    with open(filename, 'wb') as f:
        f.write(png_bytes)

def generate_shield_icon(size, filename, is_maskable=False):
    # Create RGBA pixel array
    pixels = bytearray(size * size * 4)
    
    # Simple rasterizer for the Master Soccer RJ Shield
    # Center (cx, cy)
    cx = size / 2.0
    cy = size / 2.0
    scale = size / 512.0
    
    # 7x9 Font Bitmaps for 'M', 'S', 'R', 'J'
    font_M = [
        "1000001",
        "1100011",
        "1010101",
        "1001001",
        "1000001",
        "1000001",
        "1000001",
        "1000001",
        "1000001"
    ]
    font_S = [
        "0111110",
        "1000001",
        "1000000",
        "0111110",
        "0000001",
        "0000001",
        "1000001",
        "0111110",
        "0000000"
    ]
    font_R = [
        "1111110",
        "1000001",
        "1000001",
        "1111110",
        "1010000",
        "1001000",
        "1000100",
        "1000010",
        "1000001"
    ]
    font_J = [
        "0000011",
        "0000001",
        "0000001",
        "0000001",
        "0000001",
        "1000001",
        "1000001",
        "0111110",
        "0000000"
    ]

    for y in range(size):
        for x in range(size):
            idx = (y * size + x) * 4
            
            # Maskable background vs standard
            # Background
            bg_r, bg_g, bg_b, bg_a = 15, 23, 42, 255 # Slate 900
            
            # Base background
            r, g, b, a = bg_r, bg_g, bg_b, bg_a
            
            # Shield geometry
            # Normalized coordinates (-1 to 1)
            nx = (x - cx) / (scale * 210.0)
            ny = (y - (cy - 10 * scale)) / (scale * 220.0)
            
            # Shield shape formula:
            # Top edge: y >= -0.85
            # Side curvature: |nx| <= 1.0 - 0.7 * (ny + 0.3)**2 for lower half
            in_outer_shield = False
            in_inner_shield = False
            
            if -0.85 <= ny <= 1.05:
                if ny <= 0:
                    max_x = 0.95
                else:
                    max_x = 0.95 * (1.0 - 0.75 * (ny ** 1.8))
                
                if abs(nx) <= max_x:
                    in_outer_shield = True
                
                # Inner shield (inset by ~0.08)
                inner_ny = ny + 0.04
                if -0.77 <= inner_ny <= 0.98:
                    if inner_ny <= 0:
                        inner_max_x = 0.85
                    else:
                        inner_max_x = 0.85 * (1.0 - 0.78 * (inner_ny ** 1.8))
                    if abs(nx) <= inner_max_x:
                        in_inner_shield = True
            
            if in_outer_shield:
                # Outer border: Gold
                r, g, b, a = 234, 179, 8, 255 # amber-500 gold
                
                if in_inner_shield:
                    # Blue Shield Body (Gradient)
                    t = (ny + 0.77) / 1.75
                    t = max(0.0, min(1.0, t))
                    # Blue from #2563eb to #1e3a8a
                    r = int(37 * (1 - t) + 30 * t)
                    g = int(99 * (1 - t) + 58 * t)
                    b = int(235 * (1 - t) + 138 * t)
                    a = 255
            
            pixels[idx] = r
            pixels[idx + 1] = g
            pixels[idx + 2] = b
            pixels[idx + 3] = a

    # Now stamp MS and RJ letters
    def draw_bitmap(bitmap, top_x, top_y, pixel_size, color_rgb):
        bw = len(bitmap[0])
        bh = len(bitmap)
        cr, cg, cb = color_rgb
        for row in range(bh):
            for col in range(bw):
                if bitmap[row][col] == '1':
                    px_start = int(top_x + col * pixel_size)
                    py_start = int(top_y + row * pixel_size)
                    for py in range(py_start, py_start + pixel_size):
                        for px in range(px_start, px_start + pixel_size):
                            if 0 <= px < size and 0 <= py < size:
                                p_idx = (py * size + px) * 4
                                pixels[p_idx] = cr
                                pixels[p_idx + 1] = cg
                                pixels[p_idx + 2] = cb
                                pixels[p_idx + 3] = 255

    # Stamp MS (White)
    ms_px_size = max(1, int(9 * scale))
    spacing = int(12 * scale)
    letter_w = 7 * ms_px_size
    ms_total_w = letter_w * 2 + spacing
    ms_start_x = cx - ms_total_w / 2.0
    ms_start_y = cy - 45 * scale
    draw_bitmap(font_M, ms_start_x, ms_start_y, ms_px_size, (255, 255, 255))
    draw_bitmap(font_S, ms_start_x + letter_w + spacing, ms_start_y, ms_px_size, (255, 255, 255))

    # Divider bar (Gold)
    div_y = int(cy + 42 * scale)
    div_h = max(2, int(4 * scale))
    div_w = int(120 * scale)
    for py in range(div_y, div_y + div_h):
        for px in range(int(cx - div_w/2), int(cx + div_w/2)):
            if 0 <= px < size and 0 <= py < size:
                p_idx = (py * size + px) * 4
                pixels[p_idx] = 234
                pixels[p_idx + 1] = 179
                pixels[p_idx + 2] = 8
                pixels[p_idx + 3] = 255

    # Stamp RJ (Gold)
    rj_px_size = max(1, int(6 * scale))
    rj_spacing = int(14 * scale)
    rj_letter_w = 7 * rj_px_size
    rj_total_w = rj_letter_w * 2 + rj_spacing
    rj_start_x = cx - rj_total_w / 2.0
    rj_start_y = cy + 55 * scale
    draw_bitmap(font_R, rj_start_x, rj_start_y, rj_px_size, (250, 204, 21))
    draw_bitmap(font_J, rj_start_x + rj_letter_w + rj_spacing, rj_start_y, rj_px_size, (250, 204, 21))

    # Save PNG
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    write_png(filename, size, size, pixels)
    print(f"Generated {filename} ({size}x{size})")

generate_shield_icon(192, "public/icons/icon-192.png")
generate_shield_icon(512, "public/icons/icon-512.png")
generate_shield_icon(512, "public/icons/icon-maskable-512.png", is_maskable=True)
generate_shield_icon(180, "public/apple-touch-icon.png")

