# 🐌 SnailColony — mechanika bazy i kolonii (spec)

Poniżej spójny system **jak działają kolonie/bazy**, jak się **rozbudowują**, jakie są **budynki**, zasięgi, upkeep i interakcje z systemem zasobów oraz rozwojem „drono‑ślimaków”.

---

## 1) Pojęcia i zasady rdzeniowe

**Baza startowa (Nest Core)**  
- Pierwsza kolonia na mapie. Ma **zasięg wpływu (radius)**, w którym działa logistycznie (auto‑zrzut ładunku, bufory hydratacji, budowa).  
- Zawiera unikalne moduły „rdzeniowe”: **Hatchery** (larwy), **Hydration Pool**, **Storage Node**.

**Kolonia (Outpost)**  
- Mniejszy „węzeł” zakładany przez Workera/Carriera (dostarcz zasoby budowy).  
- Mniejszy radius, mniej slotów na budynki, tańsza. Służy do **zajmowania terenu** i skracania tras.

**Sieć kolonii & ślady**  
- Kolonie łączysz **śladami** (bez mostów). Ślady przyspieszają ruch i obniżają koszt 💧.  
- **Trail Post** utrzymuje ślady (zwykłe lub „slick” z ✨).

**Zasięg wpływu (radius)**  
- Określa: auto‑zrzut ładunku, ładowanie hydratacji, budowę/naprawy i pasywne bonusy (np. dopalanie AI Sync).  
- **Awans kolonii** zwiększa radius i liczbę slotów budynków.

**Upkeep & limity**  
- Każda kolonia utrzymuje okoliczne ślimaki: **koszt w 💧** zależny od liczby aktywnych jednostek w zasięgu.  
- Kolonie mają **sloty budynków**; awans zwiększa sloty i odblokowuje typy.

**Progres kampanii a kolonie**  
- Kolonie są **scenariuszowe** (nie przenoszą się między mapami), ale dają **milestone’y** (np. +1 slot specjalizacji dla NOWYCH ślimaków po ukończeniu scenariusza).  
- Weterani‑ślimaki zachowują swój „cap” levelowy wg zasad rozwoju jednostek.

---

## 2) Cykl życia kolonii

**Stany**  
1. **Zakładanie** – Worker/Carrier wnosi pakiet budowlany; timer budowy; kolonia „niemobilna”.  
2. **Aktywna** – ma radius, przyjmuje ładunki, utrzymuje ślady, obsługuje budynki.  
3. **Wyschnięta** – niski bilans 💧 → radius maleje, ścieżki zanikają szybciej.  
4. **Przeciążona** – zbyt dużo jednostek w zasięgu → wzrost kosztu 💧 i spadek efektywności.  
5. **Porzucona** – brak zasilania (💧/🌱) dłużej niż X min → dezaktywacja, zostaje „ruina” (możliwy salvage 🪨).

**Awans kolonii (L1→L5)**  
- **L1**: 2 sloty budynków, radius 6.  
- **L2**: 3 sloty, radius 8, odblok „warsztat lekki”.  
- **L3**: 4 sloty, radius 10, Trail Post+ (ustawienia profilu śladów).  
- **L4**: 5 slotów, radius 12, **Relay Beacon** (zasięg rozkazów/AI Sync).  
- **L5**: 6 slotów, radius 14, **bonus scenariuszowy** (np. +1 part‑slot dla nowych larw z tej kolonii).

> Awans wymaga dostarczenia zasobów i krótkiego okna serwisowego (wydajność −50%).

---

## 3) Budowa i logistyka

**Budowa**  
- Każdy budynek ma **koszt zasobów** oraz **czas montażu**.  
- Budują **Workery/Carriery** – dostawa paczek, „klejenie” (czas = stały + zależny od odległości/dostaw).

**Transport**  
- **Depot/Loader** przy koloniach – punkt automatycznych zrzutów/załadunków, priorytety (💧, 🌱, 🪨…).  
- **Szlaki** – w UI możesz „pomalować” trasę; Trail Post utrzymuje ją profilami (zwykły/✨ slick/🧂 sticky).  
- **Auto‑routy** – proste zlecenia: „Carrier #7: Kolonia A ↔ B (cykl)”.

---

## 4) Budynki — katalog (Tier‑1 / wczesna kampania)

> Koszty przykładowe – spójne z systemem zasobów: 💧 Water, 🌱 Grass, 🪨 Lime, 🌾 Fibers, 🍄 Fungi, 🧂 Salt, ✨ Crystal Slime.

| Budynek | Rola | Koszt | Upkeep | Efekt |
|---|---|---|---|---|
| **Storage Nest** | Lokalny magazyn, szybszy rozładunek | 🌾×3 | — | +pojemność, −opóźnienie rozładunku |
| **Water Collector** | Pasywny drip 💧 (blisko kałuż) | 🌾×2 + 💧×5 | — | +💧/min (bonus w deszczu) |
| **Chewer Pit (Żujnia)** | Craft 3×🌱 → 1×🌾 | 🌾×2 | — | Automatyczne włókna |
| **Shell Grinder** | 2×🪨 → 1× płytka | 🪨×2 + 🌾×1 | — | Ułatwia upgrade Shell II/III |
| **Trail Post** | Utrzymanie śladów (profil zwykły/✨/🧂) | ✨×1 + 🌾×2 (dla ✨) | ✨/🧂 mikro‑koszt | Tańszy ruch, kontrola korytarzy |
| **Relay Beacon** | Wzmocnienie AI Sync/zasięgu rozkazów | 🍄×2 + ✨×1 | — | Lepsze pathing/komendy |
| **Salt Trap** | Spowolnienie wrogów, drain 💧 | (ładunek z 🧂+💧) | ładunki | Aura: −25% prędkości, 0.05💧/s |
| **Watch Mound (Sentry)** | Wizja/wykrywanie | 🍄×1 + 🌾×1 | — | Alarm, zasięg widzenia |
| **Hatchery (Larva)** | Produkcja larw (core) | 🌱×5 + 💧×5 / larwa | — | Nowe jednostki |
| **Clinic (Heal Pool)** | Leczenie/regeneracja | 💧×8 + 🍄×1 | 💧 mały | Szybkie leczenie, pasożyty off |
| **Light Workshop** | Upgrade partów I→II „w terenie” | 🌾×2 + 🪨×1 | — | Usprawnia rozwój bez powrotu |

---

## 5) Synergie z rozwojem ślimaków

- **Relay Beacon** + **Head II/III** → większy zasięg i stabilność komend.  
- **Trail Post (✨)** + **Leg II** → logistyka: −koszt 💧, +prędkość.  
- **Shell Grinder** → tańsze Carrier/Guard (Shell II/III).  
- **Clinic** → wspiera buildy „heavy” (Armored/Heavy), bo kompensuje droższy ruch leczeniem.

---

## 6) UI/UX kolonii (wymagania)

- **Karta kolonii**: poziom, radius (okrąg na mapie), sloty budynków, bilans 💧/min, kolejka budów/upgrade’ów.  
- **Priorytety logistyki**: suwak/checkboxy (💧>🌱>🪨>🍄>🌾>🧂>✨), limit Carrierów przypisanych.  
- **Panel szlaków**: profil śladów (zwykły/✨/🧂), promień autoodświeżania, koszty utrzymania.  
- **Alerty**: „kolonia wysycha”, „przeciążenie”, „brak ładunków do utrzymania śladów”, „wrogie slugi w radiusie”.

---

## 7) Liczby startowe (proponowane)

- **Radius L1/L2/L3/L4/L5:** 6 / 8 / 10 / 12 / 14.  
- **Sloty budynków:** 2 / 3 / 4 / 5 / 6.  
- **Upkeep kolonii:** −💧 0.1 / aktywny ślimak w radiusie / min.  
- **Trail Post (✨):** −✨ 0.01 / 10 heksów / min (utrzymanie); zwykły ślad bez kosztu, ale szybciej zanika.  
- **Salt Trap:** aura spowolnienia −25% i „drain” 0.05 💧/s wrogom.

---

## 8) Proste reguły balansujące

- **Cap jednostek „serwisowanych” per kolonia** (np. 8, 12, 16, 20, 24 dla L1…L5).  
- **Diminishing returns** na wielu Trail Postach w jednej strefie.  
- **Pogoda**: deszcz buffuje Water Collector, ale szybciej zmywa ślady bez ✨.  
- **Rekalkulacja radiusu** przy stanie „Wyschnięta/Przeciążona” (feedback w HUD).

---

## 9) MVP (zakres na start)

1. **Kolonia L1**: radius, 2 sloty, Storage Nest + Water Collector.  
2. **Budowa** przez Workera, **auto‑zrzut** ładunku w radiusie.  
3. **Trail Post (zwykły)** i utrzymanie śladów w promieniu.  
4. **Clinic** (leczenie) + **Light Workshop** (upgrade I→II na miejscu).  
5. **Salt Trap** (spowolnienie + drain).  
6. **UI kolonii**: priorytety logistyki, kolejka budów, alerty.

---

## 10) Mini‑model danych (pod implementację)

```json
{
  "colony": {
    "level": 1,
    "radius_by_level": [6,8,10,12,14],
    "building_slots_by_level": [2,3,4,5,6],
    "upkeep_per_snail_water_per_min": 0.1
  },
  "buildings": {
    "storage_nest": {"cost":{"fibers":3}},
    "water_collector": {"cost":{"fibers":2,"water":5}},
    "chewer_pit": {"cost":{"fibers":2}, "craft":{"grass":3,"out":"fibers","out_qty":1}},
    "shell_grinder": {"cost":{"lime":2,"fibers":1}, "craft":{"lime":2,"out":"shell_plate","out_qty":1}},
    "trail_post": {"cost":{"crystal_slime":1,"fibers":2}, "profile":["normal","slick","sticky"]},
    "relay_beacon": {"cost":{"fungi":2,"crystal_slime":1}},
    "salt_trap": {"cost":{"salt_charge":1},"effect":{"slow":0.25,"drain_water_per_sec":0.05}},
    "watch_mound": {"cost":{"fungi":1,"fibers":1}},
    "hatchery": {"larva_cost":{"grass":5,"water":5}},
    "clinic": {"cost":{"water":8,"fungi":1}},
    "light_workshop": {"cost":{"fibers":2,"lime":1}}
  }
}
```

---

## 11) Zadanie dla Codexa (skrót)

- Model **Colony** (poziom, radius, sloty, bilans 💧, stany: Zakładanie/Aktywna/Wyschnięta/Przeciążona/Porzucona).  
- System **Budowy** (kolejka, koszty, czasy, dostawy przez Workery/Carriery).  
- **Trail Post**: utrzymanie śladów wg profili; koszty.  
- **Relay Beacon**: buff do AI Sync i zasięgu rozkazów.  
- **Salt Trap**: aura, tick drain i spowolnienie.  
- UI kolonii (karta, priorytety logistyki, alerty) + eventy (zmiana stanu, awans, przeciążenie).
