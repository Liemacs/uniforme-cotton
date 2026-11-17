"""Tiparul tunicii: contururi egal depărtate de silueta ei, ca pe un tipar de croitorie.

Câmp de distanță (chamfer 3-4) în jurul siluetei, apoi curbe de nivel prin
marching squares: linia cusăturii (punctată) la D_SEAM, linia de croi la D_CUT.
Iese un SVG în coordonatele decupajului (674x881), cu margine PAD.
"""
import sys, math
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
D_SEAM, D_CUT, PAD = 7.0, 22.0, 56
a = Image.open(src).convert("RGBA").split()[-1]
W, H = a.size
GW, GH = W + 2 * PAD, H + 2 * PAD
inside = bytearray(GW * GH)
ap = a.load()
for y in range(H):
    row = (y + PAD) * GW + PAD
    for x in range(W):
        if ap[x, y] > 127: inside[row + x] = 1

# distanța (în unități 1/3 px) față de siluetă, pentru pixelii din afară
INF = 10 ** 9
d = [0 if inside[i] else INF for i in range(GW * GH)]
for y in range(GH):
    for x in range(GW):
        i = y * GW + x
        if d[i] == 0: continue
        v = d[i]
        if x > 0: v = min(v, d[i - 1] + 3)
        if y > 0:
            v = min(v, d[i - GW] + 3)
            if x > 0: v = min(v, d[i - GW - 1] + 4)
            if x < GW - 1: v = min(v, d[i - GW + 1] + 4)
        d[i] = v
for y in range(GH - 1, -1, -1):
    for x in range(GW - 1, -1, -1):
        i = y * GW + x
        if d[i] == 0: continue
        v = d[i]
        if x < GW - 1: v = min(v, d[i + 1] + 3)
        if y < GH - 1:
            v = min(v, d[i + GW] + 3)
            if x < GW - 1: v = min(v, d[i + GW + 1] + 4)
            if x > 0: v = min(v, d[i + GW - 1] + 4)
        d[i] = v
dist = [v / 3.0 for v in d]

def iso(level):
    """Curba de nivel dist = level, ca buclă închisă. Punctele se leagă după muchia de grilă
    pe care stau (cheie exactă), nu după coordonate rotunjite."""
    f = lambda x, y: dist[y * GW + x] - level
    def cross(a, b):
        (x1, y1), (x2, y2) = a, b
        v1, v2 = f(x1, y1), f(x2, y2)
        if (v1 < 0) == (v2 < 0): return None
        t = v1 / (v1 - v2)
        key = ("h", min(x1, x2), y1) if y1 == y2 else ("v", x1, min(y1, y2))
        return key, (x1 + t * (x2 - x1) - PAD, y1 + t * (y2 - y1) - PAD)
    coord, adj = {}, {}
    for y in range(GH - 1):
        for x in range(GW - 1):
            c = ((x, y), (x + 1, y), (x + 1, y + 1), (x, y + 1))
            hits = [cross(c[k], c[(k + 1) % 4]) for k in range(4)]
            hits = [h for h in hits if h]
            for key, pt in hits: coord[key] = pt
            keys = [h[0] for h in hits]
            pairs = [(keys[0], keys[1])] if len(keys) == 2 else ([(keys[0], keys[1]), (keys[2], keys[3])] if len(keys) == 4 else [])
            for a, b in pairs:
                adj.setdefault(a, []).append(b); adj.setdefault(b, []).append(a)
    seen, loops = set(), []
    for start in adj:
        if start in seen: continue
        loop, prev, cur = [start], None, start
        seen.add(start)
        while True:
            nxt = [n for n in adj[cur] if n != prev and n not in seen]
            if not nxt: break
            prev, cur = cur, nxt[0]; seen.add(cur); loop.append(cur)
        loops.append(loop)
    best = max(loops, key=len)
    closed = best[0] in adj[best[-1]]
    print(f"  level {level}: {len(loops)} loops, longest {len(best)} pts, closed={closed}")
    return [coord[k] for k in best]

def rdp(pts, eps):
    if len(pts) < 3: return pts
    (x1, y1), (x2, y2) = pts[0], pts[-1]
    dx, dy = x2 - x1, y2 - y1; n = math.hypot(dx, dy) or 1e-9
    i_max, d_max = 0, 0
    for i in range(1, len(pts) - 1):
        dd = abs(dy * pts[i][0] - dx * pts[i][1] + x2 * y1 - y2 * x1) / n
        if dd > d_max: i_max, d_max = i, dd
    if d_max > eps:
        return rdp(pts[:i_max + 1], eps)[:-1] + rdp(pts[i_max:], eps)
    return [pts[0], pts[-1]]

def path(loop):
    # bucla e închisă: o tăiem în punctul cel mai depărtat de start și simplificăm cele două jumătăți
    x0, y0 = loop[0]
    k = max(range(len(loop)), key=lambda i: (loop[i][0] - x0) ** 2 + (loop[i][1] - y0) ** 2)
    p = rdp(loop[:k + 1], .45)[:-1] + rdp(loop[k:] + [loop[0]], .45)
    return "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in p) + " Z", p

seam_d, seam_pts = path(iso(D_SEAM))
cut_d, cut_pts = path(iso(D_CUT))

# crestături: scurte, perpendiculare pe linia de croi, spre interior, în puncte fixe pe contur
def notch(pts, frac, L=12):
    n = len(pts); i = int(frac * n) % n
    (x0, y0), (x1, y1) = pts[(i - 2) % n], pts[(i + 2) % n]
    tx, ty = x1 - x0, y1 - y0; m = math.hypot(tx, ty) or 1
    nx, ny = -ty / m, tx / m
    x, y = pts[i]
    # orientăm normala spre siluetă (distanța scade)
    gx, gy = int(x + nx * 3 + PAD), int(y + ny * 3 + PAD)
    if 0 <= gx < GW and 0 <= gy < GH and dist[gy * GW + gx] > D_CUT: nx, ny = -nx, -ny
    return f"M{x:.1f} {y:.1f} L{x + nx * L:.1f} {y + ny * L:.1f}"
notches = " ".join(notch(cut_pts, f) for f in (.06, .19, .31, .44, .56, .69, .81, .94))

cx = W / 2
grain = (f"M{cx:.1f} {-PAD + 8} L{cx:.1f} {H + PAD - 8} "
         f"M{cx - 6:.1f} {-PAD + 18} L{cx:.1f} {-PAD + 8} L{cx + 6:.1f} {-PAD + 18} "
         f"M{cx - 6:.1f} {H + PAD - 18} L{cx:.1f} {H + PAD - 8} L{cx + 6:.1f} {H + PAD - 18}")

svg = f'''<svg class="hero__tipar" viewBox="{-PAD} {-PAD} {GW} {GH}" aria-hidden="true" focusable="false">
  <path class="t-cut" d="{cut_d}"/>
  <path class="t-seam" d="{seam_d}"/>
  <path class="t-notch" d="{notches}"/>
  <path class="t-grain" d="{grain}"/>
</svg>'''
open(out, "w", encoding="utf-8").write(svg)
print(f"canvas {GW}x{GH} pad {PAD} | seam pts {len(seam_pts)} | cut pts {len(cut_pts)} | svg {len(svg)} bytes")
print(f"inset: left {-PAD/W*100:.3f}% top {-PAD/H*100:.3f}% width {GW/W*100:.3f}% height {GH/H*100:.3f}%")
