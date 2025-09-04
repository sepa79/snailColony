# Faza 05 — Upkeep i Aura (Dormant/Upadek)

## Cel
Dodać cykliczne koszty utrzymania baz oraz lokalny buff (Aura).

## Wymagania
- Co `upkeep.interval_seconds`:
  - Base: −2 Water, −1 Biomass
  - Colony: −1 Water, −1 Biomass
- Jeśli brakuje **któregokolwiek** surowca:
  - Baza przechodzi w **Dormant** (aura OFF, produkcja OFF).
  - Licz czas w Dormant; po `dormant_collapse_seconds` kolonia **Upada** (znika). Baza startowa nie upada.
- **Aura** (gdy upkeep opłacony): w `radius`:
  - `slime_decay_multiplier` (mniej paruje),
  - `hydration_cost_hard_multiplier` (taniej na twardych polach),
  - `speed_bonus`,
  - `production_time_multiplier` (szybsza produkcja Workerów).

## Kryteria akceptacji
- Widoczne logi/HUD pokazują stan upkeepu i przełączenie Dormant/Active.
- Aura wpływa na ślad i ruch zgodnie z parametrami.
- Kolonie mogą upaść po długim braku surowców; baza startowa – nie.

## Out of scope
- Cele gry i UI docelowe — zaraz.
