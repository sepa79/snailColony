import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import {
  MapDef,
  TerrainType,
  WaterLayer,
  GrassLayer,
  Structure,
} from '@snail/protocol';

const TILE_W = 64;
const TILE_H = 32;

const terrainColors: Record<TerrainType, number> = {
  [TerrainType.Dirt]: 0x8b4513,
  [TerrainType.Mud]: 0x654321,
  [TerrainType.Sand]: 0xc2b280,
  [TerrainType.Rock]: 0x808080,
  [TerrainType.Brush]: 0x228b22,
  [TerrainType.Cliff]: 0x555555,
  [TerrainType.ShallowWaterBed]: 0x3a5fcd,
  [TerrainType.Road]: 0xa9a9a9,
};

const waterColors: Record<WaterLayer, number> = {
  [WaterLayer.None]: 0x000000,
  [WaterLayer.Puddle]: 0x1e90ff,
  [WaterLayer.Stream]: 0x0000ff,
  [WaterLayer.Full]: 0x000080,
};

const grassColors: Record<GrassLayer, number> = {
  [GrassLayer.None]: 0x000000,
  [GrassLayer.Sparse]: 0x7cfc00,
  [GrassLayer.Normal]: 0x32cd32,
  [GrassLayer.Dense]: 0x006400,
};

const structureColors: Record<Structure, number> = {
  [Structure.None]: 0x000000,
  [Structure.Colony]: 0xff00ff,
  [Structure.Bridge]: 0x8b4513,
};

const resourceColors = {
  biomass: 0x00ff00,
  water: 0x1e90ff,
};

interface MapViewProps {
  map: MapDef;
  entities: { id: number; x: number; y: number }[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onCommand: (cmd: { t: 'Move'; dx: number; dy: number }) => void;
  onColonySelect: (colony: { name: string; stars: number }) => void;
}

export function MapView({
  map,
  entities,
  selectedId,
  onSelect,
  onCommand,
  onColonySelect,
}: MapViewProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const cameraRef = useRef<PIXI.Container | null>(null);
  const entityLayerRef = useRef<PIXI.Container | null>(null);
  const highlightRef = useRef<PIXI.Graphics | null>(null);
  const entityRefs = useRef<Map<number, PIXI.Graphics>>(new Map());
  const snailClickRef = useRef(false);

  useEffect(() => {
    if (!rootRef.current) return;

    const app = new PIXI.Application({
      background: 0x222222,
      resizeTo: rootRef.current,
    });
    appRef.current = app;

    rootRef.current.appendChild(app.view as HTMLCanvasElement);

    const camera = new PIXI.Container();
    cameraRef.current = camera;
    app.stage.addChild(camera);

    // terrain batching
    const terrainLayers: Record<TerrainType, PIXI.Graphics> = {
      [TerrainType.Dirt]: new PIXI.Graphics(),
      [TerrainType.Mud]: new PIXI.Graphics(),
      [TerrainType.Sand]: new PIXI.Graphics(),
      [TerrainType.Rock]: new PIXI.Graphics(),
      [TerrainType.Brush]: new PIXI.Graphics(),
      [TerrainType.Cliff]: new PIXI.Graphics(),
      [TerrainType.ShallowWaterBed]: new PIXI.Graphics(),
      [TerrainType.Road]: new PIXI.Graphics(),
    };

    const waterLayer = new PIXI.Container();
    const grassLayer = new PIXI.Container();
    const structureLayer = new PIXI.Container();
    const slimeLayer = new PIXI.Container();
    const resourceLayer = new PIXI.Container();
    const highlight = new PIXI.Graphics();
    highlight.visible = false;
    highlightRef.current = highlight;
    const entityLayer = new PIXI.Container();
    entityLayerRef.current = entityLayer;
    camera.addChild(waterLayer, grassLayer, structureLayer, slimeLayer);

    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const tile = map.tiles[y * map.width + x];
        const px = (x - y) * (TILE_W / 2);
        const py = (x + y) * (TILE_H / 2);

        const g = terrainLayers[tile.terrain];
        g.beginFill(terrainColors[tile.terrain]);
        drawDiamond(g, px, py);
        g.endFill();

        if (tile.water !== WaterLayer.None) {
          const wg = new PIXI.Graphics();
          wg.beginFill(waterColors[tile.water], 0.6);
          drawDiamond(wg, px, py);
          wg.endFill();
          if (tile.water === WaterLayer.Full) {
            wg.lineStyle(2, 0xff0000);
            wg.moveTo(px, py);
            wg.lineTo(px + TILE_W, py + TILE_H);
            wg.moveTo(px + TILE_W, py);
            wg.lineTo(px, py + TILE_H);
          }
          waterLayer.addChild(wg);
        }

        if (tile.grass !== GrassLayer.None) {
          const gg = new PIXI.Graphics();
          gg.beginFill(grassColors[tile.grass], 0.5);
          drawDiamond(gg, px, py);
          gg.endFill();
          grassLayer.addChild(gg);
        }

        if (tile.structure !== Structure.None) {
          const sg = new PIXI.Graphics();
          sg.beginFill(structureColors[tile.structure]);
          drawDiamond(sg, px, py, TILE_W / 2, TILE_H / 2);
          sg.endFill();
          sg.x += TILE_W / 4;
          sg.y += TILE_H / 4;
          structureLayer.addChild(sg);
        }

        if (tile.slime_intensity > 0) {
          const sl = new PIXI.Graphics();
          sl.beginFill(0xff0000, Math.min(1, tile.slime_intensity));
          drawDiamond(sl, px, py);
          sl.endFill();
          slimeLayer.addChild(sl);
        }

        if (tile.resources) {
          if (tile.resources.biomass) {
            const bg = new PIXI.Graphics();
            bg.beginFill(resourceColors.biomass);
            bg.drawCircle(px + TILE_W / 4, py + TILE_H / 4, 5);
            bg.endFill();
            resourceLayer.addChild(bg);
          }
          if (tile.resources.water) {
            const wg = new PIXI.Graphics();
            wg.beginFill(resourceColors.water);
            wg.drawCircle(px + (3 * TILE_W) / 4, py + TILE_H / 4, 5);
            wg.endFill();
            resourceLayer.addChild(wg);
          }
        }
      }
    }

    Object.values(terrainLayers).forEach((layer) => {
      layer.cacheAsBitmap = true;
      camera.addChild(layer);
    });

    camera.addChild(resourceLayer);
    camera.addChild(highlight);
    camera.addChild(entityLayer);

    const grid = new PIXI.Graphics();
    grid.lineStyle(1, 0xffffff, 0.3);
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const px = (x - y) * (TILE_W / 2);
        const py = (x + y) * (TILE_H / 2);
        drawDiamond(grid, px, py);
      }
    }
    grid.visible = false;
    camera.addChild(grid);

    // interactions
    let dragging = false;
    let lastPos = { x: 0, y: 0 };
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return; // only left button drags
      dragging = true;
      lastPos = { x: e.clientX, y: e.clientY };
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      camera.x += e.clientX - lastPos.x;
      camera.y += e.clientY - lastPos.y;
      lastPos = { x: e.clientX, y: e.clientY };
    };
    const onUp = () => {
      dragging = false;
    };

    const view = app.view as HTMLCanvasElement;

    const updateHighlight = (clientX: number, clientY: number) => {
      const highlightG = highlightRef.current;
      if (!highlightG) return;
      const rect = view.getBoundingClientRect();
      const mx = clientX - rect.left - camera.x;
      const my = clientY - rect.top - camera.y;
      const tileX = Math.floor(
        (my / (TILE_H / 2) + mx / (TILE_W / 2)) / 2,
      );
      const tileY = Math.floor(
        (my / (TILE_H / 2) - mx / (TILE_W / 2)) / 2,
      );
      if (
        tileX >= 0 &&
        tileY >= 0 &&
        tileX < map.width &&
        tileY < map.height
      ) {
        highlightG.clear();
        highlightG.visible = true;
        highlightG.lineStyle(2, 0xffff00);
        const px = (tileX - tileY) * (TILE_W / 2);
        const py = (tileX + tileY) * (TILE_H / 2);
        drawDiamond(highlightG, px, py);
      } else {
        highlightG.clear();
        highlightG.visible = false;
      }
    };

    const onHover = (e: PointerEvent) => {
      updateHighlight(e.clientX, e.clientY);
    };

    const clearHighlight = () => {
      const highlightG = highlightRef.current;
      if (!highlightG) return;
      highlightG.clear();
      highlightG.visible = false;
    };

    view.addEventListener('pointerdown', onDown);
    view.addEventListener('pointermove', onHover);
    view.addEventListener('pointerleave', clearHighlight);
    view.addEventListener('pointerout', clearHighlight);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

    let showGrid = false;
    let animateWater = true;
    let paused = false;

    const keyHandler = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          camera.x += 10;
          break;
        case 'ArrowRight':
          camera.x -= 10;
          break;
        case 'ArrowUp':
          camera.y += 10;
          break;
        case 'ArrowDown':
          camera.y -= 10;
          break;
        case 'g':
        case 'G':
          showGrid = !showGrid;
          grid.visible = showGrid;
          break;
        case 'w':
        case 'W':
          animateWater = !animateWater;
          break;
        default:
          if (e.code === 'Space') {
            paused = !paused;
            if (paused) app.ticker.stop();
            else app.ticker.start();
          }
      }
    };
    window.addEventListener('keydown', keyHandler);

    app.ticker.add(() => {
      if (!animateWater) return;
      const t = performance.now() / 500;
      waterLayer.children.forEach((child, i) => {
        child.alpha = 0.6 + 0.1 * Math.sin(t + i);
      });
    });

    return () => {
      window.removeEventListener('keydown', keyHandler);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      view.removeEventListener('pointerdown', onDown);
      view.removeEventListener('pointermove', onHover);
      view.removeEventListener('pointerleave', clearHighlight);
      view.removeEventListener('pointerout', clearHighlight);
      app.destroy(true);
    };
  }, [map]);

  // update entity graphics when entities change
  useEffect(() => {
    const entityLayer = entityLayerRef.current;
    if (!entityLayer) return;
    const refs = entityRefs.current;

    // remove missing
    for (const [id, g] of Array.from(refs.entries())) {
      if (!entities.find((e) => e.id === id)) {
        entityLayer.removeChild(g);
        refs.delete(id);
      }
    }

    entities.forEach((ent) => {
      let g = refs.get(ent.id);
      if (!g) {
        g = new PIXI.Graphics();
        g.eventMode = 'static';
        g.cursor = 'pointer';
        g.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
          if (e.button === 0) {
            snailClickRef.current = true;
            onSelect(ent.id);
          }
        });
        entityLayer.addChild(g);
        refs.set(ent.id, g);
      }
      g.clear();
      g.beginFill(ent.id === selectedId ? 0xff0000 : 0xffff00);
      g.drawCircle(0, 0, 10);
      g.endFill();
      const px = (ent.x - ent.y) * (TILE_W / 2) + TILE_W / 2;
      const py = (ent.x + ent.y) * (TILE_H / 2) + TILE_H / 2;
      g.x = px;
      g.y = py;
    });
  }, [entities, selectedId, onSelect]);

  // handle colony selection
  useEffect(() => {
    const app = appRef.current;
    const camera = cameraRef.current;
    if (!app || !camera) return;
    const view = app.view as HTMLCanvasElement;

    const onClick = (e: MouseEvent) => {
      if (snailClickRef.current) {
        snailClickRef.current = false;
        return;
      }
      const rect = view.getBoundingClientRect();
      const mx = e.clientX - rect.left - camera.x;
      const my = e.clientY - rect.top - camera.y;
      const tileX = Math.floor(
        (my / (TILE_H / 2) + mx / (TILE_W / 2)) / 2,
      );
      const tileY = Math.floor(
        (my / (TILE_H / 2) - mx / (TILE_W / 2)) / 2,
      );
      if (
        tileX >= 0 &&
        tileY >= 0 &&
        tileX < map.width &&
        tileY < map.height
      ) {
        const tile = map.tiles[tileY * map.width + tileX];
        if (tile.structure === Structure.Colony) {
          onColonySelect({ name: `Colony (${tileX},${tileY})`, stars: 1 });
        }
      }
    };

    view.addEventListener('click', onClick);
    return () => {
      view.removeEventListener('click', onClick);
    };
  }, [map, onColonySelect]);

  // handle right click commands
  useEffect(() => {
    const app = appRef.current;
    const camera = cameraRef.current;
    if (!app || !camera) return;
    const view = app.view as HTMLCanvasElement;

    const onContext = (e: MouseEvent) => e.preventDefault();
    const onPointer = (e: PointerEvent) => {
      if (e.button !== 2) return;
      e.preventDefault();
      if (selectedId == null) return;
      const rect = view.getBoundingClientRect();
      const mx = e.clientX - rect.left - camera.x;
      const my = e.clientY - rect.top - camera.y;
      const tileX = Math.floor(
        (my / (TILE_H / 2) + mx / (TILE_W / 2)) / 2,
      );
      const tileY = Math.floor(
        (my / (TILE_H / 2) - mx / (TILE_W / 2)) / 2,
      );
      const snail = entities.find((s) => s.id === selectedId);
      if (!snail) return;
      const dx = tileX - snail.x;
      const dy = tileY - snail.y;
      const highlight = highlightRef.current;
      if (highlight) {
        highlight.clear();
        highlight.lineStyle(2, 0xffff00);
        const px = (tileX - tileY) * (TILE_W / 2);
        const py = (tileX + tileY) * (TILE_H / 2);
        drawDiamond(highlight, px, py);
        highlight.visible = true;
      }
      onCommand({ t: 'Move', dx, dy });
    };

    view.addEventListener('contextmenu', onContext);
    view.addEventListener('pointerdown', onPointer);
    return () => {
      view.removeEventListener('contextmenu', onContext);
      view.removeEventListener('pointerdown', onPointer);
    };
  }, [entities, selectedId, onCommand]);

  return <div ref={rootRef} className="w-full h-full" />;
}

function drawDiamond(
  g: PIXI.Graphics,
  x: number,
  y: number,
  w: number = TILE_W,
  h: number = TILE_H,
) {
  g.moveTo(x, y + h / 2);
  g.lineTo(x + w / 2, y);
  g.lineTo(x + w, y + h / 2);
  g.lineTo(x + w / 2, y + h);
  g.lineTo(x, y + h / 2);
}

