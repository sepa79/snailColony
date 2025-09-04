# Faza 02 — Jednostka i ruch (Worker, Hydration)

## Cel
Dodać jednostkę **Worker Snail** z ruchem po siatce i Hydration zależnym od terenu.

## Wymagania
- Zaimplementuj **Worker Snail**:
  - atrybuty: `carry_capacity=5`, `hydration_max=12`, aktualna `hydration`.
  - ruch po siatce pick-by-pick (lub A*), z prędkością zależną od `terrain.base_speed`.
- Hydration:
  - Na terenach miękkich (`grass/leaf_litter/moss`) koszt = 0.
  - Na twardych (`gravel/sidewalk`) koszt jak w `plan/config/parameters.json` + modyfikacja dla `dry sidewalk`.
  - Gdy `hydration<=0` **na twardym polu** → jednostka umiera.
  - Odnowa przy **Water node** i w **Bazie/Kolonii** (gdy powstaną).

## Kryteria akceptacji
- Worker może przejść przez różne tereny z różnymi prędkościami.
- Hydration spada tylko na twardych polach i odnawia się na Water node.
- Śmierć przy 0 hydration na twardym polu jest poprawnie obsłużona.

## Out of scope
- Śluz, magazynowanie, kolonie — dalej.
