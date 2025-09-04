# SnailColony — Codex Plan (Phases)
Generated: 2025-09-04 13:28

Ten pakiet zawiera **plan zadań dla Codexa** w rozbiciu na fazy, minimalne parametry rozgrywki oraz opis logiki.
Docelowo: **prosty RTS** w parku po deszczu, z **Koloniami**, **Worker Snails**, **dwoma zasobami** (Biomass/Water), 
**śluzowymi szlakami** (przyspieszenie i mniejsze zużycie Hydration) oraz **upkeepem** baz/kolonii i celem „Colonize & Sustain”.

## Struktura
- `PHASES.md` – przegląd faz i kolejności.
- `codex/phase-XX-*.md` – zadania dla Codexa (requirements + acceptance criteria).
- `config/parameters.json` – startowe parametry balansu (można zmieniać podczas implementacji).
- `docs/GAME_LOGIC_SC.md` – zwięzły opis logiki gry i pętli symulacji.

## Jak używać
1. Zacznij od `PHASES.md` aby zobaczyć plan.
2. Otwórz kolejne pliki w `codex/` i dawaj je Codexowi **faza po fazie**.
3. Parametry do tuningu znajdziesz w `config/parameters.json`.
4. W razie wątpliwości – zajrzyj do `docs/GAME_LOGIC_SC.md`.
