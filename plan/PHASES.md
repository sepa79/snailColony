# PHASES — przegląd
Prowadź implementację **fazami**. Każda faza ma plik `codex/phase-XX-*.md` z wymaganiami i kryteriami akceptacji.

1. **Faza 01 — Mapa i warstwy**: siatka, typy terenu, punkty zasobów (Biomass, Water), wilgoć. Proceduralny generator map połączony z dashboardem serwera.
2. **Faza 02 — Jednostka i ruch**: Worker Snail, Hydration, koszt ruchu po terenie.
3. **Faza 03 — Śluzowe szlaki**: depozycja, parowanie, wpływ na prędkość i Hydration.
4. **Faza 04 — Bazy i Kolonie**: magazyny per baza, zbiór/oddawanie, założenie Kolonii.
5. **Faza 05 — Upkeep i Aura**: cykliczne koszty baz, efekt aury, stany Dormant/Upadek.
6. **Faza 06 — Cele gry**: „Colonize & Sustain” (3 Kolonie aktywne przez 5 minut, bez utraty bazy).
7. **Faza 07 — UI/UX**: HUD zasobów, paski Hydration, heatmapa śluzu, komunikaty upkeepu/celu.
8. **Faza 08 — AI (minimum)**: pionier malujący ślad, konwój, preferencja istniejących śladów.

**Zasada:** Każda faza ma minimalny zestaw funkcji. Nie rozszerzaj zakresu bez potrzeby — najpierw *vertical slice*, potem polish.
