import React, { useEffect, useRef, useState } from 'react';
import { buildAuthenticMapEntitiesFromSkb } from '../data/OriginalSkbSpawner';
import { soundManager } from '../engine/SoundManager';
import { localServer } from '../network/LocalServerSim';
import { CharacterGender } from '../systems/CharacterStorage';
import {
  ClassId,
  CombatMode,
  FloatingTextEvent,
  GameOptionsState,
  MapDefinition,
  NationId,
  VisualEffectEvent,
  WorldEntity
} from '../types/game';
import {
  Direction8,
  SpriteActionState,
  SpriteAnimationController,
  spriteController
} from './SpriteAnimationController';

interface AtlasRect {
  u: number;
  v: number;
  w: number;
  h: number;
  ox: number;
  oy: number;
  raw32: number;
}

interface MapObjectRecord {
  id: number;
  x: number;
  y: number;
  ox: number;
  oy: number;
  sprOx?: number;
  sprOy?: number;
}

interface LoadedMapBundle {
  mapName: string;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  atlasW: number;
  atlasH: number;
  atlasRects: Record<number, AtlasRect>;
  objects: MapObjectRecord[];
  gridWords: Uint16Array;
  atlasImg: HTMLImageElement;
}

interface MapViewportCanvasProps {
  currentMap: MapDefinition;
  playerX: number;
  playerZ: number;
  playerName: string;
  playerGender: CharacterGender;
  playerClass: ClassId;
  playerNation: NationId;
  playerHp: number;
  playerMaxHp: number;
  isMounted: boolean;
  combatMode: CombatMode;
  entities: WorldEntity[];
  selectedEntityId: string | null;
  floatingTexts: FloatingTextEvent[];
  visualEffects: VisualEffectEvent[];
  options: GameOptionsState;
  onTileClick: (tileX: number, tileZ: number, isRightClick: boolean) => void;
  onEntityClick: (entity: WorldEntity, isRightClick: boolean) => void;
  onMapSkbLoaded?: (entities: WorldEntity[]) => void;
}

function decodeBase64ToUint16Array(base64: string): Uint16Array {
  const binary = window.atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Uint16Array(bytes.buffer);
}

export const MapViewportCanvas: React.FC<MapViewportCanvasProps> = ({
  currentMap,
  playerX,
  playerZ,
  playerName,
  playerGender,
  playerClass,
  playerNation,
  playerHp,
  playerMaxHp,
  isMounted,
  combatMode,
  entities,
  selectedEntityId,
  floatingTexts,
  visualEffects,
  options,
  onTileClick,
  onEntityClick,
  onMapSkbLoaded
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loadingMapName, setLoadingMapName] = useState<string | null>(currentMap.codeName);
  const [zoom, setZoom] = useState<number>(1);

  const mapBundleCacheRef = useRef<Map<string, LoadedMapBundle>>(new Map());
  const activeBundleRef = useRef<LoadedMapBundle | null>(null);

  // Smooth interpolated player state in tile coordinates
  const playerRenderRef = useRef<{
    x: number;
    y: number;
    dir: Direction8;
    action: SpriteActionState;
    lastAttackAt: number;
  }>({
    x: playerX,
    y: playerZ,
    dir: 0,
    action: 'idle',
    lastAttackAt: 0
  });

  // Entity render cache for smooth interpolation & direction tracking
  const entityRenderMapRef = useRef<
    Map<string, { x: number; y: number; dir: Direction8 }>
  >(new Map());

  // Mouse hold state & hover cursor state for original Cursor.spr
  const mouseDownRef = useRef<{ active: boolean; clientX: number; clientY: number }>({
    active: false,
    clientX: 0,
    clientY: 0
  });
  const [cursorFrame, setCursorFrame] = useState<number>(1); // 1=default gauntlet, 25=click, 301=attack sword, 361=npc talk

  // Continuous movement target driven at exact 001AniTable.bin speeds
  const moveTargetRef = useRef<{
    active: boolean;
    targetX: number;
    targetY: number;
    isRunning: boolean;
    pendingEntity: WorldEntity | null;
    isRightClick: boolean;
  }>({
    active: false,
    targetX: playerX,
    targetY: playerZ,
    isRunning: false,
    pendingEntity: null,
    isRightClick: false
  });
  const lastStepSoundAtRef = useRef<number>(0);
  const lastStateSyncAtRef = useRef<number>(0);

  // Keep latest props in a ref for the 60fps requestAnimationFrame loop
  const propsRef = useRef({
    currentMap,
    playerX,
    playerZ,
    playerName,
    playerGender,
    playerClass,
    playerNation,
    playerHp,
    playerMaxHp,
    isMounted,
    combatMode,
    entities,
    selectedEntityId,
    floatingTexts,
    visualEffects,
    options,
    zoom,
    onTileClick,
    onEntityClick
  });

  useEffect(() => {
    propsRef.current = {
      currentMap,
      playerX,
      playerZ,
      playerName,
      playerGender,
      playerClass,
      playerNation,
      playerHp,
      playerMaxHp,
      isMounted,
      combatMode,
      entities,
      selectedEntityId,
      floatingTexts,
      visualEffects,
      options,
      zoom,
      onTileClick,
      onEntityClick
    };
  }, [
    currentMap,
    playerX,
    playerZ,
    playerName,
    playerGender,
    playerClass,
    playerNation,
    playerHp,
    playerMaxHp,
    isMounted,
    combatMode,
    entities,
    selectedEntityId,
    floatingTexts,
    visualEffects,
    options,
    zoom,
    onTileClick,
    onEntityClick
  ]);

  // Load original .map + .sou2 + .sou + .toi2 bundle from /api/data0/map/:mapName
  useEffect(() => {
    let cancelled = false;
    const mapCode = currentMap.codeName;

    soundManager.playMapBgm(mapCode);

    const cached = mapBundleCacheRef.current.get(mapCode);
    if (cached) {
      activeBundleRef.current = cached;
      playerRenderRef.current.x = playerX;
      playerRenderRef.current.y = playerZ;
      onMapSkbLoaded?.(localServer.getMapEntities(currentMap.id));
      setLoadingMapName(null);
      return;
    }

    setLoadingMapName(mapCode);

    (async () => {
      try {
        const res = await fetch(`/api/data0/map/${encodeURIComponent(mapCode)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const atlasImg = new Image();
        await new Promise<void>((resolve, reject) => {
          atlasImg.onload = () => resolve();
          atlasImg.onerror = () => reject(new Error('Atlas image load failed'));
          atlasImg.src = `/api/data0/map-atlas/${encodeURIComponent(mapCode)}.png`;
        });

        if (cancelled) return;

        const gridWords = decodeBase64ToUint16Array(data.gridBase64);
        const bundle: LoadedMapBundle = {
          mapName: data.mapName,
          width: data.width,
          height: data.height,
          centerX: data.centerX,
          centerY: data.centerY,
          atlasW: data.atlasW,
          atlasH: data.atlasH,
          atlasRects: data.atlasRects,
          objects: data.objects || [],
          gridWords,
          atlasImg
        };

        mapBundleCacheRef.current.set(mapCode, bundle);
        activeBundleRef.current = bundle;
        playerRenderRef.current.x = propsRef.current.playerX;
        playerRenderRef.current.y = propsRef.current.playerZ;

        // Populate authentic NPCs, Shopkeepers, Guards, Animals, Dummies, Monsters & Nodes from .skb + dragonraja.sql
        if (Array.isArray(data.skbSpawns) && data.skbSpawns.length > 0) {
          const skbEntities = buildAuthenticMapEntitiesFromSkb(
            propsRef.current.currentMap.id,
            mapCode,
            data.skbSpawns,
            Array.isArray(data.skbSkills) ? data.skbSkills : [],
            gridWords,
            data.width,
            data.height
          );
          const registered = localServer.registerSkbEntities(
            propsRef.current.currentMap.id,
            skbEntities
          );
          onMapSkbLoaded?.(registered);
        }

        setLoadingMapName(null);
      } catch (err) {
        console.error('Failed to stream map from data0:', err);
        if (!cancelled) setLoadingMapName(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentMap.codeName]);

  // Helper to check if a tile is walkable in the original .map grid
  const isSingleTileWalkable = (tx: number, ty: number): boolean => {
    const bundle = activeBundleRef.current;
    if (!bundle) return true;
    const ix = Math.floor(tx);
    const iy = Math.floor(ty);
    if (ix < 1 || iy < 1 || ix >= bundle.width - 1 || iy >= bundle.height - 1) return false;
    const cellIdx = (iy * bundle.width + ix) * 4;
    const back = bundle.gridWords[cellIdx];
    const flags = bundle.gridWords[cellIdx + 3];
    return back > 0 && (flags & 1) === 0;
  };

  // Check foot collision footprint so the player cannot clip through walls, buildings, water, or obstacles
  const isTileWalkable = (tx: number, ty: number): boolean => {
    const r = 0.25;
    return (
      isSingleTileWalkable(tx, ty) &&
      isSingleTileWalkable(tx - r, ty) &&
      isSingleTileWalkable(tx + r, ty) &&
      isSingleTileWalkable(tx, ty - r) &&
      isSingleTileWalkable(tx, ty + r)
    );
  };

  // Convert screen coordinates (clientX, clientY) to world tile coordinates
  const screenToWorldTile = (clientX: number, clientY: number): { tileX: number; tileZ: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / Math.max(1, rect.width);
    const scaleY = canvas.height / Math.max(1, rect.height);
    const sx = (clientX - rect.left) * scaleX;
    const sy = (clientY - rect.top) * scaleY;

    const pRender = playerRenderRef.current;
    const camWorldX = Math.round(pRender.x * 32 + 16);
    const camWorldY = Math.round(pRender.y * 32 + 16);

    const worldPx = camWorldX + (sx - canvas.width / 2);
    const worldPy = camWorldY + (sy - canvas.height / 2);

    return {
      tileX: +(worldPx / 32).toFixed(2),
      tileZ: +(worldPy / 32).toFixed(2)
    };
  };

  // Find entity under cursor at world tile coordinates
  const findEntityAtTile = (tileX: number, tileZ: number): WorldEntity | null => {
    const st = propsRef.current;
    let hitEntity: WorldEntity | null = null;
    let bestDist = 2.35;
    for (const ent of st.entities) {
      if (ent.type === 'monster' && ent.hp <= 0) continue;
      const dTorso = Math.hypot(ent.x - tileX, ent.z - 0.8 - tileZ);
      const dFeet = Math.hypot(ent.x - tileX, ent.z - 0.2 - tileZ);
      const d = Math.min(dTorso, dFeet);
      if (d < bestDist) {
        bestDist = d;
        hitEntity = ent;
      }
    }
    return hitEntity;
  };

  // Convert screen click (clientX, clientY) to world movement target or entity interaction
  const handleScreenPointer = (clientX: number, clientY: number, isRightClick: boolean, isDragHold = false) => {
    const coords = screenToWorldTile(clientX, clientY);
    if (!coords) return;
    const { tileX: clickTileX, tileZ: clickTileZ } = coords;

    const st = propsRef.current;
    const pRender = playerRenderRef.current;

    // Check if user clicked on an entity (unless holding mouse to walk)
    if (!isDragHold) {
      const hitEntity = findEntityAtTile(clickTileX, clickTileZ);
      if (hitEntity) {
        pRender.dir = SpriteAnimationController.getDirection8(
          hitEntity.x - pRender.x,
          hitEntity.z - pRender.y,
          pRender.dir
        );
        const distToEnt = Math.hypot(hitEntity.x - pRender.x, hitEntity.z - pRender.y);
        const directRange =
          hitEntity.type === 'npc' || hitEntity.type === 'portal' ? 3.8 : 2.5;

        // Ranged right-click spell or already within interaction/melee range
        if (distToEnt <= directRange || (isRightClick && hitEntity.type === 'monster')) {
          moveTargetRef.current.active = false;
          moveTargetRef.current.pendingEntity = null;
          if (hitEntity.type === 'monster') {
            pRender.action = 'attack';
            pRender.lastAttackAt = performance.now();
          } else {
            pRender.action = 'idle';
          }
          st.onEntityClick(hitEntity, isRightClick);
          return;
        }

        // Farther than range: walk/run toward the entity and interact upon arrival!
        moveTargetRef.current = {
          active: true,
          targetX: hitEntity.x,
          targetY: hitEntity.z,
          isRunning: distToEnt > 3.2,
          pendingEntity: hitEntity,
          isRightClick
        };
        return;
      }
    }

    const dx = clickTileX - pRender.x;
    const dz = clickTileZ - pRender.y;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.14) return;

    pRender.dir = SpriteAnimationController.getDirection8(dx, dz, pRender.dir);

    // Set continuous movement destination (exact 001AniTable.bin walk/run speed in renderFrame)
    moveTargetRef.current = {
      active: true,
      targetX: clickTileX,
      targetY: clickTileZ,
      isRunning: dist > 2.6,
      pendingEntity: null,
      isRightClick
    };

    if (isRightClick && !isDragHold) {
      st.onTileClick(+pRender.x.toFixed(2), +pRender.y.toFixed(2), true);
    }
  };

  // Hold-mouse continuous movement updater
  useEffect(() => {
    const timer = setInterval(() => {
      if (!mouseDownRef.current.active) return;
      if (!propsRef.current.options.autoClicker.holdMovement) return;
      handleScreenPointer(
        mouseDownRef.current.clientX,
        mouseDownRef.current.clientY,
        false,
        true
      );
    }, 90);
    return () => clearInterval(timer);
  }, []);

  // Main 60 FPS 2D Canvas Render Loop
  useEffect(() => {
    let rafId = 0;
    let lastFrameTime = performance.now();

    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const renderFrame = (now: number) => {
      rafId = requestAnimationFrame(renderFrame);
      const dt = Math.min(0.05, Math.max(0.001, (now - lastFrameTime) / 1000));
      lastFrameTime = now;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const st = propsRef.current;
      const bundle = activeBundleRef.current;

      // Render at exact integer 1:1 pixel coordinates so 32x32 tiles NEVER have sub-pixel grid seams
      const targetW = Math.max(320, Math.round(window.innerWidth / st.zoom));
      const targetH = Math.max(240, Math.round(window.innerHeight / st.zoom));
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#070604';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (!bundle) return;

      // 1. Update Player Position at Exact 001AniTable.bin Speed with Strict Tile Collision
      const pRender = playerRenderRef.current;
      const warpDist = Math.hypot(st.playerX - pRender.x, st.playerZ - pRender.y);

      if (warpDist > 10) {
        // Map warp / teleport
        pRender.x = st.playerX;
        pRender.y = st.playerZ;
        pRender.action = 'idle';
        moveTargetRef.current.active = false;
      }

      // If player ever lands on a blocked tile on initial spawn, nudge to nearest walkable tile
      if (!isTileWalkable(pRender.x, pRender.y)) {
        outerNudge: for (let r = 1; r <= 6; r++) {
          for (let dy = -r; dy <= r; dy++) {
            for (let dx = -r; dx <= r; dx++) {
              if (isTileWalkable(Math.floor(pRender.x) + dx + 0.5, Math.floor(pRender.y) + dy + 0.5)) {
                pRender.x = Math.floor(pRender.x) + dx + 0.5;
                pRender.y = Math.floor(pRender.y) + dy + 0.5;
                break outerNudge;
              }
            }
          }
        }
      }

      const mt = moveTargetRef.current;
      if (mt.active) {
        // Check if walking up to an NPC, monster, node, or portal
        if (mt.pendingEntity) {
          const distEnt = Math.hypot(mt.pendingEntity.x - pRender.x, mt.pendingEntity.z - pRender.y);
          const arrivalRange =
            mt.pendingEntity.type === 'npc' || mt.pendingEntity.type === 'portal' ? 3.5 : 2.35;
          if (distEnt <= arrivalRange) {
            mt.active = false;
            const ent = mt.pendingEntity;
            mt.pendingEntity = null;
            pRender.dir = SpriteAnimationController.getDirection8(
              ent.x - pRender.x,
              ent.z - pRender.y,
              pRender.dir
            );
            if (ent.type === 'monster') {
              pRender.action = 'attack';
              pRender.lastAttackAt = now;
            } else {
              pRender.action = 'idle';
            }
            st.onTileClick(+pRender.x.toFixed(2), +pRender.y.toFixed(2), false);
            st.onEntityClick(ent, mt.isRightClick);
          }
        }

        if (mt.active) {
          const dx = mt.targetX - pRender.x;
          const dy = mt.targetY - pRender.y;
          const dist = Math.hypot(dx, dy);

          if (dist <= 0.12) {
            mt.active = false;
            if (now - pRender.lastAttackAt > 420) {
              pRender.action = 'idle';
            }
            st.onTileClick(+pRender.x.toFixed(2), +pRender.y.toFixed(2), false);
          } else {
            pRender.dir = SpriteAnimationController.getDirection8(dx, dy, pRender.dir);
            // Exact speeds from data/animations/characters/player/legacy/001AniTable.bin:
            // Act[1]/Act[2] Walk = 38px / 12 ticks (~3.8 tiles/s); Act[12] Run = 60px / 12 ticks (~5.2 tiles/s)
            const isRun = mt.isRunning && dist > 1.1;
            const tilesPerSec = st.isMounted ? 7.2 : isRun ? 5.2 : 3.8;
            const totalStep = Math.min(dist, tilesPerSec * dt);
            const dirX = dx / dist;
            const dirY = dy / dist;

            const microSteps = Math.max(1, Math.ceil(totalStep / 0.08));
            const subStep = totalStep / microSteps;
            let movedAny = false;

            for (let s = 0; s < microSteps; s++) {
              const nx = pRender.x + dirX * subStep;
              const ny = pRender.y + dirY * subStep;
              if (isTileWalkable(nx, ny)) {
                pRender.x = nx;
                pRender.y = ny;
                movedAny = true;
              } else if (Math.abs(dirX) > 0.15 && isTileWalkable(nx, pRender.y)) {
                pRender.x = nx;
                movedAny = true;
              } else if (Math.abs(dirY) > 0.15 && isTileWalkable(pRender.x, ny)) {
                pRender.y = ny;
                movedAny = true;
              } else {
                // Strictly blocked by wall, shop counter, building, tree, fence, or water
                if (mt.pendingEntity) {
                  const ent = mt.pendingEntity;
                  const distEnt = Math.hypot(ent.x - pRender.x, ent.z - pRender.y);
                  if (distEnt <= 5.2) {
                    pRender.dir = SpriteAnimationController.getDirection8(
                      ent.x - pRender.x,
                      ent.z - pRender.y,
                      pRender.dir
                    );
                    st.onTileClick(+pRender.x.toFixed(2), +pRender.y.toFixed(2), false);
                    st.onEntityClick(ent, mt.isRightClick);
                  }
                }
                mt.active = false;
                mt.pendingEntity = null;
                break;
              }
            }

            if (movedAny) {
              if (now - pRender.lastAttackAt > 420) {
                pRender.action = isRun ? 'run' : 'walk';
              }
              const stepInterval = st.isMounted ? 210 : isRun ? 250 : 330;
              if (now - lastStepSoundAtRef.current >= stepInterval) {
                lastStepSoundAtRef.current = now;
                soundManager.playStep(isRun || st.isMounted);
              }
              if (now - lastStateSyncAtRef.current >= 140) {
                lastStateSyncAtRef.current = now;
                st.onTileClick(+pRender.x.toFixed(2), +pRender.y.toFixed(2), false);
              }
            } else {
              if (now - pRender.lastAttackAt > 420) {
                pRender.action = 'idle';
              }
              st.onTileClick(+pRender.x.toFixed(2), +pRender.y.toFixed(2), false);
            }
          }
        }
      } else {
        if (now - pRender.lastAttackAt > 420) {
          pRender.action = 'idle';
        }
      }

      const animTick = Math.floor(now / 115);

      // Camera center in world pixels (100% integer pixel alignment)
      const camWorldX = Math.round(pRender.x * 32 + 16);
      const camWorldY = Math.round(pRender.y * 32 + 16);
      const halfW = Math.round(canvas.width / 2);
      const halfH = Math.round(canvas.height / 2);

      ctx.save();
      ctx.translate(halfW - camWorldX, halfH - camWorldY);

      // Visible tile bounds (+4 tile padding for oversized .sou sprites)
      const minTileX = Math.max(0, Math.floor((camWorldX - halfW) / 32) - 4);
      const maxTileX = Math.min(bundle.width - 1, Math.ceil((camWorldX + halfW) / 32) + 4);
      const minTileY = Math.max(0, Math.floor((camWorldY - halfH) / 32) - 4);
      const maxTileY = Math.min(bundle.height - 1, Math.ceil((camWorldY + halfH) / 32) + 4);

      const { gridWords, atlasRects, atlasImg, width } = bundle;

      // =======================================================================
      // LAYER 1: Original Back Ground Tiles (DrawTile back)
      // =======================================================================
      for (let ty = minTileY; ty <= maxTileY; ty++) {
        const rowBase = ty * width;
        for (let tx = minTileX; tx <= maxTileX; tx++) {
          const cellIdx = (rowBase + tx) * 4;
          const backId = gridWords[cellIdx];
          if (backId === 0) continue;
          const rect = atlasRects[backId];
          if (!rect) continue;
          const drawX = rect.raw32 ? tx * 32 : tx * 32 - rect.ox;
          const drawY = rect.raw32 ? ty * 32 : ty * 32 - rect.oy;
          ctx.drawImage(
            atlasImg,
            rect.u,
            rect.v,
            rect.w,
            rect.h,
            drawX,
            drawY,
            rect.w,
            rect.h
          );
        }
      }

      // =======================================================================
      // LAYER 2: Original Front Overlay Tiles (Roads, Bridges, Shorelines, Walls)
      // =======================================================================
      for (let ty = minTileY; ty <= maxTileY; ty++) {
        const rowBase = ty * width;
        for (let tx = minTileX; tx <= maxTileX; tx++) {
          const cellIdx = (rowBase + tx) * 4;
          const frontId = gridWords[cellIdx + 1];
          if (frontId === 0) continue;
          const rect = atlasRects[frontId];
          if (!rect) continue;
          const drawX = rect.raw32 ? tx * 32 : tx * 32 - rect.ox;
          const drawY = rect.raw32 ? ty * 32 : ty * 32 - rect.oy;
          ctx.drawImage(
            atlasImg,
            rect.u,
            rect.v,
            rect.w,
            rect.h,
            drawX,
            drawY,
            rect.w,
            rect.h
          );
        }
      }

      // Optional Tile Grid Overlay (from OptionMenuWindow)
      if (st.options.showGrid) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;
        for (let ty = minTileY; ty <= maxTileY; ty++) {
          for (let tx = minTileX; tx <= maxTileX; tx++) {
            const cellIdx = (ty * width + tx) * 4;
            const blocked = (gridWords[cellIdx + 3] & 1) !== 0;
            if (blocked) {
              ctx.fillStyle = 'rgba(239, 68, 68, 0.18)';
              ctx.fillRect(tx * 32, ty * 32, 32, 32);
            }
            ctx.strokeRect(tx * 32, ty * 32, 32, 32);
          }
        }
      }

      // =======================================================================
      // LAYER 3: Y-Sorted .toi2 Map Objects + World Entities + Player
      // =======================================================================
      type RenderableItem =
        | { kind: 'map_obj'; sortY: number; obj: MapObjectRecord }
        | { kind: 'entity'; sortY: number; ent: WorldEntity }
        | { kind: 'player'; sortY: number };

      const renderList: RenderableItem[] = [];

      // Collect visible .toi2 objects
      const viewMinPx = camWorldX - halfW - 220;
      const viewMaxPx = camWorldX + halfW + 220;
      const viewMinPy = camWorldY - halfH - 260;
      const viewMaxPy = camWorldY + halfH + 260;

      for (let i = 0; i < bundle.objects.length; i++) {
        const obj = bundle.objects[i];
        if (
          obj.x >= viewMinPx &&
          obj.x <= viewMaxPx &&
          obj.y >= viewMinPy &&
          obj.y <= viewMaxPy
        ) {
          renderList.push({ kind: 'map_obj', sortY: obj.y, obj });
        }
      }

      // Collect live WorldEntities
      for (const ent of st.entities) {
        if (ent.type === 'monster' && ent.hp <= 0) continue;
        renderList.push({
          kind: 'entity',
          sortY: ent.z * 32 + 16,
          ent
        });
      }

      // Add Player
      renderList.push({
        kind: 'player',
        sortY: pRender.y * 32 + 16
      });

      renderList.sort((a, b) => a.sortY - b.sortY);

      for (const item of renderList) {
        if (item.kind === 'map_obj') {
          const { obj } = item;
          const spr = spriteController.getMapObjectImage(obj.id);
          if (spr) {
            // Draw at exact .csp anchor offset (sprOx, sprOy) from data0
            const dx = Math.round(obj.x - (obj.sprOx ?? spr.w / 2));
            const dy = Math.round(obj.y - (obj.sprOy ?? spr.h));
            ctx.drawImage(spr.img, dx, dy);
          }
        } else if (item.kind === 'entity') {
          const { ent } = item;
          let eRender = entityRenderMapRef.current.get(ent.id);
          if (!eRender) {
            eRender = { x: ent.x, y: ent.z, dir: 0 };
            entityRenderMapRef.current.set(ent.id, eRender);
          }
          const edx = ent.x - eRender.x;
          const edy = ent.z - eRender.y;
          const eDist = Math.hypot(edx, edy);
          let eAction: SpriteActionState = 'idle';
          if (eDist > 8) {
            eRender.x = ent.x;
            eRender.y = ent.z;
          } else if (eDist > 0.03) {
            eRender.dir = SpriteAnimationController.getDirection8(edx, edy, eRender.dir);
            eRender.x += edx * 0.18;
            eRender.y += edy * 0.18;
            eAction = 'walk';
          } else {
            eRender.x = ent.x;
            eRender.y = ent.z;
          }
          if (ent.attackAnimTime && Date.now() - ent.attackAnimTime < 500) {
            eAction = 'attack';
          }

          const exPx = Math.round(eRender.x * 32 + 16);
          const eyPx = Math.round(eRender.y * 32 + 16);
          const isSelected = ent.id === st.selectedEntityId;

          // Draw Selection Ring or Ground Shadow
          ctx.beginPath();
          ctx.ellipse(exPx, eyPx, isSelected ? 20 : 14, isSelected ? 10 : 7, 0, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
          ctx.fill();
          if (isSelected) {
            ctx.lineWidth = 2;
            ctx.strokeStyle = ent.hostile ? '#ef4444' : '#facc15';
            ctx.stroke();
          }

          if (ent.type === 'portal') {
            // Animated Warp Gate Ring
            const pulse = 22 + Math.sin(now * 0.006) * 4;
            const grad = ctx.createRadialGradient(exPx, eyPx - 20, 4, exPx, eyPx - 20, pulse);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.5, ent.subType === 'portal_red' ? '#f87171' : ent.subType === 'portal_gold' ? '#facc15' : '#38bdf8');
            grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(exPx, eyPx - 20, pulse, 0, Math.PI * 2);
            ctx.fill();
          } else if (ent.type === 'node') {
            // Gathering Resource Vein / Tree / Herb / Fish Spot
            const nodeColor =
              ent.subType === 'mineral'
                ? '#38bdf8'
                : ent.subType === 'tree'
                ? '#4ade80'
                : ent.subType === 'herb'
                ? '#c084fc'
                : '#60a5fa';
            ctx.fillStyle = nodeColor;
            ctx.strokeStyle = '#1c1917';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(exPx, eyPx - 12, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          } else {
            // NPC, Monster, or Tamed Pet from original .spr (anchored 220x220 at 110, 155)
            const spec = spriteController.getEntitySpriteSpec(ent);
            const sprFrame = spriteController.getSpecFrameImage(
              spec,
              eRender.dir,
              eAction,
              animTick
            );
            if (sprFrame) {
              ctx.drawImage(
                sprFrame.img,
                Math.round(exPx - 110),
                Math.round(eyPx - 155)
              );
            }
          }

          // Classic Dragon Raja Entity Nameplate & HP Bar
          const labelY = eyPx - 68;
          ctx.font = 'bold 11px Tahoma, sans-serif';
          ctx.textAlign = 'center';

          if (ent.title) {
            ctx.fillStyle = '#000';
            ctx.fillText(ent.title, exPx + 1, labelY - 13);
            ctx.fillStyle = '#fde047';
            ctx.fillText(ent.title, exPx, labelY - 14);
          }

          const nameColor =
            ent.type === 'npc'
              ? '#4ade80'
              : ent.type === 'portal'
              ? '#38bdf8'
              : ent.type === 'node'
              ? '#fde047'
              : ent.type === 'tamed'
              ? '#86efac'
              : '#fca5a5';

          ctx.fillStyle = '#000';
          ctx.fillText(ent.name, exPx + 1, labelY + 1);
          ctx.fillStyle = nameColor;
          ctx.fillText(ent.name, exPx, labelY);

          if (ent.type === 'monster' || ent.type === 'tamed') {
            const barW = 44;
            const barH = 5;
            const pct = Math.max(0, Math.min(1, ent.hp / Math.max(1, ent.maxHp)));
            ctx.fillStyle = '#111';
            ctx.fillRect(exPx - barW / 2 - 1, labelY + 4, barW + 2, barH + 2);
            ctx.fillStyle = ent.type === 'tamed' ? '#22c55e' : '#ef4444';
            ctx.fillRect(exPx - barW / 2, labelY + 5, Math.round(barW * pct), barH);
          }
        } else if (item.kind === 'player') {
          const px = Math.round(pRender.x * 32 + 16);
          const py = Math.round(pRender.y * 32 + 16);

          // Ground aura / shadow under player
          ctx.beginPath();
          ctx.ellipse(px, py, st.isMounted ? 22 : 15, st.isMounted ? 11 : 8, 0, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle =
            st.combatMode === 'PK'
              ? '#ef4444'
              : st.combatMode === 'Battle'
              ? '#facc15'
              : '#38bdf8';
          ctx.stroke();

          // If mounted, draw original Warhorse sprite underneath player (anchored at 110, 155)
          if (st.isMounted) {
            const horseSpec = spriteController.getHorseSpriteSpec();
            const horseSpr = spriteController.getSpecFrameImage(
              horseSpec,
              pRender.dir,
              pRender.action,
              animTick
            );
            if (horseSpr) {
              ctx.drawImage(
                horseSpr.img,
                Math.round(px - 110),
                Math.round(py - 155 + 6)
              );
            }
          }

          // Draw Full Composited Player Sprite from data0 (body+head+armor+helm+sword+shield, anchored at 110, 155)
          const playerSpec = spriteController.getPlayerSpriteSpec(st.playerGender);
          const playerSpr = spriteController.getSpecFrameImage(
            playerSpec,
            pRender.dir,
            pRender.action,
            animTick
          );
          const mountOffsetY = st.isMounted ? -18 : 0;

          if (playerSpr) {
            ctx.drawImage(
              playerSpr.img,
              Math.round(px - 110),
              Math.round(py - 155 + mountOffsetY)
            );
          }

          // Classic Player Nameplate & HP Bar
          const pLabelY = py - 68 + mountOffsetY;
          ctx.font = 'bold 11px Tahoma, sans-serif';
          ctx.textAlign = 'center';

          const nationTag = `[${st.playerNation}] ${st.playerName}`;
          ctx.fillStyle = '#000';
          ctx.fillText(nationTag, px + 1, pLabelY + 1);
          ctx.fillStyle = '#fde047';
          ctx.fillText(nationTag, px, pLabelY);

          const pBarW = 46;
          const pPct = Math.max(0, Math.min(1, st.playerHp / Math.max(1, st.playerMaxHp)));
          ctx.fillStyle = '#111';
          ctx.fillRect(px - pBarW / 2 - 1, pLabelY + 4, pBarW + 2, 6);
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(px - pBarW / 2, pLabelY + 5, Math.round(pBarW * pPct), 4);
        }
      }

      // =======================================================================
      // LAYER 4: Original Roof Layer (.rof / roof bitfield) with Auto-Transparency
      // =======================================================================
      const pTileX = Math.floor(pRender.x);
      const pTileY = Math.floor(pRender.y);
      let playerInsideRoof = false;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const cx = pTileX + dx;
          const cy = pTileY + dy;
          if (cx >= 0 && cy >= 0 && cx < width && cy < bundle.height) {
            const cIdx = (cy * width + cx) * 4;
            if (gridWords[cIdx + 2] > 0 || (gridWords[cIdx + 3] & 2) !== 0) {
              playerInsideRoof = true;
            }
          }
        }
      }

      for (let ty = minTileY; ty <= maxTileY; ty++) {
        const rowBase = ty * width;
        for (let tx = minTileX; tx <= maxTileX; tx++) {
          const cellIdx = (rowBase + tx) * 4;
          const roofId = gridWords[cellIdx + 2];
          if (roofId === 0) continue;
          const rect = atlasRects[roofId];
          if (!rect) continue;

          if (playerInsideRoof && Math.hypot(tx - pTileX, ty - pTileY) < 8) {
            ctx.globalAlpha = 0.18;
          } else {
            ctx.globalAlpha = 1.0;
          }

          const drawX = rect.raw32 ? tx * 32 : tx * 32 - rect.ox;
          const drawY = rect.raw32 ? ty * 32 : ty * 32 - rect.oy;
          ctx.drawImage(
            atlasImg,
            rect.u,
            rect.v,
            rect.w,
            rect.h,
            drawX,
            drawY,
            rect.w,
            rect.h
          );
        }
      }
      ctx.globalAlpha = 1.0;

      // =======================================================================
      // LAYER 5: 2D Spell & Combat Visual Effects + Floating Damage Numbers
      // =======================================================================
      const wallNow = Date.now();
      for (const vfx of st.visualEffects) {
        const elapsed = wallNow - vfx.createdAt;
        if (elapsed > vfx.duration) continue;
        const progress = elapsed / Math.max(1, vfx.duration);
        const vx = vfx.x * 32 + 16;
        const vy = vfx.z * 32;

        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - progress);
        if (vfx.type === 'lightning') {
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(vx, vy - 180);
          ctx.lineTo(vx - 12, vy - 110);
          ctx.lineTo(vx + 10, vy - 60);
          ctx.lineTo(vx, vy);
          ctx.stroke();
        } else {
          const radius = 14 + progress * 38;
          ctx.strokeStyle = vfx.color;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(vx, vy - 16, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      if (st.options.showFloatingDamage) {
        ctx.font = 'bold 13px Tahoma, sans-serif';
        ctx.textAlign = 'center';
        for (const ft of st.floatingTexts) {
          const elapsed = wallNow - ft.createdAt;
          if (elapsed > 1100) continue;
          const progress = elapsed / 1100;
          const fx = ft.x * 32 + 16;
          const fy = ft.z * 32 - 36 - progress * 34;
          ctx.fillStyle = '#000';
          ctx.fillText(ft.text, fx + 1, fy + 1);
          ctx.fillStyle = ft.color;
          ctx.fillText(ft.text, fx, fy);
        }
      }

      ctx.restore();

      // Screen-space Weather Effects (Rain / Snow / Thunder)
      const activeWeather =
        st.options.weatherOverride === 'map_default'
          ? st.currentMap.weatherDefault
          : st.options.weatherOverride;

      if (st.options.weatherEffects && activeWeather !== 'clear') {
        ctx.save();
        if (activeWeather === 'rain' || activeWeather === 'thunder') {
          ctx.strokeStyle = 'rgba(147, 197, 253, 0.35)';
          ctx.lineWidth = 1;
          for (let i = 0; i < 65; i++) {
            const rx = ((i * 97 + Math.floor(now * 0.45)) % canvas.width);
            const ry = ((i * 53 + Math.floor(now * 0.9)) % canvas.height);
            ctx.beginPath();
            ctx.moveTo(rx, ry);
            ctx.lineTo(rx - 6, ry + 14);
            ctx.stroke();
          }
        } else if (activeWeather === 'snow') {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
          for (let i = 0; i < 55; i++) {
            const sx = ((i * 89 + Math.floor(now * 0.08)) % canvas.width);
            const sy = ((i * 61 + Math.floor(now * 0.22)) % canvas.height);
            ctx.fillRect(sx, sy, 3, 3);
          }
        }
        ctx.restore();
      }
    };

    rafId = requestAnimationFrame(renderFrame);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1, overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          imageRendering: 'pixelated',
          cursor: `url('/api/data0/sprite?path=images/misc/Cursor.spr&frame=${cursorFrame}') 2 2, auto`
        }}
        onMouseDown={(e) => {
          const isRight = e.button === 2;
          if (!isRight) {
            mouseDownRef.current = { active: true, clientX: e.clientX, clientY: e.clientY };
            setCursorFrame(25);
          }
          handleScreenPointer(e.clientX, e.clientY, isRight, false);
        }}
        onMouseMove={(e) => {
          if (mouseDownRef.current.active) {
            mouseDownRef.current.clientX = e.clientX;
            mouseDownRef.current.clientY = e.clientY;
            return;
          }
          const coords = screenToWorldTile(e.clientX, e.clientY);
          if (!coords) return;
          const hovered = findEntityAtTile(coords.tileX, coords.tileZ);
          if (hovered) {
            if (hovered.type === 'monster' && hovered.hostile) {
              setCursorFrame(301); // Original Sword Attack cursor
            } else {
              setCursorFrame(361); // Original NPC Speech / Interact cursor
            }
          } else {
            setCursorFrame(1); // Original Gauntlet Pointer cursor
          }
        }}
        onMouseUp={() => {
          mouseDownRef.current.active = false;
          setCursorFrame(1);
        }}
        onContextMenu={(e) => e.preventDefault()}
        onWheel={(e) => {
          setZoom((prev) => {
            const next = e.deltaY < 0 ? prev + 0.1 : prev - 0.1;
            return Math.max(0.85, Math.min(1.85, +next.toFixed(2)));
          });
        }}
      />

      {loadingMapName && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(10, 8, 5, 0.92)',
            border: '2px solid #8a6c3b',
            padding: '14px 24px',
            color: '#fde047',
            fontSize: 13,
            fontWeight: 700,
            zIndex: 30,
            boxShadow: '0 8px 32px rgba(0,0,0,0.9)'
          }}
        >
          Streaming Original 2D Map [{loadingMapName}.map / .sou / .toi2] from data0...
        </div>
      )}
    </div>
  );
};
