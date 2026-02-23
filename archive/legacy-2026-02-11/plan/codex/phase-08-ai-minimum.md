# Faza 08 — AI (minimum)

## Cel
Dać światu ruch bez ręcznego micro: pionier + konwój + konserwacja śladu.

## Wymagania
- Pathfinding oparty o `cost = base_cost - k * slime_intensity` na twardych polach.
- **Pionier**: jeśli brak ścieżki, wyślij 1 Workera, by „pomalował” linię do celu (tam i z powrotem).
- **Konwój**: jednostki ładunkowe podążają śladem (preferencja `I>0.3`).
- **Konserwacja**: gdy `I` na kluczowym polu spada < 0.2, najbliższy wolny Worker dostaje zlecenie „odmalowania”.

## Kryteria akceptacji
- Pionier realnie poprawia warunki dla konwoju.
- AI wybiera ślad nawet jeśli trasa jest minimalnie dłuższa.
