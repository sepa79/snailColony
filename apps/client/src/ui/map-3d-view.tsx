import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  MapDef,
  TerrainType,
  WaterLayer,
  GrassLayer,
  Structure,
} from '@snail/protocol';

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

interface Map3DViewProps {
  map: MapDef;
}

export function Map3DView({ map }: Map3DViewProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = rootRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(
      60,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000,
    );
    const initialPos = new THREE.Vector3(map.width, map.width, map.height);
    camera.position.copy(initialPos);
    camera.lookAt(new THREE.Vector3(map.width / 2, 0, map.height / 2));

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(map.width / 2, 0, map.height / 2);

    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(10, 20, 0);
    scene.add(dir);

    const grid = new THREE.GridHelper(
      Math.max(map.width, map.height),
      Math.max(map.width, map.height),
    );
    grid.visible = false;
    scene.add(grid);

    const waterMeshes: THREE.Mesh[] = [];

    const terrainGeom = new THREE.BoxGeometry(1, 0.1, 1);
    const waterThin = new THREE.BoxGeometry(1, 0.05, 1);
    const waterFull = new THREE.BoxGeometry(1, 0.5, 1);
    const grassGeom = new THREE.BoxGeometry(1, 0.02, 1);
    const bridgeGeom = new THREE.BoxGeometry(1, 0.1, 1);
    const colonyGeom = new THREE.BoxGeometry(0.6, 0.3, 0.6);

    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const tile = map.tiles[y * map.width + x];

        const terrainMat = new THREE.MeshLambertMaterial({
          color: terrainColors[tile.terrain],
        });
        const terrain = new THREE.Mesh(terrainGeom, terrainMat);
        terrain.position.set(x, -0.05, y);
        scene.add(terrain);

        if (tile.grass !== GrassLayer.None) {
          const grassMat = new THREE.MeshLambertMaterial({
            color: grassColors[tile.grass],
          });
          const grass = new THREE.Mesh(grassGeom, grassMat);
          grass.position.set(x, 0, y);
          scene.add(grass);
        }

        if (tile.water !== WaterLayer.None) {
          const geom = tile.water === WaterLayer.Full ? waterFull : waterThin;
          const mat = new THREE.MeshLambertMaterial({
            color: waterColors[tile.water],
            transparent: true,
            opacity: 0.6,
          });
          const water = new THREE.Mesh(geom, mat);
          water.position.set(
            x,
            tile.water === WaterLayer.Full ? 0.25 : 0.025,
            y,
          );
          scene.add(water);
          waterMeshes.push(water);
        }

        if (tile.structure === Structure.Bridge) {
          const mat = new THREE.MeshLambertMaterial({
            color: structureColors[Structure.Bridge],
          });
          const bridge = new THREE.Mesh(bridgeGeom, mat);
          bridge.position.set(x, 0.15, y);
          scene.add(bridge);
        } else if (tile.structure === Structure.Colony) {
          const mat = new THREE.MeshLambertMaterial({
            color: structureColors[Structure.Colony],
          });
          const colony = new THREE.Mesh(colonyGeom, mat);
          colony.position.set(x, 0.15, y);
          scene.add(colony);
        }
      }
    }

    let animateWater = true;
    let paused = false;

    const animate = () => {
      requestAnimationFrame(animate);
      if (!paused && animateWater) {
        const t = performance.now() / 500;
        waterMeshes.forEach((m, i) => {
          const material = m.material as THREE.MeshLambertMaterial;
          material.opacity = 0.6 + 0.1 * Math.sin(t + i);
        });
      }
      renderer.render(scene, camera);
      controls.update();
    };
    animate();

    const onResize = () => {
      const { clientWidth: w, clientHeight: h } = mount;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    const keyHandler = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'g':
        case 'G':
          grid.visible = !grid.visible;
          break;
        case 'w':
        case 'W':
          animateWater = !animateWater;
          break;
        case ' ':
          paused = !paused;
          break;
        case 'r':
        case 'R':
          controls.reset();
          camera.position.copy(initialPos);
          camera.lookAt(new THREE.Vector3(map.width / 2, 0, map.height / 2));
          controls.target.set(map.width / 2, 0, map.height / 2);
          break;
      }
    };
    window.addEventListener('keydown', keyHandler);

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', keyHandler);
      controls.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [map]);

  return <div ref={rootRef} className="w-full h-96" />;
}

