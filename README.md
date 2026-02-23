# SnailColony (Phaser + Colyseus)

Projekt jest przepisywany z archiwalnego prototypu do docelowego stacku browser-first:
- klient: Phaser 3 + Vite + TypeScript
- serwer (autorytatywny): Colyseus + TypeScript
- wspolne reguly i parametry: `packages/shared`

## Archiwum starej wersji
Poprzedni monorepo jest zachowany w:
- `archive/legacy-2026-02-11`

## Stan implementacji
Aktualny etap to "pelna gra MVP" wedlug zalozen faz 01-08:
- mapa + warstwy zasobow + wilgoc
- wielu Worker Snails (per gracz)
- ruch + hydration + smierc na twardym terenie
- slime deposit/decay i jego wplyw na ruch/hydration
- bazy i kolonie (budowa z kosztem/czasem)
- upkeep + aura + collapse kolonii
- cel Colonize & Sustain (postep + wynik Victory/Defeat)
- HUD i podstawowe sterowanie RTS-lite
- AI minimum: pionier, konwoj i konserwacja sladu

## Start
```bash
pnpm install
pnpm dev
```

Aplikacje:
- client: `http://localhost:5173`
- server: `ws://localhost:2567`
- health: `http://localhost:2567/health`

## Sterowanie
- `LPM` na jednostce: select Workera
- `LPM` na mapie: move dla wybranego Workera
- `N`: spawn nowego Workera (koszt z bazy startowej)
- `B`: build colony na pozycji wybranego Workera (jesli teren i koszt pozwala)
- `TAB`: cykl wyboru po Twoich Workerach
- `A`: toggle Auto Mode (AI dla Twoich workerow)
- `H`: toggle heatmapy sluzu
- `PPM` lub `Shift+drag`: pan kamery
- `Kolo myszy`: zoom

## Przydatne komendy
```bash
pnpm --filter @snail/server lint
pnpm --filter @snail/server test
pnpm --filter @snail/client lint
pnpm --filter @snail/client test
pnpm build
```
