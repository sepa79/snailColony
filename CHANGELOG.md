# Changelog

## [Unreleased]
### Added
- Faza 08 AI minimum: slime-aware pathfinding, role Pioneer (malowanie sladu), Convoy (petla transportowa), Maintenance (odmalowanie sladu ponizej progu).
- Serwerowe testy AI (`apps/server/src/rooms/ai.spec.ts`) dla round-trip i preferencji slimed route.

### Changed
- HUD klienta: pasek hydration dla wybranego Workera, status Slime Boost, format celu `mm:ss`.
- Overlay klienta: przelaczana heatmapa sluzu (`H`) i toggle automatyzacji (`A`).
- Markery kolonii: komunikat Dormant z odliczaniem do collapse.

## [0.3.0] - 2026-02-11
### Changed
- Przejscie z etapu tech demo do etapu "full game MVP" zgodnie z zalozeniami faz 01-07.
- Rozszerzenie modelu stanu z pojedynczej jednostki do wielu Workerow i wielu kolonii.
- Aktualizacja sterowania klienta pod styl RTS-lite (select/move/spawn/build, kamera i zoom).

### Added
- Pelna petla symulacji serwerowej: moisture -> slime decay -> movement/hydration -> harvest/deliver -> upkeep/aura -> scoring.
- Budowa kolonii z kosztem i czasem konstrukcji.
- Upkeep baz i kolonii z przejsciem w Dormant oraz collapse kolonii po dlugim braku utrzymania.
- Warunek celu Colonize & Sustain z postepem i wynikami Victory/Defeat.
- HUD pokazujacy stan celu, zasobow i wybranej jednostki.

## [0.2.0] - 2026-02-11
### Changed
- Zarchiwizowano poprzedni monorepo do `archive/legacy-2026-02-11`.
- Uruchomiono nowy tech demo stack: Phaser 3 + Colyseus + TypeScript.

### Added
- Autorytatywna symulacja serwerowa z tickiem i prostym modelem mapy.
- Web client w Phaser z podgladem mapy, slime, hydration i stanu bazy.
