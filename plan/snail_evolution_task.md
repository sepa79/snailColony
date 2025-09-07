# Task: Implement Snail Evolution System

## Goal
Introduce a **unit progression system** where each snail can evolve by upgrading its body parts instead of training predefined unit types.

---

## Concept

- Every snail starts as **Larva (Level 0)** with:
  - Head I (Basic Brain)
  - Leg I (Basic Leg)
  - Tiny Shell (optional, default minimal storage)

- Snails have **5 parts (slots)**:
  1. 🧠 Head (Brain/Processor)
  2. 🦶 Leg (Movement)
  3. 🐚 Shell (Storage/Armor)
  4. 👀 Antennae (Sensors)
  5. 💧 Gland/Mouth (Trail / Gather / Combat)

- Each part has **3 levels of progression** (I → II → III).  
- At any given time, a snail can have only a limited number of parts **unlocked**.  
- Additional slots unlock via **quests, victories, or survival across scenarios**.

---

## Progression Rules

- **Max level per scenario**:
  - Scenario 1 → max Level 3
  - Scenario 2 → max Level 4 (if snail survives)
  - Scenario 3 → max Level 5
  - Scenario 4 → max Level 6  
  (etc., scaling with campaign progress)

- **Death = permanent loss** of invested parts and progress.  
- **Survival = growth** → long-lived snails become veterans.

---

## Example Parts

### Head
- I: Basic Brain → can follow simple commands
- II: Enhanced Brain → faster reaction, better pathing
- III: Autonomous Brain → limited AI decisions (auto-gather/patrol)

### Leg
- I: Basic Leg → slow crawl
- II: Swift Leg → faster, lower storage
- III: Heavy Leg → slower, but resistant to terrain, more carry weight

### Shell
- I: Tiny Shell → minimal storage
- II: Carrier Shell → large storage
- III: Armored Shell → less storage, more defense

### Antennae
- I: Short → minimal detection
- II: Scout → finds resources, detects enemies
- III: Navigator → reduces errors, optimizes pathing

### Gland/Mouth
- I: Basic Gland → leaves normal trail
- II: Slick → speeds up allies
- III: Sticky → slows enemies

---

## UI Requirements

- Each snail should have a **unit panel** showing:
  - Level (stars or bar)
  - Age (scenarios survived)
  - 5 part slots (with icons, locked/unlocked state)
  - Stats summary (Speed, Storage, Defense, AI Sync)

- Example:

```
🐌 Snail #3 (Veteran)  
Level: 4 / 4 ⭐⭐⭐⭐  
Age: 2 scenarios survived  

Parts:  
🧠 Head: Enhanced Brain II  
🦶 Leg: Swift Leg II  
🐚 Shell: Carrier Shell I  
👀 Antennae: Scout Antennae I  
💧 Gland: Locked  

Stats:  
Speed ++ | Storage +++ | Defense + | AI Sync ++
```

---

## Deliverables

1. **Data model** for snail parts, levels, and progression.  
2. **Mechanics** for:
   - Upgrading parts
   - Unlocking new slots after scenario completion
   - Handling snail death and loss of progress
3. **UI implementation** for snail panel.  
4. **Integration with campaign system** (max level per scenario).
