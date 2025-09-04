# Faza 03 — Śluzowe szlaki (deposit/decay, wpływ na ruch i Hydration)

## Cel
Wprowadzić mapę śluzu `I∈[0..1]` per komórka, depozycję w ruchu i parowanie w czasie.

## Wymagania
- Każda komórka przechowuje `slime_intensity` (float 0..1).
- Depozycja: przy każdym kroku Workera `I += deposit_rate`, z capem do 1.0.
- Parowanie: co tick `I -= decay_rate(terrain, moisture)` według `parameters.json`.
- Wpływ na ruch/hydration:
  - `speed = base_speed * (1 + speed_bonus_max * f_terrain * I)`
  - `hydration_cost = base_cost * (1 - hydration_save_max * f_terrain * I)` (tylko na twardych polach).
- Brak dyfuzji (MVP).

## Kryteria akceptacji
- Ślad jest widoczny w debug overlay (np. heatmapa).
- Konwój na świeżym śladzie porusza się szybciej i traci mniej Hydration na twardych polach.
- Brak ruchu → ślad znika (szybciej na suchym chodniku).

## Out of scope
- Aura baz i UI finalne — później.
