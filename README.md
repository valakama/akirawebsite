# 密林 — Un jour dans la jungle

En ligne : https://valakama.github.io/akirawebsite/

Site-expérience : une journée dans la jungle, de l'aube à la nuit, racontée au scroll.

## Lancer en local

```bash
python -m http.server 5173
```

Puis ouvrir http://localhost:5173.

## Structure

- `index.html` : loader, scène (4 moments de la journée), manifeste, palette, fin
- `styles.css` : typo (Dela Gothic One / Anton / IBM Plex Mono), mise en page
- `main.js` : GSAP + ScrollTrigger + Lenis (via CDN), lucioles et pétales en canvas
- Style Akira : bandeaux rouges, HUD tech (timecode, climat, règle), trame manga, scanlines, grain, séparation RVB au scroll — tout en CSS/JS, aucune image en plus
- `assets/src/` : images originales · `assets/scenes/` : versions optimisées (2000, 1456 et 900 px)
- `assets/layers/` : calques détourés (lianes, feuillage) + `petals-atlas.webp` (23 pétales animés en canvas) + `mur-*.webp` et `mur-b-*.webp` (murs gauche et droit de la transition « traversée du feuillage »), une seule série teintée en CSS selon le moment

## Poids

~600 Ko d'images sur portable, ~900 Ko sur grand écran / Retina, ~260 Ko sur mobile ; les scènes 2–4 ne se chargent qu'après la première.
Calques de premier plan : ~250 Ko (mobile) à ~550 Ko (desktop). Pétales : 109 Ko, chargés après l'intro.
JS : ~50 Ko gzip au total via CDN, aucun build nécessaire.
