"""Génère les polices auto-hébergées du site (WOFF2 réduits aux caractères utilisés).

Usage (depuis la racine du projet) :
    pip install fonttools brotli
    python tools/subset_fonts.py

À relancer après avoir ajouté du texte japonais dans index.html ou main.js :
Dela Gothic One ne contient alors que les caractères réellement présents sur le site.
Sources : assets/src/fonts/*.ttf (Google Fonts, licence SIL OFL), sorties : assets/fonts/*.woff2
"""
from pathlib import Path
from fontTools import subset

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets/src/fonts"
OUT = ROOT / "assets/fonts"

LATIN = "".join(chr(c) for c in range(0x20, 0x7F)) + "".join(chr(c) for c in range(0xA0, 0x180))
PUNCT = "‘’“”«»…–—·•→↑←↓°′″€№"


def site_text() -> str:
    text = ""
    for f in ("index.html", "main.js"):
        text += (ROOT / f).read_text(encoding="utf-8")
    return text


def is_cjk(ch: str) -> bool:
    c = ord(ch)
    return (0x3000 <= c <= 0x30FF) or (0x3400 <= c <= 0x9FFF) or (0xFF00 <= c <= 0xFFEF)


def build(src: str, out: str, chars: str) -> None:
    opts = subset.Options()
    opts.flavor = "woff2"
    opts.layout_features = ["*"]
    opts.name_IDs = ["*"]
    opts.notdef_outline = True
    font = subset.load_font(str(SRC / src), opts)
    sub = subset.Subsetter(opts)
    sub.populate(text=chars)
    sub.subset(font)
    dest = OUT / out
    subset.save_font(font, str(dest), opts)
    print(f"{out:28} {dest.stat().st_size // 1024:>4} Ko")


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    text = site_text()
    japanese = "".join(sorted({ch for ch in text if is_cjk(ch)}))
    print(f"{len(japanese)} caractères japonais trouvés")
    build("DelaGothicOne-Regular.ttf", "dela-gothic-one.woff2", LATIN + PUNCT + japanese)
    build("Anton-Regular.ttf", "anton.woff2", LATIN + PUNCT)
    build("IBMPlexMono-Regular.ttf", "ibm-plex-mono-400.woff2", LATIN + PUNCT)
    build("IBMPlexMono-Medium.ttf", "ibm-plex-mono-500.woff2", LATIN + PUNCT)
