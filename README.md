# estebantobon.dev

Personal site. Plain static HTML, CSS and JS, no build step. Deploys as-is on Vercel (`vercel.json` enables clean URLs).

| Page | File |
|---|---|
| Index: scroll-driven particle hero, featured Motion Studio, web projects | `index.html` |
| Play: Gemini research imagery gallery with filters and lightbox | `play.html` |
| Me: photo, experience, toolkit, resume, links | `me.html` |

## Design system
- Type: Helvetica Neue only
- Background `#0E0E0E`, text `#FFFFFF`, secondary `#A1A1A8`
- Gradient: baby blue `#A8DCFF` → blue `#3D6BFF` → purple `#8E5CF7` → pink `#F472B6`
- Fixed pill nav, fade-in + parallax on every page, film grain, gradient "thread" dot
- Respects `prefers-reduced-motion`; keyboard and screen-reader friendly

## Hero
`assets/js/hero.js` is a canvas port of the `ParticleForm` template from [motion-studio](https://github.com/estebantobon/motion-studio): seeded particles assemble into a sphere, then morph ring → helix → "ET" as you scroll, with spring physics and pointer repulsion.

## Placeholders to replace
- `me.html`: portrait (`assets/me/esteban.jpg`), resume PDF (`assets/Esteban-Tobon-Resume.pdf`), LinkedIn URL, earlier roles
- `play.html`: the 12 generated tiles; swap each `.art` div for an `<img>`
- `index.html`: project screenshots (put an `<img>` inside `.card-art`), descriptions marked `TODO(Esteban)`, URLs for Peptide Balance and New Wave

## Local preview
```sh
python3 -m http.server 8000
```
