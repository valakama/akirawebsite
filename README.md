# 密林 · Un jour dans la jungle

En ligne : https://valakama.github.io/akirawebsite/

Site-expérience : une journée dans la jungle, de l'aube à la nuit, racontée au scroll. Style Akira, en français, anglais et japonais.

## Lancer en local

```bash
python -m http.server 5173
```

Puis ouvrir http://localhost:5173 (Ctrl + F5 pour ignorer le cache).

## Publier une mise à jour

```bash
python tools/bump_version.py
git add -A
git commit -m "Ma modification"
git push
```

`bump_version.py` change le `?v=…` de `styles.css` et `main.js` dans `index.html` : les visiteurs reçoivent la nouvelle version au lieu de celle en cache. GitHub Pages se met à jour 1 à 2 minutes après le push.

Après avoir ajouté du **texte japonais** (dans `index.html` ou dans les traductions de `main.js`), régénérer les polices pour que les nouveaux caractères existent :

```bash
pip install fonttools brotli
python tools/subset_fonts.py
```

Les polices sources (`assets/src/fonts/*.ttf`) viennent de [Google Fonts](https://github.com/google/fonts) : Dela Gothic One, Anton, IBM Plex Mono.

## Structure

- `index.html` : loader, scène (4 moments de la journée), manifeste, palette, fin
- `styles.css` : polices, mise en page, style Akira, secours sans JavaScript
- `main.js` : traductions FR / EN / JA, animations (GSAP + ScrollTrigger + Lenis), lucioles et pétales en canvas
- `vendor/` : GSAP 3.13.0, ScrollTrigger 3.13.0, Lenis 1.1.20 (hébergés sur le site, aucun service tiers)
- `assets/fonts/` : polices WOFF2 réduites aux caractères utilisés (92 Ko au total)
- `assets/scenes/` : les 4 scènes en 2000, 1456 et 900 px
- `assets/layers/` : calques détourés (lianes, feuillage, murs de la transition, pétales)
- `assets/icons/` : favicon, icônes d'écran d'accueil, manifeste
- `assets/og.jpg` : image d'aperçu pour les réseaux sociaux (1200 × 630)
- `tools/` : `bump_version.py` (cache), `subset_fonts.py` (polices)
- `assets/src/` : originaux (images Midjourney, polices sources), **non publiés** (voir `.gitignore`), à sauvegarder ailleurs

## Robustesse et accessibilité

- Sans JavaScript (ou si un script échoue), la page s'affiche comme une page classique : hero puis les 4 scènes avec leur texte.
- `prefers-reduced-motion` : pas de scroll lissé ni d'animations décoratives.
- Les passages en japonais sont marqués `lang="ja"` pour les lecteurs d'écran ; toutes les images ont un texte alternatif traduit.
- Aucune requête vers un service tiers (polices et librairies servies par le site).

## Poids

Images : ~260 Ko sur mobile, ~600 Ko sur portable, ~900 Ko sur grand écran ; les scènes 2 à 4, les murs de transition et les pétales ne se chargent qu'après l'intro.
JS : ~130 Ko non compressés (~50 Ko gzip), polices : 92 Ko.

## Licences

- Code du site : © 2026 valakama.
- GSAP / ScrollTrigger : [licence standard GSAP](https://gsap.com/standard-license) (gratuite).
- Lenis : licence MIT.
- Polices : SIL Open Font License 1.1.
