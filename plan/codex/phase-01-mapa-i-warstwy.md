# Faza 01 — Mapa i warstwy (terrain, resources, moisture)

## Cel
Dostarczyć minimalny model mapy parku:
- siatka kafelków z typami terenu,
- punkty zasobów (Biomass, Water),
- podstawowy model wilgoci (wet/damp/dry).

## Wymagania (Requirements)
- Wprowadź siatkę mapy (2D; rozmiar konfigurowalny).
- Każda komórka ma `terrain.type ∈ {grass, leaf_litter, moss, gravel, sidewalk}`.
- Dodaj warstwę „resources”:
  - **Biomass nodes** (liście/ściółka) — liczba jednostek do zebrania (regeneracja poza MVP).
  - **Water nodes** (rosa) — punkt odnowy Hydration oraz źródło „wody” do magazynu.
- Dodaj globalny stan **moisture**: `wet/damp/dry` (prosty timer lub wartość procentowa).
- Ustaw wartości domyślne z `plan/config/parameters.json`.

## Kryteria akceptacji
- Mogę odpytać mapę i dostać typ terenu i obecność zasobu dla dowolnej komórki.
- Zmiana moisture wpływa na odczyt stanu (`wet/damp/dry`).
- Prosty renderer/debug (siatka + kolory terenów + ikony zasobów) działa lokalnie.

## Out of scope
- Ruch jednostek, śluz, upkeep, UI zaawansowane — w kolejnych fazach.
