# Faza 04 — Bazy i Kolonie (magazyny per baza, zbiór/oddawanie, zakładanie kolonii)

## Cel
Wprowadzić Bazy/ Kolonie oraz logistykę zasobów z osobnymi magazynami.

## Wymagania
- **Base** (start): węzeł produkcyjny Workerów, magazyn `{biomass, water}`.
- **Colony**: konstrukcja na polu zieleni (nie na chodniku); koszt i czas budowy z `apps/server/config/parameters.json`.
- **Zbieranie**: Worker może podnieść zasób ze źródła do swojej `carry` (do 5).
- **Oddawanie**: Worker oddaje ładunek **tylko** do najbliższej własnej bazy/kolonii (tej, do której został przypisany).
- Każda baza gromadzi surowce **oddzielnie**.

## Kryteria akceptacji
- Mogę zbudować Kolonię (po spełnieniu kosztu), po czasie staje się aktywną bazą z magazynem.
- Workery zbierają i oddają do przypisanej bazy/kolonii.
- Magazyny nie mieszają stanów (sumy zgadzają się).

## Out of scope
- Upkeep i aura — następna faza.
