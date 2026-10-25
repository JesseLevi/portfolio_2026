"""Traceert een zwart-witte PNG naar een SVG met losse, animeerbare lagen.

    python3 scripts/illustrations/trace.py scripts/illustrations/avatar.json [overlay.png]

Vereist: potrace (brew install potrace) en Python met numpy, scipy en pillow.
De spec (JSON) noemt de bron-PNG, de uitvoer (plus een stilstaande `-static.svg`), de
animatie-CSS en de lagen. Coördinaten
zijn pixels in de bron-PNG. Met een tweede argument schrijft het script een overlay waarin
elke laag een eigen kleur heeft: zo controleer je waar de sneden lopen.

Een laag:
  name        klasse van de <g> in de SVG (de CSS animeert die)
  poly        de pixels binnen deze polygoon horen bij de laag
  comps_in    of: hele zwarte vormen die binnen een van deze kaders vallen (ogen, neus)
  within      alleen pixels die tot nu toe bij die laag hoorden
  parent      de laag hangt in die groep en beweegt mee (standaard: within)
  fill        een witte onderlaag, zodat wat erachter ligt niet doorschijnt
  fill_poly   beperkt die onderlaag (sluit ingesloten wit rond de laag uit)
  also_ink    lijnen in deze polygonen tekent de laag óók, over de snede heen
  seam_exclude  geen naadoverlap in deze polygonen (bv. een tafelpoot naast de schoen)
  clip_seed   punt in het gezichtsvlak; de laag wordt daarop geknipt
"""

import json
import os
import re
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

U = 4  # eerst 4x opschalen: vloeiendere curves


def poly_mask(shape, pts):
    im = Image.new('L', (shape[1], shape[0]), 0)
    ImageDraw.Draw(im).polygon([(x * U, y * U) for x, y in pts], fill=1)
    return np.asarray(im).astype(bool)


def trace(mask):
    """potrace op een masker; geeft het path-`d` in potrace-eenheden (zie `tf`)."""
    if not mask.any():
        return ''
    with tempfile.TemporaryDirectory() as td:
        pbm = os.path.join(td, 'in.pbm')
        Image.fromarray((~mask).astype(np.uint8) * 255).convert('1').save(pbm)
        svg = os.path.join(td, 'out.svg')
        subprocess.run(
            ['potrace', pbm, '-s', '-o', svg, '-t', '6', '-a', '1.1', '-O', '0.4', '-u', '2'],
            check=True,
        )
        txt = open(svg).read()
    return ' '.join(' '.join(d.split()) for d in re.findall(r'<path d="([^"]+)"', txt))


def minify_css(css):
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    css = re.sub(r'\s+', ' ', css)
    css = re.sub(r'\s*([{};:,>])\s*', r'\1', css)
    return css.replace(';}', '}').strip()


def main():
    spec_path = sys.argv[1]
    here = os.path.dirname(spec_path)
    spec = json.load(open(spec_path))
    layers = spec['layers']
    names = ['body'] + [l['name'] for l in layers]
    by_name = {l['name']: l for l in layers}
    parent = {l['name']: l.get('parent', l.get('within')) for l in layers}

    def ancestors(m):
        while m:
            yield m
            m = parent.get(m)

    def subtree(n):
        return [m for m in names if m == n or (m in parent and n in ancestors(m))]

    src = Image.open(spec['src']).convert('L')
    W, H = src.size
    black = np.asarray(src.resize((W * U, H * U), Image.LANCZOS)) < 128
    # Ingesloten wit: wit dat niet met de rand van het beeld verbonden is.
    wl, _ = ndimage.label(~black)
    border = set(np.unique(np.concatenate([wl[0], wl[-1], wl[:, 0], wl[:, -1]]))) - {0}
    interior = ~black & ~np.isin(wl, list(border))
    silhouette = black | interior

    bl, _ = ndimage.label(black)
    objs = ndimage.find_objects(bl)

    own = np.full(black.shape, 'body', dtype=object)
    for l in layers:
        m = np.ones(black.shape, bool)
        if 'poly' in l:
            m &= poly_mask(black.shape, l['poly'])
        if 'within' in l:
            m &= own == l['within']
        if 'comps_in' in l:
            sel = np.zeros(black.shape, bool)
            for x0, y0, x1, y1 in l['comps_in']:
                for i, (ys, xs) in enumerate(objs, 1):
                    if xs.start >= x0 * U and ys.start >= y0 * U and xs.stop <= x1 * U and ys.stop <= y1 * U:
                        sel |= bl == i
            # Iets ruimer, zodat de antialiasing-rand meekomt.
            m &= ndimage.binary_dilation(sel, iterations=U)
        own[m] = l['name']

    if len(sys.argv) > 2:
        palette = [(230, 60, 60), (60, 140, 230), (40, 170, 90), (220, 150, 30), (160, 80, 200), (0, 170, 170)]
        ov = np.full(black.shape + (3,), 255, np.uint8)
        for k, n in enumerate(names):
            c = (0, 0, 0) if n == 'body' else palette[k % len(palette)]
            ov[(own == n) & black] = c
            if n != 'body':
                ov[(own == n) & interior] = tuple(255 - (255 - v) // 5 for v in c)
        Image.fromarray(ov).resize((W * 2, H * 2), Image.LANCZOS).save(sys.argv[2])

    def base_fill(m):
        f = (own == m) & silhouette
        if 'fill_poly' in by_name[m]:
            f &= poly_mask(black.shape, by_name[m]['fill_poly'])
        return f

    out = {}
    for l in [{'name': 'body'}] + layers:
        n = l['name']
        ink = (own == n) & black
        if n != 'body':
            # 1 bronpixel over de snede: geen antialiasing-naad waar twee lagen elkaar raken.
            # Niet in de eigen sublagen: die bewegen apart en zouden een randje achterlaten.
            seam = ndimage.binary_dilation(own == n, iterations=U) & ~np.isin(own, subtree(n)[1:])
            for p in l.get('seam_exclude', []):
                seam &= ~poly_mask(black.shape, p)
            ink |= black & seam
        for p in l.get('also_ink', []):
            ink |= black & poly_mask(black.shape, p)
        out[n] = {'ink': trace(ink)}
        if l.get('fill'):
            # Wit onder de hele subboom, zodat bewegende sublagen nooit een gat laten zien.
            m = np.zeros(black.shape, bool)
            for s in subtree(n):
                m |= base_fill(s)
            out[n]['fill'] = trace(ndimage.binary_erosion(m))
        if 'clip_seed' in l:
            # Het gezichtsvlak, inclusief de gelaatstrekken zelf.
            x, y = l['clip_seed']
            cl, _ = ndimage.label(interior & np.isin(own, subtree(parent[n])))
            m = ndimage.binary_fill_holes(cl == cl[y * U, x * U]) | np.isin(own, subtree(n))
            out[n]['clip'] = trace(ndimage.binary_dilation(m, iterations=U))

    # potrace-eenheden (halve pixels van het opgeschaalde beeld, y omgekeerd) naar bronpixels.
    k = 0.5 / U
    tf = f'matrix({k:g} 0 0 {-k:g} 0 {H})'

    def paths(n):
        p = ''
        if out[n].get('fill'):
            p += f'<path fill="#fff" d="{out[n]["fill"]}"/>'
        if out[n]['ink']:
            p += f'<path d="{out[n]["ink"]}"/>'
        # De transform staat op een eigen groep: CSS-transforms op de laag zouden hem vervangen.
        return f'<g transform="{tf}">{p}</g>' if p else ''

    def group(n):
        g = f'<g class="{n}">{paths(n)}{"".join(group(m) for m in parent if parent[m] == n)}</g>'
        if out[n].get('clip'):
            # De clip op een stilstaande wrapper, zodat hij niet meebeweegt met de laag.
            g = (
                f'<clipPath id="{n}-clip"><path transform="{tf}" d="{out[n]["clip"]}"/></clipPath>'
                f'<g clip-path="url(#{n}-clip)">{g}</g>'
            )
        return g

    css = minify_css(open(os.path.join(here, spec['css'])).read())
    extras = open(os.path.join(here, spec['extras'])).read().strip() if 'extras' in spec else ''
    body = paths('body') + extras + ''.join(group(m) for m in parent if parent[m] is None)
    head = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}">'
    # Ook een stilstaande variant: de pagina kiest die bij reduced motion via <picture>, want
    # niet elke browser geeft die voorkeur door aan een SVG in een <img>.
    for path, style in [(spec['out'], f'<style>{css}</style>'), (spec['out'].replace('.svg', '-static.svg'), '')]:
        svg = f'{head}{style}{body}</svg>\n'
        open(path, 'w').write(svg)
        print(f'{path}: {len(svg)} bytes')


main()
