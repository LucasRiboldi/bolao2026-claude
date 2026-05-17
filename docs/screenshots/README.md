# Screenshots para o README

Capturas referenciadas no README principal. Adicione aqui quando puder
para o README ganhar vida visual.

## Capturas sugeridas (1280×800 ou 390×844 para mobile)

| Arquivo | Tela | Tamanho ideal | Captura desktop ou mobile |
|---------|------|---------------|----------------------------|
| `hero.png` | AuthScreen completa com hero + ranking público | 1280×800 | Desktop |
| `hero.gif` | (opcional) Animação 5s do login + transição pro dashboard | 800px wide | Desktop |
| `bet-screen.png` | BetScreen com grupos abertos + KO chips | 390×844 | Mobile |
| `standings.png` | StandingsScreen com tabelas + bracket | 1280×800 | Desktop |
| `ranking.png` | RankingScreen com pódio top 3 + lista | 390×844 | Mobile |
| `admin-dashboard.png` | AdminScreen com KPIs + status pills | 1280×800 | Desktop |
| `admin-tools.png` | AdminScreen → Ferramentas com cards | 1280×800 | Desktop |
| `styleguide.png` | Style guide standalone | 1280×800 | Desktop |
| `responsive.gif` | (opcional) Resize entre 320 → 768 → 1280 mostrando TeamName toggle | 800px wide | — |

## Como capturar

### macOS / Windows
- Chrome DevTools (F12) → Toggle device toolbar (Ctrl+Shift+M) →
  escolha resolução → menu ⋮ → "Capture screenshot"
- Para GIF: use [Kap](https://getkap.co) (Mac) ou [ScreenToGif](https://www.screentogif.com) (Windows)

### Otimização
Antes de commitar, comprima com [TinyPNG](https://tinypng.com) ou:
```bash
# PNG
pngcrush -reduce -brute screenshot.png compressed.png
# GIF
gifsicle -O3 --colors 128 input.gif > output.gif
```

Limite: < 500KB por arquivo (GIFs até 2MB).
