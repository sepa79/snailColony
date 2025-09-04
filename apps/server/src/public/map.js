const TILE_W = 64;
const TILE_H = 32;

const terrainColors = {
  Dirt: 0x8b4513,
  Mud: 0x654321,
  Sand: 0xc2b280,
  Rock: 0x808080,
  Brush: 0x228b22,
  Cliff: 0x555555,
  ShallowWaterBed: 0x3a5fcd,
  Road: 0xa9a9a9,
};

const waterColors = {
  None: 0x000000,
  Puddle: 0x1e90ff,
  Stream: 0x0000ff,
  Full: 0x000080,
};

const grassColors = {
  None: 0x000000,
  Sparse: 0x7cfc00,
  Normal: 0x32cd32,
  Dense: 0x006400,
};

const structureColors = {
  None: 0x000000,
  Colony: 0xff00ff,
  Bridge: 0x8b4513,
};

const resourceColors = {
  biomass: 0x00ff00,
  water: 0x1e90ff,
};

function drawDiamond(g, x, y, w = TILE_W, h = TILE_H) {
  g.moveTo(x, y + h / 2);
  g.lineTo(x + w / 2, y);
  g.lineTo(x + w, y + h / 2);
  g.lineTo(x + w / 2, y + h);
  g.lineTo(x, y + h / 2);
}

window.initMapView = function (map) {
  const container = document.getElementById('map');
  // clear previous render, if any
  container.innerHTML = '';
  if (window.mapApp) {
    window.mapApp.destroy(true, { children: true, texture: true, baseTexture: true });
    window.mapApp = undefined;
  }
  const app = new PIXI.Application({ background: 0x222222, resizeTo: container });
  container.appendChild(app.view);
  const camera = new PIXI.Container();
  app.stage.addChild(camera);
  // expose the app so callers can detect if a map has been drawn
  window.mapApp = app;

  const terrainLayers = {};
  Object.keys(terrainColors).forEach((t) => {
    terrainLayers[t] = new PIXI.Graphics();
  });

  const waterLayer = new PIXI.Container();
  const grassLayer = new PIXI.Container();
  const structureLayer = new PIXI.Container();
  const resourceLayer = new PIXI.Container();
  camera.addChild(waterLayer, grassLayer, structureLayer);

  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const tile = map.tiles[y * map.width + x];
      const px = (x - y) * (TILE_W / 2);
      const py = (x + y) * (TILE_H / 2);

      const g = terrainLayers[tile.terrain];
      g.beginFill(terrainColors[tile.terrain]);
      drawDiamond(g, px, py);
      g.endFill();

      if (tile.water !== 'None') {
        const wg = new PIXI.Graphics();
        wg.beginFill(waterColors[tile.water], 0.6);
        drawDiamond(wg, px, py);
        wg.endFill();
        if (tile.water === 'Full') {
          wg.lineStyle(2, 0xff0000);
          wg.moveTo(px, py);
          wg.lineTo(px + TILE_W, py + TILE_H);
          wg.moveTo(px + TILE_W, py);
          wg.lineTo(px, py + TILE_H);
        }
        waterLayer.addChild(wg);
      }

      if (tile.grass !== 'None') {
        const gg = new PIXI.Graphics();
        gg.beginFill(grassColors[tile.grass], 0.5);
        drawDiamond(gg, px, py);
        gg.endFill();
        grassLayer.addChild(gg);
      }

      if (tile.structure !== 'None') {
        const sg = new PIXI.Graphics();
        sg.beginFill(structureColors[tile.structure]);
        drawDiamond(sg, px, py, TILE_W / 2, TILE_H / 2);
        sg.endFill();
        sg.x += TILE_W / 4;
        sg.y += TILE_H / 4;
        structureLayer.addChild(sg);
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

  let dragging = false;
  let lastPos = { x: 0, y: 0 };
  app.view.addEventListener('pointerdown', (e) => {
    dragging = true;
    lastPos = { x: e.clientX, y: e.clientY };
  });
  window.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    camera.x += e.clientX - lastPos.x;
    camera.y += e.clientY - lastPos.y;
    lastPos = { x: e.clientX, y: e.clientY };
  });
  window.addEventListener('pointerup', () => {
    dragging = false;
  });

  let showGrid = false;
  let animateWater = true;
  let paused = false;
  window.addEventListener('keydown', (e) => {
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
  });

  app.ticker.add(() => {
    if (!animateWater) return;
    const t = performance.now() / 500;
    waterLayer.children.forEach((child, i) => {
      child.alpha = 0.6 + 0.1 * Math.sin(t + i);
    });
  });
};
