from pathlib import Path
import base64, gzip, hashlib, urllib.request

ROOT = Path(__file__).resolve().parent.parent
PARTS = ROOT / "lifeatneon" / "template"
OUT = ROOT / "lifeatneon-public"
BASE = "https://ai-neon.uk"
EXPECTED_FINAL = "dbb774cee24ed28fa1f30ba2f7e2a903144ec35e66a5d8fbf5b2a8f000855697"

ASSETS = [
    ("__NEON_ASSET_00__", "/assets/command-centre-ipad.webp", "ae8858a81e059b1f5c849bf74e9d471c56f7e02241d0fb31fd02c1507621bb45"),
    ("__NEON_ASSET_01__", "/assets/current-15.webp", "cc4ea8b9c79ef2e358734ae6a2bf2d57a12c0593a18d89b21b88983f4585c6d7"),
    ("__NEON_ASSET_02__", "/assets/v7-1.png", "71c650e412cc427b308f040b7bd2c94fb0a42ad405cb424643a9e9d0cd605f76"),
    ("__NEON_ASSET_03__", "/assets/current-12.webp", "bc3e49114f2c065f8771481a6402f1acad0422836c94236ae6d278138ff1097d"),
    ("__NEON_ASSET_04__", "/assets/neon-logo.svg", "7dcad9ce5eff607a0724e6b41d7bedff99ca4cee07dd8b42b2be59045be65692"),
    ("__NEON_ASSET_05__", "/assets/current-16.webp", "a823d26b686d86b8ed4ab408a795a73639abb4e3b4ecec20917bf99301e3577b"),
    ("__NEON_ASSET_06__", "/assets/current-14.webp", "e21c20252e914c0fb3c5263f38723b5ec2a43f9b0ca7dfc15952cdcc42ce0f2d"),
    ("__NEON_ASSET_07__", "/assets/command-centre.jpg", "201d3c2640e6773950bd98ad6ce1c3b87182ce761319e08af4075fea1aa43057"),
    ("__NEON_ASSET_08__", "/assets/current-17.webp", "cbc6b6b68bde21f694583efd872e56b7de8e1ab38da7a057c4b9515d4a450d27"),
    ("__NEON_ASSET_09__", "/assets/current-13.webp", "f464c93de1ee860e86b1a229a8e4378d518d7b51530b0dd5474f55d167e3d2b1"),
]

encoded = "".join(p.read_text() for p in sorted(PARTS.glob("part-*.b64")))
html = gzip.decompress(base64.b64decode(encoded)).decode("utf-8")

for marker, path, expected in ASSETS:
    req = urllib.request.Request(BASE + path, headers={"User-Agent": "Mozilla/5.0 RenderBuild/1.0"})
    with urllib.request.urlopen(req, timeout=30) as response:
        raw = response.read()
    actual = hashlib.sha256(raw).hexdigest()
    if actual != expected:
        raise RuntimeError(f"Asset hash mismatch for {path}: {actual} != {expected}")
    html = html.replace(marker, base64.b64encode(raw).decode("ascii"))

payload = html.encode("utf-8")
actual_final = hashlib.sha256(payload).hexdigest()
if actual_final != EXPECTED_FINAL:
    raise RuntimeError(f"Final HTML hash mismatch: {actual_final} != {EXPECTED_FINAL}")

OUT.mkdir(parents=True, exist_ok=True)
(OUT / "index.html").write_bytes(payload)
print(f"Verified exact index.html: {len(payload)} bytes, sha256={actual_final}")
