"""
Descarga las imagenes del sitio original y extrae sus URLs del HTML.
"""
import urllib.request
import urllib.error
import re
import os
import json

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'es-ES,es;q=0.9',
}

BASE = 'https://jean-paul-ramirez-rico-estafa.info'

URLS = [
    '/posts/expediente-colombia-jean-paul-ramirez',
    '/posts/red-familiar-estafa-ramirez-rico',
    '/posts/sentencia-tsj-robert-ramirez',
    '/posts/investigacion-robert-ramirez-rico',
    '/',  # homepage
]

os.makedirs('assets', exist_ok=True)

found_images = {}

for path in URLS:
    url = BASE + path
    print(f'\n=== {url}')
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode('utf-8', errors='replace')
    except Exception as e:
        print(f'  ERROR fetching: {e}')
        continue

    # Extract og:image
    og_imgs = re.findall(r'property=["\']og:image["\'][^>]*content=["\']([^"\']+)["\']', html)
    og_imgs += re.findall(r'content=["\']([^"\']+)["\'][^>]*property=["\']og:image["\']', html)

    # Extract img src
    img_srcs = re.findall(r'<img[^>]+src=["\']([^"\']+)["\']', html)

    # Extract any webp/jpg/png/jpeg references
    all_imgs = re.findall(r'["\']([^"\']*\.(?:webp|jpg|jpeg|png|gif|svg))["\']', html)

    imgs = list(set(og_imgs + img_srcs + all_imgs))
    
    for img in imgs:
        if img.startswith('//'):
            img = 'https:' + img
        elif img.startswith('/'):
            img = BASE + img
        elif not img.startswith('http'):
            continue
        
        if 'google' in img or 'facebook' in img or 'twitter' in img or 'data:' in img:
            continue
            
        print(f'  FOUND: {img}')
        found_images[img] = img

# Download all found images
print(f'\n\n=== DOWNLOADING {len(found_images)} images ===')
for img_url in found_images:
    try:
        filename = img_url.split('/')[-1].split('?')[0]
        if not filename or '.' not in filename:
            continue
        out = os.path.join('assets', filename)
        if os.path.exists(out):
            print(f'  SKIP (exists): {filename}')
            continue
        req = urllib.request.Request(img_url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = resp.read()
        with open(out, 'wb') as f:
            f.write(data)
        print(f'  OK ({len(data)} bytes): {filename}')
    except Exception as e:
        print(f'  FAIL {img_url}: {e}')

print('\n=== DONE ===')
print('Files in assets/:')
for f in os.listdir('assets'):
    size = os.path.getsize(os.path.join('assets', f))
    print(f'  {f} ({size} bytes)')
