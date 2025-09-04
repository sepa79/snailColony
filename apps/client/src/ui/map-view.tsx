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
}

export function MapView({ map }: MapViewProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!rootRef.current) return;

    const app = new PIXI.Application({
      background: 0x222222,
      resizeTo: rootRef.current,
    });

    rootRef.current.appendChild(app.view as HTMLCanvasElement);

    const camera = new PIXI.Container();
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

    (app.view as HTMLCanvasElement).addEventListener('pointerdown', onDown);
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
      (app.view as HTMLCanvasElement).removeEventListener('pointerdown', onDown);
      app.destroy(true);
    };
  }, [map]);

  return <div ref={rootRef} className="w-full h-96" />;
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

