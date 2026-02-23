import Phaser from "phaser";
import { Client, Room } from "colyseus.js";
import {
  DEFAULT_PARAMS,
  moistureBand,
  tileIndex,
  terrainColor,
  type Terrain,
} from "@snail/shared";

interface TileState {
  terrain: Terrain;
  water: number;
  biomass: number;
  slime: number;
}

interface WorkerState {
  id: number;
  owner: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  moving: boolean;
  hydration: number;
  carryBiomass: number;
  carryWater: number;
  carryCapacity: number;
  baseId: number;
  alive: boolean;
  task: "idle" | "manual" | "pioneer" | "convoy" | "maintenance" | "dead";
}

interface ColonyState {
  id: number;
  type: "base" | "colony";
  x: number;
  y: number;
  water: number;
  biomass: number;
  active: boolean;
  buildTicksRemaining: number;
  upkeepTicksRemaining: number;
  dormantTicks: number;
}

interface GameState {
  width: number;
  height: number;
  moisture: number;
  tick: number;
  tiles: unknown;
  workers: unknown;
  colonies: unknown;
  activeColonies: number;
  requiredColonies: number;
  sustainTicks: number;
  sustainRequiredTicks: number;
  result: "" | "Victory" | "Defeat";
  collapseCount: number;
}

const TILE = 36;
const ORIGIN_X = 40;
const ORIGIN_Y = 70;

function setDomStatus(text: string, color = "#f5e8a8"): void {
  const el = document.getElementById("connection-status");
  if (!el) {
    return;
  }
  el.textContent = text;
  el.style.color = color;
}

function safeNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function getCollectionLength(value: unknown): number {
  if (!value || typeof value !== "object") {
    return 0;
  }

  const withLength = value as { length?: unknown };
  if (typeof withLength.length === "number") {
    return withLength.length;
  }

  const withSize = value as { size?: unknown };
  if (typeof withSize.size === "number") {
    return withSize.size;
  }

  return 0;
}

function toArray<T>(collection: unknown): T[] {
  if (!collection) {
    return [];
  }
  if (Array.isArray(collection)) {
    return collection;
  }

  const length = getCollectionLength(collection);
  if (length <= 0) {
    return [];
  }

  const out: T[] = [];
  const indexed = collection as { [index: number]: T };
  for (let i = 0; i < length; i++) {
    const item = indexed[i];
    if (item !== undefined) {
      out.push(item);
    }
  }
  return out;
}

function hasRenderableState(state: GameState | null | undefined): state is GameState {
  if (!state) {
    return false;
  }

  const width = safeNumber((state as { width?: unknown }).width, 0);
  const height = safeNumber((state as { height?: unknown }).height, 0);
  const tilesLength = getCollectionLength((state as { tiles?: unknown }).tiles);

  return width > 0 && height > 0 && tilesLength >= width * height;
}

function distSq(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

function formatClock(totalSeconds: number): string {
  const sec = Math.max(0, Math.floor(totalSeconds));
  const mm = Math.floor(sec / 60);
  const ss = sec % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

async function connectWithTimeout(
  client: Client,
  roomName: string,
  ms: number,
): Promise<Room<GameState>> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms);
  });
  return Promise.race([client.joinOrCreate<GameState>(roomName), timeout]);
}

class GameScene extends Phaser.Scene {
  private room: Room<GameState> | null = null;
  private hasStateSync = false;
  private selectedWorkerId: number | null = null;
  private lastWaitingLogAt = 0;

  private worldLayer!: Phaser.GameObjects.Container;
  private hud!: Phaser.GameObjects.Text;
  private status!: Phaser.GameObjects.Text;

  private tileRects: Phaser.GameObjects.Rectangle[] = [];
  private slimeRects: Phaser.GameObjects.Rectangle[] = [];
  private biomassMarkers: Phaser.GameObjects.Arc[] = [];
  private waterMarkers: Phaser.GameObjects.Arc[] = [];

  private workerGraphics = new Map<number, Phaser.GameObjects.Arc>();
  private colonyGraphics = new Map<number, Phaser.GameObjects.Rectangle>();
  private colonyLabels = new Map<number, Phaser.GameObjects.Text>();
  private selectionRing!: Phaser.GameObjects.Arc;

  private isPanning = false;
  private showSlimeHeatmap = true;
  private autoMode = true;

  constructor() {
    super("game");
  }

  preload(): void {
    setDomStatus("Connecting...", "#f5e8a8");

    this.status = this.add.text(16, 16, "Connecting...", {
      color: "#f5e8a8",
      fontSize: "16px",
    });

    this.hud = this.add.text(16, 40, "", {
      color: "#d7e7f5",
      fontSize: "14px",
    });

    this.status.setScrollFactor(0);
    this.hud.setScrollFactor(0);
  }

  async create(): Promise<void> {
    this.worldLayer = this.add.container(0, 0);
    this.input.mouse?.disableContextMenu();
    this.input.setDefaultCursor("crosshair");

    this.selectionRing = this.add.circle(0, 0, 14, 0x000000, 0);
    this.selectionRing.setStrokeStyle(2, 0xff6b6b);
    this.selectionRing.setVisible(false);
    this.worldLayer.add(this.selectionRing);

    await this.connect();

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown() || pointer.event.shiftKey) {
        this.isPanning = true;
        this.input.setDefaultCursor("grabbing");
      }
    });

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!this.isPanning || !pointer.isDown) {
        return;
      }
      const camera = this.cameras.main;
      camera.scrollX -= (pointer.x - pointer.prevPosition.x) / camera.zoom;
      camera.scrollY -= (pointer.y - pointer.prevPosition.y) / camera.zoom;
    });

    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      if (this.isPanning) {
        this.isPanning = false;
        this.input.setDefaultCursor("crosshair");
        return;
      }

      if (pointer.button !== 0 || !this.room || !this.hasStateSync) {
        return;
      }

      this.handleLeftClick(pointer);
    });

    this.input.on(
      "wheel",
      (pointer: Phaser.Input.Pointer, _g: unknown, _dx: number, dy: number) => {
        const camera = this.cameras.main;
        const oldZoom = camera.zoom;
        const nextZoom = Phaser.Math.Clamp(oldZoom * (dy > 0 ? 0.9 : 1.1), 0.6, 2.4);
        if (Math.abs(nextZoom - oldZoom) < 0.0001) {
          return;
        }

        const before = camera.getWorldPoint(pointer.x, pointer.y);
        camera.setZoom(nextZoom);
        const after = camera.getWorldPoint(pointer.x, pointer.y);
        camera.scrollX += before.x - after.x;
        camera.scrollY += before.y - after.y;
      },
    );

    this.input.keyboard?.on("keydown-N", () => {
      this.room?.send("spawn_worker", {});
    });

    this.input.keyboard?.on("keydown-B", () => {
      if (this.selectedWorkerId != null) {
        this.room?.send("build_colony", { workerId: this.selectedWorkerId });
      }
    });

    this.input.keyboard?.on("keydown-TAB", (event: KeyboardEvent) => {
      event.preventDefault();
      this.cycleWorkerSelection();
    });

    this.input.keyboard?.on("keydown-H", () => {
      this.showSlimeHeatmap = !this.showSlimeHeatmap;
    });

    this.input.keyboard?.on("keydown-A", () => {
      this.autoMode = !this.autoMode;
      this.room?.send("set_auto_mode", { enabled: this.autoMode });
    });

    this.scale.on("resize", (gameSize: Phaser.Structs.Size) => {
      this.cameras.main.setSize(gameSize.width, gameSize.height);
    });
  }

  update(): void {
    const state = this.room?.state;
    if (!state) {
      return;
    }

    if (!this.hasStateSync && hasRenderableState(state)) {
      this.hasStateSync = true;
      this.status.setText("Connected + state sync");
      this.status.setColor("#8ce99a");
      setDomStatus("Connected + state sync", "#8ce99a");
      this.centerCamera(state);
    }

    if (!this.hasStateSync) {
      const now = performance.now();
      if (now - this.lastWaitingLogAt > 1500) {
        this.lastWaitingLogAt = now;
        const msg = `Connected, waiting state... w:${safeNumber((state as { width?: unknown }).width, -1)} h:${safeNumber((state as { height?: unknown }).height, -1)} tiles:${getCollectionLength((state as { tiles?: unknown }).tiles)}`;
        this.status.setText(msg);
        setDomStatus(msg, "#f5e8a8");
      }
      return;
    }

    const tiles = toArray<TileState>(state.tiles);
    const workers = toArray<WorkerState>(state.workers);
    const colonies = toArray<ColonyState>(state.colonies);

    if (tiles.length < state.width * state.height) {
      return;
    }

    this.ensureCameraBounds(state);
    this.renderMap(state, tiles);
    this.syncColonies(colonies);
    this.syncWorkers(workers);
    this.ensureSelectedWorker(workers);
    this.updateSelectionRing(workers);
    this.updateHud(state, workers, colonies, tiles);
  }

  private async connect(): Promise<void> {
    const defaultByHost =
      window.location.protocol === "https:"
        ? `wss://${window.location.hostname}:2567`
        : `ws://${window.location.hostname}:2567`;

    const candidates = import.meta.env.VITE_SERVER_URL
      ? [import.meta.env.VITE_SERVER_URL as string]
      : Array.from(
          new Set([defaultByHost, "ws://localhost:2567", "ws://127.0.0.1:2567"]),
        );

    let lastError = "unknown";

    for (const endpoint of candidates) {
      try {
        this.hasStateSync = false;
        const client = new Client(endpoint);

        this.status.setText(`Connecting: ${endpoint}`);
        this.status.setColor("#f5e8a8");
        setDomStatus(`Connecting: ${endpoint}`, "#f5e8a8");
        console.log("[snail-client] connecting", endpoint);

        this.room = await connectWithTimeout(client, "snail", 8000);
        console.log("[snail-client] joined", this.room.roomId, endpoint);

        this.status.setText(`Connected: ${endpoint}`);
        this.status.setColor("#8ce99a");
        setDomStatus(`Connected: ${endpoint}`, "#8ce99a");

        this.room.onStateChange((nextState) => {
          if (!this.hasStateSync && hasRenderableState(nextState)) {
            this.hasStateSync = true;
            this.centerCamera(nextState);
            this.status.setText(`Connected + state sync: ${endpoint}`);
            this.status.setColor("#8ce99a");
            setDomStatus(`Connected + state sync: ${endpoint}`, "#8ce99a");
          }
        });

        this.room.onError((code, message) => {
          const msg = `Room error ${code}: ${message ?? "unknown"}`;
          this.status.setText(msg);
          this.status.setColor("#ff8787");
          setDomStatus(msg, "#ff8787");
          console.error("[snail-client]", msg);
        });

        this.room.onLeave((code, reason) => {
          const msg = `Disconnected (${code}) ${reason ?? ""}`.trim();
          this.status.setText(msg);
          this.status.setColor("#ff8787");
          setDomStatus(msg, "#ff8787");
          console.warn("[snail-client]", msg);
        });

        this.room.send("set_auto_mode", { enabled: this.autoMode });

        return;
      } catch (error) {
        lastError = String(error);
        console.warn("[snail-client] connect failed", endpoint, error);
      }
    }

    const finalError = `Connection error: ${lastError}`;
    this.status.setText(finalError);
    this.status.setColor("#ff8787");
    setDomStatus(finalError, "#ff8787");
  }

  private handleLeftClick(pointer: Phaser.Input.Pointer): void {
    if (!this.room) {
      return;
    }

    const state = this.room.state;
    const workers = toArray<WorkerState>(state.workers);
    const ownWorkers = workers.filter(
      (worker) => worker.owner === this.room?.sessionId && worker.alive,
    );

    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

    let nearest: WorkerState | null = null;
    let nearestDist = Infinity;
    for (const worker of ownWorkers) {
      const wx = ORIGIN_X + worker.x * TILE + TILE / 2;
      const wy = ORIGIN_Y + worker.y * TILE + TILE / 2;
      const d = distSq(worldPoint.x, worldPoint.y, wx, wy);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = worker;
      }
    }

    if (nearest && nearestDist <= 14 * 14) {
      this.selectedWorkerId = nearest.id;
      return;
    }

    const tx = Math.floor((worldPoint.x - ORIGIN_X) / TILE);
    const ty = Math.floor((worldPoint.y - ORIGIN_Y) / TILE);
    if (tx < 0 || ty < 0 || tx >= state.width || ty >= state.height) {
      return;
    }

    if (this.selectedWorkerId != null) {
      this.room.send("move_worker", {
        workerId: this.selectedWorkerId,
        x: tx,
        y: ty,
      });
    }
  }

  private renderMap(state: GameState, tiles: TileState[]): void {
    const count = state.width * state.height;

    if (this.tileRects.length !== count) {
      this.tileRects.forEach((r) => r.destroy());
      this.slimeRects.forEach((r) => r.destroy());
      this.biomassMarkers.forEach((r) => r.destroy());
      this.waterMarkers.forEach((r) => r.destroy());

      this.tileRects = [];
      this.slimeRects = [];
      this.biomassMarkers = [];
      this.waterMarkers = [];

      for (let y = 0; y < state.height; y++) {
        for (let x = 0; x < state.width; x++) {
          const px = ORIGIN_X + x * TILE;
          const py = ORIGIN_Y + y * TILE;

          const tileRect = this.add.rectangle(px, py, TILE - 2, TILE - 2, 0x22303a);
          tileRect.setOrigin(0, 0);
          this.worldLayer.add(tileRect);
          this.tileRects.push(tileRect);

          const slimeRect = this.add.rectangle(px, py, TILE - 10, TILE - 10, 0x86efac);
          slimeRect.setOrigin(0, 0);
          slimeRect.setVisible(false);
          this.worldLayer.add(slimeRect);
          this.slimeRects.push(slimeRect);

          const biomassMarker = this.add.circle(px + 8, py + 8, 4, 0x8ce99a);
          biomassMarker.setVisible(false);
          this.worldLayer.add(biomassMarker);
          this.biomassMarkers.push(biomassMarker);

          const waterMarker = this.add.circle(px + TILE - 8, py + 8, 4, 0x74c0fc);
          waterMarker.setVisible(false);
          this.worldLayer.add(waterMarker);
          this.waterMarkers.push(waterMarker);
        }
      }
    }

    for (let y = 0; y < state.height; y++) {
      for (let x = 0; x < state.width; x++) {
        const i = tileIndex(state.width, x, y);
        const tile = tiles[i];
        if (!tile) {
          continue;
        }

        const tileRect = this.tileRects[i];
        tileRect.setFillStyle(terrainColor(tile.terrain));
        tileRect.setStrokeStyle(1, 0x0f141a, 0.45);

        const slimeRect = this.slimeRects[i];
        slimeRect.setVisible(this.showSlimeHeatmap && tile.slime > 0.01);
        slimeRect.setAlpha(Math.min(0.75, tile.slime));

        const biomass = this.biomassMarkers[i];
        biomass.setVisible(tile.biomass > 0);
        if (tile.biomass > 0) {
          biomass.setRadius(Math.min(6, 3 + tile.biomass * 0.3));
        }

        const water = this.waterMarkers[i];
        water.setVisible(tile.water > 0);
        if (tile.water > 0) {
          water.setRadius(Math.min(6, 3 + tile.water * 0.3));
        }
      }
    }
  }

  private syncWorkers(workers: WorkerState[]): void {
    const aliveIds = new Set(workers.map((w) => w.id));

    for (const [id, graphic] of this.workerGraphics.entries()) {
      if (!aliveIds.has(id)) {
        graphic.destroy();
        this.workerGraphics.delete(id);
      }
    }

    for (const worker of workers) {
      let graphic = this.workerGraphics.get(worker.id);
      if (!graphic) {
        graphic = this.add.circle(0, 0, 10, 0xf5d76e);
        graphic.setStrokeStyle(2, 0x1c2833);
        this.worldLayer.add(graphic);
        this.workerGraphics.set(worker.id, graphic);
      }

      graphic.x = ORIGIN_X + worker.x * TILE + TILE / 2;
      graphic.y = ORIGIN_Y + worker.y * TILE + TILE / 2;

      const isOwn = worker.owner === this.room?.sessionId;
      const isSelected = worker.id === this.selectedWorkerId;

      if (!worker.alive) {
        graphic.setFillStyle(0x868e96, 0.8);
      } else if (worker.task === "pioneer") {
        graphic.setFillStyle(0xffa94d, 1);
      } else if (worker.task === "maintenance") {
        graphic.setFillStyle(0x63e6be, 1);
      } else if (worker.task === "convoy") {
        graphic.setFillStyle(0x4dabf7, 1);
      } else if (isSelected) {
        graphic.setFillStyle(0xff6b6b, 1);
      } else if (isOwn) {
        graphic.setFillStyle(0xf5d76e, 1);
      } else {
        graphic.setFillStyle(0x74c0fc, 1);
      }
    }
  }

  private syncColonies(colonies: ColonyState[]): void {
    const ids = new Set(colonies.map((c) => c.id));

    for (const [id, marker] of this.colonyGraphics.entries()) {
      if (!ids.has(id)) {
        marker.destroy();
        this.colonyGraphics.delete(id);
      }
    }

    for (const [id, label] of this.colonyLabels.entries()) {
      if (!ids.has(id)) {
        label.destroy();
        this.colonyLabels.delete(id);
      }
    }

    for (const colony of colonies) {
      let marker = this.colonyGraphics.get(colony.id);
      if (!marker) {
        marker = this.add.rectangle(0, 0, TILE - 6, TILE - 6, 0xffffff, 0.25);
        marker.setOrigin(0, 0);
        this.worldLayer.add(marker);
        this.colonyGraphics.set(colony.id, marker);
      }

      let label = this.colonyLabels.get(colony.id);
      if (!label) {
        label = this.add.text(0, 0, "", {
          color: "#f8f9fa",
          fontSize: "11px",
        });
        this.worldLayer.add(label);
        this.colonyLabels.set(colony.id, label);
      }

      marker.x = ORIGIN_X + colony.x * TILE + 3;
      marker.y = ORIGIN_Y + colony.y * TILE + 3;

      if (colony.buildTicksRemaining > 0) {
        marker.setFillStyle(0x748ffc, 0.45);
      } else if (colony.active) {
        marker.setFillStyle(0x69db7c, 0.35);
      } else {
        marker.setFillStyle(0xff8787, 0.35);
      }

      if (colony.type === "base") {
        marker.setStrokeStyle(2, 0xffe066);
      } else {
        marker.setStrokeStyle(1, 0xdee2e6);
      }

      label.x = marker.x + 2;
      label.y = marker.y + 2;
      if (colony.type === "base") {
        label.setText("BASE");
      } else if (colony.buildTicksRemaining > 0) {
        const sec = colony.buildTicksRemaining / DEFAULT_PARAMS.tickRate;
        label.setText(`B:${sec.toFixed(0)}s`);
      } else if (colony.active) {
        label.setText("ACTIVE");
      } else {
        const collapseSec = Math.max(
          0,
          DEFAULT_PARAMS.upkeep.dormantCollapseSeconds -
            colony.dormantTicks / DEFAULT_PARAMS.tickRate,
        );
        label.setText(`D:${collapseSec.toFixed(0)}s`);
      }
    }
  }

  private ensureSelectedWorker(workers: WorkerState[]): void {
    const ownAlive = workers.filter(
      (worker) => worker.owner === this.room?.sessionId && worker.alive,
    );

    if (ownAlive.length === 0) {
      this.selectedWorkerId = null;
      return;
    }

    if (!ownAlive.find((worker) => worker.id === this.selectedWorkerId)) {
      this.selectedWorkerId = ownAlive[0].id;
    }
  }

  private cycleWorkerSelection(): void {
    if (!this.room) {
      return;
    }

    const workers = toArray<WorkerState>(this.room.state.workers).filter(
      (worker) => worker.owner === this.room?.sessionId && worker.alive,
    );
    if (workers.length === 0) {
      this.selectedWorkerId = null;
      return;
    }

    if (this.selectedWorkerId == null) {
      this.selectedWorkerId = workers[0].id;
      return;
    }

    const idx = workers.findIndex((worker) => worker.id === this.selectedWorkerId);
    const next = workers[(idx + 1) % workers.length] ?? workers[0];
    this.selectedWorkerId = next.id;
  }

  private updateSelectionRing(workers: WorkerState[]): void {
    if (this.selectedWorkerId == null) {
      this.selectionRing.setVisible(false);
      return;
    }

    const worker = workers.find((w) => w.id === this.selectedWorkerId && w.alive);
    if (!worker) {
      this.selectionRing.setVisible(false);
      return;
    }

    this.selectionRing.setVisible(true);
    this.selectionRing.x = ORIGIN_X + worker.x * TILE + TILE / 2;
    this.selectionRing.y = ORIGIN_Y + worker.y * TILE + TILE / 2;
    this.worldLayer.bringToTop(this.selectionRing);
  }

  private updateHud(
    state: GameState,
    workers: WorkerState[],
    colonies: ColonyState[],
    tiles: TileState[],
  ): void {
    const selected = workers.find((w) => w.id === this.selectedWorkerId) ?? null;
    const ownAlive = workers.filter((w) => w.owner === this.room?.sessionId && w.alive).length;

    const base = colonies.find((c) => c.type === "base");
    const activeColonies = state.activeColonies;
    const sustainSeconds = state.sustainTicks / DEFAULT_PARAMS.tickRate;
    const sustainRequiredSeconds = state.sustainRequiredTicks / DEFAULT_PARAMS.tickRate;
    const moisture = safeNumber(state.moisture);
    const band = moistureBand(moisture, DEFAULT_PARAMS.moisture.thresholds);
    const selectedTile =
      selected != null
        ? tiles[tileIndex(state.width, Math.floor(selected.x), Math.floor(selected.y))]
        : undefined;
    const slimeBoost = selectedTile && selectedTile.slime > 0.3 ? "ON" : "OFF";
    const hydrationRatio = selected
      ? Phaser.Math.Clamp(
          selected.hydration / Math.max(0.0001, DEFAULT_PARAMS.worker.hydrationMax),
          0,
          1,
        )
      : 0;
    const hydrationBars = 12;
    const filled = Math.round(hydrationRatio * hydrationBars);
    const hydrationBar = `[${"#".repeat(filled)}${"-".repeat(hydrationBars - filled)}]`;

    const lines = [
      `Tick: ${safeNumber(state.tick).toFixed(0)} | Moisture: ${moisture.toFixed(1)} (${band})`,
      `Workers alive (you): ${ownAlive} | Total workers: ${workers.filter((w) => w.alive).length}`,
      `Base stock: W ${safeNumber(base?.water).toFixed(1)} | B ${safeNumber(base?.biomass).toFixed(1)}`,
      `Goal: ${activeColonies}/${state.requiredColonies} active colonies | sustain ${formatClock(sustainSeconds)}/${formatClock(sustainRequiredSeconds)}`,
      `Result: ${state.result || "In progress"} | Collapses: ${safeNumber(state.collapseCount).toFixed(0)}`,
      selected
        ? `Selected #${selected.id} [${selected.task}] H:${selected.hydration.toFixed(2)} ${hydrationBar} Slime boost:${slimeBoost} Carry(B:${selected.carryBiomass.toFixed(1)} W:${selected.carryWater.toFixed(1)}) Base:${selected.baseId}`
        : "Selected: none",
      `Auto mode: ${this.autoMode ? "ON" : "OFF"} | Slime heatmap: ${this.showSlimeHeatmap ? "ON" : "OFF"}`,
      "LPM select/move | PPM lub Shift+drag kamera | Kolo zoom | N spawn | B colony | TAB cycle | A auto | H heatmap",
    ];

    this.hud.setText(lines.join("\n"));
  }

  private centerCamera(state: GameState): void {
    const camera = this.cameras.main;
    camera.setZoom(1);
    const centerX = ORIGIN_X + (state.width * TILE) / 2;
    const centerY = ORIGIN_Y + (state.height * TILE) / 2;
    camera.centerOn(centerX, centerY);
    this.ensureCameraBounds(state);
  }

  private ensureCameraBounds(state: GameState): void {
    const camera = this.cameras.main;
    const pad = 360;
    camera.setBounds(
      ORIGIN_X - pad,
      ORIGIN_Y - pad,
      state.width * TILE + pad * 2,
      state.height * TILE + pad * 2,
      true,
    );
  }
}

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "app",
  backgroundColor: "#10171d",
  scene: [GameScene],
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: window.innerWidth,
    height: window.innerHeight,
  },
});

window.addEventListener("resize", () => {
  game.scale.resize(window.innerWidth, window.innerHeight);
});
