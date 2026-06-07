# 15th Century World — Interactive History Map

A React + MapLibre GL JS explorer of global history circa 1400–1500 CE. Two drill levels: continents → countries. Includes trade routes, exploration paths, military campaigns, and diplomatic connections as arc overlays.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## Build

```bash
npm run build
```

Output goes to `dist/`.

## Data files

- `history_data.json` — continents, countries, and connections data
- `world_110m.geojson` — world map polygons (Natural Earth 110m)
