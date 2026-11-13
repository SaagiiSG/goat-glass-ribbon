# /// script
# requires-python = ">=3.10,<3.13"
# dependencies = ["pillow>=10.4", "numpy>=1.26", "mediapipe==1.2.3"]
# ///
"""Glass Ribbon · Шилэн тууз.

A violet-graded talking head with a glowing ribbon and purple orbs floating behind the speaker,
a frosted glass card, and captions where one word turns into a big serif italic. A purple light
streak wipes to a speaker-free scene of numbered glass cards joined by a glowing line.
A MediaPipe person cut-out on every frame puts the ribbon behind the speaker.
Usage: uv run render.py plan.json
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import goatcut as g  # noqa: E402
import numpy as np  # noqa: E402
from PIL import Image, ImageDraw, ImageFilter  # noqa: E402

NAME = "glass-ribbon"
GRADE = ("colorbalance=rs=0.06:gs=-0.08:bs=0.18:rm=0.04:gm=-0.08:bm=0.12:rh=0.02:gh=-0.02:bh=0.05,"
         "eq=brightness=-0.03:contrast=1.04:saturation=0.95,vignette=PI/5")
INTER = "Inter[opsz,wght].ttf"
SERIF = "CormorantGaramond-Italic[wght].ttf"
MODEL = "selfie_segmenter.tflite"  # MediaPipe, Apache-2.0, bundled in models/
SMALL = (288, 512)                 # the cut-out runs on this small copy of each frame
WHITE = (255, 255, 255, 255)
CAP_BASE = 1212                    # caption baseline: descenders stay inside the safe box (y < 1248)
CARD_BOX = (560, 280, 960)         # glass card: left, top, right
ORBS = [(65, 576, 173, 0.0), (864, 845, 130, 3.0), (713, 461, 76, 5.0)]  # left, top, size, phase (s)
STEP_POS = [(130, 881), (259, 679), (389, 478)]  # numbered glass cards, 01 bottom-left to 03 top-right
STEP_SIZE = (475, 163)
LEAD = 0.4                         # the scene switches this long before its first card rises


# ---------------------------------------------------------------- person cut-out

class Matte:
    """Person mask per frame: MediaPipe selfie segmenter on a small copy, firmed up and blended
    with the previous frame's mask so edges don't flicker. Resets at cuts and after skipped frames."""

    def __init__(self, ctx):
        from mediapipe.tasks.python import BaseOptions, vision
        model = (ctx.skill_dir / "models" / MODEL).read_bytes()  # buffer, not path: non-Latin folder names break paths
        self.seg = vision.ImageSegmenter.create_from_options(vision.ImageSegmenterOptions(
            base_options=BaseOptions(model_asset_buffer=model),
            running_mode=vision.RunningMode.VIDEO, output_confidence_masks=True))
        self.prev, self.clip, self.t = None, -1, -1.0

    def __call__(self, img, t, ctx):
        import mediapipe as mp
        small = np.ascontiguousarray(img.resize(SMALL, Image.BILINEAR))
        res = self.seg.segment_for_video(mp.Image(image_format=mp.ImageFormat.SRGB, data=small), int(t * 1000))
        m = np.array(res.confidence_masks[0].numpy_view()[..., 0])
        i = ctx.clip_at(t)[0]
        if i == self.clip and t - self.t < 0.05:
            m = 0.6 * m + 0.4 * self.prev
        self.prev, self.clip, self.t = m, i, t
        small = Image.fromarray(np.clip((m - 0.3) * 2.5 * 255, 0, 255).astype(np.uint8))
        return small.filter(ImageFilter.GaussianBlur(1)).resize((g.W, g.H), Image.BILINEAR)


# ---------------------------------------------------------------- drawing helpers

def hexrgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


def ramp(d, stops):
    """Colour array for positions d (0..1) through [(pos, '#rrggbb', alpha)] stops. Returns uint8 RGBA."""
    pos = [s[0] for s in stops]
    ch = [np.interp(d, pos, [hexrgb(s[1])[k] for s in stops]) for k in range(3)]
    ch.append(np.interp(d, pos, [s[2] * 255 for s in stops]))
    return np.dstack(ch).astype(np.uint8)


def bezier(p0, p1, p2, p3, n=80):
    return [tuple((1 - s) ** 3 * a + 3 * (1 - s) ** 2 * s * b + 3 * (1 - s) * s * s * c + s ** 3 * d
                  for a, b, c, d in zip(p0, p1, p2, p3)) for s in (i / n for i in range(n + 1))]


def stroke(size, pts, width, fill, blur=0):
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    ImageDraw.Draw(img).line(pts, fill=fill, width=width, joint="curve")
    return img.filter(ImageFilter.GaussianBlur(blur)) if blur else img


def ribbon_sprite():
    """The preview's ribbon: M-60 840 C 220 560, 520 1000, 780 700 S 1080 520, 1160 640,
    a blurred violet glow, a 52 px violet-to-white gradient band and a thin white highlight."""
    y0 = 420  # sprite top in screen pixels
    pts = bezier((-60, 840), (220, 560), (520, 1000), (780, 700)) + bezier((780, 700), (1040, 400), (1080, 520), (1160, 640))
    pts = [(x, y - y0) for x, y in pts]
    size = (g.W, 780)
    img = stroke(size, pts, 130, (168, 85, 247, 115), blur=18)
    band = stroke(size, pts, 52, WHITE).getchannel("A")
    x = (np.arange(g.W) + 60) / 1220
    grad = Image.fromarray(np.repeat(ramp(x, [(0, "#6D28D9", 1), (0.55, "#C084FC", 1), (1, "#F5EFFF", 1)]), size[1], 0))
    grad.putalpha(band)
    img.alpha_composite(grad)
    img.alpha_composite(stroke(size, [(px, py - 14) for px, py in pts], 6, (255, 255, 255, 190)))
    return img, y0


def orb_sprite(size):
    yy, xx = np.mgrid[0:size, 0:size] / size
    d = np.hypot(xx - 0.35, yy - 0.35) / (0.65 * 2 ** 0.5)  # CSS radial-gradient(circle at 35% 35%)
    rgba = ramp(d, [(0, "#C9A7FF", 0.7), (0.55, "#7C3AED", 0.7), (0.72, "#7C3AED", 0)])
    rgba[..., 3] = rgba[..., 3] * (np.hypot(xx - 0.5, yy - 0.5) < 0.5)  # border-radius: 50%
    return Image.fromarray(rgba).filter(ImageFilter.GaussianBlur(2))


def scene_bg():
    yy, xx = np.mgrid[0:g.H, 0:g.W]
    d = np.hypot(xx - 324, yy - 576) / 1542  # circle at 30% 30%, out to the farthest corner
    img = Image.fromarray(ramp(d, [(0, "#4B2A9E", 1), (0.6, "#1A0B3D", 1), (1, "#0E0626", 1)]))
    pts = bezier((-40, 1240), (260, 1120), (380, 840), (600, 700)) + bezier((600, 700), (820, 560), (900, 460), (1120, 410))
    img.alpha_composite(stroke(img.size, pts, 14, (168, 85, 247, 255), blur=10))
    img.alpha_composite(stroke(img.size, pts, 8, (192, 132, 252, 255)))
    return img


def glass(backdrop, box, radius, blur, title=None):
    """Frosted glass: the backdrop under box, blurred, lightened, with a thin bright border."""
    x0, y0, x1, y1 = (int(v) for v in box)
    w, h = x1 - x0, y1 - y0
    img = backdrop.crop((x0, y0, x1, y1)).filter(ImageFilter.GaussianBlur(blur)).convert("RGBA")
    img.alpha_composite(Image.new("RGBA", (w, h), (255, 255, 255, 36)))
    ImageDraw.Draw(img).rounded_rectangle((0, 0, w - 1, h - 1), radius, outline=(255, 255, 255, 87), width=2)
    if title is not None:
        img.alpha_composite(title)
    img.putalpha(g.rounded_mask((w, h), radius))
    return img


def shadow_sprite(w, h, radius, dy=20, blur=36, color=(20, 0, 60, 90)):
    pad = blur * 3
    img = Image.new("RGBA", (w + pad * 2, h + pad * 2), (0, 0, 0, 0))
    ImageDraw.Draw(img).rounded_rectangle((pad, pad + dy, pad + w, pad + h + dy), radius, fill=color)
    return img.filter(ImageFilter.GaussianBlur(blur)), pad


def caption_sprite(ctx, text):
    """Inter words with each *starred* word in big Cormorant Garamond italic, on one baseline.
    Shrinks until it fits 840 px. Returns (sprite, baseline y in the sprite)."""
    parts = [g.drawable(p, ctx.font(SERIF if i % 2 else INTER, 54)) for i, p in enumerate(text.split("*"))]
    size = 54
    while True:
        fonts = [ctx.font(INTER, size, {"wght": 600, "opsz": 32}), ctx.font(SERIF, size * 80 / 54, {"wght": 600})]
        widths = [fonts[i % 2].getlength(p) for i, p in enumerate(parts)]
        if sum(widths) <= 840 or size <= 24:
            break
        size = int(size * 0.94)
    base = int(size * 1.6)
    img = Image.new("RGBA", (int(sum(widths)) + 60, base + size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    x = 30
    for i, p in enumerate(parts):
        d.text((x, base), p, font=fonts[i % 2], fill=WHITE, anchor="ls")
        x += widths[i]
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sh.paste((20, 0, 50, 140), (0, 0), img.getchannel("A"))
    out = sh.filter(ImageFilter.GaussianBlur(10))
    out.alpha_composite(img)
    return out, base


def pill_sprite(ctx, text):
    f = ctx.fit(text, INTER, 600, 26, min_size=18, axes={"wght": 600, "opsz": 24})
    label = g.text_sprite(text, f, fill=(42, 26, 74, 255))
    w, h = label.width + 44, label.height + 24
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(img).rounded_rectangle((0, 0, w - 1, h - 1), h // 2, fill=(255, 255, 255, 235))
    img.alpha_composite(label, (22, 12))
    return img


def card_face(ctx, text):
    """Title and two placeholder lines of the glass card, on a transparent card-sized image."""
    w = CARD_BOX[2] - CARD_BOX[0]
    f = ctx.fit(text, SERIF, w - 52, 44, min_size=26, axes={"wght": 600})
    title = g.text_sprite(text, f, align="left")
    h = 24 + title.height + 20 + 10 + 12 + 10 + 30
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    img.alpha_composite(title, (26, 24))
    d = ImageDraw.Draw(img)
    y = 24 + title.height + 20
    for frac in (0.85, 0.55):
        d.rounded_rectangle((26, y, 26 + (w - 52) * frac, y + 10), 5, fill=(255, 255, 255, 97))
        y += 22
    return img


def step_sprite(ctx, bg, k, text):
    x, y = STEP_POS[k]
    w, h = STEP_SIZE
    face = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    num = g.text_sprite(f"{k + 1:02d}", ctx.font(INTER, 30, {"wght": 600, "opsz": 24}))
    label = g.text_sprite(text, ctx.fit(text, INTER, w - 52, 28, min_size=18, axes={"wght": 400, "opsz": 24}),
                          fill=(255, 255, 255, 217), align="left")
    face.alpha_composite(num, (26, 34))
    face.alpha_composite(label, (26, 34 + num.height + 18))
    return glass(bg, (x, y, x + w, y + h), 24, 14, face)


# ---------------------------------------------------------------- look

def SFX(ctx):
    # a swish with each light-streak wipe, a shimmer as each glass card appears (numbered ones softer)
    ev = [{"sound": "swish", "at": max(0, s - 0.3), "volume": 0.7} for a, b, _ in ctx.scenes for s in (a, b)
          if s < ctx.dur - 0.1]
    ev += [{"sound": "shimmer", "at": x["start"], "volume": 0.5} for x in ctx.texts("card")]
    ev += [{"sound": "shimmer", "at": x["start"], "volume": 0.3} for x in ctx.texts("step")]
    return ev


def setup(ctx):
    # group the numbered steps into scenes: steps that overlap in time share one scene
    ctx.scenes = []
    for item in ctx.texts("step"):
        if ctx.scenes and item["start"] < ctx.scenes[-1][1] + 0.05:
            a, b, items = ctx.scenes[-1]
            ctx.scenes[-1] = (a, max(b, item.get("end", ctx.dur)), items + [item])
        else:
            ctx.scenes.append((max(0, item["start"] - LEAD), item.get("end", ctx.dur), [item]))
    for a, b, items in ctx.scenes:
        if len(items) > 3:
            g.die(f"{len(items)} steps overlap at {a:.1f}s. Show at most 3 numbered cards at a time.")
    ctx.matte = Matte(ctx)
    ctx.ribbon, ctx.ribbon_y = ribbon_sprite()
    ctx.orbs = [orb_sprite(s) for _, _, s, _ in ORBS]
    ctx.bg = scene_bg() if ctx.scenes else None
    profile = ramp(np.arange(g.W) / g.W, [(0, "#965AFF", 0), (0.3, "#965AFF", 0), (0.46, "#C8A0FF", 0.85),
                                           (0.5, "#FFFFFF", 1), (0.54, "#C8A0FF", 0.85), (0.7, "#965AFF", 0),
                                           (1, "#965AFF", 0)])
    ctx.streak = Image.fromarray(profile).resize((g.W, g.H))


def wave(t, period, phase=0.0):
    """0..1..0 eased back and forth, like a CSS 'alternate' animation."""
    x = ((t + phase) / period) % 2
    return g.ease_in_out(x if x < 1 else 2 - x)


def speaker(img, t, ctx):
    canvas = img.convert("RGBA")
    a = g.clamp(t / 0.6)  # ribbon and orbs fade in over the first 0.6 s
    for (x, y, s, ph), orb in zip(ORBS, ctx.orbs):
        g.paste(canvas, orb, x, y - 40 * wave(t, 8, ph), a)
    g.paste(canvas, ctx.ribbon, 0, ctx.ribbon_y - 30 * wave(t, 4), a)
    canvas = Image.composite(img.convert("RGBA"), canvas, ctx.matte(img, t, ctx))
    for item in ctx.active(t, "card")[-1:]:
        face = ctx.cache(("card", item["text"]), lambda: card_face(ctx, item["text"]))
        x0, y0, x1 = CARD_BOX
        y = y0 + 30 * (1 - g.ease_out((t - item["start"]) / 0.45))
        al = g.fade(t, item, 0.45, 0.25)
        sh, pad = ctx.cache(("shadow", face.size), lambda: shadow_sprite(*face.size, 28))
        g.paste(canvas, sh, x0 - pad, y - pad, al)
        g.paste(canvas, glass(canvas, (x0, y, x1, y + face.height), 28, 18, face), x0, y, al)
    return canvas


def frame(img, t, ctx):
    scene = next((s for s in ctx.scenes if s[0] - 0.08 <= t < s[1] + 0.08), None)
    k = 0.0
    if scene:  # a quick cross-fade at the middle of each streak
        a, b, _ = scene
        k = g.clamp(min((t - a + 0.08) / 0.16, (b + 0.08 - t) / 0.16))
    if k < 1:
        canvas = speaker(img, t, ctx)
    if k > 0:
        a, b, items = scene
        sc = ctx.bg.copy()
        for n, item in enumerate(items):
            s = ctx.cache(("step", id(item)), lambda: step_sprite(ctx, ctx.bg, n, item["text"]))
            x, y = STEP_POS[n]
            g.paste(sc, s, x, y + 30 * (1 - g.ease_out((t - item["start"]) / 0.3)), g.fade(t, item, 0.3, 0.2))
        canvas = sc if k >= 1 else Image.blend(canvas, sc, k)

    for item in ctx.active(t, "pill")[-1:]:
        s = ctx.cache(("pill", item["text"]), lambda: pill_sprite(ctx, item["text"]))
        rise = 20 * (1 - g.ease_out((t - item["start"]) / 0.3))
        g.paste(canvas, s, 540, CAP_BASE - 120 + rise, g.fade(t, item, 0.3, 0.2), anchor="mb")
    for item in ctx.active(t, "caption")[-1:]:
        s, base = ctx.cache(("cap", item["text"]), lambda: caption_sprite(ctx, item["text"]))
        rise = 20 * (1 - g.ease_out((t - item["start"]) / 0.3))
        g.paste(canvas, s, 540 - s.width / 2, CAP_BASE - base + rise, g.fade(t, item, 0.3, 0.2))

    for edge in (e for a, b, _ in ctx.scenes for e in (a, b)):  # purple light streak across each switch
        p = (t - edge + 0.32) / 0.64
        if 0 <= p <= 1:
            g.paste(canvas, ctx.streak, (-1.2 + 2.4 * g.ease_in_out(p)) * g.W, 0)
    return canvas


if __name__ == "__main__":
    g.run(sys.modules[__name__])
