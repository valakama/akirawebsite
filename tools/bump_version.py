"""Met à jour le numéro de version de styles.css et main.js dans index.html.

GitHub Pages et les navigateurs gardent les fichiers en cache : changer le ?v=…
force tous les visiteurs à recharger la nouvelle version après une mise à jour.

Usage (depuis la racine du projet), juste avant de committer :
    python tools/bump_version.py
"""
import re
from datetime import datetime
from pathlib import Path

index = Path(__file__).resolve().parent.parent / "index.html"
version = datetime.now().strftime("%Y%m%d%H%M")
html = index.read_text(encoding="utf-8")
html, count = re.subn(r'((?:styles\.css|main\.js)\?v=)[0-9]+', rf"\g<1>{version}", html)
index.write_text(html, encoding="utf-8")
print(f"version {version} ({count} fichiers)")
