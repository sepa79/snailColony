# GAME_LOGIC_SC — skrót logiki SnailColony

## Rdzeń rozgrywki
1) Produkuj **Worker Snails** w bazie.
2) Zbieraj **Biomass** (liście/ściółka) i **Water** (rosa).
3) Oddawaj do **magazynu** swojej bazy/kolonii (osobne magazyny).
4) **Śluzowe szlaki** ułatwiają ruch i zmniejszają koszt Hydration na twardych polach, ale **parują**.
5) **Ekspanduj**: zakładaj **Kolonie** na nowych wyspach zieleni.
6) **Upkeep** utrzymuje bazy aktywne i daje **aurę** (buff lokalny).

## Teren i wilgoć
- Park: `grass`, `leaf_litter`, `moss`, `gravel`, `sidewalk`, opcjonalnie `crack/edge` jako modyfikator.
- Wilgoć globalna/śladowa: `wet/damp/dry` — wpływa na prędkość i parowanie śluzu (zwłaszcza na chodniku).

## Jednostka
- **Worker Snail**: nośność 5; Hydration max 12; traci Hydration **tylko** na `gravel/sidewalk`.
- Ruch po siatce: koszt i prędkość zależne od terenu + śluzu.

## Śluz
- `I∈[0..1]` per pole, rośnie w ruchu (`deposit_rate`), maleje w czasie (`decay_rate` zależny od terenu i wilgoci).
- Wpływ: `speed += bonus(I)`, `hydration_cost *= (1 - save(I))` na twardych polach.
- Brak dyfuzji w MVP (możliwy blur w przyszłości).

## Bazy/kolonie
- Baza startowa produkuje Workery i ma magazyn.
- **Kolonia**: koszt 30 Biomass + 20 Water, budowa 30 s, własny magazyn.
- Oddawanie surowców **tylko** do lokalnej bazy/kolonii.

## Upkeep
- Co 10 s: **Base**: −2 Water, −1 Biomass; **Colony**: −1 Water, −1 Biomass.
- Gdy opłacony: **Aura** w R=5: `slime_decay −50%`, `hydration_cost(hard) −50%`, `speed +10%`, `production_time −20%`.
- Brak surowca → **Dormant** (aura OFF, produkcja OFF). 60 s nieopłacone → **Upadek** (kolonia znika).

## Cel
**Colonize & Sustain:** Załóż **3 Kolonie** i utrzymaj je **aktywne** przez **5 minut**, bez utraty żadnej bazy.
Aktywna = upkeep opłacony + ≥10 Water lub ≥10 Biomass w magazynie.

## Kolejność ticka
1) Aktualizacja wilgoci/aury → 2) Decay śluzu → 3) Ruch jednostek (z depozycją śluzu) → 
4) Zbieranie/oddawanie → 5) Upkeep co 10 s → 6) Sprawdzenie celu.
