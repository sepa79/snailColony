# Faza 06 — Cel gry: Colonize & Sustain

## Cel
Zaimplementować warunek zwycięstwa i porażki.

## Wymagania
- Warunek zwycięstwa:
  - `colonies_required` aktywnych kolonii (upkeep opłacony, w magazynie ≥ `active_min_stock_any` dla wody **lub** biomasy)
  - utrzymanych przez `sustain_minutes`.
- Warunek porażki:
  - Upadek dowolnej bazy **poza** startową **albo** timeout scenariusza (opcjonalnie).
- Prosty licznik / wskaźnik postępu celu w HUD/komunikatach.

## Kryteria akceptacji
- System poprawnie wykrywa aktywność kolonii i liczy czas utrzymania.
- Zwycięstwo/porażka wyświetlają jasny komunikat.

## Out of scope
- Zaawansowane scenariusze / tryby.
