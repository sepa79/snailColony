# Plan

This document outlines the long-term goals for the SnailColony project. It mirrors the original task specification provided by the stakeholders.

## Original Task

SnailColony — bootstrap (server-authoritative, WS + AMQP)

Ten plik jest **jedynym zadaniem** dla Codex. Zrób wszystko automatycznie wg specyfikacji poniżej.
Cel: postawić szkielet gry webowej “SnailColony” (klient React+Pixi, serwer Node/Nest, tick loop ECS) z działającym PoC: dwaj gracze w jednym pokoju, ruch ślimaków, zużycie wody na suchym, zbiór trawy/wody, zakładanie kolonii, prosty scoring. **UI na porcie 80**. Klient może połączyć się do dowolnego serwera przez URL.

---

## 0) Technologia i zasady

**Klient:**
- React + Vite, TypeScript.
- Render: PixiJS (+ `@inlet/react-pixi`), UI: Tailwind.
- Stan UI: Zustand (lekki).
- Sieć: WebSocket (native) + automatyczny reconnect.
- Serializacja: JSON (łatwy start), interfejsy TS.
- Mapowanie klawiszy: WASD/strzałki — ruch kursora/selektor, kliki myszą — komendy.
- Build prod: `vite build`.

**Serwer:**
- Node 20+, NestJS (REST + WS Gateway).
- ECS: `bitecs` — systemy: Movement, Hydration, Harvest, Colonization, Scoring.
- Tick: 10 TPS (100 ms), snapshot co 5 ticków (delta w przyszłości).
- Redis: presence/pokoje/cache.
- Postgres: gracze, leaderboard, definicje map/biomów, minimalnie: tabele `player`, `match`, `map`.
- RabbitMQ: metryki/zdarzenia (`game.events`), AI stub (`ai.commands`/`ai.actions`), admin (`admin.control`).
- Logi: pino, OpenTelemetry exporter → Loki/Prometheus (basic).

**DevOps:**
- Docker Compose: `gateway`, `game-engine` (może być w jednym serwisie na start jako `server`), `client`, `redis`, `postgres`, `rabbitmq`, `otel-collector`, `prometheus`, `grafana`, `loki`.
- UI nasłuchuje na **80**.
- Skrypty `make` lub `npm run` do: `dev`, `build`, `compose:up`, `compose:down`, `lint`, `test`.

**Konwencje:**
- Monorepo pn. `snailcolony/`.
- TypeScript strict.
- Bez zbędnych pytań — użyj sensownych defaultów.

---

## 1) Struktura repo

```
snailcolony/
  README.md
  docker-compose.yml
  .env.example
  package.json
  pnpm-workspace.yaml
  apps/
    client/                      
      index.html
      src/
        main.tsx
        app.tsx
        ui/                      
        net/                     
        game/                    
        assets/                  
      vite.config.ts
      tailwind.config.ts
      postcss.config.js
      package.json
    server/                      
      src/
        main.ts
        app.module.ts
        ws/
          gateway.module.ts
          gateway.service.ts
          messages.ts            
        ecs/
          world.ts               
          systems/
            movement.system.ts
            hydration.system.ts
            harvest.system.ts
            colonization.system.ts
            scoring.system.ts
        game/
          room.service.ts        
          map.service.ts         
        infra/
          redis.service.ts
          pg.service.ts
          amqp.service.ts
        rest/
          health.controller.ts
          lobby.controller.ts    
      ormconfig.ts
      package.json
  libs/
    protocol/                    
      src/index.ts
      package.json
  tools/
    scripts/
      seed-map.ts                
      create-leaderboard.ts
  .github/
    workflows/ci.yml
```

---

## 2) Docker Compose (minimalne usługi)

```yaml
version: "3.9"
services:
  client:
    build: ./apps/client
    container_name: snailcolony_client
    ports:
      - "80:80"
    environment:
      - VITE_SERVER_URL=ws://localhost:3000
    depends_on: [server]

  server:
    build: ./apps/server
    container_name: snailcolony_server
    ports:
      - "3000:3000"
    environment:
      - REDIS_URL=redis://redis:6379
      - PGHOST=postgres
      - PGUSER=snail
      - PGPASSWORD=snail
      - PGDATABASE=snailcolony
      - PGPORT=5432
      - AMQP_URL=amqp://guest:guest@rabbitmq:5672
      - TICK_RATE=10
    depends_on: [redis, postgres, rabbitmq]

  redis:
    image: redis:7-alpine
    container_name: snailcolony_redis
    ports: ["6379:6379"]

  postgres:
    image: postgres:16-alpine
    container_name: snailcolony_pg
    environment:
      - POSTGRES_USER=snail
      - POSTGRES_PASSWORD=snail
      - POSTGRES_DB=snailcolony
    ports: ["5432:5432"]
    volumes:
      - pgdata:/var/lib/postgresql/data

  rabbitmq:
    image: rabbitmq:3-management
    container_name: snailcolony_rabbit
    ports:
      - "5672:5672"
      - "15672:15672"

volumes:
  pgdata:
```

---

## 3) Zmienne środowiskowe

`.env.example`:

```
VITE_SERVER_URL=ws://localhost:3000
REDIS_URL=redis://localhost:6379
AMQP_URL=amqp://guest:guest@localhost:5672
PGHOST=localhost
PGUSER=snail
PGPASSWORD=snail
PGDATABASE=snailcolony
PGPORT=5432
TICK_RATE=10
```

---

## 4) Protokół sieciowy (JSON)

**Komendy od klienta**:

```ts
type ClientCommand =
  | { t: "JoinRoom"; roomId?: string; playerName: string }
  | { t: "MoveUnits"; unitIds: string[]; target: { x: number; y: number } }
  | { t: "FoundColony"; at: { x: number; y: number } }
  | { t: "Gather"; unitIds: string[]; resource: "water" | "grass" }
  | { t: "BuyUnit"; unit: "scout" | "worker"; count: number }
  | { t: "Ping"; nonce: number };
```

**Wiadomości do klienta**:

```ts
type ServerMessage =
  | { t: "Welcome"; playerId: string; roomId: string; seed: number }
  | { t: "RoomState"; tick: number; you: string; players: PlayerSummary[] }
  | { t: "Snapshot"; tick: number; entities: EntitySnapshot[] }
  | { t: "Event"; kind: "ColonyFounded" | "UnitDied" | "ResourceTick"; data: any }
  | { t: "Pong"; nonce: number; rtt: number }
  | { t: "Error"; code: string; msg: string };
```

---

## 5) ECS — systemy i tick

- **MovementSystem** — pozycje.
- **HydrationSystem** — zużycie wody, obrażenia przy 0.
- **HarvestSystem** — zbiór wody/trawy.
- **ColonizationSystem** — zakładanie kolonii.
- **ScoringSystem** — wynik.

Tick co 100ms, snapshot co 5 ticków.

---

## 6) REST/WS

- `GET /health`
- `POST /lobby/room`
- **WS** `/ws` — handshake + wymiana wiadomości.

---

## 7) RabbitMQ

- Exchange `game.events`
- Exchange `ai.commands` / `ai.actions`
- Exchange `admin.control`

---

## 8) Klient — HUD

- Widok mapy (grid, sprite’y).
- Panel zasobów.
- Klik/drag → zaznaczenie jednostek.
- Przyciski Gather / Found Colony / Buy Unit.
- Pole “Connect” do wpisania dowolnego URL serwera.

---

## 9) Kryteria akceptacji (PoC)

- UI na `http://localhost/` (80).
- Dwóch graczy w tym samym pokoju → widzą wspólny stan.
- Ruch po suchym terenie zużywa wodę → jednostki mogą umrzeć.
- Gather/Found Colony działają.
- Wynik rośnie.
- RabbitMQ publikuje zdarzenia.

---

## 10) Skrypty

```json
{
  "name": "snailcolony",
  "private": true,
  "workspaces": ["apps/*", "libs/*"],
  "scripts": {
    "dev": "concurrently -k \"pnpm --filter @snail/client dev\" \"pnpm --filter @snail/server start:dev\"",
    "build": "pnpm -r build",
    "lint": "pnpm -r lint",
    "test": "pnpm -r test",
    "compose:up": "docker compose up --build",
    "compose:down": "docker compose down -v"
  },
  "devDependencies": {
    "concurrently": "^9.0.0"
  }
}
```

---

## 11) Seed mapy

Prosty generator perlin/simplex → kafle `dry/wet/grass`. Rozmiar 128×128.

---

## 12) Observability

- `/health` z tickRate, roomsCount, playersCount.
- Prometheus `/metrics` (tick_duration_ms, ws_connections, room_count).
- Logi pino → Loki.

---

## 13) Bezpieczeństwo

- Walidacja wszystkich komend.
- Rate limit per gracz (Redis).
- Reconnect idempotentny.

---

## 14) Placeholdery

- Sprite’y: ślimak, kolonia, woda, trawa — proste figury.
- Kamera: pan/zoom.

---

## 15) Dalsze kroki

- Delta-compression.
- Fog-of-war.
- Boty AI.
- Leaderboard i replaye.
- Skalowanie serwerów.

---

## 16) Uruchomienie

```
bash
pnpm i
pnpm run compose:up
```

Otwórz `http://localhost/` → wpisz `ws://localhost:3000` → Connect.
Drugi klient w innej karcie → dołącz do tego samego `roomId`.

---

## 17) Commit

- `chore: scaffold SnailColony monorepo (client+server+compose)`
- `feat: PoC gameplay (move/hydration/gather/colony/score)`

---

## 18) Jakość

- TypeScript strict.
- ESLint + Prettier.
- Zero ostrzeżeń.
- README z instrukcją.

**Zrób wszystko powyżej.**
