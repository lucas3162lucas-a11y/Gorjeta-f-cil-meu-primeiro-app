#!/usr/bin/env python3
"""VID-20261113-02 — montagem por código (720x1280, 30fps)."""
import subprocess, sys, math, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

D = os.path.dirname(os.path.abspath(__file__))
W, H, FPS = 720, 1280, 30
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(D, "video_mudo.mp4")

INTER_BLACK = "/usr/share/fonts/opentype/inter/Inter-Black.otf"
INTER_BOLD = "/usr/share/fonts/opentype/inter/Inter-Bold.otf"
INTER_SEMI = "/usr/share/fonts/opentype/inter/Inter-SemiBold.otf"
INTER_REG = "/usr/share/fonts/opentype/inter/Inter-Regular.otf"
EMOJI = "/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf"

# Zona segura do TikTok (em 720x1280): topo ~120px, base ~330px, direita ~110px
SAFE_L, SAFE_R, SAFE_TOP = 50, 110, 150
TEXT_CX = (SAFE_L + (W - SAFE_R)) // 2

def font(p, s):
    return ImageFont.truetype(p, s)

_emoji_cache = {}
def emoji_img(ch, size):
    k = (ch, size)
    if k not in _emoji_cache:
        f = ImageFont.truetype(EMOJI, 109)
        im = Image.new("RGBA", (160, 160), (0, 0, 0, 0))
        ImageDraw.Draw(im).text((10, 10), ch, font=f, embedded_color=True)
        im = im.crop(im.getbbox())
        r = size / im.height
        _emoji_cache[k] = im.resize((max(1, int(im.width * r)), size), Image.LANCZOS)
    return _emoji_cache[k]

def wrap(draw, text, f, maxw):
    lines = []
    for para in text.split("\n"):
        cur = ""
        for w in para.split(" "):
            t = (cur + " " + w).strip()
            if draw.textlength(t, font=f) <= maxw or not cur:
                cur = t
            else:
                lines.append(cur); cur = w
        lines.append(cur)
    return lines

def caption(img, text, y, size=62, emoji=None, color=(255, 255, 255), box=None, pop=1.0):
    """Texto grande com contorno, centralizado na área segura. pop = escala da animação de entrada."""
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    f = font(INTER_BLACK, size)
    maxw = W - SAFE_L - SAFE_R - 20
    lines = wrap(d, text, f, maxw - (size if emoji else 0))
    lh = int(size * 1.18)
    total_h = lh * len(lines)
    yy = y
    if box:
        widest = max(d.textlength(l, font=f) for l in lines) + (size + 10 if emoji else 0)
        pad = 22
        d.rounded_rectangle([TEXT_CX - widest / 2 - pad, y - pad + 4, TEXT_CX + widest / 2 + pad, y + total_h + pad - 6],
                            radius=26, fill=box)
    for i, l in enumerate(lines):
        tw = d.textlength(l, font=f)
        ew = 0
        if emoji and i == len(lines) - 1:
            ew = size + 10
        x = TEXT_CX - (tw + ew) / 2
        stroke = 0 if box else max(4, size // 11)
        d.text((x, yy), l, font=f, fill=color, stroke_width=stroke, stroke_fill=(0, 0, 0))
        if ew:
            e = emoji_img(emoji, int(size * 0.95))
            layer.alpha_composite(e, (int(x + tw + 10), int(yy + size * 0.12)))
        yy += lh
    if not box:
        sh = layer.split()[3].filter(ImageFilter.GaussianBlur(8))
        shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        shadow.putalpha(sh.point(lambda v: int(v * 0.55)))
        img.alpha_composite(shadow, (0, 6))
    if pop != 1.0:
        cx, cy = TEXT_CX, y + total_h / 2
        nw, nh = int(W * pop), int(H * pop)
        big = layer.resize((nw, nh), Image.LANCZOS)
        ox, oy = int(cx - cx * pop), int(cy - cy * pop)
        layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        layer.alpha_composite(big.crop((max(0, -ox), max(0, -oy), max(0, -ox) + W, max(0, -oy) + H)), (max(0, ox), max(0, oy)))
    img.alpha_composite(layer)

def pop_scale(t):
    """Entrada do texto: cresce de 0.85 a 1.0 em 0.18s."""
    if t >= 0.18:
        return 1.0
    p = t / 0.18
    return 0.85 + 0.15 * (1 - (1 - p) ** 3)

def load_photo(name):
    im = Image.open(os.path.join(D, "img", name)).convert("RGB")
    # amplia com Lanczos e realça levemente (fonte é 450x800)
    big = im.resize((int(W * 1.12), int(H * 1.12)), Image.LANCZOS)
    big = big.filter(ImageFilter.UnsharpMask(radius=2, percent=60, threshold=2))
    return big

PHOTOS = {k: load_photo(k + ".jpg") for k in ["c1", "c2", "c3", "c7", "c8"]}

def kenburns(big, p, z0=1.0, z1=1.08, fx=0.5, fy=0.5, dx=0.0, dy=0.0):
    """p em [0,1]. Recorta janela W*H/zoom da imagem ampliada."""
    e = p * p * (3 - 2 * p)
    z = z0 + (z1 - z0) * e
    bw, bh = big.size
    cw, ch = bw / (1.12 * z) * 1.0, bh / (1.12 * z)
    cx = bw * fx + dx * bw * e
    cy = bh * fy + dy * bh * e
    l = min(max(0, cx - cw / 2), bw - cw)
    t = min(max(0, cy - ch / 2), bh - ch)
    return big.resize((W, H), Image.LANCZOS, box=(l, t, l + cw, t + ch)).convert("RGBA")

def vignette_grade(img):
    return img

# ---------- tela do "chat" (animação por código, exemplo ilustrativo) ----------
BG_APP = (247, 247, 248)
def chat_screen(t, dur, prompt, answer, label, ph="Escreva uma legenda...", tit="Novo post"):
    img = Image.new("RGBA", (W, H), (20, 20, 24, 255))
    d = ImageDraw.Draw(img)
    # metade de cima: ANTES (post em branco)
    top_y0, top_y1 = 330, 610
    bot_y0, bot_y1 = 640, 1180
    fs = font(INTER_BLACK, 30)
    # ANTES
    d.rounded_rectangle([40, top_y0, W - 40, top_y1], radius=28, fill=(255, 255, 255))
    d.rounded_rectangle([60, top_y0 + 18, 210, top_y0 + 62], radius=20, fill=(230, 57, 70))
    d.text((80, top_y0 + 23), "ANTES", font=fs, fill=(255, 255, 255))
    fl = font(INTER_SEMI, 26)
    d.text((70, top_y0 + 90), tit, font=fl, fill=(90, 90, 100))
    d.line([70, top_y0 + 130, W - 70, top_y0 + 130], fill=(225, 225, 230), width=2)
    if int(t * 2) % 2 == 0:
        d.rectangle([72, top_y0 + 150, 75, top_y0 + 188], fill=(40, 40, 40))
    d.text((90, top_y0 + 152), ph, font=font(INTER_REG, 26), fill=(170, 170, 178))
    # DEPOIS
    d.rounded_rectangle([40, bot_y0, W - 40, bot_y1], radius=28, fill=BG_APP)
    d.rounded_rectangle([60, bot_y0 + 18, 240, bot_y0 + 62], radius=20, fill=(46, 160, 67))
    d.text((80, bot_y0 + 23), "DEPOIS", font=fs, fill=(255, 255, 255))
    d.text((W - 300, bot_y0 + 28), "exemplo ilustrativo", font=font(INTER_SEMI, 20), fill=(140, 140, 150))
    # bolha do prompt (aparece colando)
    fp = font(INTER_SEMI, 25)
    pl = wrap(d, prompt, fp, 440)
    pin = min(1.0, t / 0.35)
    bx1 = W - 60
    bh = 31 * len(pl) + 30
    by = bot_y0 + 82
    bx0 = bx1 - 490
    if pin > 0:
        a = int(255 * pin)
        bub = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        bd = ImageDraw.Draw(bub)
        bd.rounded_rectangle([bx0, by, bx1, by + bh], radius=20, fill=(52, 120, 246, a))
        yy = by + 14
        for l in pl:
            bd.text((bx0 + 20, yy), l, font=fp, fill=(255, 255, 255, a)); yy += 31
        img.alpha_composite(bub)
    # resposta digitando
    fa = font(INTER_BOLD, 31)
    start = 0.6
    chars = 0 if t < start else int((t - start) / max(0.1, (dur - start) * 0.8) * len(answer))
    chars = min(len(answer), chars)
    shown = answer[:chars]
    ay = by + bh + 22
    al = wrap(d, shown, fa, W - 160) if shown else []
    # ícone IA
    d.ellipse([60, ay, 100, ay + 40], fill=(30, 30, 36))
    d.text((68, ay + 7), "IA", font=font(INTER_BLACK, 20), fill=(255, 255, 255))
    yy = ay + 4
    for i, l in enumerate(al):
        d.text((115, yy), l, font=fa, fill=(30, 30, 36)); yy += 41
    if chars < len(answer) and t >= start and int(t * 6) % 2 == 0:
        d.ellipse([118, yy + 8, 132, yy + 22], fill=(30, 30, 36))
    # selo
    caption(img, label, SAFE_TOP + 10, size=64, emoji="✅", pop=pop_scale(t))
    return img

PROMPTS = [
    ("Crie uma legenda de Instagram para a Black Friday da Ateliê Mara, loja de roupas femininas. Tom animado.",
     "BLACK FRIDAY NA ATELIÊ MARA! Aquelas peças que você namorou o ano todo estão com preço especial. Corre, porque é só nesta semana. Vem pra loja ou chama no direct! #blackfriday #modafeminina",
     "1. LEGENDA"),
    ("Escreva uma mensagem curta de WhatsApp avisando clientes da Ateliê Mara sobre a Black Friday.",
     "Oi! Aqui é a Mara, da Ateliê Mara. A Black Friday começou e separei novidades com a sua cara. Quer que eu te mande as fotos das peças?",
     "2. WHATSAPP"),
    ("Crie o texto de uma oferta de Black Friday para a Ateliê Mara, curto e direto.",
     "BLACK FRIDAY ATELIÊ MARA. Peças selecionadas com preço especial, só até domingo. Garanta a sua na loja ou pelo WhatsApp.",
     "3. OFERTA"),
]

EXTRA = [("Escreva uma legenda...", "Novo post"), ("Digite uma mensagem...", "WhatsApp: clientes"), ("Texto da oferta...", "Oferta da semana")]

def split_blank_phone(t):
    """Cena 3-7s: tela dividida. Esquerda: post em branco; direita: lojista."""
    img = Image.new("RGBA", (W, H), (0, 0, 0, 255))
    right = kenburns(PHOTOS["c2"], 0.0, 1.0, 1.0)
    # metade direita: centro da foto
    r = right.crop((W // 4, 0, W // 4 + W // 2, H))
    img.paste(r, (W // 2, 0))
    left = Image.new("RGBA", (W // 2, H), (238, 238, 242, 255))
    d = ImageDraw.Draw(left)
    # celular desenhado
    px0, py0, px1, py1 = 30, 300, W // 2 - 30, 1000
    d.rounded_rectangle([px0, py0, px1, py1], radius=40, fill=(25, 25, 28))
    d.rounded_rectangle([px0 + 14, py0 + 14, px1 - 14, py1 - 14], radius=30, fill=(255, 255, 255))
    d.text((px0 + 40, py0 + 60), "Novo post", font=font(INTER_BOLD, 26), fill=(40, 40, 46))
    d.rounded_rectangle([px0 + 40, py0 + 110, px1 - 40, py0 + 330], radius=14, fill=(232, 232, 236))
    if int(t * 2) % 2 == 0:
        d.rectangle([px0 + 42, py0 + 370, px0 + 45, py0 + 405], fill=(30, 30, 30))
    d.text((px0 + 55, py0 + 372), "Legenda...", font=font(INTER_REG, 24), fill=(170, 170, 178))
    img.paste(left, (0, 0))
    ImageDraw.Draw(img).line([W // 2, 0, W // 2, H], fill=(255, 255, 255), width=4)
    return img

# ---------- linha do tempo (s) ----------
# Ajustada ao áudio da narração (34s) quando disponível; ver timeline.txt
TL = [float(x) for x in open(os.path.join(D, "timeline.txt")).read().split()] if os.path.exists(os.path.join(D, "timeline.txt")) else \
     [0, 3.0, 6.6, 9.6, 15.2, 20.4, 25.4, 29.6, 34.6]

def frame_at(t):
    s = TL
    if t < s[1]:
        p = (t - s[0]) / (s[1] - s[0])
        img = kenburns(PHOTOS["c1"], p, 1.0, 1.18, fx=0.38, fy=0.45, dx=0.0, dy=-0.04)
        caption(img, "BLACK FRIDAY E VOCÊ SEM POST?", SAFE_TOP + 20, size=66, color=(255, 255, 255), pop=pop_scale(t))
    elif t < s[2]:
        img = split_blank_phone(t)
        caption(img, "Falta tempo.\nFalta ideia.", SAFE_TOP + 20, size=60, pop=pop_scale(t - s[1]))
    elif t < s[3]:
        p = (t - s[2]) / (s[3] - s[2])
        img = kenburns(PHOTOS["c3"], p, 1.05, 1.15, fx=0.42, fy=0.62, dy=0.02)
        caption(img, "150 Prompts de IA para Pequenos Negócios", SAFE_TOP + 20, size=54,
                color=(20, 20, 20), box=(255, 214, 10, 240), pop=pop_scale(t - s[2]))
    elif t < s[6]:
        for i in range(3):
            if t < s[4 + i]:
                a, b = s[3 + i], s[4 + i]
                pr, an, lb = PROMPTS[i]
                img = chat_screen(t - a, b - a, pr, an, lb, *EXTRA[i])
                break
    elif t < s[7]:
        p = (t - s[6]) / (s[7] - s[6])
        sh = math.sin(t * 7.0) * 0.004
        img = kenburns(PHOTOS["c7"], p, 1.04, 1.12, fx=0.5 + sh, fy=0.5)
        caption(img, "Revise antes de postar", SAFE_TOP + 20, size=60, emoji="✍️", pop=pop_scale(t - s[6]))
    else:
        p = min(1.0, (t - s[7]) / (s[8] - s[7]))
        img = kenburns(PHOTOS["c8"], p, 1.12, 1.12, fx=0.45, fy=0.40)
        caption(img, "Link na bio", 780, size=78, emoji="👆", pop=pop_scale(t - s[7]))
    return img.convert("RGB")

def main():
    total = TL[-1]
    n = int(round(total * FPS))
    cmd = ["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
           "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", OUT]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for i in range(n):
        p.stdin.write(frame_at(i / FPS).tobytes())
    p.stdin.close(); p.wait()
    print("ok", OUT, n, "frames")

if __name__ == "__main__":
    if len(sys.argv) > 2 and sys.argv[2] == "stills":
        for t in [float(x) for x in sys.argv[3:]]:
            frame_at(t).save(os.path.join(D, f"still_{t:05.1f}.jpg"), quality=88)
    else:
        main()
