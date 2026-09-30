#!/usr/bin/env python3
"""Flat Plate share cards at the brand palette. Shapes are supersampled; type is drawn at 1x."""
from PIL import Image, ImageDraw, ImageFont

BG = (0x0B, 0x11, 0x0F)
SURFACE = (0x17, 0x17, 0x1A)
ACCENT = (0x2F, 0xDB, 0xB0)
TEXT = (0xF4, 0xF4, 0xF5)
SEMI = "/workspace/.grok/fonts/Outfit-SemiBold.ttf"
MED = "/workspace/.grok/fonts/Outfit-Medium.ttf"
SCALE = 4


def sfont(path, size):
    return ImageFont.truetype(path, size)


def rounded(draw, xy, radius, fill):
    draw.rounded_rectangle(xy, radius=radius, fill=fill)


def downscale(im, size):
    return im.resize(size, Image.Resampling.BOX)


def paint_shapes(w, h, draw_fn):
    im = Image.new("RGBA", (w * SCALE, h * SCALE), BG + (255,))
    draw_fn(im, SCALE)
    return downscale(im, (w, h))


def disc_mark(base, scale, cx, cy, tile, disc_r, hole_ratio=0.38, radius_ratio=0.26):
    s = scale
    half = tile / 2
    x0, y0, x1, y1 = (cx - half) * s, (cy - half) * s, (cx + half) * s, (cy + half) * s
    rim = Image.new("RGBA", base.size, (0, 0, 0, 0))
    rd = ImageDraw.Draw(rim)
    pad = 1.5 * s
    rounded(rd, (x0 - pad, y0 - pad, x1 + pad, y1 + pad), (tile * radius_ratio + 1.5) * s, TEXT + (40,))
    base.alpha_composite(rim)
    d = ImageDraw.Draw(base)
    rounded(d, (x0, y0, x1, y1), tile * radius_ratio * s, SURFACE + (255,))
    d.ellipse(((cx - disc_r) * s, (cy - disc_r) * s, (cx + disc_r) * s, (cy + disc_r) * s), fill=ACCENT + (255,))
    hole = disc_r * hole_ratio
    d.ellipse(((cx - hole) * s, (cy - hole) * s, (cx + hole) * s, (cy + hole) * s), fill=BG + (255,))


def halo(base, scale, cx, cy, radius, width, alpha):
    s = scale
    overlay = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    r = radius * s
    d.ellipse((cx * s - r, cy * s - r, cx * s + r, cy * s + r), outline=ACCENT + (alpha,), width=max(1, int(width * s)))
    base.alpha_composite(overlay)


def plate(base, scale, cx, cy, r, hole_ratio=0.38):
    s = scale
    d = ImageDraw.Draw(base)
    d.ellipse(((cx - r) * s, (cy - r) * s, (cx + r) * s, (cy + r) * s), fill=ACCENT + (255,))
    hole = r * hole_ratio
    d.ellipse(((cx - hole) * s, (cy - hole) * s, (cx + hole) * s, (cy + hole) * s), fill=BG + (255,))


def ink(font_, text):
    l, t, r, b = font_.getbbox(text)
    return l, t, r, b, r - l, b - t


def draw_title(base, text, cx, top, font_, fill):
    l, t, r, b, w, h = ink(font_, text)
    x = cx - w / 2 - l
    y = top - t
    ImageDraw.Draw(base).text((x, y), text, font=font_, fill=fill)
    return (x + l, top, x + r, top + h)


def draw_tracked(base, text, cx, top, font_, fill, tracking):
    boxes = []
    advances = []
    for ch in text:
        l, t, r, b, w, h = ink(font_, ch)
        boxes.append((l, t, r, b))
        advances.append(font_.getlength(ch))
    total = sum(advances) + tracking * (len(text) - 1)
    top_bearing = min(box[1] for box in boxes)
    ink_h = max(box[3] for box in boxes) - top_bearing
    x = cx - total / 2
    d = ImageDraw.Draw(base)
    for ch, (l, t, r, b), adv in zip(text, boxes, advances):
        d.text((x - l, top - top_bearing), ch, font=font_, fill=fill)
        x += adv + tracking
    left = cx - total / 2
    return (left, top, left + total, top + ink_h)


def render_og():
    W, H = 1200, 630
    tile = 156
    title_px = 268
    label_px = 26
    title_font = sfont(SEMI, title_px)
    label_font = sfont(MED, label_px)
    title_h = ink(title_font, "Plate")[5]
    label_h = 20
    gap_mark_label = 40
    gap_label_title = 24
    block = tile + gap_mark_label + label_h + gap_label_title + title_h
    top = (H - block) / 2
    mark_cy = top + tile / 2

    def shapes(im, scale):
        halo(im, scale, 600, mark_cy, radius=132, width=16, alpha=64)
        disc_mark(im, scale, 600, mark_cy, tile, disc_r=54)

    im = paint_shapes(W, H, shapes)
    label_top = top + tile + gap_mark_label
    label_box = draw_tracked(im, "GYM LOG", 600, label_top, label_font, ACCENT, tracking=7)
    title_top = label_top + label_h + gap_label_title
    title_box = draw_title(im, "Plate", 600, title_top, title_font, TEXT)
    print("OG title", tuple(round(v, 1) for v in title_box), "label", tuple(round(v, 1) for v in label_box))
    print(
        "OG margins LRTB",
        round(min(title_box[0], label_box[0]), 1),
        round(W - max(title_box[2], label_box[2]), 1),
        round(top, 1),
        round(H - title_box[3], 1),
        "title width frac",
        round((title_box[2] - title_box[0]) / W, 3),
    )
    # 16:9 normalize trims ~3% vertically. Keep ink well inside that.
    assert title_box[1] > H * 0.06 and title_box[3] < H * 0.94
    assert label_box[1] > H * 0.06
    assert title_box[0] > 80 and title_box[2] < W - 80
    return im.convert("RGB")


def render_banner():
    W, H = 1200, 264
    tile = 124
    mark_cx = 72 + tile / 2
    mark_cy = 92  # above midline 132; bottom of tile stays above the bottom fifth
    title_px = 108

    def shapes(im, scale):
        # Same plate, enlarged, sitting right of the word. It may bleed into the
        # feed overlay (right quarter / bottom fifth); the lockup does not.
        plate_cx, plate_cy, plate_r = 820, 140, 180
        halo(im, scale, plate_cx, plate_cy, radius=plate_r + 34, width=18, alpha=52)
        plate(im, scale, plate_cx, plate_cy, plate_r)
        disc_mark(im, scale, mark_cx, mark_cy, tile, disc_r=42)

    im = paint_shapes(W, H, shapes)
    title_font = sfont(SEMI, title_px)
    title_h = ink(title_font, "Plate")[5]
    title_w = ink(title_font, "Plate")[4]
    title_top = mark_cy - title_h / 2 - 1
    left = mark_cx + tile / 2 + 32
    title_box = draw_title(im, "Plate", left + title_w / 2, title_top, title_font, TEXT)
    print("BANNER title", tuple(round(v, 1) for v in title_box))
    print(
        "fractions x",
        round(title_box[0] / W, 3),
        round(title_box[2] / W, 3),
        "y",
        round(title_box[1] / H, 3),
        round(title_box[3] / H, 3),
    )
    assert title_box[2] < W * 0.50, title_box
    assert title_box[3] < H * 0.80, title_box
    assert title_box[0] > 40 and title_box[1] > 18, title_box
    mark_right = mark_cx + tile / 2
    mark_bottom = mark_cy + tile / 2
    assert mark_right < W * 0.50
    assert mark_bottom < H * 0.80, mark_bottom
    # Title must not collide with the scenery plate (left edge 860-168=692).
    assert title_box[2] < 680, title_box
    return im.convert("RGB")


if __name__ == "__main__":
    og = render_og()
    og.save("/workspace/.grok/og-raw.png", "PNG")
    banner = render_banner()
    banner.save("/workspace/.grok/x-banner-raw.png", "PNG")
    for name, im in (("og", og), ("banner", banner)):
        whites = sum(1 for _, c in im.getcolors(500000) if c == (255, 255, 255))
        print(name, "white-pixels", whites, "size", im.size)
