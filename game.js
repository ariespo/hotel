import * as PIXI from 'pixi.js';
import { ACC_NAMES,                  appKey, avatarURL, defaultAppearance, drawAvatar, drawSprite, normalizeApp,            PRESETS, randomAppearance, THEMES } from './src/chargen.js';
import { furnPix, dirtPix, doorPix, equipAnimPix, platePix, ROOM_WALL, T, wallPix } from './src/furniture.js';

const ACTOR_S = 0.5;          // 世界里的小人按 50% 画（美术画布 64×72 → 场内 32×36）

export function tickerDt(tk) {
  if (typeof tk === 'number' && Number.isFinite(tk) && tk > 0) return Math.min(tk / 60, 0.05);
  const ms = Number(tk?.deltaMS);
  if (Number.isFinite(ms) && ms > 0) return Math.min(ms / 1000, 0.05);
  return 1 / 60;
}

import { FLOOR_VARIANTS, floorVariant, glowPix, lightPoolPix, rugTile, wallDecoPix } from './src/floor.js';
import { contactShadow, edgeOcclusion, floorLightTint, nightShadeAlpha, tileWarmth, worldLights } from './src/light.js';
import { hexToNum, mix, PAL, Rng } from './src/pix.js';
import {
  BLUEPRINTS, BED_KINDS, DISHES, DUTY_LABEL, furnDef, furnQualityUnlock,              ING_PRICE,           JOB_COLOR, ROOM_FLOOR, ROOM_LABEL, STAR_THRESHOLDS, styleById, wantById, worldById,
} from './src/data.js';
import { DAY_LEN, applyRecruitmentWorld, makeStaff, newEcon, Sim, worldIngredientPrice } from './src/sim.js';
import { canPersistSim } from './src/save-policy.js';
import { bedDisplayPlacement, bpById, dirDelta,            furnFootprint, rotateRoomPoint,            Tavern, validateCandidateOrError } from './src/world.js';
import {               UI } from './src/ui.js';
import { TitleScreen, validGameSave } from './src/title.js';
import { createSkyPlan, skyBandColor } from './src/sky.js';
import { resetPlayerProfile, savePlayerProfile } from './src/player-profile.js';
import { clampZoom, usableViewport } from './src/camera.js';
import { applyStartLayout, emptyLayoutRefund } from './src/start-layouts.js';
import { parseAndMigrateGameSave, SAVE_SCHEMA_VERSION, stringifyGameSave, legacyLayoutSeal, verifyLegacyLayoutSeal } from './src/save-schema.js';
import { allBgmTracks, bgmManifest, bgmSettingsGroups, bgmTrackById, resolveWorldBgm } from './src/world-bgm.js';
import { applyTutorialFurniturePlaced, applyTutorialRoomPlaced, syncTutorialFurniturePhase, tutorialFurnitureKind, tutorialFurnitureRoomSelection, tutorialMissingFurniture } from './src/tutorial-actions.js';
import { advanceClosingPhase, resumeClosingPhase } from './src/closing-controller.js';
import { runDawnTransition } from './src/dawn-controller.js';
import { advancePendingNightBed } from './src/night-bed-controller.js';
import { parseValidateSave as parseValidateSaveInput } from './src/save-validation.js';
import { pixelWorldVisible as pixelVisible, worldPointVisible as gridVisible } from './src/render-visibility.js';

const SAVE_KEY = 'wjbdy.save.v1';
const MORNING_KEY = 'wjbdy.morning.v1';
const ACTIVE_SLOT_KEY = 'wjbdy.save.active.v1';
const SAVE_SLOT_COUNT = 3;
const MATERIAL_PACK_KEY = 'wjbdy.material-pack.v1';
const TUTORIAL_COMPLETED_KEY = 'wjbdy.tutorial.completed.v1';
const normalizeMaterialPack = (pack) => pack === 'classic' ? 'classic' : 'hd';
const WORLD_ART_SCALE = 4;
const WORLD_MATERIALS = {
  'floor-wood': 'assets/world-materials/floor-walnut-v2.webp',
  'floor-wood2': 'assets/world-materials/floor-walnut-q2.webp',
  'floor-wood3': 'assets/world-materials/floor-walnut-q3.webp',
  'floor-kitchen': 'assets/world-materials/floor-kitchen-v2.webp',
  'floor-kitchen2': 'assets/world-materials/floor-kitchen-q2.webp',
  'floor-kitchen3': 'assets/world-materials/floor-kitchen-q3.webp',
  rug: 'assets/world-materials/rug-wine-v2.webp',
  wall: 'assets/world-materials/wall-beam-v2.webp',
  wall2: 'assets/world-materials/wall-beam-q2.webp',
  wall3: 'assets/world-materials/wall-beam-q3.webp',
  door: 'assets/world-materials/door-frame-v2.webp',
  'floor-storage': 'assets/world-materials/floor-storage-v3.webp',
  'floor-storage2': 'assets/world-materials/floor-storage-q2.webp',
  'floor-storage3': 'assets/world-materials/floor-storage-q3.webp',
  'floor-carpet': 'assets/world-materials/floor-carpet-v3.webp',
  'floor-carpet2': 'assets/world-materials/floor-carpet-q2.webp',
  'floor-carpet3': 'assets/world-materials/floor-carpet-q3.webp',
  'floor-tatami': 'assets/world-materials/floor-tatami-v3.webp',
  'floor-tatami2': 'assets/world-materials/floor-tatami-q2.webp',
  'floor-tatami3': 'assets/world-materials/floor-tatami-q3.webp',
  'floor-neon': 'assets/world-materials/floor-neon-v3.webp',
  'floor-neon2': 'assets/world-materials/floor-neon-q2.webp',
  'floor-neon3': 'assets/world-materials/floor-neon-q3.webp',
  'floor-astral': 'assets/world-materials/floor-astral-v3.webp',
  'floor-astral2': 'assets/world-materials/floor-astral-q2.webp',
  'floor-astral3': 'assets/world-materials/floor-astral-q3.webp',
  'floor-forge': 'assets/world-materials/floor-forge-v3.webp',
  'floor-forge2': 'assets/world-materials/floor-forge-q2.webp',
  'floor-forge3': 'assets/world-materials/floor-forge-q3.webp',
  'floor-frost': 'assets/world-materials/floor-frost-v3.webp',
  'floor-frost2': 'assets/world-materials/floor-frost-q2.webp',
  'floor-frost3': 'assets/world-materials/floor-frost-q3.webp',
  'floor-onsen': 'assets/world-materials/floor-onsen-v3.webp',
  'floor-onsen2': 'assets/world-materials/floor-onsen-q2.webp',
  'floor-onsen3': 'assets/world-materials/floor-onsen-q3.webp',
  'floor-parquet': 'assets/world-materials/floor-parquet-v3.webp',
  'floor-parquet2': 'assets/world-materials/floor-parquet-q2.webp',
  'floor-parquet3': 'assets/world-materials/floor-parquet-q3.webp',
  'floor-garden': 'assets/world-materials/floor-garden-v3.webp',
  'floor-garden2': 'assets/world-materials/floor-garden-q2.webp',
  'floor-garden3': 'assets/world-materials/floor-garden-q3.webp',
  furniture: 'assets/world-materials/furniture-target-v3.webp',
  meetingtable: 'assets/meetingtable.png',
};
const hdQualityName = (base, quality, materials) => {
  if (quality >= 3 && materials.has(base + '3')) return base + '3';
  if (quality >= 2 && materials.has(base + '2')) return base + '2';
  return base;
};
const saveKeyFor = (slot        ) => slot === 1 ? SAVE_KEY : `wjbdy.save.v2.slot.${slot}`;
const morningKeyFor = (slot        ) => slot === 1 ? MORNING_KEY : `wjbdy.morning.v2.slot.${slot}`;
const backupKeyFor = (slot        ) => `wjbdy.save.backup.v3.slot.${slot}`;
const ROOM_BLUEPRINT_KEY = 'wjbdy.room-blueprints.v1';
const LAYOUT_BLUEPRINT_KEY = 'wjbdy.layout-blueprints.v1';
const WORLD_BACKGROUND_IDS = new Set([
  'hearth_coast', 'verdant_court', 'magma_ridge', 'neon_ring', 'moonsea', 'evernight',
  'honey_sky', 'iron_hive', 'mask_realm', 'inverted_dreamsea', 'ash_dragoncourt', 'timeless_bazaar',
]);
const WORLD_LAYERED_BACKGROUND_IDS = new Set(WORLD_BACKGROUND_IDS);
const WORLD_SEPARATE_FAR_BACKGROUND_IDS = new Set(['hearth_coast', 'verdant_court', 'magma_ridge', 'neon_ring']);
const WORLD_BACKGROUND_MOTION = {
  hearth_coast: { x: 10, y: 6, xSpeed: 0.11, ySpeed: 0.085, alpha: 0.39, farAlpha: 1 },
  verdant_court: { x: 8, y: 7, xSpeed: 0.075, ySpeed: 0.06, alpha: 0.28, farAlpha: 1 },
  magma_ridge: { x: 18, y: 8, xSpeed: 0.28, ySpeed: 0.16, alpha: 0.45, farAlpha: 1 },
  neon_ring: { x: 18, y: 4, xSpeed: 0.2, ySpeed: 0.11, alpha: 0.3, farAlpha: 1 },
  moonsea: { x: 12, y: 10, xSpeed: 0.09, ySpeed: 0.14, alpha: 0.38, farAlpha: 1 },
  evernight: { x: 7, y: 5, xSpeed: 0.045, ySpeed: 0.06, alpha: 0.34, farAlpha: 1 },
  honey_sky: { x: 15, y: 8, xSpeed: 0.1, ySpeed: 0.075, alpha: 0.36, farAlpha: 1 },
  iron_hive: { x: 22, y: 6, xSpeed: 0.24, ySpeed: 0.11, alpha: 0.42, farAlpha: 1 },
  mask_realm: { x: 14, y: 10, xSpeed: 0.13, ySpeed: 0.17, alpha: 0.4, farAlpha: 1 },
  inverted_dreamsea: { x: 18, y: 14, xSpeed: 0.12, ySpeed: 0.09, alpha: 0.38, farAlpha: 1 },
  ash_dragoncourt: { x: 12, y: 8, xSpeed: 0.18, ySpeed: 0.13, alpha: 0.44, farAlpha: 1 },
  timeless_bazaar: { x: 9, y: 6, xSpeed: 0.07, ySpeed: 0.19, alpha: 0.36, farAlpha: 1 },
};
const cloneData = (value) => JSON.parse(JSON.stringify(value));
const BGM_TRACKS = allBgmTracks();
const BGM_MANIFEST = bgmManifest();
const AUDIO_CATALOG = [
  ...BGM_MANIFEST,
  ['build', 'assets/sfx-build.wav'], ['place', 'assets/sfx-place.wav'],
  ['serve', 'assets/sfx-serve.wav'], ['coin', 'assets/sfx-coin.wav'], ['portal', 'assets/sfx-portal.wav'],
  ['error', 'assets/sfx-error.wav'], ['chime', 'assets/sfx-chime.wav'], ['happy', 'assets/sfx-happy.wav'],
  ['world-travel', 'assets/world-travel.mp3'],
  ['angry', 'assets/sfx-angry.wav'], ['clean', 'assets/sfx-clean.wav'], ['sizzle', 'assets/sfx-sizzle.wav'],
  ['upgrade', 'assets/sfx-upgrade.wav'], ['upgrade-furn', 'assets/sfx-upgrade-furn.wav'],
  ['upgrade-room', 'assets/sfx-upgrade-room.wav'],
  ['alert', 'assets/sfx-alert.wav'], ['daybell', 'assets/sfx-daybell.wav'],
  ['splash', 'assets/sfx-splash.wav'], ['cue', 'assets/sfx-cue.wav'], ['snore', 'assets/sfx-snore.wav'],
  ['amb', 'assets/amb-tavern.wav'], ['amb-night', 'assets/amb-night.wav'],
];

// ---------- 纹理缓存 ----------
const actorTex = new Map                      ();
// 房间装饰配置：地毯（[边饰色, 主体色]）与墙饰组合
const RUG                                   = {
  bar: ['#C9922F', '#4E2430'], lounge: ['#7FB7C9', '#2A3242'], dining: ['#C9922F', '#3E2836'],
};
const WALL_DECO                           = {
  foyer: ['sconce', 'painting'], dining: ['sconce', 'painting', 'sconce'], kitchen: ['pans', 'sconce'],
  storage: ['crate', 'crate', 'sconce'], bar: ['bottles', 'sconce'], lounge: ['painting', 'sconce'],
};
// 高清墙饰边角还不干净：先整块关掉，只留壁灯。经典材质仍画原来的小像素。
const HD_HIDDEN_WALL_DECOS = new Set(['painting', 'pans', 'bottles', 'crate']);

function texFromCanvas(c                   )               {
  const t = PIXI.Texture.from(c);
  t.source.scaleMode = 'nearest';
  return t;
}
function actorTexture(app            , dir        , pose      , frame        , carry               , keep = 1)               {
  const d = dir === 1 ? 3 : dir;
  const key = `${appKey(app)}|${d}|${pose}|${frame}|${carry || ''}|${keep}`;
  let t = actorTex.get(key);
  if (!t) {
    if (keep < 1) {
      // 泡汤：只保留水面以上的部分（同一张 source 上换 frame，不重画）
      const base = actorTexture(app, dir, pose, frame, carry, 1);
      const h = Math.max(4, Math.round(base.frame.height * keep));
      t = new PIXI.Texture({
        source: base.source,
        frame: new PIXI.Rectangle(base.frame.x, base.frame.y, base.frame.width, h),
      });
    } else {
      t = texFromCanvas(drawSprite(app, d, pose, frame, carry).canvas);
    }
    actorTex.set(key, t);
  }
  return t;
}
const furnTex = new Map                      ();
const FURNITURE_ATLAS_FRAMES = {
  table: [0, 0, 128, 128], table2: [640, 0, 128, 128], table3: [768, 0, 128, 128],
  chair: [128, 0, 128, 128], chair2: [1664, 0, 128, 128], chair3: [1792, 0, 128, 128],
  plant: [256, 0, 128, 128], plant2: [384, 512, 128, 128], plant3: [512, 512, 128, 128],
  desk: [384, 0, 256, 128], desk2: [640, 128, 256, 128], desk3: [896, 128, 256, 128],
  prep: [0, 128, 256, 128], prep2: [1280, 384, 256, 128], prep3: [1536, 384, 256, 128],
  stove: [256, 128, 256, 128], stove2: [1152, 128, 256, 128], stove3: [1408, 128, 256, 128],
  sconce: [512, 128, 128, 128], sconce2: [0, 1408, 128, 128], sconce3: [128, 1408, 128, 128],
  sink: [0, 256, 256, 128], sink2: [1664, 128, 256, 128], sink3: [1024, 256, 256, 128],
  pass: [256, 256, 256, 128], pass2: [1280, 256, 256, 128], pass3: [1536, 256, 256, 128],
  shelf: [512, 256, 256, 128], shelf2: [1792, 256, 256, 128], shelf3: [1024, 384, 256, 128],
  bed: [768, 256, 256, 128], bed2: [1152, 0, 256, 128], bed3: [1408, 0, 256, 128],
  lamp: [0, 384, 128, 128], lamp2: [896, 0, 128, 128], lamp3: [1024, 0, 128, 128],
  couch: [128, 384, 256, 128], couch2: [1792, 384, 256, 128], couch3: [128, 512, 256, 128],
  bunk: [384, 384, 256, 128], bunk2: [1024, 1152, 256, 128], bunk3: [1280, 1152, 256, 128],
  bookshelf: [640, 384, 256, 128], bookshelf2: [512, 1152, 256, 128], bookshelf3: [768, 1152, 256, 128],
  teatable: [896, 384, 128, 128], teatable2: [640, 512, 128, 128], teatable3: [768, 512, 128, 128],
  vanity: [0, 512, 128, 128], vanity2: [1792, 1280, 128, 128], vanity3: [1920, 1280, 128, 128],
  keg: [0, 640, 128, 128], keg2: [1536, 1280, 128, 128], keg3: [1664, 1280, 128, 128],
  lightcol: [128, 640, 128, 128], lightcol2: [256, 1408, 128, 128], lightcol3: [384, 1408, 128, 128],
  statue: [256, 640, 128, 128], statue2: [512, 1408, 128, 128], statue3: [640, 1408, 128, 128],
  clock: [384, 640, 128, 128], clock2: [768, 1408, 128, 128], clock3: [896, 1408, 128, 128],
  banner: [512, 640, 128, 128], banner2: [1024, 1408, 128, 128], banner3: [1152, 1408, 128, 128],
  arcadem: [640, 640, 128, 128], arcadem2: [1280, 1408, 128, 128], arcadem3: [1408, 1408, 128, 128],
  crystal: [768, 640, 128, 128], crystal2: [1536, 1408, 128, 128], crystal3: [1664, 1408, 128, 128],
  painting: [1792, 1408, 128, 128], pans: [1920, 1408, 128, 128],
  bottles: [1536, 1664, 128, 128], crate: [1664, 1664, 128, 128],
  lightbar: [896, 640, 256, 128], lightbar2: [0, 1536, 256, 128], lightbar3: [256, 1536, 256, 128],
  fireplace: [1152, 640, 256, 128], fireplace2: [0, 1152, 256, 128], fireplace3: [256, 1152, 256, 128],
  icebox: [1408, 640, 256, 128], icebox2: [512, 1280, 256, 128], icebox3: [768, 1280, 256, 128],
  bench: [1664, 640, 256, 128], bench2: [512, 1536, 256, 128], bench3: [768, 1536, 256, 128],
  billiardtable: [0, 768, 256, 128], billiardtable2: [1536, 1152, 256, 128], billiardtable3: [1792, 1152, 256, 128],
  piano: [256, 768, 256, 128], piano2: [0, 1280, 256, 128], piano3: [256, 1280, 256, 128],
  screen: [512, 768, 256, 128], screen2: [1024, 1536, 256, 128], screen3: [1280, 1536, 256, 128],
  aquarium: [768, 768, 256, 128], aquarium2: [1536, 1536, 256, 128], aquarium3: [1792, 1536, 256, 128],
  winecabinet: [1024, 768, 256, 128], winecabinet2: [1024, 1280, 256, 128], winecabinet3: [1280, 1280, 256, 128],
  flowerbed: [1280, 768, 256, 128], flowerbed2: [0, 1664, 256, 128], flowerbed3: [256, 1664, 256, 128],
  telescope: [1536, 768, 256, 128], telescope2: [512, 1664, 256, 128], telescope3: [768, 1664, 256, 128],
  cauldron: [1792, 768, 256, 128], cauldron2: [1024, 1664, 256, 128], cauldron3: [1280, 1664, 256, 128],
  doublebed: [0, 896, 256, 256], doublebed2: [1024, 1792, 256, 256], doublebed3: [1280, 1792, 256, 256],
  pool: [256, 896, 256, 256], pool2: [512, 1792, 256, 256], pool3: [768, 1792, 256, 256],
  fountain: [512, 896, 256, 256], fountain2: [0, 1792, 256, 256], fountain3: [256, 1792, 256, 256],
  kingbed: [768, 896, 384, 256], kingbed2: [0, 2048, 384, 256], kingbed3: [384, 2048, 384, 256],
};
function furnitureAtlasTexture(kind, atlas, quality = 1) {
  // 高清升级：有同款豪华帧就换贴图（table2/table3），否则回落基础帧再叠轮廓光。
  const frame = (quality >= 2 && FURNITURE_ATLAS_FRAMES[kind + quality]) || FURNITURE_ATLAS_FRAMES[kind];
  if (!atlas || !frame) return null;
  const key = `atlas|${kind}|${quality}|${frame.join(',')}`;
  let t = furnTex.get(key);
  if (!t) {
    t = new PIXI.Texture({ source: atlas.source, frame: new PIXI.Rectangle(...frame) });
    furnTex.set(key, t);
  }
  return t;
}
function furnTexture(kind        , q        , accent = '#C9922F', atlas = null)               {
  const hd = furnitureAtlasTexture(kind, atlas, q);
  if (hd) return hd;
  const key = kind + q + accent;
  let t = furnTex.get(key);
  if (!t) { t = texFromCanvas(furnPix(kind, q, accent).canvas); furnTex.set(key, t); }
  return t;
}
const dirtTex = new Map                      ();
function dirtTexture(level        )               {
  let t = dirtTex.get(level);
  if (!t) { t = texFromCanvas(dirtPix(level).canvas); dirtTex.set(level, t); }
  return t;
}
const plateTex = new Map                      ();
function plateTexture(color        , dirty         )               {
  const k = color + (dirty ? 'd' : '');
  let t = plateTex.get(k);
  if (!t) { t = texFromCanvas(platePix(color, dirty).canvas); plateTex.set(k, t); }
  return t;
}

// ---------- 音频 ----------
class Audio2 {
  ctx                      = null;
  buffers = new Map                     ();
  music                               = null;
  gain                  = null;
  musicGain                  = null;
  last = new Map                ();
  unlocked = false;
  raws = new Map();

  constructor() { this.loadPrefs(); }

  async prepare(onProgress) {
    const files = AUDIO_CATALOG;
    let done = 0;
    const tick = () => {
      done += 1;
      onProgress?.(done / files.length, `正在备妥乐曲与音效 ${done}/${files.length}`);
    };
    const queue = files.slice();
    await Promise.all(Array.from({ length: 4 }, async () => {
      while (queue.length) {
        const item = queue.shift();
        if (!item) return;
        const [key, url] = item;
        try {
          const res = await fetch(url);
          if (res.ok) this.raws.set(key, await res.arrayBuffer());
        } catch { /* 资源缺失时静音降级 */ }
        tick();
      }
    }));
  }

  async unlock()                {
    if (this.unlocked) return;
    this.unlocked = true;
    const W = window;
    const C = W.AudioContext || W.webkitAudioContext;
    if (!C) return;
    this.ctx = new C();
    this.loadPrefs();
    this.gain = this.ctx.createGain();
    this.gain.gain.value = this.sfxVol;
    this.gain.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = this.musicBase * this.musicVol;
    this.musicGain.connect(this.ctx.destination);
    try { await this.ctx.resume?.(); } catch { /* 部分浏览器需手势后才真正出声 */ }
    const pending = this.raws.size ? [...this.raws] : [];
    if (!pending.length) {
      for (const [key, url] of AUDIO_CATALOG) {
        try {
          const res = await fetch(url);
          if (res.ok) pending.push([key, await res.arrayBuffer()]);
        } catch { /* 资源缺失时静音降级 */ }
      }
    }
    for (const [key, raw] of pending) {
      try {
        const copy = raw.slice(0);
        this.buffers.set(key, await this.ctx.decodeAudioData(copy));
      } catch { /* 解码失败则跳过该轨 */ }
    }
    this.raws.clear();
    this.applyMusic();
    this.playAmb(this.wantAmb);
  }

  /** 环境底噪：营业=酒馆人声炉火 / 收盘=夜间余烬（音乐还没到位，先靠氛围铺底） */
  wantAmb = 'amb-night';
          curAmb = '';
          amb                               = null;
          ambGain                  = null;
  playAmb(name        )       {
    this.wantAmb = name;
    if (!this.ctx) return;
    if (!this.ambGain) {
      this.ambGain = this.ctx.createGain();
      this.ambGain.gain.value = 0.3;
      this.ambGain.connect(this.ctx.destination);
    }
    if (name === this.curAmb) return;
    const b = this.buffers.get(name);
    if (!b) return;
    if (this.amb) { try { this.amb.stop(); } catch (e) { /* 已停止 */ } this.amb = null; }
    const s = this.ctx.createBufferSource();
    s.buffer = b; s.loop = true;
    s.connect(this.ambGain);
    s.start();
    this.amb = s;
    this.curAmb = name;
    this.ambGain.gain.setTargetAtTime(name === 'amb' ? 0.34 : 0.22, this.ctx.currentTime, 0.6);
  }

  /** 分阶段 BGM：按驻留世界选曲；自定义或缺曲时从森冠/艾泽/霓虹/海国同时段随机抽。 */
  wantTrack = '';
  curTrack = '';
  musicPref = 'auto';
  musicPaused = false;

  tracks() { return BGM_TRACKS; }
  trackGroups() { return bgmSettingsGroups(); }

  resolveTrack(name = this.wantTrack) {
    const requested = this.musicPref !== 'auto' ? this.musicPref : name;
    if (requested && this.buffers.has(requested)) return requested;
    const loaded = BGM_TRACKS.filter((track) => this.buffers.has(track.id));
    if (!loaded.length) return '';
    return loaded[Math.floor(Math.random() * loaded.length)].id;
  }

  stopMusic() {
    if (this.music) { try { this.music.stop(); } catch (e) { /* 已停止 */ } this.music = null; }
    this.curTrack = '';
  }

  applyMusic() {
    if (this.musicPaused) { this.stopMusic(); return; }
    if (!this.ctx || !this.musicGain) return;
    const key = this.resolveTrack(this.wantTrack);
    if (!key || key === this.curTrack) return;
    const b = this.buffers.get(key);
    if (!b) return;
    this.stopMusic();
    const s = this.ctx.createBufferSource();
    s.buffer = b; s.loop = true;
    s.connect(this.musicGain);
    s.start();
    this.music = s;
    this.curTrack = key;
  }

  playTrack(name        , force = false)       {
    this.wantTrack = name;
    if (force) this.curTrack = '';
    this.applyMusic();
  }

  setBgmPref(id) {
    this.musicPref = id === 'auto' || !!bgmTrackById(id) ? id : 'auto';
    this.saveVols();
    this.applyMusic();
  }

  pauseMusic() {
    this.musicPaused = true;
    this.saveVols();
    this.stopMusic();
  }

  resumeMusic() {
    this.musicPaused = false;
    this.saveVols();
    this.unlock();
    this.applyMusic();
  }

  /** 游戏内部的阶段基准音量（营业/规划/结算），与玩家音量偏好相乘 */
          musicBase = 0.68;
          musicVol = 1;
          sfxVol = 0.7;

  setMusicLevel(v        )       {
    this.musicBase = v;
    if (this.musicGain && this.ctx) this.musicGain.gain.setTargetAtTime(this.musicBase * this.musicVol, this.ctx.currentTime, 0.4);
  }

  /** 玩家音乐音量偏好 0..1（设置面板拉动条） */
  setMusicVol(v        )       {
    this.musicVol = v;
    if (this.musicGain && this.ctx) this.musicGain.gain.setTargetAtTime(this.musicBase * this.musicVol, this.ctx.currentTime, 0.15);
    this.saveVols();
  }

  setSfxLevel(v        )       {
    this.sfxVol = v;
    if (this.gain && this.ctx) this.gain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.1);
    this.saveVols();
  }

          saveVols()       {
    try {
      localStorage.setItem('wjbdy.vol.v1', JSON.stringify({
        mv: this.musicVol, sv: this.sfxVol, bgm: this.musicPref, paused: this.musicPaused,
      }));
    } catch (err) { /* 忽略 */ }
  }

  loadPrefs() {
    try {
      const p = JSON.parse(localStorage.getItem('wjbdy.vol.v1') || 'null');
      if (!p || typeof p !== 'object') return;
      if (typeof p.mv === 'number') this.musicVol = p.mv;
      if (typeof p.sv === 'number') this.sfxVol = p.sv;
      // 曲目锁定只对本次打开有效：刷新后回到跟随世界/时段，避免一直播上次试听的那一首。
      this.musicPref = 'auto';
      this.musicPaused = !!p.paused;
    } catch (err) { /* 忽略 */ }
  }

  curVolumes()                           {
    return { m: this.musicVol, s: this.sfxVol, bgm: this.musicPref, paused: this.musicPaused, playing: !!this.music, current: this.curTrack };
  }

  playOutcome(success, vol = 0.85) {
    this.play(success ? 'happy' : 'error', vol);
  }

  play(name        , vol = 1)       {
    if (!this.ctx || !this.gain) return;
    const now = performance.now();
    const last = this.last.get(name) || 0;
    if (now - last < 120) return;
    this.last.set(name, now);
    const b = this.buffers.get(name);
    if (!b) return;
    const s = this.ctx.createBufferSource();
    s.buffer = b;
    const g = this.ctx.createGain();
    g.gain.value = vol;
    s.connect(g); g.connect(this.gain);
    s.start();
  }

  playMusicCue(name        , vol = 1)          {
    if (!this.ctx) return null;
    const b = this.buffers.get(name);
    if (!b) return null;
    const s = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    s.buffer = b;
    gain.gain.value = Math.max(0, Math.min(1, vol * this.musicVol));
    s.connect(gain); gain.connect(this.ctx.destination); s.start();
    return s;
  }
}

// ---------- 游戏 ----------
export class Game                    {
  app                   ;
  world = new PIXI.Container();
  floorLayer = new PIXI.Container();
  lightLayer = new PIXI.Container();
  wallLayer = new PIXI.Graphics();
  dirtLayer = new PIXI.Container();
  furnLayer = new PIXI.Container();
          furnSprites                = [];
  itemLayer = new PIXI.Container();
  actorLayer = new PIXI.Container();
  overlay = new PIXI.Graphics();
  upgradeFxLayer = new PIXI.Container();
  upgradeFx = [];
  labelLayer = new PIXI.Container();
  speechLayer = new PIXI.Graphics();
  stars = new PIXI.Graphics();
  starGlintsA = new PIXI.Graphics();
  starGlintsB = new PIXI.Graphics();
  worldBackgroundFar = new PIXI.Container();
  worldBackgroundMid = new PIXI.Container();
  worldBackgroundWeather = new PIXI.Graphics();
  worldTravelLayer = new PIXI.Container();
  worldBackgroundMask = new PIXI.Graphics();
  worldBackgroundId = '';
  worldBackgroundLoad = 0;
  worldBackgroundFarSprite = null;
  worldBackgroundMidSprite = null;
  worldBackgroundFarScale = 1;
  worldBackgroundMidScale = 1;
  worldBackgroundParticles = [];
  worldTravelActive = false;
  tutorialCinematicActive = false;
  tutorialCompletionT = 0;
  pendingNightBed = false;
  tutorialTravelAnimator = null;
  worldTravelSprite = null;
  worldTravelVideo = null;

  tavern = new Tavern();
  sim      ;
  ui     ;
  audio = new Audio2();

  cam = { x: 6, y: 5 };
  zoom = 2;
  paused = false;
  creatorPending = true;
  titleActive = true;
  titleScreen = null;
  speed = 1;
  heat = 'off';
  /** 仅供自测读取：本帧热图着色格数 */
  heatCells = 0;
  perfStats = { renderedActors: 0, culledActors: 0, renderedItems: 0, culledItems: 0, frames: 0, frameMs: 0, frameP95Ms: 0, longFrames: 0 };
  perfFrameSamples = [];
  buildBp                = null;
  buildFurn                = null;
  buildQuality = 1;
  buildRot = 0;
  selection                                      = null;
  hover = { x: 0, y: 0 };
  frameErrors = 0;
  staticVersion = -1;
  dirtVersion = -1;
  keys = new Set        ();
  manualInput = { x: 0, y: 0 };
          lastTap                                             = null;
  drag                                                                                          = null;
  pointers = new Map                                  ();
  pinchDist = 0;
  labels              = [];
  floorTextures = new Map                      ();
  floorBase = new Map                           ();
  worldMaterials = new Map();
  decoSprites = new PIXI.Container();
  pixTex = new Map                      ();
  wallSprites = new PIXI.Container();
  nightShades = [];
  ownerName = '店主';
  currentSlot = 1;
  materialPack = normalizeMaterialPack(localStorage.getItem(MATERIAL_PACK_KEY));
  static MANUAL_KEY = 'wjbdy.manual.v1';
          lastW = 0;
          lastH = 0;

  get blocked()          { return this.titleActive || this.creatorPending || this.worldTravelActive || this.tutorialCinematicActive || !!(this.ui && this.ui.modal) || !!this.sim?.nightState?.dawn?.active; }

  async boot()                {
    document.documentElement.dataset.materialPack = this.materialPack;
    const host = document.getElementById('app')               ;
    this.titleScreen = new TitleScreen(document.body);
    const note = (ratio, text) => this.titleScreen.setProgress(ratio, text);
    note(0.04, '正在打开位面门…');
    this.app = new PIXI.Application();
    await this.app.init({ resizeTo: host, background: PAL.voidBg, antialias: false, roundPixels: true });
    host.appendChild(this.app.canvas);
    note(0.1, '正在点亮旅店灯火…');
    try {
      const f = new FontFace('FusionPixel', "url('assets/lib/fusion-pixel/FusionPixel-12px-zh_hans.woff2')");
      await f.load();
      document.fonts.add(f);
    } catch (e) { /* 字体缺失时回退系统字体 */ }
    note(0.16, '正在安放招牌字体…');
    const floors = ['floor-wood', 'floor-kitchen', 'floor-storage', 'floor-carpet',
      'floor-neon', 'floor-astral', 'floor-forge', 'floor-frost',
      'floor-tatami', 'floor-onsen', 'floor-parquet', 'floor-garden'];
    for (let i = 0; i < floors.length; i++) {
      const name = floors[i];
      try {
        const tex = await PIXI.Assets.load(`assets/${name}.png`);
        tex.source.scaleMode = 'nearest';
        tex.source.addressMode = 'repeat';
        this.floorTextures.set(name, tex);
        const res = (tex.source                                     ).resource;
        if (res) this.floorBase.set(name, res                     );
      } catch (e) { /* 缺失贴图用纯色兜底 */ }
      note(0.16 + ((i + 1) / floors.length) * 0.18, `正在铺设地板 ${i + 1}/${floors.length}`);
    }
    const mats = Object.entries(WORLD_MATERIALS);
    for (let i = 0; i < mats.length; i++) {
      const [name, url] = mats[i];
      try {
        const tex = await PIXI.Assets.load(url);
        tex.source.scaleMode = 'linear';
        this.worldMaterials.set(name, tex);
      } catch (e) { /* 高清材质缺失时保留原有程序贴图 */ }
      note(0.34 + ((i + 1) / mats.length) * 0.28, `正在擦亮店面材质 ${i + 1}/${mats.length}`);
    }
    await this.audio.prepare((p, text) => note(0.62 + p * 0.36, text));
    note(0.99, '灯火即将点亮…');
    this.app.stage.addChild(this.stars, this.worldBackgroundFar, this.worldBackgroundMid, this.worldBackgroundMask, this.starGlintsA, this.starGlintsB, this.worldBackgroundWeather, this.worldTravelLayer, this.world, this.labelLayer);
    this.worldBackgroundMask.renderable = false;
    this.world.addChild(this.floorLayer, this.lightLayer, this.wallLayer, this.wallSprites, this.decoSprites, this.dirtLayer, this.furnLayer, this.itemLayer, this.actorLayer, this.upgradeFxLayer, this.overlay);
    this.actorLayer.sortableChildren = true;
    this.labelLayer.addChild(this.speechLayer);
    for (let i = 0; i < 32; i++) {
      const t = new PIXI.Text({ text: '', style: { fontFamily: 'FusionPixel, monospace', fontSize: 11, fill: 0xffe6b0 } });
      t.visible = false;
      this.labelLayer.addChild(t);
      this.labels.push(t);
    }
    this.drawStars();

    this.sim = new Sim(this.tavern, newEcon(Math.floor(Math.random() * 1e9)));
    this.ui = new UI(this);
    this.ui.root.inert = true;
    this.ui.root.setAttribute('aria-hidden', 'true');
    this.ui.root.style.visibility = 'hidden';
    this.bindInput();
    this.creatorPending = false;
    this.currentSlot = this.readActiveSlot();
    const slots = this.saveSlots();
    if (!slots.some((slot) => slot.slot === this.currentSlot && slot.valid)) {
      this.currentSlot = slots.find((slot) => slot.valid)?.slot || this.currentSlot;
    }
    this.titleScreen.activate({
      hasSave: slots.some((slot) => slot.valid),
      slots,
      onInteract: () => this.audio.unlock(),
      onChoose: (action, slot) => this.chooseTitleAction(action, slot),
    });

    this.app.ticker.add((tk) => {
      // pixi 的 ticker 一旦在回调里抛异常就不会再申请下一帧 —— 整个游戏会静默冻结。
      try { this.frame(tickerDt(tk)); }
      catch (err) { this.frameErrors++; if (this.frameErrors <= 3) console.error('frame error', err); }
    });
    this.ui.render(true);
    (window                                     ).__gpReady = true;
    (window                                   ).__debug = {
      game: this, sim: () => this.sim, tavern: () => this.tavern,
      openDay: () => this.openDay(), forceClose: () => this.finishDay(),
      chargen: { drawSprite, drawAvatar, defaultAppearance, randomAppearance, THEMES, normalizeApp, PRESETS, ACC_NAMES, appKey, avatarURL },
      state: () => ({
        day: this.sim.econ.day, coins: Math.round(this.sim.econ.coins), rep: this.sim.econ.rep,
        rooms: this.tavern.rooms.length, furns: this.tavern.furns.length, staff: this.sim.staff.length,
        guests: this.sim.guests.length, orders: this.sim.orders.map((o) => o.stage), dayT: this.sim.dayT,
        running: this.sim.running, blocked: this.blocked, paused: this.paused, stars: this.sim.stars(),
        heat: this.heat, heatCells: this.heatCells, sealed: this.sim.sealed,
      }),
    };
  }

  chooseTitleAction(action        , slot = this.currentSlot)          {
    this.audio.play('chime', 0.7);
    this.currentSlot = this.normalizeSlot(slot);
    this.rememberActiveSlot();
    if (action === 'continue') {
      const saved = localStorage.getItem(saveKeyFor(this.currentSlot));
      if (!validGameSave(saved)) return false;
      try {
        this.loadFrom(saved);
        this.sim.manualOwner = this.manualPref();
        this.creatorPending = false;
      } catch (err) {
        localStorage.removeItem(saveKeyFor(this.currentSlot));
        return false;
      }
      this.titleActive = false;
      this.ui.root.inert = false;
      this.ui.root.removeAttribute('aria-hidden');
      this.ui.root.style.visibility = '';
      this.playStageMusic(this.sim.dayActive ? 'open' : 'close');
      this.audio.playAmb(this.sim.dayActive ? 'amb' : 'amb-night');
      this.ui.render(true);
      this.ui.resumeTutorial();
      return true;
    }
    this.titleActive = false;
    this.ui.root.inert = false;
    this.ui.root.removeAttribute('aria-hidden');
    this.ui.root.style.visibility = '';
    this.newGame(this.currentSlot);
    return true;
  }

  // ---------- 初始局 ----------
  startCreator()       {
    this.creatorPending = true;
    const openOwner = (app0, name0, sex0, seed = {}) => {
      this.ui.openCreator(app0, name0, (app, name, sex, ownerOptions) => {
        this.ui.openTavernSetup({
          ownerName: name,
          tavernPreset: ownerOptions.tavernPreset,
          tavernName: ownerOptions.tavernName,
          tavernBlurb: ownerOptions.tavernBlurb,
          startLayout: ownerOptions.startLayout,
          quickStart: ownerOptions.quickStart,
        }, (tavern) => {
          this.newTavern(app, name, sex, { ...ownerOptions, ...tavern });
          this.creatorPending = false;
          this.ui.render(true);
        }, (tavern) => {
          openOwner(app, name, sex, { ...ownerOptions, ...tavern });
        });
      }, false, sex0, seed);
    };
    openOwner(defaultAppearance(), '店主', '女', {});
  }

  newTavern(app            , name        , sex        , ownerOptions = {})       {
    const previous = { tavern: this.tavern, sim: this.sim, ownerName: this.ownerName, cam: this.cam, selection: this.selection, history: this.buildHistory, historyIndex: this.buildHistoryIndex };
    try {
    this.tavern = new Tavern();
    this.sim = new Sim(this.tavern, newEcon(Math.floor(Math.random() * 1e9)));
    this.ownerName = name;
    this.sim.econ.tavernName = String(ownerOptions.tavernName || '多元便携旅店').trim().slice(0, 24) || '多元便携旅店';
    this.sim.econ.tavernBlurb = String(ownerOptions.tavernBlurb || '').trim().slice(0, 240);
    const t = this.tavern;
    // 新档固定从玩家休息室开始；旧入口参数仅保留给兼容调用方。
    const quickStart = !!ownerOptions.quickStart;
    let tutorialExperienced = false;
    try { tutorialExperienced = localStorage.getItem(TUTORIAL_COMPLETED_KEY) === '1'; } catch (_) { /* ignore */ }
    const layout = applyStartLayout(t, quickStart ? 'quick-start' : 'playerroom');
    this.sim.econ.coins = quickStart ? 1320 : 3200;
    this.sim.econ.day = quickStart ? 2 : 1;
    this.sim.campaign = tutorialExperienced
      ? { mode: 'free', phase: 'prepare', chapter: 0, firstDayComplete: false, quickStartUnlocked: true, tutorialFlags: { tutorialComplete: true }, postReportEvents: [], firstGrantClaimed: false }
      : quickStart
        ? { mode: 'tutorial', phase: 'prepare', chapter: 2, firstDayComplete: true, quickStartUnlocked: true, tutorialFlags: { quickStart: true }, postReportEvents: [], firstGrantClaimed: true }
        : { mode: 'tutorial', phase: 'tutorial-build', chapter: 1, firstDayComplete: false, quickStartUnlocked: false, tutorialFlags: {}, postReportEvents: [], firstGrantClaimed: false };
    if (layout.refund) {
      const refund = emptyLayoutRefund();
      this.sim.econ.coins += refund;
      this.sim.toast(`空门厅开局：经典分馆造价 ${refund} 界币已全额退回账面`);
    }
    const owner = makeStaff(this.sim.rng, this.sim.id(), true, app, name, ownerOptions);
    owner.sex = sex;
    savePlayerProfile(ownerOptions.profile || {}, this.currentSlot);
    // 玩家出生在不可拆卸的私人休息室；公共入口专供客人和候选员工使用。
    const ownerRoom = t.rooms.find((r) => r.kind === 'playerroom') || t.rooms.find((r) => r.kind === 'foyer');
    const e = ownerRoom ? { x: ownerRoom.x + Math.floor(ownerRoom.w / 2), y: ownerRoom.y } : t.entrance();
    owner.x = e.x; owner.y = e.y + 1;
    owner.job = 'free';
    this.sim.staff.push(owner);
    this.sim.refreshPool();
    // 固定教学首日必须让店主自动接活；旧的直控偏好不能让新档开门后原地不动。
    this.sim.manualOwner = quickStart ? this.manualPref() : false;
    this.sim.toast(`${name}接过了钥匙：${this.sim.econ.tavernName}，开张了。`);
    this.staticVersion = -1;
    this.cam = { x: 2, y: layout.id === 'empty' ? 2 : 3 };
    if (this.ui.compact) this.fitView();
    this.selection = null;
    this.resetBuildHistory('开局布局');
    this.saveMorning();
    this.save();
    this.playStageMusic('close');
    if (this.sim.campaign.mode === 'tutorial') this.ui.startTutorial(true);
    else { this.ui.tutorialActive = false; this.ui.render(true); }
    } catch (error) {
      this.tavern = previous.tavern; this.sim = previous.sim; this.ownerName = previous.ownerName; this.cam = previous.cam; this.selection = previous.selection; this.buildHistory = previous.history; this.buildHistoryIndex = previous.historyIndex;
      throw error;
    }
  }

  // ---------- 存档 ----------
  normalizeSlot(slot        )         { return Math.max(1, Math.min(SAVE_SLOT_COUNT, Math.round(Number(slot) || 1))); }

  readActiveSlot()         {
    try { return this.normalizeSlot(localStorage.getItem(ACTIVE_SLOT_KEY)); } catch (e) { return 1; }
  }

  rememberActiveSlot()       {
    try { localStorage.setItem(ACTIVE_SLOT_KEY, String(this.currentSlot)); } catch (e) { /* ignore */ }
  }

  saveSlots()       {
    const out = [];
    for (let slot = 1; slot <= SAVE_SLOT_COUNT; slot++) {
      const raw = localStorage.getItem(saveKeyFor(slot));
      let data = null;
      try { data = raw ? this.parseValidateSave(raw).data : null; } catch (e) { /* invalid */ }
      const valid = !!data;
      out.push({
        slot, valid,
        hasBackup: (() => { try { this.parseValidateSave(localStorage.getItem(backupKeyFor(slot))); return true; } catch (error) { return false; } })(),
        ownerName: valid ? (data.ownerName || '店主') : '',
        day: valid ? (data.sim?.econ?.day || 1) : 0,
        coins: valid ? Math.round(data.sim?.econ?.coins || 0) : 0,
        stars: valid ? Math.max(0, Math.min(5, STAR_THRESHOLDS.filter((need) => (data.sim?.econ?.rep || 0) >= need).length - 1)) : 0,
        savedAt: valid ? (data.meta?.savedAt || 0) : 0,
      });
    }
    return out;
  }

  save(slot = this.currentSlot, manual = false)       {
    // 营业中的客人、订单、路径和计时是瞬时状态，当前存档格式有意不保存它们。
    // 因此营业中不覆盖稳定的收盘规划存档；刷新/重开会回到开门前检查点。
    if (!canPersistSim(this.sim)) return false;
    slot = this.normalizeSlot(slot);
    const data = {
      tavern: this.tavern.serialize(), sim: this.sim.serialize(), ownerName: this.ownerName, cam: this.cam, zoom: this.zoom,
      meta: { version: SAVE_SCHEMA_VERSION, slot, savedAt: Date.now(), manual: !!manual },
    };
    if (this.tavern.legacy && this.sim.campaign?.mode === 'legacy') data.meta.legacySeal = legacyLayoutSeal(data.tavern);
    try { this.parseValidateSave(data); } catch (e) { this.sim.toast(`存档校验失败：${e.message}`); return false; }
    try {
      const old = localStorage.getItem(saveKeyFor(slot));
      if (old) { try { const validOld = this.parseValidateSave(old); localStorage.setItem(backupKeyFor(slot), stringifyGameSave(validOld.data)); } catch (error) { /* 不用坏档覆盖备份 */ } }
      localStorage.setItem(saveKeyFor(slot), stringifyGameSave(data));
    } catch (e) { return false; }
    return true;
  }

  saveToSlot(slot        )          {
    if (!canPersistSim(this.sim)) { this.sim.toast('营业中不能主动存档：请先完成今日营业'); this.audio.play('error'); return false; }
    const targetSlot = this.normalizeSlot(slot);
    const ok = this.save(targetSlot, true);
    if (ok) { this.currentSlot = targetSlot; this.rememberActiveSlot(); this.sim.toast(`已主动保存到档位 ${this.currentSlot}`); this.audio.play('chime', 0.7); }
    return ok;
  }

  loadSlot(slot        )          {
    slot = this.normalizeSlot(slot);
    let raw = localStorage.getItem(saveKeyFor(slot));
    let validated; let fromBackup = false; const previousMain = localStorage.getItem(saveKeyFor(slot));
    try { validated = this.parseValidateSave(raw); } catch (error) {
      const backup = localStorage.getItem(backupKeyFor(slot));
      try {
        validated = this.parseValidateSave(backup);
        raw = stringifyGameSave(validated.data);
        fromBackup = true;
        localStorage.setItem(saveKeyFor(slot), raw);
        this.sim.toast(`档位 ${slot} 主存档损坏，已自动恢复最近备份`);
      } catch (backupError) { this.sim.toast(`档位 ${slot} 没有可读取的存档`); this.audio.play('error'); return false; }
    }
    try {
      this.loadFrom(validated);
      this.currentSlot = slot;
      this.rememberActiveSlot();
      this.creatorPending = false;
      this.ui.closeModal();
      this.playStageMusic(this.sim.dayActive ? 'open' : 'close');
      this.audio.playAmb(this.sim.dayActive ? 'amb' : 'amb-night');
      this.sim.toast(`已读取档位 ${slot}`);
      this.ui.render(true);
      this.ui.resumeTutorial();
      return true;
    } catch (e) { if (fromBackup) { try { if (previousMain == null) localStorage.removeItem(saveKeyFor(slot)); else localStorage.setItem(saveKeyFor(slot), previousMain); } catch (_) { /* 保持运行态 */ } } this.sim.toast(`档位 ${slot} 读取失败`); this.audio.play('error'); return false; }
  }

  saveMorning()       {
    const saveKey = saveKeyFor(this.currentSlot);
    try { localStorage.setItem(morningKeyFor(this.currentSlot), localStorage.getItem(saveKey) || JSON.stringify({ tavern: this.tavern.serialize(), sim: this.sim.serialize(), ownerName: this.ownerName })); } catch (e) { /* ignore */ }
  }
  hasMorningSave()          { return !!localStorage.getItem(morningKeyFor(this.currentSlot)); }

  exportSave(slot = this.currentSlot) {
    slot = this.normalizeSlot(slot);
    const raw = localStorage.getItem(saveKeyFor(slot));
    let data;
    try { data = this.parseValidateSave(raw).data; } catch (error) { this.sim.toast(`档位 ${slot} 无法导出：${error.message}`); return false; }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = `多元便携旅店-档位${slot}-第${data.sim.econ.day}天.json`;
    anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    this.sim.toast(`已导出档位 ${slot} 的 JSON 存档`);
    return true;
  }

  importSaveText(raw, slot = this.currentSlot) {
    slot = this.normalizeSlot(slot);
    try {
      const { data } = this.parseValidateSave(raw);
      data.meta = { ...data.meta, version: SAVE_SCHEMA_VERSION, slot, importedAt: Date.now(), savedAt: Date.now() };
      const current = localStorage.getItem(saveKeyFor(slot));
      if (current) { try { this.parseValidateSave(current); localStorage.setItem(backupKeyFor(slot), current); } catch (error) { /* ignore */ } }
      localStorage.setItem(saveKeyFor(slot), stringifyGameSave(data));
      this.sim.toast(`已导入并迁移到档位 ${slot}`);
      return true;
    } catch (error) { this.sim.toast(`导入失败：${error.message}`); this.audio.play('error'); return false; }
  }

  restoreBackup(slot = this.currentSlot) {
    slot = this.normalizeSlot(slot);
    const raw = localStorage.getItem(backupKeyFor(slot));
    let validated; try { validated = this.parseValidateSave(raw); } catch (error) { this.sim.toast(`档位 ${slot} 没有可恢复的有效备份`); return false; }
    try { localStorage.setItem(saveKeyFor(slot), stringifyGameSave(validated.data)); } catch (error) { this.sim.toast(`档位 ${slot} 备份写入失败`); return false; }
    this.sim.toast(`已恢复档位 ${slot} 的最近备份`);
    return true;
  }

  parseValidateSave(raw) {
    const result = parseValidateSaveInput(raw);
    return { data: result.normalizedData, mode: result.trustedMode, sourceVersion: result.sourceVersion, strictLoadedTavern: result.strictLoadedTavern };
  }

  playStageMusic(phase, force = false) {
    const world = this.sim?.currentWorld?.();
    const festival = this.sim?.currentWorldFestival?.();
    const id = resolveWorldBgm({
      worldId: world?.id,
      phase,
      festivalName: festival?.name,
    });
    if (force) {
      const locked = this.audio.musicPref;
      this.audio.musicPref = 'auto';
      this.audio.playTrack(id, true);
      this.audio.musicPref = locked;
      return;
    }
    this.audio.playTrack(id);
  }

  setManualOwner(v         )       {
    this.sim.manualOwner = v;
    this.manualInput.x = 0; this.manualInput.y = 0;
    this.sim.manualVec.x = 0; this.sim.manualVec.y = 0;
    try { localStorage.setItem(Game.MANUAL_KEY, v ? '1' : '0'); } catch (e) { /* 隐私模式下忽略 */ }
    const own = this.sim.staff.find((x) => x.isOwner);
    if (own) { own.task = null; own.path = []; own.bubble = { text: v ? '听你指挥！' : '我自己忙去', t: 1.6 }; }
    this.sim.invalidateTasks?.(v ? 'owner-manual' : 'owner-auto');
    this.sim.toast(v ? (this.ui.compact || this.ui.touchUi ? '已开启直控：点按屏下方向键移动，右侧交互相当于 E' : '已开启直控：WASD / 方向键移动店主') : '已关闭直控：店主恢复自动干活，WASD 平移镜头');
  }

  setMaterialPack(pack) {
    pack = normalizeMaterialPack(pack);
    document.documentElement.dataset.materialPack = pack;
    if (pack === this.materialPack) return;
    this.materialPack = pack;
    try { localStorage.setItem(MATERIAL_PACK_KEY, pack); } catch (e) { /* 隐私模式下忽略 */ }
    this.staticVersion = -1;
    this.ui?.root.classList.toggle('material-hd', pack === 'hd');
    this.sim.toast(pack === 'hd' ? '已切换高清材质' : '已切换经典材质');
  }

  setManualInput(x        , y        )       {
    this.manualInput.x = Math.max(-1, Math.min(1, x));
    this.manualInput.y = Math.max(-1, Math.min(1, y));
  }

  manualPref()          {
    try { return localStorage.getItem(Game.MANUAL_KEY) === '1'; } catch (e) { return false; }
  }

  loadFrom(json        )       {
    const previousTavern = this.tavern, previousSim = this.sim, previousOwnerName = this.ownerName;
    try {
    let sourceVersion = 0; try { const raw = typeof json === 'string' ? JSON.parse(json) : json; sourceVersion = Number(raw?.meta?.version ?? raw?.version) || 0; } catch { sourceVersion = 0; }
    const parsed = json?.normalizedData ? json : json?.data ? json : parseValidateSaveInput(json);
    const data = parsed.normalizedData || parsed.data
                                                                                                                        
                                                                                          
                                                                       
     ;
    const requestedMode = data.sim?.campaign?.mode;
    const trustedMode = parsed.trustedMode || parsed.mode || (requestedMode === 'legacy' && verifyLegacyLayoutSeal(data) ? 'legacy' : requestedMode === 'free' ? 'free' : 'tutorial');
    this.tavern = parsed.strictLoadedTavern || Tavern.load(data.tavern, { mode: trustedMode === 'legacy' ? 'legacy' : 'tutorial', strict: true });
    this.sim = new Sim(this.tavern, data.sim.econ);
    data.sim.campaign = { ...(data.sim.campaign || {}), mode: trustedMode };
    this.tavern.legacy = trustedMode === 'legacy';
    this.sim.loadState(data.sim);
    this.resumeCampaignPhase();
    for (const st of this.sim.staff) st.app = normalizeApp(st.app);   // 旧存档的外观字段夹到新模型范围
    for (const st of this.sim.pool) st.app = normalizeApp(st.app);
    for (const ad of this.sim.ads) for (const c of ad.cands) c.app = normalizeApp(c.app);
    this.ownerName = data.ownerName || '店主';
    if (data.cam) this.cam = data.cam;
    if (data.zoom) this.zoom = data.zoom;
    if (this.ui.compact) this.fitView();
    this.staticVersion = -1;
    this.selection = null;
    this.buildBp = null; this.buildFurn = null; this.moveRoomId = null; this.moveFurnId = null;
    this.clearPlacementConfirmation();
    this.resetBuildHistory('读取存档');
    } catch (error) {
      this.tavern = previousTavern; this.sim = previousSim; this.ownerName = previousOwnerName;
      throw error;
    }
  }

  resumeCampaignPhase() {
    const phase = this.sim.campaign?.phase;
    if (this.sim.nightState?.dawn?.active) {
      runDawnTransition(this.sim, { onStage: (stage) => this.ui.showDawnTransition?.(stage), animate: (done, stage) => this.playDawnTransition(done, stage), onComplete: () => { if (this.sim.finishNight({ force: false })) { this.save(); this.ui.hideDawnTransition?.(); if (!this.startDayThreeWorldIntro()) this.ui.render(true); } } });
      return 'dawn';
    }
    if (phase === 'report' && this.sim.lastStat) this.ui.openSettlement(this.sim.lastStat);
    else if (phase === 'post-report-events') this.ui.afterSettlementClose();
    else if (phase === 'meeting') this.ui.openMeeting(this.sim.econ.day === 1);
    else if (phase === 'closing-title' || phase === 'closing-assemble') { this.closingState = { t: 0 }; resumeClosingPhase(this.sim); this.ui.render(true); }
    else if (phase === 'world-intro') this.startDayThreeWorldIntro();
    return phase;
  }

  newGame(slot = this.currentSlot)       {
    this.currentSlot = this.normalizeSlot(slot);
    this.rememberActiveSlot();
    localStorage.removeItem(saveKeyFor(this.currentSlot));
    localStorage.removeItem(morningKeyFor(this.currentSlot));
    localStorage.removeItem(backupKeyFor(this.currentSlot));
    resetPlayerProfile(this.currentSlot);
    this.ui.closeModal();
    this.tavern = new Tavern();
    this.sim = new Sim(this.tavern, newEcon(Math.floor(Math.random() * 1e9)));
    this.staticVersion = -1;
    this.startCreator();
  }

  loadMorning()       {
    const m = localStorage.getItem(morningKeyFor(this.currentSlot));
    if (!m) return;
    this.loadFrom(m);
    this.sim.sealed = false;
    this.sim.econ.strikes = 0;
    this.ui.closeModal();
    this.creatorPending = false;
    this.playStageMusic(this.sim.dayActive ? 'open' : 'close');
    this.sim.toast('已读取晨间存档');
    this.save();
    this.ui.resumeTutorial();
  }

  // ---------- 输入 ----------
  bindInput()       {
    const cv = this.app.canvas;
    cv.style.touchAction = 'none';
    cv.addEventListener('pointerdown', (e) => {
      this.audio.unlock();
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.pointers.size === 2) {
        const p = [...this.pointers.values()];
        this.pinchDist = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
        this.drag = null;
        return;
      }
      const t = this.screenToTile(e.clientX, e.clientY);
      this.hover = t;
      this.drag = { x: e.clientX, y: e.clientY, camx: this.cam.x, camy: this.cam.y, moved: false, id: e.pointerId };
    });
    cv.addEventListener('pointermove', (e) => {
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      this.hover = this.screenToTile(e.clientX, e.clientY);
      if (this.pointers.size === 2) {
        const p = [...this.pointers.values()];
        const d = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
        if (this.pinchDist > 0 && Math.abs(d - this.pinchDist) > 60) {
          this.setZoom(this.zoom * (d > this.pinchDist ? 1.12 : 0.89));
          this.pinchDist = d;
        }
        return;
      }
      if (!this.drag || e.pointerId !== this.drag.id) return;
      const dx = e.clientX - this.drag.x, dy = e.clientY - this.drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 8) this.drag.moved = true;
      if (this.drag.moved) {
        this.cam.x = this.drag.camx - dx / (T * this.zoom);
        this.cam.y = this.drag.camy - dy / (T * this.zoom);
      }
    });
    cv.addEventListener('pointerup', (e) => {
      this.pointers.delete(e.pointerId);
      if (this.pointers.size < 2) this.pinchDist = 0;
      if (!this.drag || e.pointerId !== this.drag.id) { this.drag = null; return; }
      const moved = this.drag.moved;
      this.drag = null;
      if (moved) return;
      const t = this.screenToTile(e.clientX, e.clientY);
      const editMode = !!(this.buildBp || this.buildFurn || this.moveRoomId !== null || this.moveFurnId !== null);
      this.click(t.x, t.y, e.button === 2);
      if (editMode) { this.lastTap = null; return; }
      // 双击同一格上的员工 → 详情页
      const now = performance.now();
      if (this.lastTap && now - this.lastTap.t < 420 && Math.abs(this.lastTap.x - t.x) <= 1 && Math.abs(this.lastTap.y - t.y) <= 1) {
        this.lastTap = null;
        if (!this.requestNightBedAt(t.x, t.y)) this.openDetailAt(t.x, t.y);
      } else this.lastTap = { t: now, x: t.x, y: t.y };
    });
    cv.addEventListener('pointercancel', (e) => { this.pointers.delete(e.pointerId); this.drag = null; });
    cv.addEventListener('dblclick', (e) => {
      if (this.buildBp || this.buildFurn || this.moveRoomId !== null || this.moveFurnId !== null) return;
      const t = this.screenToTile(e.clientX, e.clientY);
      if (!this.requestNightBedAt(t.x, t.y)) this.openDetailAt(t.x, t.y);
    });
    cv.addEventListener('contextmenu', (e) => { e.preventDefault(); this.cancelBuild(); });
    cv.addEventListener('wheel', (e) => { e.preventDefault(); this.setZoom(this.zoom * (e.deltaY < 0 ? 1.15 : 0.87)); }, { passive: false });
    window.addEventListener('keydown', (e) => {
      const tag = (e.target               ).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      this.keys.add(e.key.toLowerCase());
      const k = e.key.toLowerCase();
      if (this.sim.nightState?.dawn?.active || this.tutorialCinematicActive) { e.preventDefault(); this.keys.clear(); this.sim.manualVec.x = 0; this.sim.manualVec.y = 0; return; }
      if (k === ' ') { this.setPaused(!this.paused); e.preventDefault(); }
      else if (k === '1') this.setSpeed(1);
      else if (k === '2') this.setSpeed(2);
      else if (k === '3') this.setSpeed(4);
      else if (k === 'b') { this.ui.leftTab = 'room'; this.ui.render(true); }
      else if (k === 'r') {
        if (this.buildBp || this.buildFurn || this.moveFurnId !== null) this.rotateBuild();
        else if (this.selection && this.selection.kind === 'furn') this.rotateFurn(this.selection.id);
      }
      else if (k === 'escape') {
        // 会议是日报后的必经经营阶段：主会议 modal 不提供 X/ESC 旁路，
        // 只能使用“提前散会”确认或返回会议专用按钮。
        if (this.sim.campaign?.phase === 'meeting' && this.ui.modal) { this.sim.toast('请在会议中选择议题，或使用“结束会议”'); e.preventDefault(); return; }
        this.cancelBuild(); this.selection = null; this.ui.closeModal();
      }
      else if (k === 'delete' || k === 'backspace') this.deleteSelection();
      else if (k === 'e') this.interactNearby();
      else if (k === 'f' && this.selection) this.focusSelection();
      this.ui.render(true);
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
  }

  screenToTile(cx        , cy        )                           {
    const rect = this.app.canvas.getBoundingClientRect();
    const sx = (cx - rect.left) * (this.app.canvas.width / rect.width) / this.app.renderer.resolution;
    const sy = (cy - rect.top) * (this.app.canvas.height / rect.height) / this.app.renderer.resolution;
    return {
      x: Math.floor((sx - this.world.x) / (T * this.zoom)),
      y: Math.floor((sy - this.world.y) / (T * this.zoom)),
    };
  }

  setZoom(z        )       { this.zoom = clampZoom(z); }

  mapViewportRect()       {
    const canvas = this.app.canvas.getBoundingClientRect();
    const sx = this.app.renderer.width / Math.max(1, canvas.width);
    const sy = this.app.renderer.height / Math.max(1, canvas.height);
    const visible = (node) => node && getComputedStyle(node).display !== 'none' && node.getBoundingClientRect().width > 0;
    const leftNode = this.ui.compact ? null : this.collapsedPanelNode('left');
    const rightNode = this.ui.compact ? null : this.collapsedPanelNode('right');
    const edge = (node, side) => {
      if (!visible(node)) return 0;
      const rect = node.getBoundingClientRect();
      if (side === 'left') return Math.max(0, rect.right - canvas.left) * sx;
      if (side === 'right') return Math.max(0, canvas.right - rect.left) * sx;
      if (side === 'top') return Math.max(0, rect.bottom - canvas.top) * sy;
      return Math.max(0, canvas.bottom - rect.top) * sy;
    };
    return usableViewport(this.app.renderer.width, this.app.renderer.height, {
      left: edge(leftNode, 'left'), right: edge(rightNode, 'right'),
      top: edge(this.ui.top, 'top'), bottom: edge(this.ui.bottom, 'bottom'),
    });
  }

  worldPointVisible(x, y, margin = 3) {
    const view = this.renderViewport || this.mapViewportRect();
    return gridVisible(x, y, { ...view, centerX: this.cam.x, centerY: this.cam.y }, this.zoom, T, margin);
  }

  pixelWorldVisible(px, py, margin = 3) {
    const view = this.renderViewport || this.mapViewportRect();
    return pixelVisible(px, py, { ...view, centerX: this.cam.x, centerY: this.cam.y }, this.zoom, T, margin);
  }

  collapsedPanelNode(side)       {
    if (side === 'left') return this.ui.collapsed.left ? this.ui.railL : this.ui.left;
    return this.ui.collapsed.right ? this.ui.railR : this.ui.right;
  }

  frameRooms(rs, maxZoom = 1, padX = 60, padY = 150)       {
    if (!rs.length) return;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const r of rs) { x0 = Math.min(x0, r.x); y0 = Math.min(y0, r.y); x1 = Math.max(x1, r.x + r.w); y1 = Math.max(y1, r.y + r.h); }
    const wPx = (x1 - x0) * T + padX, hPx = (y1 - y0) * T + padY;
    const view = this.mapViewportRect();
    this.renderViewport = view;
    this.setZoom(Math.min(maxZoom, view.width / wPx, view.height / hPx));
    this.cam = { x: (x0 + x1) / 2, y: (y0 + y1) / 2 - 1 };
  }

  /** 把全部房间收进当前面板之外的地图视野。 */
  fitView()       { this.frameRooms(this.tavern.rooms); }

  /** 回到门厅周边的核心营业区，远端客房和休息室留给全店视图。 */
  focusHome()       {
    const entrance = this.tavern.entrance();
    const core = this.tavern.rooms.filter((room) => !['guestroom', 'lounge', 'corridor'].includes(room.kind)
      && Math.hypot(room.x + room.w / 2 - entrance.x, room.y + room.h / 2 - entrance.y) <= 18);
    this.frameRooms(core.length ? core : this.tavern.rooms, 1.25, 96, 112);
  }

  click(x        , y        , right         )       {
    if (this.sim.nightState?.dawn?.active) return;
    if (right) { this.cancelBuild(); return; }
    if (this.blocked) return;
    if (this.moveRoomId !== null) { this.tryMoveRoom(x, y); return; }
    if (this.moveFurnId !== null) { this.tryMoveFurn(x, y); return; }
    if (this.buildBp) { this.tryBuildRoom(x, y); return; }
    if (this.buildFurn) { this.tryBuildFurn(x, y); return; }
    // 教学画布在未选中正确 ghost 时只允许当前目标所需的房间选择。
    // 角色、旧房间和空地图点击不能绕过 exact-next 方法层。
    const campaign = this.sim.campaign;
    if (campaign?.mode === 'tutorial' && this.sim.econ.day === 1 && campaign.phase === 'tutorial-build') {
      this.sim.toast('请先从高亮卡片选择当前教学目标');
      return;
    }
    if (campaign?.mode === 'tutorial' && this.sim.econ.day === 1 && campaign.phase === 'tutorial-furnish') {
      const next = tutorialMissingFurniture(this.sim)[0];
      if (!tutorialFurnitureRoomSelection(this.sim, this.tavern, x, y, next, (selection) => { this.selection = selection; })) { this.sim.toast('请点击能容纳当前教学家具的高亮房间'); return; }
      this.ui.leftTab = 'furn'; this.ui.render(true);
      return;
    }
    if (campaign?.mode === 'tutorial' && this.sim.econ.day === 1 && campaign.phase === 'first-recruitment') {
      const room = this.tavern.roomAt(x, y);
      if (!room || room.kind !== 'playerroom') { this.sim.toast('先在玩家休息室的会议桌旁准备座位'); return; }
      this.selection = { kind: 'room', id: room.id };
      return;
    }
    // 选择：角色 > 家具 > 房间
    let bestStaff               = null;
    for (const s of this.sim.staff) if (Math.abs(s.x - x) < 0.75 && Math.abs(s.y - y) < 0.75) bestStaff = s;
    if (bestStaff) {
      this.selection = { kind: 'staff', id: bestStaff.id };
      if (!bestStaff.isOwner) this.ui.openInteract('staff', bestStaff.id);
      return;
    }
    for (const g of this.sim.guests) if (Math.abs(g.x - x) < 0.7 && Math.abs(g.y - y) < 0.7) {
      this.selection = { kind: 'guest', id: g.id };
      this.ui.openInteract('guest', g.id);
      return;
    }
    const f = this.tavern.furnAt(x, y);
    if (f) {
      if (f.kind === 'bunk' && this.sim.dayActive && this.tavern.roomOfFurn(f)?.kind === 'playerroom') {
        const owner = this.sim.staff.find((s) => s.isOwner);
        const stand = this.tavern.standTileNear(this.tavern.useTiles(f));
        if (owner?.task?.kind === 'rest' && owner.task.bedId === f.id) { this.sim.cancelRest(owner.id, f.id); this.sim.toast('已取消床边休息'); this.ui.render(true); return; }
        if (owner && stand && Math.hypot(owner.x - stand.x, owner.y - stand.y) > 1.8 && !this.sim.manualOwner) {
          if (this.sim.campaign?.tutorialFlags?.bedPrompt && owner.task && owner.task.kind !== 'rest') {
            owner.task = null; owner.actT = 0; owner.actTotal = 0; owner.carry = null;
            this.sim.invalidateTasks?.('tutorial-bed-lesson');
          }
          owner.path = this.tavern.path(Math.round(owner.x), Math.round(owner.y), stand.x, stand.y) || [];
          owner.pendingBedRest = f.id; this.sim.toast('店主正走向床边休息'); return;
        }
        if (owner && stand && Math.hypot(owner.x - stand.x, owner.y - stand.y) <= 1.8) {
          const result = this.sim.requestBedRest(owner.id, f.id);
          if (result.ok) { this.sim.toast('开始床边休息'); this.ui.render(true); return; }
        }
      }
      this.selection = { kind: 'furn', id: f.id };
      return;
    }
    const r = this.tavern.roomAt(x, y);
    this.selection = r ? { kind: 'room', id: r.id } : null;
  }

  /** 双击：命中员工就开详情（点空地不打扰） */
  requestNightBedAt(x, y) {
    if (!this.sim.nightState?.active || this.sim.dayActive || this.sim.manualOwner) return false;
    const bed = this.tavern.furnAt(x, y);
    const room = bed && this.tavern.roomOfFurn(bed);
    if (!bed || bed.kind !== 'bunk' || !room || (this.sim.campaign?.mode !== 'legacy' && room.kind !== 'playerroom')) return false;
    const owner = this.sim.staff.find((staff) => staff.isOwner);
    const stand = this.tavern.standTileNear(this.tavern.useTiles(bed));
    if (!owner || !stand) return true;
    if (Math.hypot(owner.x - stand.x, owner.y - stand.y) < 1.8) {
      this.sim.nightState.ownerAtBed = true;
      this.ui.showModal('<h3>结束今天？</h3><div class="dim">确认后店主入睡，所有员工恢复状态并进入次日经营准备。</div><div class="row" style="margin-top:10px"><button data-act="nightbed">躺下，结束今天</button><button data-act="closemodal">再忙一会儿</button></div>');
    } else {
      owner.path = this.tavern.path(Math.round(owner.x), Math.round(owner.y), stand.x, stand.y) || [];
      this.pendingNightBed = true;
      this.sim.toast('店主正回到自己的床边');
    }
    return true;
  }

  openDetailAt(x        , y        )       {
    if (this.creatorPending) return;
    const st = this.staffAt(x, y);
    this.lastDetailHit = { x, y, id: st ? st.id : -1 };
    if (st) { this.selection = { kind: 'staff', id: st.id }; this.ui.openStaffDetail(st.id); }
  }

  lastDetailHit                                              = null;

  staffAt(x        , y        )               {
    let best               = null;
    for (const s of this.sim.staff) if (Math.abs(s.x - x) < 0.9 && Math.abs(s.y - y) < 1.1) best = s;
    return best;
  }

  /** E：与店主身边最近的伙计搭话（不需要开直控，店主自己走动时也能触发） */
  nearOwner(x        , y        , r = 2.8)          {
    const own = this.sim.staff.find((s) => s.isOwner);
    return !!own && Math.hypot(own.x - x, own.y - y) < r;
  }

  interactNearby()       {
    if (this.blocked || this.sim.nightState?.dawn?.active) return;
    const own = this.sim.staff.find((s) => s.isOwner);
    if (!own) return;
    if (this.sim.dayActive) {
      const beds = [this.sim.bedFor(own.id)].filter(Boolean);
      const bed = beds.sort((a, b) => Math.hypot(own.x - a.x, own.y - a.y) - Math.hypot(own.x - b.x, own.y - b.y))[0];
      const stand = bed && this.tavern.standTileNear(this.tavern.useTiles(bed));
      if (bed && stand && Math.hypot(own.x - stand.x, own.y - stand.y) < 1.8) {
        if (own.task?.kind === 'rest' && own.task.bedId === bed.id) { own.task = null; own.path = []; this.sim.toast('已取消床边休息'); }
        else this.sim.requestBedRest(own.id, bed.id);
        return;
      }
    }
    if (!this.sim.dayActive && this.sim.nightState?.active) {
      const bed = this.sim.bedFor(own.id);
      const stand = bed && this.tavern.standTileNear(this.tavern.useTiles(bed));
      if (bed && stand && Math.hypot(own.x - stand.x, own.y - stand.y) >= 1.8 && !this.sim.manualOwner) {
        own.path = this.tavern.path(Math.round(own.x), Math.round(own.y), stand.x, stand.y) || [];
        this.pendingNightBed = true; this.sim.toast(this.sim.campaign?.mode === 'legacy' ? '店主正回到员工休息室床边' : '店主正回到玩家休息室床边'); return;
      }
      if (bed && stand && Math.hypot(own.x - stand.x, own.y - stand.y) < 1.8) { this.sim.nightState.ownerAtBed = true; this.ui.showModal('<h3>结束今天？</h3><div class="dim">确认后店主入睡，所有员工恢复状态并进入次日经营准备。</div><div class="row" style="margin-top:10px"><button data-act="nightbed">躺下，结束今天</button><button data-act="closemodal">再忙一会儿</button></div>'); return; }
    }
    let bestStaff               = null; let bd = 2.8;
    for (const s of this.sim.staff) {
      if (s.isOwner) continue;
      const d = Math.hypot(s.x - own.x, s.y - own.y);
      if (d < bd) { bd = d; bestStaff = s; }
    }
    let bestGuest                                   = null;
    for (const g of this.sim.guests) {
      const d = Math.hypot(g.x - own.x, g.y - own.y);
      if (d < 2.8 && (!bestGuest || d < bestGuest.d)) bestGuest = { id: g.id, d };
    }
    if (bestStaff && (!bestGuest || bd <= bestGuest.d)) {
      this.selection = { kind: 'staff', id: bestStaff.id };
      this.ui.openInteract('staff', bestStaff.id);
      return;
    }
    if (bestGuest) {
      this.selection = { kind: 'guest', id: bestGuest.id };
      this.ui.openInteract('guest', bestGuest.id);
      return;
    }
    this.sim.toast('身边没人可搭话：走到伙计或客人旁边再按 E 或点交互（设置里可开直控自己走）');
    this.ui.render(true);
  }

  // ---------- GameApi ----------
  setPaused(v         )       { this.paused = v; }
  setSpeed(n        )       { this.speed = n; this.paused = false; }
  setHeat(h        )       { this.heat = h; }
  select(kind        , id        )       { this.selection = { kind, id }; }
  focusOn(x        , y        )       { this.cam = { x, y }; }
  focusSelection()       {
    const s = this.selection;
    if (!s) return;
    if (s.kind === 'staff') { const st = this.sim.staff.find((x) => x.id === s.id); if (st) this.focusOn(st.x, st.y); }
    if (s.kind === 'room') { const r = this.tavern.roomById(s.id); if (r) this.focusOn(r.x + r.w / 2, r.y + r.h / 2); }
    if (s.kind === 'furn') { const f = this.tavern.furnById(s.id); if (f) this.focusOn(f.x, f.y); }
  }

  moveRoomId                = null;
  moveFurnId                = null;
  placementConfirm = null;
  buildHistory = [];
  buildHistoryIndex = -1;
  roomCopy = null;

  buildSnapshot(label = '') {
    return cloneData({ label, tavern: this.tavern.serialize(), coins: this.sim.econ.coins, staffRooms: this.sim.staff.map((staff) => [staff.id, staff.roomId]) });
  }

  resetBuildHistory(label = '当前布局') {
    this.buildHistory = [this.buildSnapshot(label)];
    this.buildHistoryIndex = 0;
  }

  recordBuildState(label) {
    if (this.sim.dayActive) return;
    this.buildHistory = this.buildHistory.slice(0, this.buildHistoryIndex + 1);
    this.buildHistory.push(this.buildSnapshot(label));
    if (this.buildHistory.length > 40) this.buildHistory.shift();
    this.buildHistoryIndex = this.buildHistory.length - 1;
  }

  restoreBuildState(snapshot) {
    if (!snapshot || this.sim.dayActive) return false;
    const mode = this.sim.campaign?.mode || (this.tavern.legacy ? 'legacy' : 'tutorial');
    let restored;
    try { restored = Tavern.load(snapshot.tavern, { mode, strict: true }); } catch (error) { this.sim.toast(error.message); return false; }
    this.tavern = restored;
    this.sim.tavern = this.tavern;
    this.sim.econ.coins = snapshot.coins;
    const rooms = new Map(snapshot.staffRooms || []);
    for (const staff of this.sim.staff) staff.roomId = rooms.get(staff.id) ?? null;
    for (const staff of this.sim.staff) { staff.task = null; staff.path = []; staff.carry = null; }
    this.selection = null; this.cancelBuild(); this.staticVersion = -1; this.dirtVersion = -1;
    this.save(); this.ui.render(true);
    return true;
  }

  undoBuild() {
    if (this.buildHistoryIndex <= 0) { this.sim.toast('没有更早的建造操作'); return false; }
    const state = this.buildHistory[--this.buildHistoryIndex];
    const ok = this.restoreBuildState(state); if (ok) this.sim.toast(`已撤销：${this.buildHistory[this.buildHistoryIndex + 1]?.label || '建造操作'}`); return ok;
  }

  redoBuild() {
    if (this.buildHistoryIndex >= this.buildHistory.length - 1) { this.sim.toast('没有可重做的建造操作'); return false; }
    const state = this.buildHistory[++this.buildHistoryIndex];
    const ok = this.restoreBuildState(state); if (ok) this.sim.toast(`已重做：${state.label || '建造操作'}`); return ok;
  }

  storedBlueprints(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (_) { return []; }
  }

  saveBlueprints(key, values) {
    try { localStorage.setItem(key, JSON.stringify(values.slice(-12))); return true; } catch (_) { this.sim.toast('蓝图库写入失败'); return false; }
  }

  roomBlueprints() { return this.storedBlueprints(ROOM_BLUEPRINT_KEY); }
  layoutBlueprints() { return this.storedBlueprints(LAYOUT_BLUEPRINT_KEY); }

  roomBlueprintData(id) {
    const room = this.tavern.roomById(id);
    if (!room) return null;
    const base = bpById(room.bp);
    const rot = base.w !== base.h && room.w === base.h && room.h === base.w ? 1 : 0;
    return cloneData({
      name: `${ROOM_LABEL[room.kind]} ${room.w}×${room.h}`,
      createdAt: Date.now(), bp: room.bp, rot, quality: room.quality, style: this.tavern.roomStyle(room),
      furns: this.tavern.furnsIn(room.id).filter((f) => !f.builtIn && !(base.builtIn || []).includes(f.kind)).map((f) => ({ kind: f.kind, x: f.x - room.x, y: f.y - room.y, dir: f.dir, quality: f.quality, purchasePrice: f.purchasePrice ?? 0 })),
    });
  }

  normalizeRoomBlueprint(data) {
    const bp = data && bpById(data.bp);
    if (!bp) return null;
    const autoKinds = new Set(bp.builtIn || []);
    const furns = (data.furns || []).filter((f) => !autoKinds.has(f.kind)).map((f) => ({
      kind: f.kind, x: Number(f.x) || 0, y: Number(f.y) || 0, dir: ((Number(f.dir) || 0) % 4 + 4) % 4,
      quality: Math.max(1, Math.min(3, Number(f.quality) || 1)),
      purchasePrice: f.purchasePrice == null || Number(f.purchasePrice) === 0 ? (furnDef(f.kind)?.cost?.[(Number(f.quality) || 1) - 1] || 0) : Number(f.purchasePrice),
    }));
    return { ...cloneData(data), furns };
  }

  saveRoomBlueprint(id) {
    const data = this.roomBlueprintData(id);
    if (!data) return false;
    const list = this.roomBlueprints();
    data.name = `${data.name} · 模板 ${list.length + 1}`;
    list.push(data);
    if (this.saveBlueprints(ROOM_BLUEPRINT_KEY, list)) { this.sim.toast(`已保存房间蓝图：${data.name}`); return true; }
    return false;
  }

  startRoomCopy(data) {
    data = this.normalizeRoomBlueprint(data);
    if (this.sim.dayActive || !data || !bpById(data.bp)) { this.sim.toast('当前不能复制房间'); return; }
    this.clearPlacementConfirmation();
    this.roomCopy = cloneData(data); this.buildBp = data.bp; this.buildRot = data.rot || 0;
    this.buildFurn = null; this.moveRoomId = null; this.moveFurnId = null;
    this.sim.toast(`复制${data.name}：选择新位置，家具会随蓝图一并建造`);
    this.ui.render(true);
  }

  copyRoom(id) { const data = this.roomBlueprintData(id); if (data) this.startRoomCopy(data); }
  startSavedRoomBlueprint(index) { this.startRoomCopy(this.roomBlueprints()[index]); }
  deleteRoomBlueprint(index) { const list = this.roomBlueprints(); list.splice(index, 1); this.saveBlueprints(ROOM_BLUEPRINT_KEY, list); }

  copyFurn(id) {
    const f = this.tavern.furnById(id);
    if (!f) return;
    if (f.builtIn || f.kind === 'meetingtable') { this.sim.toast('内置会议家具不能复制'); return; }
    this.selection = { kind: 'furn', id };
    this.startBuildFurn(f.kind, f.quality);
    this.buildRot = f.dir;
    this.sim.toast(`复制${furnDef(f.kind).name}：选择位置放置`);
    this.ui.render(true);
  }

  saveLayoutBlueprint() {
    if (this.sim.dayActive) { this.sim.toast('请在收盘规划时保存布局'); return false; }
    const list = this.layoutBlueprints();
    list.push({ name: `整店布局 ${list.length + 1} · 第${this.sim.econ.day}天`, createdAt: Date.now(), tavern: cloneData(this.tavern.serialize()) });
    if (this.saveBlueprints(LAYOUT_BLUEPRINT_KEY, list)) { this.sim.toast('已保存整套布局'); return true; }
    return false;
  }

  applyLayoutBlueprint(index) {
    if (this.sim.dayActive) { this.sim.toast('营业中不能更换布局'); return false; }
    const saved = this.layoutBlueprints()[index];
    if (!saved?.tavern) return false;
    const currentRooms = new Map(this.tavern.rooms.map((r) => [r.id, r]));
    const currentFurns = new Map(this.tavern.furns.map((f) => [f.id, f]));
    const nextRooms = saved.tavern.rooms || [], nextFurns = saved.tavern.furns || [];
    const compatible = nextRooms.length === currentRooms.size && nextFurns.length === currentFurns.size
      && nextRooms.every((r) => currentRooms.get(r.id)?.kind === r.kind)
      && nextFurns.every((f) => currentFurns.get(f.id)?.kind === f.kind);
    if (!compatible) { this.sim.toast('该布局保存后的房间或家具数量已改变，无法直接套用'); return false; }
    const data = cloneData(saved.tavern);
    for (const room of data.rooms) {
      const cur = currentRooms.get(room.id);
      room.quality = cur.quality; room.clean = cur.clean; room.maint = cur.maint; room.style = cur.style; room.occupant = cur.occupant;
    }
    for (const f of data.furns) {
      const cur = currentFurns.get(f.id);
      const position = { x: f.x, y: f.y, dir: f.dir };
      Object.assign(f, cloneData(cur), position);
    }
    const mode = this.sim.campaign?.mode || (this.tavern.legacy ? 'legacy' : 'tutorial');
    try { validateCandidateOrError(this.tavern, data, mode, 'applyLayoutBlueprint'); } catch (error) { this.sim.toast(error.message); return false; }
    this.tavern = Tavern.load(data, { mode, strict: true }); this.sim.tavern = this.tavern;
    for (const staff of this.sim.staff) { staff.task = null; staff.path = []; staff.carry = null; }
    this.selection = null; this.cancelBuild(); this.staticVersion = -1; this.dirtVersion = -1;
    this.recordBuildState(`套用${saved.name}`); this.save(); this.ui.render(true); this.sim.toast(`已套用：${saved.name}`);
    return true;
  }

  deleteLayoutBlueprint(index) { const list = this.layoutBlueprints(); list.splice(index, 1); this.saveBlueprints(LAYOUT_BLUEPRINT_KEY, list); }

  placementKey(type        , item        , x        , y        , rot        , quality = 0)         {
    return [type, item, x, y, rot, quality].join('|');
  }

  clearPlacementConfirmation()       {
    if (this.placementConfirm?.timer) clearTimeout(this.placementConfirm.timer);
    this.placementConfirm = null;
  }

  confirmPlacement(key        , message        )          {
    const now = performance.now();
    if (this.placementConfirm?.key === key && now < this.placementConfirm.expires) {
      this.clearPlacementConfirmation();
      return true;
    }
    this.clearPlacementConfirmation();
    const pending = { key, expires: now + 6500, timer: 0 };
    pending.timer = setTimeout(() => { if (this.placementConfirm?.key === key) this.placementConfirm = null; }, 6500);
    this.placementConfirm = pending;
    this.sim.toast(message);
    return false;
  }

  startMoveRoom(id        )       {
    if (this.sim.dayActive) { this.sim.toast('营业中不能移动房间，先完成今天'); this.audio.play('error'); return; }
    if (this.moveRoomId === id) { this.cancelBuild(); return; }
    const room = this.tavern.roomById(id);
    if (!room) return;
    this.clearPlacementConfirmation();
    this.buildBp = null; this.buildFurn = null; this.moveFurnId = null;
    this.moveRoomId = id;
    this.buildRot = 0;
    this.sim.toast('移动房间：点击新位置整体放下（R 旋转；放下后按新共享墙居中开门，不沿用旧门）');
    this.ui.render(true);
  }

  tryMoveRoom(x        , y        )       {
    const id = this.moveRoomId;
    if (id === null) return;
    const room = this.tavern.roomById(id);
    if (!room) { this.moveRoomId = null; return; }
    const check = this.tavern.canMoveRoom(id, x, y, this.buildRot);
    if (!check.ok) { this.sim.toast(check.reason); this.audio.play('error', 0.5); return; }
    const candidate = Tavern.load(cloneData(this.tavern.serialize())); const movedCandidate = candidate.moveRoom(id, x, y, this.buildRot);
    if (!movedCandidate) { this.sim.toast('房间无法移动到这里'); this.audio.play('error', 0.5); return; }
    try { validateCandidateOrError(this.tavern, candidate.serialize(), this.sim.campaign?.mode || (this.tavern.legacy ? 'legacy' : 'tutorial'), 'moveRoom'); } catch (error) { this.sim.toast(error.message); this.audio.play('error', 0.5); return; }
    const inside = (person      ) => this.tavern.roomAt(Math.round(person.x), Math.round(person.y))?.id === id;
    const actors = [...this.sim.staff, ...this.sim.guests].filter(inside);
    const moved = this.tavern.moveRoom(id, x, y, this.buildRot);
    if (!moved) { this.sim.toast('房间无法移动到这里'); this.audio.play('error', 0.5); return; }
    for (const person of actors) {
      const p = rotateRoomPoint(person.x - moved.old.x, person.y - moved.old.y, moved.old.w, moved.old.h, moved.turns);
      person.x = moved.room.x + p.x; person.y = moved.room.y + p.y;
      person.dir = ((person.dir || 0) + moved.turns) % 4;
      person.path = [];
    }
    for (const s of this.sim.staff) { s.task = null; s.path = []; s.carry = null; s.free = null; }
    for (const guest of this.sim.guests) guest.path = [];
    this.sim.fx.length = 0;
    this.staticVersion = -1;
    this.dirtVersion = -1;
    this.sim.invalidateTasks?.('room-move');
    this.moveRoomId = null;
    this.selection = { kind: 'room', id };
    this.focusOn(moved.room.x + moved.room.w / 2, moved.room.y + moved.room.h / 2);
    this.audio.play('place', 0.8);
    this.sim.toast(`${ROOM_LABEL[moved.room.kind]}已整体${moved.turns ? `旋转 ${moved.turns * 90}°并` : ''}移动`);
    this.recordBuildState('移动房间');
    this.save();
  }

  startMoveFurn(id        )       {
    const f = this.tavern.furnById(id);
    if (!f) return;
    if (f.builtIn) this.sim.toast('内置家具只能在绑定房间内移动，不能出售或移出');
    this.clearPlacementConfirmation();
    this.buildBp = null; this.buildFurn = null; this.moveRoomId = null;
    this.moveFurnId = id;
    this.buildRot = f.dir;
    this.sim.toast('搬家具：在同一房间里点新位置放下（R 转朝向，右键或 Esc 取消）');
    this.ui.render(true);
  }

          tryMoveFurn(x        , y        )       {
    const id = this.moveFurnId;
    if (id === null) return;
    const f = this.tavern.furnById(id);
    if (!f) { this.moveFurnId = null; return; }
    const from = this.tavern.roomOfFurn(f);
    const to = this.tavern.roomAt(x, y);
    const allowedRooms = furnDef(f.kind)?.rooms || [];
    if (!to || !from || (f.builtIn && f.boundRoomId && to.id !== f.boundRoomId) || (!f.builtIn && !allowedRooms.includes(to.kind))) { this.sim.toast('家具不能放入这个房间'); this.audio.play('error', 0.5); return; }
    const chk = this.tavern.canPlaceFurn(f.kind, x, y, this.buildRot, f.id);
    if (!chk.ok) { this.sim.toast(chk.reason); this.audio.play('error', 0.5); return; }
    const candidate = cloneData(this.tavern.serialize());
    const candidateFurn = candidate.furns.find((item) => item.id === id);
    if (!candidateFurn) return;
    candidateFurn.x = x; candidateFurn.y = y; candidateFurn.dir = this.buildRot;
    try { validateCandidateOrError(this.tavern, candidate, this.sim.campaign?.mode || (this.tavern.legacy ? 'legacy' : 'tutorial'), 'moveFurn'); } catch (error) { this.sim.toast(error.message); this.audio.play('error', 0.5); return; }
    // 家具挪位后旧任务的坐标就废了：让所有人重新领活（本来就是几秒内的事）
    for (const s of this.sim.staff) { s.task = null; s.path = []; s.carry = null; }
    f.x = x; f.y = y; f.dir = this.buildRot;
    f.busyBy = undefined;
    this.tavern.reindex();
    this.sim.invalidateTasks?.('furn-move');
    const rescued = this.sim.rescueTrappedActors(true);
    this.staticVersion = -1;
    this.moveFurnId = null;
    this.selection = { kind: 'furn', id: f.id };
    this.audio.play('place', 0.8);
    this.sim.toast(`${furnDef(f.kind).name}搬好了${rescued ? `，并让 ${rescued} 名角色脱离卡点` : ''}`);
    this.recordBuildState('移动家具');
    this.save();
  }

  startBuildRoom(id        )       {
    if (this.sim.dayActive) { this.sim.toast('营业中不能建造，先完成今天'); this.audio.play('error'); return; }
    if (this.sim.campaign?.mode === 'tutorial' && this.sim.econ.day === 1 && this.sim.campaign.phase === 'first-recruitment') {
      const needsRecruitCorridor = !this.tavern.rooms.some((room) => room.kind === 'corridor');
      const allowed = needsRecruitCorridor ? bpById(id)?.kind === 'corridor' : bpById(id)?.kind === 'lounge';
      if (!allowed) { this.sim.toast(needsRecruitCorridor ? '先建一段连接员工房的走廊' : '现在只需要先建员工休息室'); return; }
    }
    if (this.sim.campaign?.mode === 'tutorial' && this.sim.econ.day === 1 && !['tutorial-build', 'first-recruitment'].includes(this.sim.campaign.phase)) { this.sim.toast('当前教学步骤不需要建新房间'); return; }
    if (this.sim.campaign?.mode === 'tutorial' && this.sim.econ.day === 1 && !['foyer4', 'dining6', 'kitchen6', 'storage4', 'guestroom5'].includes(id) && !(this.sim.campaign.phase === 'first-recruitment' && (bpById(id)?.kind === 'corridor' || id === 'lounge5'))) { this.sim.toast('第一天先按引导准备基础房间'); return; }
    if (this.sim.campaign?.mode === 'tutorial' && this.sim.econ.day === 1 && this.sim.campaign.phase === 'tutorial-build') {
      const order = ['foyer', 'dining', 'kitchen', 'storage', 'guestroom'];
      const next = order.find((kind) => !this.tavern.rooms.some((room) => room.kind === kind));
      if (bpById(id).kind !== next) { this.sim.toast(`教学下一步必须先建${ROOM_LABEL[next]}`); return; }
    }
    this.clearPlacementConfirmation();
    this.roomCopy = null; this.buildBp = id; this.buildFurn = null; this.moveRoomId = null; this.moveFurnId = null; this.buildRot = 0;
  }
  startBuildFurn(kind        , q        )       {
    if (this.sim.dayActive) { this.sim.toast('营业中不能改造，先完成今天'); this.audio.play('error'); return; }
    if (kind === 'meetingtable' || (furnDef(kind)?.builtIn && this.sim.campaign?.mode !== 'legacy')) { this.sim.toast('内置家具只能随绑定房间生成'); this.audio.play('error'); return; }
    if (this.sim.campaign?.mode === 'tutorial' && this.sim.econ.day === 1 && !['tutorial-furnish', 'first-recruitment'].includes(this.sim.campaign.phase)) { this.sim.toast('先完成当前教学步骤，再按引导摆家具'); return; }
    if (this.sim.campaign?.mode === 'tutorial' && this.sim.econ.day === 1 && this.sim.campaign.phase === 'first-recruitment' && kind !== 'chair') { this.sim.toast('先为会议桌增加一把椅子'); return; }
    if (this.sim.campaign?.mode === 'tutorial' && this.sim.econ.day === 1 && !['desk', 'table', 'chair', 'prep', 'stove', 'pass', 'sink', 'shelf', 'bed'].includes(kind)) { this.sim.toast('第一天先按引导准备基础家具'); return; }
    if (this.sim.campaign?.mode === 'tutorial' && this.sim.econ.day === 1 && this.sim.campaign.phase === 'tutorial-furnish') {
      const order = ['desk', 'table', 'chair1', 'chair2', 'prep', 'stove', 'pass', 'sink', 'shelf', 'bed'];
      const next = tutorialMissingFurniture(this.sim)[0];
      if (kind !== tutorialFurnitureKind(next)) { this.sim.toast(`教学下一步必须先摆${next === 'chair1' ? '第一把餐椅' : next === 'chair2' ? '第二把餐椅' : furnDef(tutorialFurnitureKind(next)).name}`); return; }
    }
    const sel = this.selection;
    const room = sel && sel.kind === 'room' ? this.tavern.roomById(sel.id)
      : sel && sel.kind === 'furn' ? (() => { const f = this.tavern.furnById(sel.id); return f ? this.tavern.roomOfFurn(f) : null; })() : null;
    const needStar = furnQualityUnlock(kind, q);
    if (this.sim.stars() < needStar) { this.sim.toast(`家具品质 ${'I'.repeat(q)} 需要 ★${needStar}`); this.audio.play('error'); return; }
    if (!room || room.quality < q) { this.sim.toast(`先把当前房间升级到品质 ${'I'.repeat(q)}`); this.audio.play('error'); return; }
    this.clearPlacementConfirmation();
    this.buildFurn = kind; this.buildQuality = q; this.buildBp = null; this.moveRoomId = null; this.moveFurnId = null; this.buildRot = 0;
  }
  cancelBuild()       {
    this.clearPlacementConfirmation();
    if (this.moveRoomId !== null) { this.moveRoomId = null; this.sim.toast('取消移动房间'); }
    if (this.moveFurnId !== null) { this.moveFurnId = null; this.sim.toast('取消搬动'); }
    this.buildBp = null; this.buildFurn = null; this.roomCopy = null;
  }

  rotateBuild()       {
    this.clearPlacementConfirmation();
    if (this.moveRoomId !== null) this.buildRot = (this.buildRot + 1) % 4;
    else if (this.moveFurnId !== null) this.buildRot = (this.buildRot + 1) % 4;
    else if (this.buildBp && this.roomCopy) this.sim.toast('房间蓝图会保持原有朝向');
    else if (this.buildBp) this.buildRot = this.buildRot ? 0 : 1;
    else if (this.buildFurn) this.buildRot = (this.buildRot + 1) % 4;
    else if (this.selection && this.selection.kind === 'furn') this.rotateFurn(this.selection.id);
  }

  tryBuildRoom(x        , y        )       {
    const tutorialPhaseAtEntry = this.sim.campaign?.phase;
    const bp = bpById(this.buildBp          );
    if (this.sim.campaign?.mode === 'tutorial' && this.sim.econ.day === 1 && !['tutorial-build', 'first-recruitment'].includes(this.sim.campaign.phase)) { this.sim.toast('当前教学步骤不需要建新房间'); return; }
    if (this.sim.campaign?.mode === 'tutorial' && this.sim.econ.day === 1 && this.sim.campaign.phase === 'first-recruitment') {
      const needsRecruitCorridor = !this.tavern.rooms.some((room) => room.kind === 'corridor');
      const allowed = needsRecruitCorridor ? bp.kind === 'corridor' : bp.kind === 'lounge';
      if (!allowed) { this.sim.toast(needsRecruitCorridor ? '当前阶段先建连接员工房的走廊' : '当前阶段只能建员工休息室'); return; }
    }
    if (this.sim.campaign?.mode === 'tutorial' && this.sim.econ.day === 1 && this.sim.campaign.phase === 'tutorial-build') {
      const order = ['foyer', 'dining', 'kitchen', 'storage', 'guestroom'];
      const next = order.find((kind) => !this.tavern.rooms.some((room) => room.kind === kind));
      if (bp.kind !== next) { this.sim.toast(`教学下一步必须建${ROOM_LABEL[next]}`); return; }
    }
    if (bp?.unique && this.tavern.rooms.some((room) => room.kind === bp.kind)) { this.sim.toast(`${bp.name}只能建造一个`); this.audio.play('error'); return; }
    const check = this.tavern.canPlaceRoom(bp, x, y, this.buildRot, this.sim.campaign?.mode || (this.tavern.legacy ? 'legacy' : 'tutorial'));
    if (!check.ok) { this.sim.toast(check.reason); this.audio.play('error'); return; }
    const copy = this.roomCopy;
    const area = (this.buildRot ? bp.h : bp.w) * (this.buildRot ? bp.w : bp.h);
    const roomUpgradeCost = copy ? Array.from({ length: Math.max(0, copy.quality - 1) }, (_, i) => Math.round(area * 26 * (i + 1))).reduce((a, b) => a + b, 0) : 0;
    const styleCost = copy ? styleById(copy.style).cost : 0;
    const furnitureCost = copy ? copy.furns.reduce((sum, f) => sum + furnDef(f.kind).cost[f.quality - 1], 0) : 0;
    const totalCost = (bp.buildCost ?? bp.cost) + roomUpgradeCost + styleCost + furnitureCost;
    if (this.sim.econ.coins < totalCost) { this.sim.toast(`界币不足，需要 ${totalCost}`); this.audio.play('error'); return; }
    const candidate = this.tavern.serialize(); const candidateRoomId = candidate.nr; const candidateRoom = { id: candidateRoomId, kind: bp.kind, bp: bp.id, x, y, w: this.buildRot ? bp.h : bp.w, h: this.buildRot ? bp.w : bp.h, quality: copy?.quality || 1, clean: 100, maint: 100, style: copy?.style || 'rustic', purchasePrice: bp.buildCost ?? bp.cost ?? 0 }; candidate.rooms = [...candidate.rooms, candidateRoom]; candidate.nr++;
    for (const builtIn of bp.builtIn || []) { const bx = x + Math.max(0, Math.floor(candidateRoom.w / 2) - 1), by = y + Math.max(0, candidateRoom.h - 2); candidate.furns.push({ id: candidate.nf++, kind: builtIn, x: bx, y: by, dir: 0, quality: 1, builtIn: true, purchasePrice: 0, boundRoomId: candidateRoomId }); }
    if (copy) for (const f of [...copy.furns].sort((a, b) => Number(a.kind === 'chair') - Number(b.kind === 'chair'))) {
      candidate.furns.push({ id: candidate.nf++, kind: f.kind, x: x + f.x, y: y + f.y, dir: f.dir, quality: f.quality, purchasePrice: f.purchasePrice ?? furnDef(f.kind).cost[f.quality - 1] ?? 0, builtIn: false });
    }
    if (bp.kind === 'lounge' && !candidate.rooms.some((r) => r.kind === 'corridor')) { this.sim.toast('员工休息室需要通过走廊连接'); this.audio.play('error'); return; }
    try { validateCandidateOrError(this.tavern, candidate, this.sim.campaign?.mode || (this.tavern.legacy ? 'legacy' : 'tutorial'), 'buildRoom'); } catch (error) { this.sim.toast(error.message); this.audio.play('error'); return; }
    const purchaseKey = this.placementKey(copy ? 'roomcopy' : 'room', bp.id, x, y, this.buildRot, totalCost);
    if (!this.confirmPlacement(purchaseKey, `是否购买并建造${copy?.name || bp.name}（-${totalCost}）？再次单击确认，双击直接购买`)) return;
    this.sim.econ.coins -= totalCost;
    const room = this.tavern.placeRoom(bp, x, y, this.buildRot);
    for (const builtIn of bp.builtIn || []) {
      const bx = x + Math.max(0, Math.floor(room.w / 2) - 1), by = y + Math.max(0, room.h - 2);
      if (this.tavern.canPlaceFurn(builtIn, bx, by, 0).ok) { const f = this.tavern.placeFurn(builtIn, bx, by, 0, 1); f.builtIn = true; f.purchasePrice = 0; f.boundRoomId = room.id; this.sim.campaign.tutorialFlags[`furn_${builtIn}`] = true; }
    }
    if (copy) {
      room.quality = copy.quality; room.style = copy.style;
      for (const f of [...copy.furns].sort((a, b) => Number(a.kind === 'chair') - Number(b.kind === 'chair'))) {
        const placed = this.tavern.placeFurn(f.kind, x + f.x, y + f.y, f.dir, f.quality);
        placed.purchasePrice = f.purchasePrice ?? furnDef(f.kind).cost[f.quality - 1] ?? 0;
      }
      this.tavern.reindex();
    }
    this.sim.toast(`${copy ? copy.name : ROOM_LABEL[bp.kind]}落位（-${totalCost}）`);
    applyTutorialRoomPlaced(this.sim, bp.kind, tutorialPhaseAtEntry);
    this.audio.play('build');
    for (let i = 0; i < 14; i++) this.sim.fx.push({ x: room.x + Math.random() * room.w, y: room.y + Math.random() * room.h, t: 0.5 + Math.random() * 0.3, kind: 'spark' });
    this.selection = { kind: 'room', id: room.id };
    this.sim.invalidateTasks?.('room-build');
    this.recordBuildState(`建造${copy?.name || bp.name}`);
    this.save();
  }

  tryBuildFurn(x        , y        )       {
    const tutorialPhaseAtEntry = this.sim.campaign?.phase;
    const kind = this.buildFurn          ;
    if (this.sim.campaign?.mode === 'tutorial' && this.sim.econ.day === 1 && !['tutorial-furnish', 'first-recruitment'].includes(this.sim.campaign.phase)) { this.sim.toast('先完成当前教学步骤，再按引导摆家具'); return; }
    if (this.sim.campaign?.mode === 'tutorial' && this.sim.econ.day === 1 && this.sim.campaign.phase === 'tutorial-furnish') {
      const order = ['desk', 'table', 'chair1', 'chair2', 'prep', 'stove', 'pass', 'sink', 'shelf', 'bed'];
      const next = tutorialMissingFurniture(this.sim)[0];
      if (kind !== tutorialFurnitureKind(next)) { this.sim.toast(`教学下一步必须摆${next === 'chair1' ? '第一把餐椅' : next === 'chair2' ? '第二把餐椅' : furnDef(tutorialFurnitureKind(next)).name}`); return; }
    }
    const def = furnDef(kind);
    const cost = def.cost[this.buildQuality - 1];
    const room = this.tavern.roomAt(x, y);
    if (['doublebed', 'kingbed'].includes(kind) && room) {
      const roomBeds = this.tavern.furnsIn(room.id).filter((item) => BED_KINDS.includes(item.kind));
      if (roomBeds.some((item) => ['doublebed', 'kingbed'].includes(item.kind))) { this.sim.toast('双人大床和豪华大床每间客房最多一张，且不能与其他床混放'); return; }
    }
    const check = this.tavern.canPlaceFurn(kind, x, y, this.buildRot);
    if (!check.ok) { this.sim.toast(check.reason); this.audio.play('error'); return; }
    const candidate = this.tavern.serialize(); candidate.furns = [...candidate.furns, { id: candidate.nf, kind, x, y, dir: this.buildRot, quality: this.buildQuality, purchasePrice: cost, builtIn: false }]; candidate.nf++;
    try { validateCandidateOrError(this.tavern, candidate, this.sim.campaign?.mode || (this.tavern.legacy ? 'legacy' : 'tutorial'), 'buildFurn'); } catch (error) { this.sim.toast(error.message); this.audio.play('error'); return; }
    if (this.sim.econ.coins < cost) { this.sim.toast('界币不足'); this.audio.play('error'); return; }
    const purchaseKey = this.placementKey('furn', kind, x, y, this.buildRot, this.buildQuality);
    if (!this.confirmPlacement(purchaseKey, `是否购买并放置${def.name}（-${cost}）？再次单击确认，双击直接购买`)) return;
    this.sim.econ.coins -= cost;
    const f = this.tavern.placeFurn(kind, x, y, this.buildRot, this.buildQuality); f.purchasePrice = cost;
    applyTutorialFurniturePlaced(this.sim, kind, tutorialPhaseAtEntry, this.sim.meetingSeatCapacity());
    this.audio.play('place');
    this.selection = { kind: 'furn', id: f.id };
    this.sim.invalidateTasks?.('furn-build');
    this.recordBuildState(`放置${def.name}`);
    this.save();
  }

  openDay()       {
    if (this.sim.sealed) { this.sim.toast('酒馆已被封印'); return; }
    if (this.sim.dayActive) return;
    syncTutorialFurniturePhase(this.sim);
    if (this.sim.campaign?.mode === 'tutorial' && this.sim.econ.day === 3 && !this.sim.campaign.tutorialFlags?.worldTravelComplete) {
      if (this.sim.campaign.phase !== 'world-select') this.startDayThreeWorldIntro();
      else this.sim.toast('先点击左上角旅店名称，完成首次免费迁界');
      return;
    }
    if (this.sim.campaign?.phase === 'world-arrived') this.sim.campaign.phase = 'prepare';
    if (!this.sim.canOpenBusinessNow() && !(['tutorial-build', 'tutorial-furnish'].includes(this.sim.campaign?.phase) && this.sim.econ.day === 1)) { this.sim.toast('当前阶段不能开门营业'); return; }
    if (['settlement', 'meeting', 'night'].includes(this.sim.campaign?.phase)) { this.sim.toast('请先完成日报、会议与夜间休息'); return; }
    if (this.sim.campaign?.mode === 'tutorial' && this.sim.econ.day === 1) {
      if (this.sim.manualOwner) this.setManualOwner(false);
      const flags = this.sim.campaign.tutorialFlags || {};
      const presentRooms = new Set(this.tavern.rooms.map((room) => room.kind));
      const missingRooms = ['foyer', 'dining', 'kitchen', 'storage', 'guestroom'].filter((kind) => !presentRooms.has(kind));
      if (missingRooms.length) { this.sim.toast(`教学准备未完成：还需要${missingRooms.map((kind) => ROOM_LABEL[kind]).join('、')}`); return; }
      const missingFurniture = tutorialMissingFurniture(this.sim);
      if (missingFurniture.length) { this.sim.toast(`教学家具未完成：还需要${missingFurniture.map((kind) => furnDef(kind).name).join('、')}`); return; }
      this.sim.campaign.phase = 'day1-open'; this.sim.campaign.tutorialFlags.day1Opened = true;
    }
    const readiness = this.openingReadiness();
    if (readiness.blocking.length) {
      this.sim.toast(`无法开门：${readiness.blocking.join('；')}`);
      this.audio.play('error');
      return;
    }
    if (readiness.warnings.length) this.sim.toast(`营业准备提醒：${readiness.warnings.join('；')}`);
    this.cancelBuild();
    this.save();
    this.saveMorning();
    const started = this.sim.openDay();
    if (!started && this.sim.campaign?.phase === 'world-transition') {
      this.runTutorialTravel();
      return;
    }
    this.drawStars();
    this.paused = false;
    this.audio.play('portal');
    this.playStageMusic('open');
    this.audio.playAmb('amb');
    this.audio.setMusicLevel(0.8);
  }

  async runTutorialTravel() {
    // 教学迁界也必须经过可见的世界转场层；测试可注入 animator，玩家则
    // 看到一整帧以上的遮幕与文字，而不是 openDay 同步改写 world。
    const veil = new PIXI.Graphics();
    veil.rect(0, 0, this.app.renderer.width, this.app.renderer.height).fill({ color: 0x120d2b, alpha: .96 });
    const title = new PIXI.Text({ text: '首次免费迁往玄黄界', style: { fontFamily: 'FusionPixel, monospace', fontSize: 28, fill: 0xffe6b0, align: 'center' } });
    title.anchor.set(.5); title.position.set(this.app.renderer.width / 2, this.app.renderer.height / 2);
    this.worldTravelLayer.removeChildren();
    this.worldTravelLayer.addChild(veil, title);
    this.worldTravelLayer.visible = true;
    this.sim.toast('位面转场：晨光正在穿过门缝……');
    const animator = this.tutorialTravelAnimator || (() => new Promise((resolve) => window.setTimeout(resolve, 700)));
    try { await animator({ layer: this.worldTravelLayer, targetWorld: 'magma' }); }
    catch (error) { this.worldTravelLayer.visible = false; this.worldTravelLayer.removeChildren(); throw error; }
    if (this.sim.campaign?.phase !== 'world-transition') { this.worldTravelLayer.visible = false; this.worldTravelLayer.removeChildren(); return false; }
    const arrived = this.sim.activatePendingWorldSwitch();
    this.sim.campaign.tutorialFlags.worldTravelComplete = !!arrived;
    this.sim.campaign.phase = arrived ? 'prepare' : 'world-transition';
    if (arrived) this.sim.toast('穿越完成：玄黄大世界的晨光照进了旅店');
    this.worldTravelLayer.visible = false;
    this.worldTravelLayer.removeChildren();
    this.save();
    // 玩家不需要再次点击“开门营业”：转场完成后自动接续第3日营业。
    if (arrived && !this.sim.dayActive) this.openDay();
    return !!arrived;
  }

  startDayThreeWorldIntro() {
    if (this.tutorialCinematicActive || this.sim.campaign?.mode !== 'tutorial' || this.sim.econ.day !== 3 || this.sim.campaign.tutorialFlags?.worldTravelComplete) return false;
    this.tutorialCinematicActive = true;
    this.speed = 1;
    this.paused = false;
    this.sim.campaign.phase = 'world-intro';
    this.ui.tutorialActive = true;
    this.ui.closeModal();
    const scenes = [
      ['旅店之外，不止一个世界', 'start'],
      ['多元便携旅店能穿越时空，在不同世界开门营业', 'middle'],
      ['今天，由你亲手选择第一条航路', 'end'],
    ];
    this.ui.showWorldTutorialTransition(scenes[0][0], scenes[0][1]);
    window.setTimeout(() => this.tutorialCinematicActive && this.ui.showWorldTutorialTransition(scenes[1][0], scenes[1][1]), 1800);
    window.setTimeout(() => this.tutorialCinematicActive && this.ui.showWorldTutorialTransition(scenes[2][0], scenes[2][1]), 3900);
    window.setTimeout(() => {
      if (!this.tutorialCinematicActive) return;
      this.tutorialCinematicActive = false;
      this.ui.hideDawnTransition();
      this.sim.campaign.phase = 'world-select';
      this.sim.campaign.tutorialFlags.worldIntroComplete = true;
      this.save();
      this.ui.render(true);
    }, 5900);
    return true;
  }

  worldBackgroundUrls(id        )            {
    if (!WORLD_BACKGROUND_IDS.has(id)) return [];
    const far = WORLD_SEPARATE_FAR_BACKGROUND_IDS.has(id) ? `${id}-far.webp` : `${id}.webp`;
    return [`assets/world-backgrounds/${far}`, `assets/world-backgrounds/${id}-mid.webp`];
  }

  async preloadWorldBackground(id        )                 {
    await Promise.all(this.worldBackgroundUrls(id).map((url) => PIXI.Assets.load(url)));
  }

  async fadeWorldTravel(to        , duration        )                 {
    const sprite = this.worldTravelSprite;
    if (!sprite) return;
    const from = sprite.alpha;
    const started = performance.now();
    await new Promise((resolve) => {
      const step = (now        ) => {
        const p = Math.min(1, (now - started) / duration);
        sprite.alpha = from + (to - from) * (p * p * (3 - 2 * p));
        if (p >= 1) resolve(); else requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  layoutWorldTravel()       {
    const sprite = this.worldTravelSprite;
    const video = this.worldTravelVideo;
    if (!sprite || !video?.videoWidth || !video.videoHeight) return;
    const w = this.app.renderer.width, h = this.app.renderer.height;
    sprite.scale.set(Math.max(w / video.videoWidth, h / video.videoHeight));
    sprite.position.set(w / 2, h / 2);
  }

  async createWorldTravelVideo()                 {
    const video = document.createElement('video');
    video.src = 'assets/world-travel.mp4'; video.preload = 'auto'; video.playsInline = true; video.muted = true;
    await new Promise((resolve, reject) => {
      const timeout = window.setTimeout(() => reject(new Error('穿越动画加载超时')), 30000);
      video.addEventListener('loadeddata', () => { window.clearTimeout(timeout); resolve(); }, { once: true });
      video.addEventListener('error', () => { window.clearTimeout(timeout); reject(new Error('穿越动画加载失败')); }, { once: true });
      video.load();
    });
    video.currentTime = 0;
    const texture = PIXI.Texture.from(video);
    const sprite = new PIXI.Sprite(texture);
    sprite.anchor.set(0.5); sprite.alpha = 0;
    this.worldTravelLayer.removeChildren(); this.worldTravelLayer.addChild(sprite);
    this.worldTravelVideo = video; this.worldTravelSprite = sprite; this.layoutWorldTravel();
    return video;
  }

  cleanupWorldTravel()       {
    const video = this.worldTravelVideo;
    if (video) { video.pause(); video.removeAttribute('src'); video.load(); }
    this.worldTravelLayer.removeChildren();
    if (this.worldTravelSprite) this.worldTravelSprite.destroy({ texture: true });
    this.worldTravelVideo = null; this.worldTravelSprite = null;
  }

  async travelToWorld(id        )                 {
    if (this.worldTravelActive || !this.sim.requestWorldSwitch(id)) return false;
    const target = this.sim.worldById(id);
    this.worldTravelActive = true; this.ui.closeModal(); this.save();
    this.audio.stopMusic();
    this.sim.toast(`位面航路已启动：正在前往${target.name}`);
    const targetLoad = this.preloadWorldBackground(id).catch(() => null);
    try {
      const video = await this.createWorldTravelVideo();
      await this.fadeWorldTravel(1, 700);
      const cue = this.audio.playMusicCue('world-travel', 0.95);
      video.currentTime = 0;
      await video.play();
      await new Promise((resolve) => {
        const timeout = window.setTimeout(resolve, 7500);
        video.addEventListener('ended', () => { window.clearTimeout(timeout); resolve(); }, { once: true });
      });
      if (cue) { try { cue.stop(); } catch (err) { /* 音轨已经自然结束 */ } }
      await targetLoad;
      const arrived = this.sim.activatePendingWorldSwitch();
      if (arrived) {
        if (this.sim.campaign?.mode === 'tutorial' && this.sim.econ.day === 3 && arrived.id === 'magma_ridge') {
          this.sim.campaign.tutorialFlags.worldTravelComplete = true;
          this.sim.campaign.phase = 'world-arrived';
          this.ui.tutorialActive = true;
        }
        this.worldBackgroundId = '';
        this.ensureWorldBackground();
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        this.ui.render(true); this.save();
      }
      await this.fadeWorldTravel(0, 900);
      return !!arrived;
    } catch (err) {
      const arrived = this.sim.activatePendingWorldSwitch();
      if (arrived && this.sim.campaign?.mode === 'tutorial' && this.sim.econ.day === 3 && arrived.id === 'magma_ridge') {
        this.sim.campaign.tutorialFlags.worldTravelComplete = true;
        this.sim.campaign.phase = 'world-arrived';
        this.ui.tutorialActive = true;
      }
      this.worldBackgroundId = ''; this.ensureWorldBackground();
      this.ui.render(true); this.save();
      this.sim.toast(`${arrived ? '已抵达目标世界，但穿越动画未能完整播放' : '穿越失败'}：${err?.message || '未知错误'}`);
      return !!arrived;
    } finally {
      this.cleanupWorldTravel();
      this.worldTravelActive = false;
      this.playStageMusic(this.sim.dayActive ? 'open' : 'close', true);
      this.audio.setMusicLevel(this.sim.dayActive ? 0.72 : 0.4);
    }
  }

  openingReadiness() {
    const blocking = []; const warnings = [];
    const hasSeats = this.tavern.allTables().some((t) => this.tavern.tableSeats(t).length > 0);
    if (this.sim.campaign?.mode !== 'legacy') {
      const meetingSeats = this.tavern.meetingTables().reduce((sum, t) => sum + this.tavern.meetingSeats(t).length, 0);
      if (meetingSeats < this.sim.staff.length) blocking.push(`会议桌座位不足（需要 ${this.sim.staff.length} 把椅子）`);
    }
    const hasStorage = this.tavern.furnsOfKind('shelf').length > 0 || this.tavern.furnsOfKind('icebox').length > 0;
    const kitchens = this.tavern.rooms.filter((r) => r.kind === 'kitchen');
    const productionLines = kitchens.reduce((sum, room) => sum + Math.min(
      this.tavern.furnsIn(room.id).filter((f) => f.kind === 'stove').length,
      this.tavern.furnsIn(room.id).filter((f) => f.kind === 'prep').length,
      this.tavern.furnsIn(room.id).filter((f) => f.kind === 'pass').length,
    ), 0);
    const drinkLines = this.tavern.furnsOfKind('keg').filter((f) => ['bar', 'parlor'].includes(this.tavern.roomOfFurn(f)?.kind)).length;
    if (!this.tavern.furnsOfKind('desk').length) blocking.push('缺少前台柜台');
    if (!hasSeats) blocking.push('缺少有效餐桌座位');
    if (!hasStorage) blocking.push('缺少储物架或冰柜');
    if (!productionLines && !drinkLines) blocking.push('缺少可生产的厨房线或饮品线');
    if (!this.tavern.furnsOfKind('sink').length) blocking.push('缺少水槽');
    const cooks = this.sim.staff.filter((s) => s.job === 'cook').length;
    if (cooks > productionLines) warnings.push(`厨师 ${cooks} 人，但完整厨房生产线仅 ${productionLines} 条`);
    const specialKinds = new Set(['pool', 'billiardtable', 'screen', 'fountain', 'telescope', 'arcadem', 'cauldron']);
    const specialRooms = new Map();
    for (const f of this.tavern.furns) if (specialKinds.has(f.kind)) {
      const room = this.tavern.roomOfFurn(f); if (room) specialRooms.set(room.id, room);
    }
    for (const room of specialRooms.values()) {
      const covered = this.sim.staff.some((s) => this.sim.dutyFit('facility', s) >= 0
        && (!s.roomId || s.roomMode !== 'strict' || s.roomId === room.id));
      if (!covered) warnings.push(`${ROOM_LABEL[room.kind]}#${room.id}没有场务覆盖，客人会等待`);
    }
    const roomDuties = { foyer: ['greet'], dining: ['order'], kitchen: ['cook'], bar: ['mix'], parlor: ['order', 'mix'] };
    for (const room of this.tavern.rooms) for (const kind of roomDuties[room.kind] || []) {
      const covered = this.sim.staff.some((s) => this.sim.dutyFit(kind, s) >= 0
        && (!s.roomId || s.roomMode !== 'strict' || s.roomId === room.id));
      if (!covered) warnings.push(`${ROOM_LABEL[room.kind]}#${room.id}缺少${kind === 'greet' ? '迎宾' : kind === 'order' ? '桌边服务' : kind === 'cook' ? '烹饪' : '调酒'}覆盖`);
    }
    const critical = new Set(['shelf', 'icebox', 'prep', 'stove', 'pass', 'keg', ...specialKinds]);
    const unreachable = this.tavern.furns.filter((f) => critical.has(f.kind) && !this.tavern.standTileNear(this.tavern.useTiles(f)));
    if (unreachable.length) warnings.push(`${unreachable.length} 件设备的使用面不可达`);
    return { blocking, warnings, productionLines, drinkLines };
  }

  finishDay()       {
    const stat = this.sim.closeBusiness();
    const owner = this.sim.staff.find((staff) => staff.isOwner);
    if (owner) owner.bubble = { text: '好累啊，不过今天总算结束了……先回到“我的房间”复盘一下吧~', t: 6 };
    this.sim.toast('本日经营结束 · 打烊时间');
    this.sim.campaign.phase = 'closing-title';
    this.closingState = { t: 0 };
    this.audio.setMusicLevel(0.48);
    this.playStageMusic('settle');
    this.audio.playAmb('amb-night');
    this.audio.play('daybell');
    this.audio.play('coin');
    this.save();
    this.ui.render(true);
  }

  advanceEmployeeIntro(dt) {
    const seq = this.sim.campaign?.employeeIntroSequence;
    if (this.sim.campaign?.phase !== 'employee-intro' || !seq) return false;
    const newcomer = this.sim.staff.find((staff) => staff.id === seq.staffId);
    const owner = this.sim.staff.find((staff) => staff.isOwner);
    if (!newcomer || !owner) return false;
    seq.t = (seq.t || 0) + dt;
    if (seq.stage === 'arrival') {
      if (newcomer.arrivalFx > 0) return true;
      newcomer.bubble = { text: ['我本来只是试着投递简历，没想到传说是真的！', '哇，这就是多元便携旅店吗？', '简历才投出去，我居然真的来到异世界旅店了！'][newcomer.id % 3], t: 3.2 };
      seq.stage = 'arrival-line'; seq.t = 0;
    } else if (seq.stage === 'arrival-line' && seq.t >= 3.1) {
      const target = this.sim.nearestWalkableTile(Math.round(owner.x) + 1, Math.round(owner.y), { x: 1, y: 0 });
      newcomer.path = target ? (this.tavern.path(Math.round(newcomer.x), Math.round(newcomer.y), target.x, target.y) || []) : [];
      seq.stage = 'approach'; seq.t = 0;
    } else if (seq.stage === 'approach') {
      if (newcomer.path.length) this.sim.moveActor(newcomer, dt, 1.7);
      if (!newcomer.path.length) {
        owner.bubble = { text: `你好，我是${this.sim.econ.tavernName}的新一任主人${owner.name}，你是我的第一名员工！`, t: 4.2 };
        seq.stage = 'owner-hello'; seq.t = 0;
      }
    } else if (seq.stage === 'owner-hello' && seq.t >= 4.1) {
      newcomer.bubble = { text: `${owner.name}老板，您好！我是${newcomer.name}，今后多多指教！`, t: 4 };
      seq.stage = 'staff-hello'; seq.t = 0;
    } else if (seq.stage === 'staff-hello' && seq.t >= 3.9) {
      owner.bubble = { text: '那事不宜迟，我们来进行一次小小的会议吧！', t: 3.2 };
      seq.stage = 'invite'; seq.t = 0;
    } else if (seq.stage === 'invite' && seq.t >= 3.1) {
      this.sim.assembleMeetingSeats();
      seq.stage = 'seating'; seq.t = 0;
    } else if (seq.stage === 'seating') {
      let seated = 0;
      for (const staff of this.sim.staff.filter((person) => !person.dismissPending)) {
        if (staff.path?.length) this.sim.moveActor(staff, dt, 1.7);
        const seat = staff.meetingSeat;
        if (seat && !staff.path.length) { staff.x = seat.x; staff.y = seat.y; staff.pose = 'sit'; staff.dir = seat.dir; seated++; }
      }
      if (seated >= this.sim.staff.filter((person) => !person.dismissPending).length) {
        this.sim.campaign.tutorialFlags.employeeIntroConfirmed = true;
        delete this.sim.campaign.employeeIntroSequence;
        this.sim.beginMeeting(true);
        this.save();
        this.ui.openMeeting(true);
      }
    }
    return true;
  }

  playDawnTransition(done, stage) {
    window.requestAnimationFrame(() => {
      window.setTimeout(() => stage('middle'), 1050);
      window.setTimeout(() => stage('end'), 2650);
      window.setTimeout(done, 4100);
    });
  }

  finishNight() {
    if (!this.sim.confirmNightBed()) return false;
    if (this.sim.nightState?.dawn?.active) return false;
    this.sim.nightState.dawn = { active: true, stage: 'start', token: `dawn:${this.sim.econ.day}`, text: '休息结束 经营时段', done: false };
    this.save();
    runDawnTransition(this.sim, {
      onStage: (stage) => this.ui.showDawnTransition?.(stage),
      onText: (text) => this.sim.toast(text),
      animate: (done, stage) => this.playDawnTransition(done, stage),
      onComplete: () => {
        if (!this.sim.finishNight({ force: false })) return;
        this.save(); this.audio.playAmb('amb'); this.ui.hideDawnTransition?.(); if (!this.startDayThreeWorldIntro()) this.ui.render(true);
      },
    });
    this.ui.render(true);
    return true;
  }

  hire(id        )       { this.sim.hire(id); this.save(); }
  targetedRecruit(app, name, sex, options) {
    const hired = this.sim.targetedRecruit(app, name, sex, options);
    if (hired) this.save();
    return hired;
  }
  fire(id        )       {
    const s = this.sim.staff.find((x) => x.id === id);
    if (!s || s.isOwner) return false;
    this.sim.fire(id);
    this.save();
    return true;
  }
  setJob(id        , job     )       {
    const s = this.sim.staff.find((x) => x.id === id);
    if (!s) return;
    if (this.sim.campaign?.mode === 'tutorial' && this.sim.econ.day === 1) { this.sim.toast('第一天先熟悉基础工作，岗位会在招募后开放'); return; }
    if (this.sim.dayActive) { this.sim.toast('营业中不能调岗，请在收盘规划时安排'); return; }
    s.job = job;
    s.task = null;
    s.path = [];
    s.carry = null;
    s.note = '';
    s.pose = 'idle';
    s.bubble = { text: '收到', t: 1.2 };
    this.save();
  }
  setStaffRoom(id        , roomId               )       {
    const s = this.sim.staff.find((x) => x.id === id);
    if (!s) return;
    if (this.sim.campaign?.mode === 'tutorial' && this.sim.econ.day === 1) { this.sim.toast('第一天暂不调整负责区域'); return; }
    if (this.sim.dayActive) { this.sim.toast('营业中不能调整负责区域，请在收盘规划时安排'); return; }
    s.roomId = roomId;
    s.task = null;
    s.path = [];
    s.carry = null;
    s.note = '';
    s.pose = 'idle';
    if (roomId) {
      const r = this.tavern.roomById(roomId);
      if (r) {
        const t = this.tavern.freeTileIn(r, 3);
        const p = this.tavern.path(Math.round(s.x), Math.round(s.y), t.x, t.y);
        if (p) s.path = p; else s.bubble = { text: '过不去!', t: 2.5 };
      }
    }
    this.save();
  }
  setStaffRoomMode(id, mode) {
    const s = this.sim.staff.find((x) => x.id === id);
    if (this.sim.campaign?.mode === 'tutorial' && this.sim.econ.day === 1) { this.sim.toast('第一天暂不调整区域模式'); return; }
    if (!s || this.sim.dayActive) { if (this.sim.dayActive) this.sim.toast('营业中不能调整区域模式'); return; }
    s.roomMode = mode === 'strict' ? 'strict' : 'prefer';
    s.task = null; s.path = []; s.carry = null;
    this.save();
  }
  setPrio(id        , p        )       {
    const s = this.sim.staff.find((x) => x.id === id);
    if (this.sim.campaign?.mode === 'tutorial' && this.sim.econ.day === 1) { this.sim.toast('第一天暂不调整抢单优先级'); return; }
    if (s) { s.prio = Math.max(0, Math.min(3, p)); this.save(); }
  }
  setDutyMode(id, mode) {
    const s = this.sim.staff.find((person) => person.id === id);
    if (!s) return;
    if (this.sim.campaign?.mode === 'tutorial' && this.sim.econ.day === 1) { this.sim.toast('第一天暂不调整职责模式'); return; }
    s.dutyMode = mode === 'manual' ? 'manual' : 'auto';
    this.sim.invalidateTasks?.('priority-mode');
    s.bubble = { text: s.dutyMode === 'manual' ? '按自定义优先级工作' : '恢复岗位自动安排', t: 2 };
    this.save(); this.ui.render(true);
  }
  setDutyPriority(id, duty, priority) {
    const s = this.sim.staff.find((person) => person.id === id);
    if (!s || !s.dutyPriorities || !(duty in s.dutyPriorities)) return;
    if (this.sim.campaign?.mode === 'tutorial' && this.sim.econ.day === 1) { this.sim.toast('第一天暂不调整自定义优先级'); return; }
    s.dutyPriorities[duty] = Math.max(0, Math.min(4, priority));
    s.dutyMode = 'manual';
    this.sim.invalidateTasks?.('priority-change');
    const taskDuty = { greet: 'front', seat: 'front', checkout: 'front', order: 'service', serve: 'service', cook: 'cook', mix: 'mix', facility: 'facility', tidy: 'clean', clean: 'clean', bus: 'carry' }[s.task?.kind];
    if (taskDuty === duty && s.dutyPriorities[duty] === 0) {
      s.task = null; s.path = []; s.carry = null; s.actT = 0; s.actTotal = 0; s.note = ''; s.pose = 'idle';
    }
    s.bubble = { text: `${DUTY_LABEL[duty]}优先级 ${s.dutyPriorities[duty]}`, t: 1.8 };
    this.save(); this.ui.render(true);
  }
  trainStaff(id, skill, choiceId = 'focus') { const ok = this.sim.trainStaff(id, skill, choiceId); if (ok) { this.save(); this.ui.render(true); } return ok; }
  buyStaffEquipment(id, equipmentId) {
    const ok = this.sim.buyStaffEquipment(id, equipmentId);
    if (ok) { this.audio.play('coin', 0.75); this.save(); this.ui.render(true); }
    else this.audio.play('error', 0.45);
    this.ui.renderToasts();
    return ok;
  }
  learnStaffPerk(id, perkId) {
    const ok = this.sim.learnStaffPerk(id, perkId);
    if (ok) { this.audio.play('chime', 0.75); this.save(); this.ui.render(true); }
    else this.audio.play('error', 0.45);
    this.ui.renderToasts();
    return ok;
  }
  setWage(id        , w        )       {
    const s = this.sim.staff.find((x) => x.id === id);
    if (s && !s.isOwner) { s.wage = Math.max(5, w); this.save(); }
  }
  dressStaff(id        , app            )       {
    const s = this.sim.staff.find((x) => x.id === id);
    if (!s) return;
    s.app = app;
    this.save();
  }

  upgradeRoom(id        )       {
    const r = this.tavern.roomById(id);
    if (!r || r.quality >= 3) return;
    const cost = Math.round(r.w * r.h * 26 * r.quality);
    if (this.sim.econ.coins < cost) { this.sim.toast('界币不足'); this.audio.play('error'); return; }
    this.sim.econ.coins -= cost;
    r.quality++;
    r.maint = 100;
    this.tavern.version++;   // 触发静态层重建，否则新外观不刷新
    this.playUpgradeFx({
      type: 'room',
      x: (r.x + r.w / 2) * T,
      y: (r.y + r.h / 2) * T,
      w: r.w * T,
      h: r.h * T,
      quality: r.quality,
    });
    for (let i = 0; i < 16; i++) {
      this.sim.fx.push({
        x: r.x + Math.random() * r.w,
        y: r.y + Math.random() * r.h,
        t: 0.35 + Math.random() * 0.28,
        kind: 'spark',
      });
    }
    this.sim.toast(`${ROOM_LABEL[r.kind]}升级到品质 ${'I'.repeat(r.quality)}`);
    this.audio.play('upgrade-room', r.quality >= 3 ? 1 : 0.88);
    this.recordBuildState('升级房间');
    this.save();
  }
  setRoomStyle(id        , styleId        )       {
    const r = this.tavern.roomById(id);
    if (!r) return;
    const st = styleById(styleId);
    if (this.tavern.roomStyle(r) === st.id) return;
    if (st.cost > 0 && this.sim.econ.coins < st.cost) { this.sim.toast('界币不足'); this.audio.play('error'); return; }
    this.sim.econ.coins -= st.cost;
    this.tavern.setRoomStyle(id, st.id);
    this.staticVersion = -1;
    this.sim.toast(`${ROOM_LABEL[r.kind]} 装修为「${st.name}」`);
    this.audio.play('upgrade');
    this.ui.render(true);
    this.recordBuildState('更换房间风格');
    this.save();
  }

  demolishRoom(id        )       {
    if (this.sim.dayActive) { this.sim.toast('营业中不能拆除'); this.audio.play('error'); return; }
    const check = this.tavern.canRemoveRoom(id, this.sim.campaign?.mode || (this.tavern.legacy ? 'legacy' : 'tutorial'));
    if (!check.ok) { this.sim.toast(check.reason); this.audio.play('error'); return; }
    const r = this.tavern.roomById(id);
    if (!r) return;
    const bp = BLUEPRINTS.find((b) => b.id === r.bp);
    if (r.kind === 'playerroom') { this.sim.toast('玩家休息室不可拆除'); return; }
    const mode = this.sim.campaign?.mode || (this.tavern.legacy ? 'legacy' : 'tutorial');
    const source = cloneData(this.tavern.serialize());
    const removedFurniture = this.tavern.furns.filter((f) => this.tavern.roomOfFurn(f)?.id === id);
    source.rooms = source.rooms.filter((room) => room.id !== id);
    source.furns = source.furns.filter((furn) => !removedFurniture.some((f) => f.id === furn.id));
    source.dirt = source.dirt.filter((d) => !(d.x >= r.x && d.x < r.x + r.w && d.y >= r.y && d.y < r.y + r.h));
    try { validateCandidateOrError(this.tavern, source, mode, 'removeRoom'); } catch (error) { this.sim.toast(error.message); this.audio.play('error'); return; }
    const removed = this.tavern.removeRoom(id);
    let refund = Math.round(Number(r.purchasePrice ?? bp?.buildCost ?? bp?.cost ?? 0) * 0.7);
    for (const f of removed) if (!f.builtIn) refund += Math.round(Number(f.purchasePrice ?? furnDef(f.kind).cost[f.quality - 1] ?? 0) * 0.7);
    this.sim.econ.coins += refund;
    for (const staff of this.sim.staff) { staff.task = null; staff.path = []; staff.carry = null; staff.free = null; }
    for (const guest of this.sim.guests) guest.path = [];
    this.sim.toast(`拆除完成，返还 ${refund}`);
    this.selection = null;
    this.sim.invalidateTasks?.('room-remove');
    this.recordBuildState('拆除房间');
    this.save();
  }
  upgradeFurn(id        )       {
    const f = this.tavern.furnById(id);
    if (!f || f.quality >= 3) return;
    if (f.builtIn) { this.sim.toast('内置家具不可升级'); return; }
    const nextQuality = f.quality + 1;
    const needStar = furnQualityUnlock(f.kind, nextQuality);
    const room = this.tavern.roomOfFurn(f);
    if (this.sim.stars() < needStar) { this.sim.toast(`品质 ${'I'.repeat(nextQuality)} 需要 ★${needStar}`); this.audio.play('error'); return; }
    if (!room || room.quality < nextQuality) { this.sim.toast(`先把所在房间升级到品质 ${'I'.repeat(nextQuality)}`); this.audio.play('error'); return; }
    const def = furnDef(f.kind);
    const cost = def.cost[f.quality] - def.cost[f.quality - 1];
    if (this.sim.econ.coins < cost) { this.sim.toast('界币不足'); this.audio.play('error'); return; }
    this.sim.econ.coins -= cost;
    const fstyle = styleById(this.tavern.roomStyle(room));
    const atlas = this.materialPack === 'hd' ? this.worldMaterials.get('furniture') : null;
    const oldTex = furnTexture(f.kind, f.quality, fstyle.accent, atlas);
    const [fw, fh] = furnFootprint(f.kind, f.dir);
    const [sourceW, sourceH] = furnFootprint(f.kind, 0);
    const hdChair = !!(atlas && f.kind === 'chair');
    f.quality++;
    this.tavern.version++;    // 触发静态层重建，否则新外观不刷新
    this.sim.invalidateTasks?.('furn-upgrade');
    this.playUpgradeFx({
      type: 'furn',
      x: (f.x + fw / 2) * T,
      y: (f.y + fh / 2) * T,
      w: sourceW * T * (hdChair ? 0.6 : 1),
      h: sourceH * T * (hdChair ? 0.6 : 1),
      rot: f.dir * (Math.PI / 2),
      oldTex,
      quality: f.quality,
    });
    for (let i = 0; i < 8; i++) {
      this.sim.fx.push({
        x: f.x + Math.random() * fw,
        y: f.y + Math.random() * fh,
        t: 0.28 + Math.random() * 0.22,
        kind: 'spark',
      });
    }
    this.audio.play('upgrade-furn', f.quality >= 3 ? 1 : 0.88);
    this.recordBuildState('升级家具');
    this.save();
  }
  removeFurn(id        )       {
    if (this.sim.dayActive) { this.sim.toast('营业中不能拆除家具'); this.audio.play('error'); return; }
    const f = this.tavern.furnById(id);
    if (!f) return;
    if (f.builtIn) { this.sim.toast('内置家具不可出售'); return; }
    const candidate = this.tavern.serialize(); candidate.furns = candidate.furns.filter((x) => x.id !== id);
    try { validateCandidateOrError(this.tavern, candidate, this.sim.campaign?.mode || (this.tavern.legacy ? 'legacy' : 'tutorial'), 'removeFurn'); } catch (error) { this.sim.toast(error.message); return; }
    this.sim.econ.coins += Math.round(furnDef(f.kind).cost[f.quality - 1] * 0.7);
    this.tavern.removeFurn(id);
    this.sim.invalidateTasks?.('furn-remove');
    this.selection = null;
    this.recordBuildState('拆除家具');
    this.save();
  }
  playUpgradeFx({ type, x, y, w, h, rot = 0, oldTex = null, quality = 2 }) {
    const root = new PIXI.Container();
    root.x = x;
    root.y = y;
    this.upgradeFxLayer.addChild(root);
    let ghost = null;
    if (oldTex) {
      ghost = new PIXI.Sprite(oldTex);
      ghost.anchor.set(0.5);
      ghost.width = w;
      ghost.height = h;
      ghost.rotation = rot;
      root.addChild(ghost);
    }
    const flash = new PIXI.Graphics();
    flash.blendMode = 'add';
    root.addChild(flash);
    const ring = new PIXI.Graphics();
    ring.blendMode = 'add';
    root.addChild(ring);
    const wash = type === 'room' ? new PIXI.Graphics() : null;
    if (wash) {
      wash.blendMode = 'add';
      root.addChildAt(wash, 0);
    }
    this.upgradeFx.push({
      type, root, ghost, flash, ring, wash,
      t: 0, dur: type === 'room' ? 0.55 : 0.42,
      w, h, quality,
    });
  }
  tickUpgradeFx(dt) {
    const gold = 0xF3D98A;
    const brass = 0xE8B44A;
    for (const fx of this.upgradeFx) {
      fx.t += dt;
      const u = Math.min(1, fx.t / fx.dur);
      const out = 1 - (1 - u) * (1 - u);
      const col = fx.quality >= 3 ? gold : brass;
      if (fx.ghost) {
        fx.ghost.alpha = 1 - out;
        const grow = 1 + out * 0.1;
        fx.ghost.width = fx.w * grow;
        fx.ghost.height = fx.h * grow;
      }
      const flashR = Math.max(12, Math.max(fx.w, fx.h) * (0.28 + out * 0.5));
      fx.flash.clear();
      fx.flash.circle(0, 0, flashR).fill({ color: col, alpha: 0.55 * (1 - u) * (1 - u) });
      const ringR = 6 + out * Math.max(fx.w, fx.h) * 0.62;
      fx.ring.clear();
      fx.ring.circle(0, 0, ringR).stroke({
        width: fx.type === 'room' ? 3 : 2,
        color: col,
        alpha: 0.9 * (1 - u),
      });
      if (fx.wash) {
        fx.wash.clear();
        fx.wash.rect(-fx.w / 2, -fx.h / 2, fx.w, fx.h).fill({ color: col, alpha: 0.22 * (1 - out) });
      }
      if (u >= 1) {
        fx.root.destroy({ children: true });
        fx.done = true;
      }
    }
    this.upgradeFx = this.upgradeFx.filter((fx) => !fx.done);
  }
  rotateFurn(id        )       {
    const f = this.tavern.furnById(id);
    if (!f) return;
    if (this.sim.dayActive) { this.sim.toast('营业中不能旋转家具'); this.audio.play('error'); return; }
    for (let i = 1; i <= 4; i++) {
      const nd = (f.dir + i) % 4;
      const check = this.tavern.canPlaceFurn(f.kind, f.x, f.y, nd, f.id);
      if (check.ok) {
        const candidate = this.tavern.serialize(); const target = candidate.furns.find((x) => x.id === id); if (target) target.dir = nd;
        try { validateCandidateOrError(this.tavern, candidate, this.sim.campaign?.mode || (this.tavern.legacy ? 'legacy' : 'tutorial'), 'rotateFurn'); } catch { continue; }
        f.dir = nd;
        this.tavern.reindex();
        this.audio.play('place');
        this.recordBuildState('旋转家具');
        this.save();
        return;
      }
    }
    this.sim.toast('周围空间不足，无法旋转');
    this.audio.play('error');
  }
  deleteSelection()       {
    const s = this.selection;
    if (!s) return;
    if (s.kind === 'furn') this.removeFurn(s.id);
    else if (s.kind === 'room') this.demolishRoom(s.id);
  }
  buyStock(k        , n        )       {
    const cost = worldIngredientPrice(this.sim.econ, k) * n;
    if (this.sim.econ.coins < cost) { this.sim.toast('界币不足'); this.audio.play('error'); return; }
    this.sim.econ.coins -= cost;
    this.sim.econ.stock[k] += n;
    this.audio.play('coin', 0.5);
    this.save();
  }
  setMarkup(v        )       { this.sim.econ.markup = v; this.save(); }
  resolveEvent(i        )       {
    const text = this.sim.resolveEvent(i);
    this.audio.playOutcome(this.sim.lastEventResolution?.success);
    this.ui.openEventResult(text, this.sim.lastEventResolution);
    this.save();
  }

  // ---------- 帧 ----------
  frame(dt        )       {
    const frameStart = performance.now();
    if (this.sim.nightState?.dawn?.active) {
      this.sim.manualVec.x = 0; this.sim.manualVec.y = 0; this.keys.clear();
      this.ui.showDawnTransition?.(this.sim.nightState.dawn.stage || 'start');
      this.ui.render(true);
      const frameMs = performance.now() - frameStart; this.recordPerfFrame(frameMs); return;
    }
    const up = this.keys.has('w') || this.keys.has('arrowup');
    const down = this.keys.has('s') || this.keys.has('arrowdown');
    const left = this.keys.has('a') || this.keys.has('arrowleft');
    const right = this.keys.has('d') || this.keys.has('arrowright');
    const own = this.sim.staff.find((x) => x.isOwner);
    if (this.sim.manualOwner) {
      // 直控店主：按键给方向，镜头缓动跟随
      this.sim.manualVec.x = Math.max(-1, Math.min(1, (right ? 1 : 0) - (left ? 1 : 0) + this.manualInput.x));
      this.sim.manualVec.y = Math.max(-1, Math.min(1, (down ? 1 : 0) - (up ? 1 : 0) + this.manualInput.y));
      if (own) { this.cam.x += (own.x - this.cam.x) * Math.min(1, dt * 6); this.cam.y += (own.y - this.cam.y) * Math.min(1, dt * 6); }
    } else {
      const pan = 14 * dt;
      this.sim.manualVec.x = 0; this.sim.manualVec.y = 0;
      if (up) this.cam.y -= pan;
      if (down) this.cam.y += pan;
      if (left) this.cam.x -= pan;
      if (right) this.cam.x += pan;
    }

    const active = !this.paused && !this.blocked;
    this.sim.uiTick(dt);
    this.advanceEmployeeIntro(dt);
    const closingFrame = advanceClosingPhase(this.sim, this.closingState ||= { t: 0 }, dt * this.speed, (stat) => { this.sim.toast('打烊时间 · 集合完成'); this.ui.openSettlement(stat); });
    if (!closingFrame && (active || this.sim.campaign?.phase === 'closing-assemble')) this.sim.update(dt * this.speed);
    else {
      // 暂停/弹窗冻结经营，但直控店主仍按真实时间走路，避免安卓上原地踏步。
      if (this.sim.manualOwner && own && !this.titleActive && !this.creatorPending) this.sim.driveOwner(own, dt);
      this.sim.update(0);
      if (this.sim.manualOwner && own) this.sim.tickAnim(dt);
      if (this.blocked && !this.sim.running) this.sim.tickDepartures(dt);
    }
    if (this.sim.nightState?.active && (this.sim.nightState.proactiveInFlight || this.sim.nightState.proactiveReadyQueue?.length || this.sim.nightState.proactiveReadyStaff) && !this.ui.modal) {
      const ready = this.sim.consumeNightProactiveReady();
      if (ready) { this.ui.openNightProactive?.(ready); this.save(); }
    }
    advancePendingNightBed(this, dt * this.speed);
    if (own?.pendingBedRest && !own.path.length && this.sim.dayActive) {
      const result = this.sim.requestBedRest(own.id, own.pendingBedRest);
      if (result.ok) { delete own.pendingBedRest; this.sim.toast('开始床边休息'); this.ui.render(true); }
    }
    // 接入 AI 后，在收尾前一分钟后台生成一张严格结构化的当日专属经营事件。
    if (this.sim.dayActive && this.sim.dayT >= DAY_LEN - 60 && !this.sim.aiEventRequested) {
      this.sim.aiEventRequested = true;
      this.ui.requestDynamicBusinessEvent();
    }
    // 灯光动效：火苗快速闪烁、灯带缓慢呼吸、灶台无人时只剩余烬
    this.glowT = (this.glowT || 0) + dt;
    for (const ga of this.glowAnims) {
      const busy = ga.furn ? !!(this.tavern.furnById(ga.furn) || {}).busyBy : true;
      const t = this.glowT * ga.speed + ga.phase;
      const flick = Math.sin(t) * 0.5 + Math.sin(t * 2.7 + 1.3) * 0.3 + Math.sin(t * 6.1 + 0.7) * 0.2;
      ga.sp.alpha = Math.max(0.03, (ga.base + flick * ga.amp) * (busy ? 1 : 0.35));
    }
    const shade = nightShadeAlpha(this.sim.dayActive);
    for (const sp of this.nightShades) sp.alpha = shade;
    // 设备工作动效：火焰/气泡/水花换帧；壁炉常燃，其余开工才播
    for (const a of this.furnAnims) {
      a.phase += dt;
      a.sp.texture = a.frames[Math.floor(a.phase * 7) % a.frames.length];
      const furn = this.tavern.furnById(a.furn);
      const visible = furn ? this.pixelWorldVisible((furn.x + 0.5) * T, (furn.y + 0.5) * T, 2) : false;
      a.sp.visible = visible && (a.always || !!furn.busyBy);
    }
    this.tickUpgradeFx(dt);
    for (const s of this.sim.sounds) this.audio.play(s, s === 'portal' ? 0.5 : 0.8);
    this.sim.sounds.length = 0;

    if (this.sim.pendingEvent && !this.ui.modal) this.ui.openEvent();
    if (this.sim.dayActive && this.sim.campaign?.mode === 'tutorial' && this.sim.econ.day === 1 && this.sim.campaign.tutorialFlags?.day1ForcedLossComplete) {
      this.sim.campaign.tutorialFlags.day1ForcedLossComplete = false;
      this.finishDay();
    }
    if (this.sim.dayActive && this.sim.campaign?.mode === 'tutorial' && this.sim.econ.day === 3 && this.sim.tutorialWaveIndex >= 3 && !this.sim.groups.some((group) => group.tutorialScriptId?.startsWith('d3-'))) {
      if (!this.sim.campaign.tutorialFlags?.tutorialCompleteAnnounced) {
        this.sim.campaign.tutorialFlags.tutorialCompleteAnnounced = true;
        this.sim.campaign.phase = 'tutorial-complete';
        this.tutorialCompletionT = 0;
        const owner = this.sim.staff.find((staff) => staff.isOwner);
        if (owner) owner.bubble = { text: '三个世界身份都认识了。接下来，就按自己的方式经营吧！', t: 5 };
        this.sim.toast('三日教学完成：从现在开始进入自由经营');
        this.ui.tutorialActive = true;
        this.save();
      }
      this.tutorialCompletionT += dt;
      if (this.tutorialCompletionT >= 4.5) {
        try { localStorage.setItem(TUTORIAL_COMPLETED_KEY, '1'); } catch (_) { /* ignore */ }
        this.sim.campaign.tutorialFlags.tutorialComplete = true;
        this.sim.campaign.mode = 'free';
        this.sim.campaign.phase = 'business';
        this.ui.tutorialActive = false;
        this.tutorialCompletionT = 0;
        this.finishDay();
      }
    }
    if (this.sim.dayActive && this.sim.dayT >= DAY_LEN && (!this.sim.groups.some((g) => !g.overnight) || this.sim.dayT > DAY_LEN + 90)) this.finishDay();

    this.render();
    this.ui.tick(dt);
    this.recordPerfFrame(performance.now() - frameStart);
  }

  recordPerfFrame(frameMs) {
    this.perfStats.frameMs = frameMs;
    this.perfFrameSamples.push(frameMs);
    if (this.perfFrameSamples.length > 240) this.perfFrameSamples.shift();
    const sorted = [...this.perfFrameSamples].sort((a, b) => a - b);
    this.perfStats.frameP95Ms = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * .95))] || frameMs;
    if (frameMs > 33.3) this.perfStats.longFrames++;
  }

  ensureWorldBackground() {
    if (!this.sim) return;
    const id = this.sim.currentWorld()?.id || 'hearth_coast';
    if (id === this.worldBackgroundId) return;
    this.worldBackgroundId = id;
    const load = ++this.worldBackgroundLoad;
    this.worldBackgroundFar.removeChildren();
    this.worldBackgroundMid.removeChildren();
    this.worldBackgroundFarSprite = null;
    this.worldBackgroundMidSprite = null;
    const seed = [...id].reduce((sum, ch) => (sum * 33 + ch.charCodeAt(0)) >>> 0, 5381);
    this.worldBackgroundParticles = Array.from({ length: 34 }, (_, i) => ({
      x: ((seed ^ (i * 2654435761)) >>> 0) / 4294967295,
      y: ((seed * (i + 19) * 2246822519) >>> 0) / 4294967295,
      size: 1 + (i % 4), speed: 0.012 + (i % 7) * 0.004, phase: (i * 0.173) % 1,
    }));
    if (!WORLD_BACKGROUND_IDS.has(id)) return;
    const layered = WORLD_LAYERED_BACKGROUND_IDS.has(id);
    const farName = WORLD_SEPARATE_FAR_BACKGROUND_IDS.has(id) ? `${id}-far.webp` : `${id}.webp`;
    const farUrl = `assets/world-backgrounds/${farName}`;
    const midUrl = `assets/world-backgrounds/${id}-mid.webp`;
    Promise.all([PIXI.Assets.load(farUrl), PIXI.Assets.load(midUrl)]).then(([farTexture, midTexture]) => {
      if (load !== this.worldBackgroundLoad) return;
      farTexture.source.scaleMode = 'linear';
      midTexture.source.scaleMode = 'linear';
      const far = new PIXI.Sprite(farTexture), mid = new PIXI.Sprite(midTexture);
      far.anchor.set(0.5); mid.anchor.set(0.5);
      far.alpha = 0.94;
      mid.alpha = layered ? 0.42 : 0.18;
      mid.mask = layered ? null : this.worldBackgroundMask;
      this.worldBackgroundFar.addChild(far);
      this.worldBackgroundMid.addChild(mid);
      this.worldBackgroundFarSprite = far;
      this.worldBackgroundMidSprite = mid;
      this.layoutWorldBackground();
    }).catch(() => { /* 自定义世界或缺失资产使用世界色天空，不显示临时剪影。 */ });
  }

  layoutWorldBackground() {
    const w = this.app?.renderer?.width || 1, h = this.app?.renderer?.height || 1;
    this.worldBackgroundMask.clear().rect(0, Math.round(h * 0.43), w, Math.ceil(h * 0.57)).fill(0xffffff);
    for (const sp of [this.worldBackgroundFarSprite, this.worldBackgroundMidSprite]) {
      if (!sp?.texture) continue;
      const tw = sp.texture.width || 1, th = sp.texture.height || 1;
      const layered = WORLD_LAYERED_BACKGROUND_IDS.has(this.worldBackgroundId);
      const extra = sp === this.worldBackgroundMidSprite ? (layered ? 1.06 : 1.12) : (layered ? 1.015 : 1.08);
      const scale = Math.max(w / tw, h / th) * extra;
      sp.scale.set(scale);
      if (sp === this.worldBackgroundFarSprite) this.worldBackgroundFarScale = scale;
      else this.worldBackgroundMidScale = scale;
      sp.position.set(w / 2, h / 2);
    }
  }

  renderWorldBackground(time) {
    this.ensureWorldBackground();
    const w = this.app.renderer.width, h = this.app.renderer.height;
    const driftX = Math.sin((this.cam.x || 0) * 0.045), driftY = Math.sin((this.cam.y || 0) * 0.04);
    const layered = WORLD_LAYERED_BACKGROUND_IDS.has(this.worldBackgroundId);
    const motion = WORLD_BACKGROUND_MOTION[this.worldBackgroundId] || WORLD_BACKGROUND_MOTION.hearth_coast;
    if (this.worldBackgroundFarSprite) {
      const farX = layered ? Math.sin(time * 0.07) * 1.5 : 0;
      const farY = layered ? Math.cos(time * 0.055) * 1.2 : 0;
      this.worldBackgroundFarSprite.position.set(w / 2 - driftX * 1.5 + farX, h / 2 - driftY + farY);
      this.worldBackgroundFarSprite.scale.set(this.worldBackgroundFarScale * (layered ? 1 + Math.sin(time * 0.045) * 0.0025 : 1));
      if (layered) this.worldBackgroundFarSprite.alpha = motion.farAlpha;
    }
    if (this.worldBackgroundMidSprite) {
      const midX = layered ? Math.sin(time * motion.xSpeed + 0.8) * motion.x : 0;
      const midY = layered ? Math.cos(time * motion.ySpeed) * motion.y : 0;
      this.worldBackgroundMidSprite.position.set(w / 2 - driftX * 9 + midX, h / 2 - driftY * 4 + midY);
      this.worldBackgroundMidSprite.scale.set(this.worldBackgroundMidScale * (layered ? 1 + Math.sin(time * 0.08) * 0.006 : 1));
      if (layered) this.worldBackgroundMidSprite.alpha = motion.alpha + Math.sin(time * 0.17) * 0.03;
    }
    const g = this.worldBackgroundWeather;
    g.clear();
    const world = this.sim?.currentWorld?.();
    const id = world?.id || 'hearth_coast';
    const tint = hexToNum(world?.visuals?.atmosphere?.tint || world?.atmosphere?.tint || '#9BC7E8');
    const veil = id === 'magma_ridge' || id === 'honey_sky' || id === 'inverted_dreamsea' ? 0.11 : 0.045;
    g.rect(0, 0, w, h).fill({ color: 0x07111d, alpha: veil });
    for (const p of this.worldBackgroundParticles) {
      let x = (p.x + time * p.speed) % 1 * w;
      let y = (p.y + time * p.speed * 0.45) % 1 * h;
      const pulse = 0.45 + Math.sin(time * 1.7 + p.phase * 12) * 0.2;
      if (id === 'neon_ring') g.moveTo(x, y).lineTo(x - 5, y + 18 + p.size * 3).stroke({ width: 1, color: tint, alpha: 0.18 });
      else if (id === 'iron_hive' || id === 'ash_dragoncourt') {
        y = (p.y - time * p.speed + 5) % 1 * h;
        g.rect(x, y, p.size, p.size + 2).fill({ color: tint, alpha: pulse * 0.35 });
      } else if (id === 'moonsea' || id === 'inverted_dreamsea') {
        y = (p.y - time * p.speed + 5) % 1 * h;
        g.circle(x, y, 2 + p.size).stroke({ width: 1, color: tint, alpha: pulse * 0.28 });
      } else if (id === 'verdant_court' || id === 'honey_sky') {
        y = (p.y - time * p.speed * 0.7 + 5) % 1 * h;
        g.circle(x + Math.sin(time + p.phase * 20) * 8, y, p.size).fill({ color: tint, alpha: pulse * 0.36 });
      } else if (id === 'magma_ridge') {
        y = (p.y - time * p.speed * 0.55 + 5) % 1 * h;
        g.moveTo(x - p.size * 3, y).lineTo(x + p.size * 3, y).stroke({ width: 1, color: tint, alpha: pulse * 0.48 });
      } else if (id === 'evernight') {
        g.circle(x + Math.sin(time * 0.6 + p.phase * 9) * 12, y, 1 + p.size).fill({ color: tint, alpha: pulse * 0.22 });
      } else if (id === 'mask_realm') {
        const sway = Math.sin(time * 0.9 + p.phase * 16) * 9;
        g.rect(x + sway, y, 2 + p.size, 1 + p.size).fill({ color: tint, alpha: pulse * 0.32 });
      } else if (id === 'timeless_bazaar') {
        const radius = 2 + p.size;
        g.circle(x, y, radius).stroke({ width: 1, color: tint, alpha: pulse * 0.3 });
        g.moveTo(x, y).lineTo(x + Math.cos(time + p.phase * 24) * radius, y + Math.sin(time + p.phase * 24) * radius).stroke({ width: 1, color: tint, alpha: pulse * 0.34 });
      } else g.rect(x, y, p.size, p.size).fill({ color: tint, alpha: pulse * 0.22 });
    }
  }

  drawStars()       {
    const g = this.stars;
    g.clear();
    this.starGlintsA.clear();
    this.starGlintsB.clear();
    const w = this.app.renderer.width, h = this.app.renderer.height;
    const sky = createSkyPlan(w, h);
    const atmosphere = this.sim?.currentWorld?.()?.visuals?.atmosphere || this.sim?.currentWorld?.()?.atmosphere;
    const skyColors = atmosphere?.sky || [];
    for (let i = 0; i < sky.bands.length; i++) {
      const band = sky.bands[i];
      const color = skyBandColor(skyColors, i, sky.bands.length, band.color);
      g.rect(0, band.y, w, band.height).fill(hexToNum(color));
    }
    for (const cloud of sky.nebula) {
      g.ellipse(cloud.x, cloud.y, cloud.rx, cloud.ry).fill({ color: cloud.color, alpha: cloud.alpha });
    }
    const galaxy = sky.galaxy;
    g.ellipse(galaxy.x - galaxy.rx * 0.22, galaxy.y + galaxy.ry * 0.1, galaxy.rx * 0.72, galaxy.ry * 0.56).fill({ color: 0x5a4bae, alpha: 0.045 });
    g.ellipse(galaxy.x + galaxy.rx * 0.25, galaxy.y - galaxy.ry * 0.12, galaxy.rx * 0.64, galaxy.ry * 0.48).fill({ color: 0x8e56bf, alpha: 0.05 });
    g.ellipse(galaxy.x - galaxy.rx * 0.02, galaxy.y, galaxy.rx * 0.45, galaxy.ry * 0.38).fill({ color: 0xb06bc9, alpha: 0.065 });
    for (const dust of sky.galaxyDust) {
      g.rect(dust.x, dust.y, dust.size, dust.size).fill({ color: dust.color, alpha: dust.alpha });
    }
    g.ellipse(galaxy.x, galaxy.y, galaxy.rx * 0.22, galaxy.ry * 0.2).fill({ color: 0xffca70, alpha: 0.42 });
    g.rect(galaxy.x - 2, galaxy.y - 2, 5, 5).fill({ color: 0xffefb0, alpha: 0.86 });
    for (const star of sky.stars) {
      g.rect(star.x, star.y, star.size, star.size).fill({ color: star.color, alpha: star.alpha });
      if (star.size >= 3) g.rect(star.x - 1, star.y + 1, star.size + 2, 1).fill({ color: star.color, alpha: star.alpha * 0.45 });
    }
    for (const star of sky.glints) {
      const layer = star.phase ? this.starGlintsB : this.starGlintsA;
      const r = star.radius;
      layer.rect(star.x - r, star.y, r * 2 + 1, 1).fill({ color: star.color, alpha: 0.9 });
      layer.rect(star.x, star.y - r, 1, r * 2 + 1).fill({ color: star.color, alpha: 0.9 });
      layer.rect(star.x, star.y, 1, 1).fill(0xffffff);
      if (r >= 5) layer.circle(star.x, star.y, 4).fill({ color: star.color, alpha: 0.08 });
    }
    this.ensureWorldBackground();
    this.layoutWorldBackground();
  }

  render()       {
    this.perfStats.frames++;
    const zoom = this.zoom;
    if (this.app.renderer.width !== this.lastW || this.app.renderer.height !== this.lastH) {
      this.lastW = this.app.renderer.width; this.lastH = this.app.renderer.height;
      this.drawStars();
    }
    this.world.scale.set(zoom);
    const view = this.mapViewportRect();
    this.renderViewport = view;
    this.world.x = Math.round(view.centerX - this.cam.x * T * zoom);
    this.world.y = Math.round(view.centerY - this.cam.y * T * zoom);
    const skyTime = performance.now() * 0.001;
    this.starGlintsA.alpha = 0.48 + Math.sin(skyTime * 1.35) * 0.22;
    this.starGlintsB.alpha = 0.52 + Math.sin(skyTime * 1.07 + 2.1) * 0.2;
    this.renderWorldBackground(skyTime);
    if (this.worldTravelActive) this.layoutWorldTravel();

    if (this.staticVersion !== this.tavern.version) { this.rebuildStatic(); this.staticVersion = this.tavern.version; }
    this.rebuildDirt();
    this.renderActors();
    this.renderItems();
    this.renderOverlay();
    // 音乐层：营业中提高
    this.audio.setMusicLevel(this.worldTravelActive ? 0 : this.sim.dayActive ? 0.72 : 0.4);
    if (typeof window !== 'undefined') window.__hotelPerf = { ...this.perfStats, task: this.sim.taskPerfSnapshot?.(), frame: this.perfStats.frames, ui: { panelRebuilds: this.ui.panelRebuilds || 0 } };
  }

  rebuildStatic()       {
    this.floorLayer.removeChildren();
    this.lightLayer.removeChildren();
    this.nightShades = [];
    this.furnLayer.removeChildren();
    const wall = this.wallLayer;
    wall.clear();
    this.wallSprites.removeChildren();
    this.decoSprites.removeChildren();
    this.glowAnims = [];
    this.furnAnims = [];
    const lights = worldLights(this.tavern, WALL_DECO, (f) => {
      const fstyle = styleById(this.tavern.roomStyle(this.tavern.roomOfFurn(f)));
      return f.kind === 'fireplace' || f.kind === 'stove' ? '#E4732C'
        : (f.kind === 'lightbar' || f.kind === 'lightcol') ? fstyle.accent : fstyle.glow;
    });
    const hdLight = this.materialPack === 'hd';
    const floorTex = (name        , v        )               => {
      const key = `f|${name}|${v}`;
      let tex = this.pixTex.get(key);
      if (!tex) { tex = texFromCanvas(floorVariant(name, v, this.floorBase.get(name) || null).canvas); this.pixTex.set(key, tex); }
      return tex;
    };
    const materialFrame = (name, x = 0, y = 0) => {
      const base = this.worldMaterials.get(name);
      if (!base) return null;
      const size = T * WORLD_ART_SCALE;
      const fx = ((x % WORLD_ART_SCALE) + WORLD_ART_SCALE) % WORLD_ART_SCALE;
      const fy = ((y % WORLD_ART_SCALE) + WORLD_ART_SCALE) % WORLD_ART_SCALE;
      const key = `hd|${name}|${fx}|${fy}`;
      let tex = this.pixTex.get(key);
      if (!tex) {
        tex = new PIXI.Texture({
          source: base.source,
          frame: new PIXI.Rectangle(fx * size, fy * size, size, size),
        });
        this.pixTex.set(key, tex);
      }
      return tex;
    };
    const glowTex = (r        , c        )               => {
      const key = `g|${r}|${c}`;
      let tex = this.pixTex.get(key);
      if (!tex) {
        tex = texFromCanvas(glowPix(r, c).canvas);
        tex.source.scaleMode = 'linear';
        this.pixTex.set(key, tex);
      }
      return tex;
    };
    const poolTex = (r        , c        )               => {
      const key = `lp|${r}|${c}`;
      let tex = this.pixTex.get(key);
      if (!tex) {
        tex = texFromCanvas(lightPoolPix(r, c).canvas);
        tex.source.scaleMode = 'linear';
        this.pixTex.set(key, tex);
      }
      return tex;
    };
    const rugTex = (edge, accent, body, seed) => {
      const key = `rug|${edge}|${accent}|${body}|${seed % 12}`;
      let tex = this.pixTex.get(key);
      if (!tex) { tex = texFromCanvas(rugTile(edge, accent, body, seed).canvas); this.pixTex.set(key, tex); }
      return tex;
    };
    const decoTex = (kind        , horiz         )               => {
      const key = `dc|${kind}|${horiz ? 'h' : 'v'}`;
      let tex = this.pixTex.get(key);
      if (!tex) { tex = texFromCanvas(wallDecoPix(kind, horiz).canvas); this.pixTex.set(key, tex); }
      return tex;
    };
    for (const r of this.tavern.rooms) {
      const stl = styleById(this.tavern.roomStyle(r));
      const name = stl.floor || ROOM_FLOOR[r.kind];
      const hasTex = this.floorBase.has(name) || true;
      if (hasTex) {
        // 逐格变体：多数格用素面，约三成带手写细节，避免大面积重复
        for (let x = r.x; x < r.x + r.w; x++) for (let y = r.y; y < r.y + r.h; y++) {
          const hash = ((x * 73856093) ^ (y * 19349663) ^ (r.id * 83492791)) >>> 0;
          const roll = hash % 100;
          const v = roll < 62 ? 0 : 1 + (hash >>> 7) % (FLOOR_VARIANTS - 1);
          const hdName = this.materialPack === 'hd' ? hdQualityName(name, r.quality, this.worldMaterials) : name;
          const deluxeFloor = hdName !== name;
          const hd = this.materialPack === 'hd' ? materialFrame(hdName, x - r.x, y - r.y) : null;
          const sp = new PIXI.Sprite(hd || floorTex(name, v));
          sp.width = T; sp.height = T;
          if (name === 'floor-tatami' && this.materialPack !== 'hd' && ((x + y) & 1)) {
            // 经典榻榻米：相邻格织向转 90°。高清图已带完整席面，再转会把席块拧碎。
            sp.anchor.set(0.5);
            sp.rotation = Math.PI / 2;
            sp.x = x * T + T / 2; sp.y = y * T + T / 2;
          } else {
            sp.x = x * T; sp.y = y * T;
            // 高清有豪华地面帧就换贴图；经典或还没豪华帧时才用暖金调色。
            let tint = (name === 'floor-kitchen' && ((x + y) & 1)) ? 0xE4EAF0 : 0xFFFFFF;
            const qt = deluxeFloor ? 0xFFFFFF
              : this.materialPack === 'hd'
              ? (r.quality >= 3 ? 0xFFD890 : r.quality >= 2 ? 0xFFE8C4 : 0xFFFFFF)
              : (r.quality >= 3 ? 0xFFF0D2 : r.quality >= 2 ? 0xFBF6EA : 0xFFFFFF);
            tint = (((tint >> 16 & 255) * (qt >> 16 & 255) / 255) << 16) | (((tint >> 8 & 255) * (qt >> 8 & 255) / 255) << 8) | Math.round((tint & 255) * (qt & 255) / 255);
            if (tint !== 0xFFFFFF) sp.tint = tint;
          }
          const warmth = tileWarmth(x, y, lights) * edgeOcclusion(this.tavern, x, y);
          const lit = hdLight ? warmth : 0.42 + warmth * 0.38;
          const lightTint = floorLightTint(lit, sp.tint || 0xFFFFFF, hdLight ? 1.25 : 1);
          if (lightTint !== 0xFFFFFF) sp.tint = lightTint;
          this.floorLayer.addChild(sp);
        }
      }
      // 地毯：酒吧/休息室/餐饮房间内缩一格铺一张，边饰自动拼接
      const rug = RUG[r.kind];
      const rugMaterial = this.worldMaterials.get('rug');
      if (rug && this.materialPack === 'hd' && rugMaterial && r.w >= 4 && r.h >= 3) {
        const sp = new PIXI.Sprite(rugMaterial);
        sp.x = (r.x + 1) * T; sp.y = (r.y + 1) * T;
        sp.width = (r.w - 2) * T; sp.height = (r.h - 2) * T;
        sp.alpha = 0.96;
        this.floorLayer.addChild(sp);
      } else if (rug && (this.materialPack === 'classic' || !rugMaterial) && r.w >= 4 && r.h >= 3) {
        for (let x = 0; x < r.w - 2; x++) for (let y = 0; y < r.h - 2; y++) {
          const edge = (y === 0 ? 1 : 0) | (y === r.h - 3 ? 2 : 0) | (x === 0 ? 4 : 0) | (x === r.w - 3 ? 8 : 0);
          const sp = new PIXI.Sprite(rugTex(edge, rug[0], rug[1], r.id * 31 + x * 7 + y));
          sp.x = (r.x + x + 1) * T; sp.y = (r.y + y + 1) * T;
          this.floorLayer.addChild(sp);
        }
      }
    }
    const shadeA = nightShadeAlpha(this.sim && this.sim.dayActive);
    for (const r of this.tavern.rooms) {
      const shade = new PIXI.Graphics();
      shade.rect(r.x * T, r.y * T, r.w * T, r.h * T).fill({ color: 0x1a1210, alpha: 1 });
      shade.blendMode = 'multiply';
      shade.alpha = shadeA;
      this.lightLayer.addChild(shade);
      this.nightShades.push(shade);
    }
    for (const light of lights) {
      const pool = new PIXI.Sprite(poolTex(light.bloom, light.color));
      pool.anchor.set(0.5);
      pool.x = light.x * T;
      pool.y = light.y * T;
      pool.blendMode = 'add';
      pool.alpha = light.alpha;
      this.lightLayer.addChild(pool);
      const prof = light.kind === 'fireplace' ? { base: 0.28, amp: 0.1, speed: 6.2 }
        : light.kind === 'stove' ? { base: 0.08, amp: 0.13, speed: 8.4 }
        : light.kind === 'sconce' ? { base: 0.24, amp: 0.05, speed: 2.0 }
        : { base: light.alpha, amp: 0.05, speed: 2.1 };
      this.glowAnims.push({ sp: pool, ...prof, phase: (light.x * 7.1 + light.y * 3.3) % 6.28, furn: light.furn || 0 });
    }
    // 墙体贴图化：外墙 8px（壁纸+踢脚线），内墙 5px，门口铺门框；墙脚再压两层地面投影
    const isDoor = (x1        , y1        , x2        , y2        )          =>
      this.tavern.doors.some((d) => (d.ax === x1 && d.ay === y1 && d.bx === x2 && d.by === y2) || (d.ax === x2 && d.ay === y2 && d.bx === x1 && d.by === y1));
    const wallTex = (kind               , roomKind        , horiz         , styleId        , rq = 1)               => {
      const st = styleById(styleId);
      // 房间品质换材质：II 加亮勾缝、III 暖金墙面+金踢脚（缓存键带品质）
      const base = st.wall || ROOM_WALL[roomKind] || '#8C6B4A';
      const wc = rq >= 3 ? mix(base, '#C9A24B', 0.35) : rq >= 2 ? mix(base, '#F5E6C8', 0.12) : base;
      const tm = rq >= 3 ? '#F3D98A' : rq >= 2 ? mix(st.trim || '#8A5A38', '#F3D98A', 0.35) : st.trim;
      const key = `w|${kind}|${roomKind}|${horiz ? 'h' : 'v'}|${styleId}|${rq}`;
      let tex = this.pixTex.get(key);
      if (!tex) { tex = texFromCanvas(wallPix(kind, roomKind, horiz, wc, tm).canvas); this.pixTex.set(key, tex); }
      return tex;
    };
    const doorTex = (horiz         )               => {
      const key = `d|${horiz ? 'h' : 'v'}`;
      let tex = this.pixTex.get(key);
      if (!tex) { tex = texFromCanvas(doorPix(horiz).canvas); this.pixTex.set(key, tex); }
      return tex;
    };
    const beamStrip = (x, quality = 1) => {
      const wallName = hdQualityName('wall', quality, this.worldMaterials);
      const base = this.worldMaterials.get(wallName);
      if (!base) return null;
      const fx = ((x % WORLD_ART_SCALE) + WORLD_ART_SCALE) % WORLD_ART_SCALE;
      const key = `beamstrip|${wallName}|${fx}`;
      let tex = this.pixTex.get(key);
      if (!tex) {
        tex = new PIXI.Texture({
          source: base.source,
          frame: new PIXI.Rectangle(fx * (T * WORLD_ART_SCALE), 0, T * WORLD_ART_SCALE, 32),
        });
        this.pixTex.set(key, tex);
      }
      return tex;
    };
    for (const r of this.tavern.rooms) {
      for (let x = r.x; x < r.x + r.w; x++) for (let y = r.y; y < r.y + r.h; y++) {
        const sides                             = [[0, 0, -1], [1, 0, 1], [2, -1, 0], [3, 1, 0]];
        for (const [side, dx, dy] of sides) {
          const nb = this.tavern.roomAt(x + dx, y + dy);
          if (nb && nb.id === r.id) continue;
          if (nb && nb.id < r.id && !isDoor(x, y, x + dx, y + dy)) continue;   // 内墙只画一次
          const horiz = side === 0 || side === 1;
          if (nb && isDoor(x, y, x + dx, y + dy)) {
            const hdDoor = this.materialPack === 'hd' ? this.worldMaterials.get('door') : null;
            const sp = new PIXI.Sprite(hdDoor || doorTex(horiz));
            if (hdDoor) {
              sp.anchor.set(0.5); sp.width = T; sp.height = 10;
              sp.rotation = horiz ? 0 : Math.PI / 2;
              sp.x = side === 2 ? x * T + 4 : side === 3 ? (x + 1) * T - 4 : x * T + T / 2;
              sp.y = side === 0 ? y * T + 4 : side === 1 ? (y + 1) * T - 4 : y * T + T / 2;
            } else if (side === 0) { sp.x = x * T; sp.y = y * T - 1; }
            else if (side === 1) { sp.x = x * T; sp.y = (y + 1) * T - 9; }
            else if (side === 2) { sp.x = x * T - 1; sp.y = y * T; }
            else { sp.x = (x + 1) * T - 9; sp.y = y * T; }
            this.wallSprites.addChild(sp);
            continue;
          }
          const kind                = nb ? 'int' : 'ext';
          const th = nb ? 5 : 8;
          const sp = new PIXI.Sprite(wallTex(kind, r.kind, horiz, this.tavern.roomStyle(r), r.quality));
          if (side === 0) { sp.x = x * T; sp.y = y * T; }
          else if (side === 1) { sp.x = x * T; sp.y = (y + 1) * T; sp.scale.y = -1; }
          else if (side === 2) { sp.x = x * T; sp.y = y * T; }
          else { sp.x = (x + 1) * T; sp.y = y * T; sp.scale.x = -1; }
          const beam = this.materialPack === 'hd' ? beamStrip(x, r.quality) : null;
          if (beam) {
            const trim = new PIXI.Sprite(beam);
            trim.anchor.set(0.5); trim.width = T; trim.height = th;
            trim.rotation = horiz ? 0 : Math.PI / 2;
            trim.x = side === 2 ? x * T + th / 2 : side === 3 ? (x + 1) * T - th / 2 : x * T + T / 2;
            trim.y = side === 0 ? y * T + th / 2 : side === 1 ? (y + 1) * T - th / 2 : y * T + T / 2;
            const deluxeWall = r.quality >= 2 && this.worldMaterials.has(hdQualityName('wall', r.quality, this.worldMaterials))
              && hdQualityName('wall', r.quality, this.worldMaterials) !== 'wall';
            const beamStyle = styleById(this.tavern.roomStyle(r));
            let beamHex = deluxeWall ? '#FFFFFF'
              : r.quality >= 3 ? mix('#FFFFFF', '#E8B44A', 0.52)
              : r.quality >= 2 ? mix('#FFFFFF', '#C9922F', 0.3) : '#FFFFFF';
            if (!deluxeWall && beamStyle.id !== 'rustic') beamHex = mix(beamHex, beamStyle.trim || beamStyle.accent, 0.45);
            if (beamHex !== '#FFFFFF') trim.tint = hexToNum(beamHex);
            this.wallSprites.addChild(trim);
          } else {
            this.wallSprites.addChild(sp);
          }
          if (!nb && ((x * 5 + y * 3 + side) % 4 === 0)) {
            const pick = WALL_DECO[r.kind] || WALL_DECO.dining;
            const kindDeco = pick[(x + y + side) % pick.length];
            if (!(this.materialPack === 'hd' && HD_HIDDEN_WALL_DECOS.has(kindDeco))) {
              const hdDeco = this.materialPack === 'hd' ? furnitureAtlasTexture(kindDeco, this.worldMaterials.get('furniture')) : null;
              const d = new PIXI.Sprite(hdDeco || decoTex(kindDeco, horiz));
              if (hdDeco) { d.width = 24; d.height = 24; d.rotation = horiz ? 0 : Math.PI / 2; }
              else d.tint = hexToNum(styleById(this.tavern.roomStyle(r)).furnTint);
              d.anchor.set(0.5);
              if (side === 0) { d.x = x * T + T / 2; d.y = y * T + 4; }
              else if (side === 1) { d.x = x * T + T / 2; d.y = (y + 1) * T - 4; d.scale.y *= -1; }
              else if (side === 2) { d.x = x * T + 4; d.y = y * T + T / 2; }
              else { d.x = (x + 1) * T - 4; d.y = y * T + T / 2; d.scale.x *= -1; }
              this.decoSprites.addChild(d);
              if (kindDeco === 'sconce') {
                const gl = new PIXI.Sprite(glowTex(40, '#F3B84B'));
                gl.anchor.set(0.5);
                gl.blendMode = 'add';
                gl.alpha = 0.35;
                gl.x = side === 2 ? x * T + 10 : side === 3 ? (x + 1) * T - 10 : x * T + T / 2;
                gl.y = side === 0 ? y * T + 10 : side === 1 ? (y + 1) * T - 10 : y * T + T / 2;
                this.decoSprites.addChild(gl);
              }
            }
          }
          const s1 = side === 0 ? [x * T, y * T + th, T, 3] : side === 1 ? [x * T, (y + 1) * T - th - 3, T, 3]
            : side === 2 ? [x * T + th, y * T, 3, T] : [(x + 1) * T - th - 3, y * T, 3, T];
          wall.rect(s1[0], s1[1], s1[2], s1[3]).fill({ color: 0x0a0710, alpha: nb ? 0.12 : 0.2 });
          const s2 = side === 0 ? [x * T, y * T + th + 3, T, 2] : side === 1 ? [x * T, (y + 1) * T - th - 5, T, 2]
            : side === 2 ? [x * T + th + 3, y * T, 2, T] : [(x + 1) * T - th - 5, y * T, 2, T];
          wall.rect(s2[0], s2[1], s2[2], s2[3]).fill({ color: 0x0a0710, alpha: nb ? 0.05 : 0.09 });
        }
      }
      // 房间升级：经典用像素金线；高清把同一条木踢脚镀成黄铜，并在 III 加角饰。
      const gap = (x        , y        , dx        , dy        )          => isDoor(x, y, x + dx, y + dy);
      if (r.quality >= 2 && this.materialPack !== 'hd') {
        const col = r.quality >= 3 ? 0xC9922F : 0x8A5A38;
        const hi = r.quality >= 3 ? 0xF3D98A : 0xB5763F;
        for (let x = r.x; x < r.x + r.w; x++) {
          if (!this.tavern.roomAt(x, r.y - 1) || gap(x, r.y, 0, -1)) { if (!gap(x, r.y, 0, -1)) { wall.rect(x * T + 2, r.y * T + 9, T - 4, 2).fill(col); wall.rect(x * T + 2, r.y * T + 9, T - 4, 1).fill(hi); } }
          if (!this.tavern.roomAt(x, r.y + r.h) || gap(x, r.y + r.h - 1, 0, 1)) { if (!gap(x, r.y + r.h - 1, 0, 1)) { wall.rect(x * T + 2, (r.y + r.h) * T - 11, T - 4, 2).fill(col); wall.rect(x * T + 2, (r.y + r.h) * T - 10, T - 4, 1).fill(hi); } }
        }
        for (let y = r.y; y < r.y + r.h; y++) {
          if (!this.tavern.roomAt(r.x - 1, y) || gap(r.x, y, -1, 0)) { if (!gap(r.x, y, -1, 0)) { wall.rect(r.x * T + 9, y * T + 2, 2, T - 4).fill(col); wall.rect(r.x * T + 9, y * T + 2, 1, T - 4).fill(hi); } }
          if (!this.tavern.roomAt(r.x + r.w, y) || gap(r.x + r.w - 1, y, 1, 0)) { if (!gap(r.x + r.w - 1, y, 1, 0)) { wall.rect((r.x + r.w) * T - 11, y * T + 2, 2, T - 4).fill(col); wall.rect((r.x + r.w) * T - 10, y * T + 2, 1, T - 4).fill(hi); } }
        }
        if (r.quality >= 3) for (const [cx, cy] of [[r.x, r.y], [r.x + r.w - 1, r.y], [r.x, r.y + r.h - 1], [r.x + r.w - 1, r.y + r.h - 1]]              ) {
          wall.rect(cx * T + 7, cy * T + 7, 5, 5).fill(0x8A5A38);
          wall.rect(cx * T + 8, cy * T + 8, 3, 3).fill(0xF3D98A);
        }
      }

    }
    // 门厅入口只在真正朝向室外时补门槛；与上方房间相连时由普通门系统处理。
    const e = this.tavern.entrance();
    if (!this.tavern.roomAt(e.x, e.y - 1)) {
      const entranceDoor = this.materialPack === 'hd' ? this.worldMaterials.get('door') : null;
      const sp = new PIXI.Sprite(entranceDoor || doorTex(true));
      if (entranceDoor) {
        sp.anchor.set(0.5); sp.width = T; sp.height = 10;
        sp.x = e.x * T + T / 2; sp.y = e.y * T + 4;
      } else { sp.x = e.x * T; sp.y = e.y * T - 1; }
      this.wallSprites.addChild(sp);
    }
    // 家具：和角色同层，按底边 y 排序 —— 站在家具上方（更小的 y）的角色会被家具挡住
    for (const sp of this.furnSprites) sp.destroy({ children: true });
    this.furnSprites.length = 0;
    for (const f of this.tavern.furns) {
      const fstyle = styleById(this.tavern.roomStyle(this.tavern.roomOfFurn(f)));
      const furnitureAtlas = this.materialPack === 'hd' ? this.worldMaterials.get('furniture') : null;
      const meetingTexture = f.kind === 'meetingtable' ? this.worldMaterials.get('meetingtable') : null;
      const hdFurniture = !!(furnitureAtlas && FURNITURE_ATLAS_FRAMES[f.kind]);
      const sp = new PIXI.Sprite(meetingTexture || furnTexture(f.kind, f.quality, fstyle.accent, furnitureAtlas));
      // 实例级微色差：同种家具不再千件一面（色相暖冷 4 档抖动）
      const jit = [0xFFFFFF, 0xF7EEE0, 0xFFF6E4, 0xEFF2F4][((f.id * 2654435761) >>> 0) % 4];
      const base = hexToNum(fstyle.furnTint);
      const deluxeHd = hdFurniture && f.quality >= 2 && !!FURNITURE_ATLAS_FRAMES[f.kind + f.quality];
      if (hdFurniture) {
        const styleHex = fstyle.id !== 'rustic' ? mix('#FFFFFF', fstyle.furnTint, 0.58) : '#FFFFFF';
        // 豪华帧自己已是升级材质，不再额外镀金；无豪华帧时只轻微暖一下原贴图。
        const qHex = deluxeHd ? '#FFFFFF' : (f.quality >= 3 ? '#F0D090' : f.quality >= 2 ? '#F6E4B8' : '#FFFFFF');
        const merged = mix(styleHex, qHex, deluxeHd ? 0 : (f.quality >= 2 ? 0.28 : 0));
        if (merged !== '#FFFFFF') sp.tint = hexToNum(merged);
      } else {
        sp.tint = (((base >> 16 & 255) * (jit >> 16 & 255) / 255) << 16) | (((base >> 8 & 255) * (jit >> 8 & 255) / 255) << 8) | Math.round((base & 255) * (jit & 255) / 255);
      }
      const [fw, fh] = furnFootprint(f.kind, f.dir);
      const [sourceW, sourceH] = furnFootprint(f.kind, 0);
      sp.width = sourceW * T; sp.height = sourceH * T;
      if (meetingTexture) { sp.width = 5 * T; sp.height = 1 * T; if (f.quality >= 2) sp.tint = f.quality >= 3 ? 0xEAD9FF : 0xFFF0C2; }
      if (hdFurniture && f.kind === 'chair') { sp.width *= 0.6; sp.height *= 0.6; }
      sp.anchor.set(0.5);
      sp.x = (f.x + fw / 2) * T;
      sp.y = (f.y + fh / 2) * T;
      sp.rotation = (f.dir === 0 ? 0 : f.dir === 1 ? Math.PI / 2 : f.dir === 2 ? Math.PI : Math.PI * 1.5);
      // -5：同底边时角色画在家具前面（坐在椅子上、贴着灶台干活）
      sp.zIndex = Math.round((f.y + fh) * 100) - 5;
      this.actorLayer.addChild(sp);
      this.furnSprites.push(sp);
      if (hdFurniture && f.quality >= 2 && !deluxeHd) {
        const sheen = new PIXI.Sprite(sp.texture);
        sheen.anchor.set(0.5);
        sheen.x = sp.x; sheen.y = sp.y; sheen.rotation = sp.rotation;
        sheen.width = sp.width; sheen.height = sp.height;
        sheen.blendMode = 'add';
        sheen.tint = f.quality >= 3 ? 0xE8C070 : 0xC9A050;
        sheen.alpha = f.quality >= 3 ? 0.22 : 0.12;
        sheen.zIndex = sp.zIndex + 1;
        this.actorLayer.addChild(sheen);
        this.furnSprites.push(sheen);
      }
      if (hdFurniture && f.quality >= 2 && (f.kind === 'table' || f.kind === 'teatable')) {
        const candle = new PIXI.Sprite(glowTex(12 + f.quality * 3, f.quality >= 3 ? '#F6D080' : '#E8B44A'));
        candle.anchor.set(0.5);
        candle.blendMode = 'add';
        candle.alpha = f.quality >= 3 ? 0.38 : 0.24;
        candle.x = sp.x;
        candle.y = sp.y;
        candle.zIndex = sp.zIndex + 2;
        this.actorLayer.addChild(candle);
        this.furnSprites.push(candle);
      }
      const shadow = contactShadow(f.kind, fw, fh, T);
      if (shadow) {
        const cs = new PIXI.Sprite(glowTex(18, '#1A1016'));
        cs.anchor.set(0.5);
        cs.blendMode = 'multiply';
        cs.alpha = shadow.alpha;
        cs.width = shadow.width;
        cs.height = shadow.height;
        cs.x = (f.x + fw / 2) * T;
        cs.y = (f.y + fh / 2) * T + shadow.dy;
        this.lightLayer.addChild(cs);
      }
      if (f.kind === 'lamp' || f.kind === 'fireplace' || f.kind === 'lightbar' || f.kind === 'lightcol' || f.kind === 'stove') {
        const warm = f.kind === 'fireplace' ? '#E4732C' : f.kind === 'stove' ? '#E4732C'
          : (f.kind === 'lightbar' || f.kind === 'lightcol') ? fstyle.accent : fstyle.glow;
        const rad = f.kind === 'fireplace' ? 68 : f.kind === 'stove' ? 50 : f.kind === 'lightbar' ? 48 + f.quality * 8 : 45 + f.quality * 7;
        const gl = new PIXI.Sprite(glowTex(rad, warm));
        gl.anchor.set(0.5);
        gl.x = (f.x + fw / 2) * T;
        gl.y = (f.y + fh / 2) * T;
        gl.blendMode = 'add';
        gl.alpha = 0.35;
        this.decoSprites.addChild(gl);
        // 火苗类闪得快而猛，灯带只是呼吸；灶台没人用时只留一点余烬
        const prof = f.kind === 'fireplace' ? { base: 0.3, amp: 0.18, speed: 7 }
          : f.kind === 'stove' ? { base: 0.07, amp: 0.23, speed: 9 }
          : f.kind === 'lamp' ? { base: 0.3, amp: 0.09, speed: 2.2 }
          : { base: 0.45, amp: 0.18, speed: 1.4 };
        this.glowAnims.push({ sp: gl, ...prof, phase: (f.id * 1.618) % 6.28, furn: f.kind === 'stove' ? f.id : 0 });
      }
      // 设备工作动效贴片（火焰/气泡/水花）：作为家具精灵的子节点，自动跟随旋转
      if (f.kind === 'stove' || f.kind === 'fireplace' || f.kind === 'keg' || f.kind === 'sink' || f.kind === 'fountain' || f.kind === 'aquarium' || f.kind === 'arcadem' || f.kind === 'cauldron') {
        const spots             = f.kind === 'stove' ? (f.quality >= 3 ? [[13, 12], [26, 12], [38, 12], [51, 12]] : [[21, 12], [43, 12]])
          : f.kind === 'fireplace' ? [[32, 22]]
          : f.kind === 'keg' ? [[16, 24]]
          : f.kind === 'fountain' ? [[32, 26]]
          : f.kind === 'aquarium' ? [[24, 24], [44, 22]]
          : f.kind === 'arcadem' ? [[16, 12]]
          : f.kind === 'cauldron' ? [[26, 16], [38, 18]]
          : [[21, 13]];
        const frames                 = [];
        for (let fr = 0; fr < 3; fr++) {
          const key = `eq|${f.kind}|${fr}`;
          let tex = this.pixTex.get(key);
          if (!tex) { const px = equipAnimPix(f.kind, fr); if (px) { tex = texFromCanvas(px.canvas); this.pixTex.set(key, tex); } }
          if (tex) frames.push(tex);
        }
        for (const [lx, ly] of spots) {
          if (!frames.length) break;
          const ov = new PIXI.Sprite(frames[0]);
          ov.anchor.set(0.5, 1);
          ov.scale.set(0.75);
          // 父精灵锚点在纹理中心，子坐标要换算成相对中心
          ov.x = lx - fw * 16; ov.y = ly + 3 - fh * 16;
          sp.addChild(ov);
          this.furnAnims.push({ sp: ov, frames, furn: f.id, always: f.kind === 'fireplace' || f.kind === 'fountain' || f.kind === 'aquarium' || f.kind === 'arcadem' || f.kind === 'cauldron', phase: (f.id * 0.7 + lx) % 3 });
        }
      }
    }
  }

  rebuildDirt()       {
    const sig = this.tavern.dirt.map((d) => `${d.x},${d.y},${d.level}`).sort().join('|');
    if (sig === this.dirtVersion) return;
    this.dirtVersion = sig;
    this.dirtLayer.removeChildren();
    for (const d of this.tavern.dirt) {
      const sp = new PIXI.Sprite(dirtTexture(Math.min(3, d.level)));
      sp.x = d.x * T; sp.y = d.y * T;
      this.dirtLayer.addChild(sp);
    }
  }

          actorSprites = new Map                     ();
          actorShadows = new Map                     ();
          shadowTex                      = null;
  /** 台球挥杆相位：用于在击球瞬间只响一次 */
          cuePhase = new Map                ();

  renderActors()       {
    this.perfStats.renderedActors = 0; this.perfStats.culledActors = 0;
    const seen = new Set        ();
    // 正在使用设施的客人：各房间一套专属姿态（躺床／泡汤半身／打球挥杆）
    const facUse = new Map                ();
    const facZ = new Map                ();
    const shooter = new Set        ();
    for (const gr of this.sim.groups) {
      if (gr.state !== 'using' || !gr.facId) continue;
      const f = this.tavern.furnById(gr.facId);
      if (!f) continue;
      const fh = furnFootprint(f.kind, f.dir)[1];
      gr.members.forEach((m, i) => {
        facUse.set(m.id, { kind: f.kind, furn: f, index: i, count: gr.members.length });
        // 多格设施（汤池 2×2）的精灵按底边排序，站在上排的客人要手动抬到它之上
        facZ.set(m.id, Math.round((f.y + fh) * 100) + 2);
        if (i === 0 && f.kind === 'billiardtable') shooter.add(m.id);
      });
    }
    const put = (id        , app            , x        , y        , dir        , pose      , animT        , carry               , restOn             , actorFx = null)       => {
      seen.add(id);
      if (!this.worldPointVisible(x, y)) {
        this.perfStats.culledActors++;
        const old = this.actorSprites.get(id); if (old) old.visible = false;
        const shadow = this.actorShadows.get(id); if (shadow) shadow.visible = false;
        return;
      }
      this.perfStats.renderedActors++;
      let sp = this.actorSprites.get(id);
      if (!sp) {
        sp = new PIXI.Sprite();
        sp.anchor.set(0.5, 1);
        sp.roundPixels = true;
        this.actorLayer.addChild(sp);
        this.actorSprites.set(id, sp);
      }
      sp._appearanceKey = appKey(app);
      let sh = this.actorShadows.get(id);
      if (!sh) {
        if (!this.shadowTex) this.shadowTex = texFromCanvas(glowPix(14, '#1A1016').canvas);
        sh = new PIXI.Sprite(this.shadowTex);
        sh.anchor.set(0.5, 0.5);
        sh.blendMode = 'multiply';
        this.actorLayer.addChild(sh);
        this.actorShadows.set(id, sh);
      }
      const facilityUse = facUse.get(id);
      const fk = facilityUse?.kind;
      const isBed = (!!fk && BED_KINDS.includes(fk)) || (restOn !== null && restOn.kind === 'bunk');
      const usePose       = fk === 'billiardtable' && shooter.has(id) ? 'work' : fk === 'arcadem' ? 'work' : fk === 'screen' ? 'sit' : fk ? 'idle' : pose;
      const useDir = fk === 'pool' || isBed ? 0 : dir;
      const frame = usePose === 'walk' ? Math.floor(animT * 7) % 4
        : usePose === 'idle' ? Math.floor(animT * 1.6) % 2 : Math.floor(animT * 3) % 4;
      // 贴墙钳制：脚不压进墙带（纯视觉，模拟位置不变）
      const cc = this.tavern.clampFeet(x, y);
      // 休息中的员工：画到床/沙发本体上（躺床/坐沙发），而不是蹲在旁边的地上
      const c = restOn ? { x: restOn.x + (restOn.kind === 'bunk' ? 0.5 : 0.4), y: restOn.y } : cc;
      sp.anchor.set(0.5, 1);
      sp.rotation = 0;
      sp.scale.set(useDir === 1 ? -ACTOR_S : ACTOR_S, ACTOR_S);
      sp.x = (c.x + 0.5) * T;
      sp.y = (c.y + 1) * T + 2;
      sp.texture = actorTexture(app, useDir, usePose, frame, fk ? null : carry, fk === 'pool' ? 0.5 : 1);
      if (isBed) {
        // 躺下：改成中心锚点再转 90°，人就正好压在床面上；再叠一点呼吸起伏
        sp.anchor.set(0.5, 0.5);
        if (facilityUse) {
          const bed = bedDisplayPlacement(facilityUse.furn, facilityUse.index, facilityUse.count);
          sp.x = bed.x * T;
          sp.y = bed.y * T + Math.sin(animT * 1.6) * 1.2;
          sp.rotation = bed.rotation;
        } else {
          sp.rotation = -Math.PI / 2;
          sp.y = (c.y + 0.6) * T + Math.sin(animT * 1.6) * 1.2;
        }
        sp.scale.set(ACTOR_S, ACTOR_S);
      } else if (fk === 'pool') {
        // 泡汤：只露头肩，随水面上下浮动（水面以下由裁剪隐藏）
        sp.y = (c.y + 1) * T - 5 + Math.sin(animT * 1.4 + id) * 1.4;
      } else if (fk === 'billiardtable') {
        sp.y += shooter.has(id) ? Math.sin(animT * 2.4) * 1.5 : Math.sin(animT * 1.1 + id) * 1;
      } else {
        // 姿态动效放大到世界层：像素级动画在半尺寸小人身上读不出，得用引擎变换
        const sx = useDir === 1 ? -ACTOR_S : ACTOR_S;
        if (usePose === 'walk') {
          sp.rotation = Math.sin(animT * 11) * 0.055;                       // 走路左右摆
        } else if (usePose === 'work') {
          const k = Math.sin(animT * 9);                                     // 干活：揉面式压缩回弹
          sp.scale.set(sx * (1 - k * 0.045), ACTOR_S * (1 + k * 0.055));
          sp.y += Math.abs(k) * 1.6;
        } else if (usePose === 'eat') {
          sp.y += Math.max(0, Math.sin(animT * 5.2)) * 2;                    // 进餐点头
        } else if (usePose === 'greet') {
          sp.rotation = Math.sin(animT * 3.6) * 0.07;                        // 迎宾欠身
        } else if (usePose === 'sit') {
          sp.y += Math.sin(animT * 2) * 0.6;                                 // 坐着小憩
        } else {
          sp.scale.set(sx, ACTOR_S * (1 + Math.sin(animT * 2.4) * 0.02));    // 待机呼吸
        }
      }
      sp.zIndex = Math.max(Math.round((c.y + 1) * 100), facZ.get(id) || -1e9, restOn ? Math.round((restOn.y + 1) * 100) + 2 : -1e9);
      sp.alpha = 1;
      if (actorFx?.arrivalFx > 0) {
        const p = 1 - Math.min(1, actorFx.arrivalFx / 1.35);
        sp.alpha = Math.max(.08, p);
        sp.rotation += (1 - p) * Math.PI * 3;
        sp.y -= (1 - p) * 88;
      } else if (actorFx?.dismissFx > 0) {
        const p = Math.min(1, actorFx.dismissFx / 1.2);
        sp.alpha = p;
        sp.rotation += (1 - p) * Math.PI * 3;
        sp.scale.x *= p; sp.scale.y *= p;
      }
      sp.visible = true;
      // 脚下接触阴影：站在地面上才有（躺床/泡汤/围桌/坐沙发不要）
      sh.scale.set(1.55, 0.48);
      sh.alpha = 0.4;
      sh.x = (c.x + 0.5) * T;
      sh.y = (c.y + 1) * T + 1;
      sh.zIndex = sp.zIndex - 1;
      sh.visible = !fk && !restOn;
    };
    for (const s of this.sim.staff) {
      // 休息中的员工：找到身下的床/沙发，画到家具上面去
      let restOn              = null;
      const resting = (s.task && s.task.kind === 'rest') || (s.free && s.free.kind === 'rest');
      if (resting && !s.path.length) {
        let bd = 1.8;
        for (const f of this.tavern.furns) {
          if (f.kind !== 'bunk' && f.kind !== 'couch') continue;
          const d = Math.hypot(f.x + 1 - s.x - 0.5, f.y + 0.5 - s.y - 0.5);
          if (d < bd) { bd = d; restOn = f; }
        }
      }
      // 任务姿态：休息=躺床/坐沙发，前台=迎宾致意
      const spose       = restOn && restOn.kind === 'bunk' ? 'idle' : s.task && s.task.kind === 'rest' ? 'sit' : s.task && s.task.kind === 'greet' ? 'greet' : s.pose;
      put(s.id, s.app, s.x, s.y, s.dir, spose, s.animT, s.carry, restOn, s);
    }
    const groupById = new Map(this.sim.groups.map((group) => [group.id, group]));
    for (const g of this.sim.guests) {
      const gr = groupById.get(g.groupId);
      const pose       = gr && gr.state === 'eating' && !facUse.has(g.id) ? 'eat'
        : gr && (gr.state === 'seated' || gr.state === 'ordered') && !facUse.has(g.id) ? 'sit' : g.pose;
      put(g.id, g.app, g.x, g.y, g.dir, pose, g.animT, null, null);
    }
    for (const [id, sp] of this.actorSprites) {
      if (!seen.has(id)) {
        const appearanceKey = sp._appearanceKey;
        sp.destroy(); this.actorSprites.delete(id);
        const sh = this.actorShadows.get(id); if (sh) { sh.destroy(); this.actorShadows.delete(id); }
        const stillVisible = appearanceKey && [...this.actorSprites.values()].some((sprite) => sprite._appearanceKey === appearanceKey);
        if (appearanceKey && !stillVisible) {
          const prefix = `${appearanceKey}|`;
          const retiredTextures = [];
          for (const [textureKey, texture] of actorTex) if (textureKey.startsWith(prefix)) {
            actorTex.delete(textureKey); retiredTextures.push(texture);
          }
          // 同一帧的泡汤裁剪纹理共享 source；每个 source 只在最后一个视图销毁时释放。
          const texturesBySource = new Map();
          for (const texture of retiredTextures) {
            const rows = texturesBySource.get(texture.source) || [];
            rows.push(texture); texturesBySource.set(texture.source, rows);
          }
          for (const textures of texturesBySource.values()) {
            textures.forEach((texture, index) => texture.destroy(index === textures.length - 1));
          }
        }
      }
    }
  }

          itemPool                = [];
          glowAnims                                                                                               = [];
          furnAnims                                                                                              = [];
          glowT = 0;
          itemUsed = 0;
  itemSprite(tex              , x        , y        )       {
    if (!this.worldPointVisible(x / T, y / T)) { this.perfStats.culledItems++; return; }
    let sp = this.itemPool[this.itemUsed];
    if (!sp) {
      sp = new PIXI.Sprite();
      sp.roundPixels = true;
      this.itemLayer.addChild(sp);
      this.itemPool.push(sp);
    }
    sp.texture = tex; sp.x = x; sp.y = y; sp.visible = true;
    this.itemUsed++;
    this.perfStats.renderedItems++;
  }

  renderItems()       {
    this.itemUsed = 0;
    this.perfStats.renderedItems = 0; this.perfStats.culledItems = 0;
    const readyOrders = this.sim.orders.filter((order) => order.stage === 'ready');
    const orderById = new Map(this.sim.orders.map((order) => [order.id, order]));
    const eatingGroupByTable = new Map(this.sim.groups.filter((group) => group.state === 'eating').map((group) => [group.tableId, group]));
    // 出餐台上的成品
    for (const f of this.tavern.furnsOfKind('pass')) {
      const n = f.plates || 0;
      for (let i = 0; i < n; i++) {
        const o = readyOrders[i];
        const dish = o ? this.sim.dishOf(o.dishId) : DISHES[0];
        this.itemSprite(plateTexture(dish ? dish.color : PAL.cream, false), f.x * T + 4 + i * 14, f.y * T + 8);
      }
    }
    // 桌上的菜与脏盘
    for (const t of this.tavern.allTables()) {
      const group = eatingGroupByTable.get(t.id);
      if (group) {
        const o = orderById.get(group.orderId);
        const dish = o ? this.sim.dishOf(o.dishId) : null;
        this.itemSprite(plateTexture(dish ? dish.color : PAL.cream, false), t.x * T + 8, t.y * T + 8);
      }
      for (let i = 0; i < Math.min(3, t.dirty || 0); i++) {
        this.itemSprite(plateTexture(PAL.stone, true), t.x * T + 2 + i * 8, t.y * T + 12);
      }
    }
    for (let i = this.itemUsed; i < this.itemPool.length; i++) this.itemPool[i].visible = false;
  }

  renderOverlay()       {
    const g = this.overlay;
    g.clear();
    this.speechLayer.clear();
    let li = 0;
    const bubbleBoxes = [];
    // 标签在屏幕空间（不随缩放模糊）
    const label = (text        , wx        , wy        , color = 0xffe6b0)       => {
      // Overlay callers use pixel-world coordinates; worldPointVisible consumes logical grid coordinates.
      if (li >= this.labels.length || !this.worldPointVisible(wx / T, wy / T, 2)) return;
      const t = this.labels[li++];
      t.text = text;
      t.x = Math.round(this.world.x + wx * this.zoom);
      t.y = Math.round(this.world.y + wy * this.zoom);
      t.visible = true;
      t.style.wordWrap = false;
      t.style.fill = color === undefined ? 0xffe6b0 : color;
    };
    const bubble = (text, wx, wy, tone = 'neutral') => {
      if (li >= this.labels.length || !text || !this.worldPointVisible(wx / T, wy / T, 2)) return;
      const t = this.labels[li++];
      t.text = text;
      t.style.wordWrap = true;
      t.style.wordWrapWidth = Math.min(168, Math.max(96, this.app.screen.width - 28));
      t.style.fill = 0xfff7df;
      const anchorX = Math.round(this.world.x + wx * this.zoom);
      const anchorY = Math.round(this.world.y + wy * this.zoom);
      const padX = 7, padY = 5;
      const boxW = Math.ceil(t.width) + padX * 2;
      const boxH = Math.ceil(t.height) + padY * 2;
      const boxX = Math.max(8, Math.min(this.app.screen.width - boxW - 8, Math.round(anchorX - boxW / 2)));
      let boxY = Math.max(8, Math.round(anchorY - boxH - 9));
      while (bubbleBoxes.some((box) => boxX < box.x + box.w + 4 && boxX + boxW + 4 > box.x && boxY < box.y + box.h + 4 && boxY + boxH + 4 > box.y) && boxY > 8) {
        boxY = Math.max(8, boxY - boxH - 7);
      }
      bubbleBoxes.push({ x: boxX, y: boxY, w: boxW, h: boxH });
      const edge = tone === 'good' ? 0x8ddb4a : tone === 'bad' ? 0xe7685d : 0xf3b84b;
      this.speechLayer.roundRect(boxX, boxY, boxW, boxH, 6).fill({ color: 0x241a26, alpha: 0.94 }).stroke({ width: 2, color: edge, alpha: 0.96 });
      const tailX = Math.max(boxX + 10, Math.min(boxX + boxW - 10, anchorX));
      this.speechLayer.moveTo(tailX - 5, boxY + boxH - 1).lineTo(tailX, boxY + boxH + 7).lineTo(tailX + 5, boxY + boxH - 1).fill({ color: 0x241a26, alpha: 0.94 });
      t.x = boxX + padX;
      t.y = boxY + padY;
      t.visible = true;
    };

    // 热图
    this.heatCells = 0;
    if (this.heat !== 'off') {
      for (const r of this.tavern.rooms) {
        if (this.heat === 'clean') {
          const a = (1 - r.clean / 100) * 0.6;
          if (a > 0.02) { g.rect(r.x * T, r.y * T, r.w * T, r.h * T).fill({ color: hexToNum(PAL.coral), alpha: a }); this.heatCells += r.w * r.h; }
        }
      }
      if (this.heat === 'traffic') {
        const counts = new Map                ();
        const add = (x        , y        )       => {
          const k = Math.round(x) * 10000 + Math.round(y);
          counts.set(k, (counts.get(k) || 0) + 1);
        };
        for (const s of this.sim.staff) add(s.x, s.y);
        for (const gu of this.sim.guests) add(gu.x, gu.y);
        for (const [k, v] of counts) {
          const x = Math.floor(k / 10000), y = k % 10000;
          g.rect(x * T, y * T, T, T).fill({ color: hexToNum(PAL.cyan), alpha: Math.min(0.55, 0.18 * v) });
          this.heatCells++;
        }
      }
    }

    // 建造预览
    if (this.buildBp) {
      const bp = bpById(this.buildBp);
      const w = this.buildRot ? bp.h : bp.w, h = this.buildRot ? bp.w : bp.h;
      const area = w * h;
      const chk = this.tavern.canPlaceRoom(bp, this.hover.x, this.hover.y, this.buildRot);
      const col = chk.ok ? hexToNum(PAL.acid) : hexToNum(PAL.coral);
      g.rect(this.hover.x * T, this.hover.y * T, w * T, h * T).fill({ color: col, alpha: 0.28 }).stroke({ width: 2, color: col });
      if (!chk.ok) label(chk.reason, this.hover.x * T, this.hover.y * T - 14, 0xff6b5a);
      else {
        const proposed = { id: -1, x: this.hover.x, y: this.hover.y, w, h };
        const doors = this.tavern.rooms.map((room) => this.tavern.doorBetween(proposed, room, new Set(this.tavern.furnIdx.keys()))).filter(Boolean);
        for (const door of doors) {
          g.rect(door.ax * T + 7, door.ay * T + 7, T - 14, T - 14).fill({ color: hexToNum(PAL.cyan), alpha: 0.92 });
          g.rect(door.bx * T + 7, door.by * T + 7, T - 14, T - 14).fill({ color: hexToNum(PAL.cyan), alpha: 0.92 });
        }
        const armed = this.placementConfirm?.key === this.placementKey('room', bp.id, this.hover.x, this.hover.y, this.buildRot);
        const traffic = doors.length > 1 ? '拥堵风险低' : area >= 30 ? '单门·拥堵风险高' : '单门·拥堵风险中';
        label(armed ? `再次点击确认购买 ${this.roomCopy?.name || bp.name}` : `${this.roomCopy?.name || bp.name} · 门洞 ${doors.length} · ${traffic}`, this.hover.x * T, this.hover.y * T - 14, 0x8ddb4a);
      }
    }
    if (this.moveRoomId !== null) {
      const room = this.tavern.roomById(this.moveRoomId);
      if (room) {
        const rw = this.buildRot % 2 ? room.h : room.w, rh = this.buildRot % 2 ? room.w : room.h;
        const chk = this.tavern.canMoveRoom(room.id, this.hover.x, this.hover.y, this.buildRot);
        const col = chk.ok ? hexToNum(PAL.acid) : hexToNum(PAL.coral);
        g.rect(this.hover.x * T, this.hover.y * T, rw * T, rh * T).fill({ color: col, alpha: 0.3 }).stroke({ width: 3, color: col });
        if (!chk.ok) label(chk.reason, this.hover.x * T, this.hover.y * T - 14, 0xff6b5a);
        else {
          const proposed = { ...room, x: this.hover.x, y: this.hover.y, w: rw, h: rh };
          const doors = this.tavern.rooms.filter((other) => other.id !== room.id).map((other) => this.tavern.doorBetween(proposed, other, new Set(this.tavern.furnIdx.keys()))).filter(Boolean);
          for (const door of doors) {
            g.rect(door.ax * T + 7, door.ay * T + 7, T - 14, T - 14).fill({ color: hexToNum(PAL.cyan), alpha: 0.92 });
            g.rect(door.bx * T + 7, door.by * T + 7, T - 14, T - 14).fill({ color: hexToNum(PAL.cyan), alpha: 0.92 });
          }
          label(`整体移动 · 旋转 ${this.buildRot * 90}° · 门洞 ${doors.length} · ${doors.length > 1 ? '拥堵风险低' : '单门易拥堵'}`, this.hover.x * T, this.hover.y * T - 14, 0x8ddb4a);
        }
      }
    }
    if (this.moveFurnId !== null) {
      const mf = this.tavern.furnById(this.moveFurnId);
      if (mf) {
        const [fw, fh] = furnFootprint(mf.kind, this.buildRot);
        const room = this.tavern.roomOfFurn(mf);
        const to = this.tavern.roomAt(this.hover.x, this.hover.y);
        const chk = this.tavern.canPlaceFurn(mf.kind, this.hover.x, this.hover.y, this.buildRot, mf.id);
        const sameRoom = !!to && !!room && to.id === room.id;
        const ok = chk.ok && sameRoom;
        const col = ok ? hexToNum(PAL.acid) : hexToNum(PAL.coral);
        g.rect(this.hover.x * T, this.hover.y * T, fw * T, fh * T).fill({ color: col, alpha: 0.32 }).stroke({ width: 2, color: col });
        const [dx, dy] = dirDelta(this.buildRot);
        g.rect((this.hover.x + dx) * T + 8, (this.hover.y + dy) * T + 8, T - 16, T - 16).fill({ color: hexToNum(PAL.hi), alpha: 0.5 });
        if (!ok) label(sameRoom ? chk.reason : '只能搬到同一个房间', this.hover.x * T, this.hover.y * T - 14, 0xff6b5a);
        else label(`搬到这里（R 转朝向）`, this.hover.x * T, this.hover.y * T - 14, 0x8ddb4a);
      }
    }
    if (this.buildFurn) {
      const [fw, fh] = furnFootprint(this.buildFurn, this.buildRot);
      const chk = this.tavern.canPlaceFurn(this.buildFurn, this.hover.x, this.hover.y, this.buildRot);
      const col = chk.ok ? hexToNum(PAL.acid) : hexToNum(PAL.coral);
      g.rect(this.hover.x * T, this.hover.y * T, fw * T, fh * T).fill({ color: col, alpha: 0.3 }).stroke({ width: 2, color: col });
      const [dx, dy] = dirDelta(this.buildRot);
      g.rect((this.hover.x + dx) * T + 8, (this.hover.y + dy) * T + 8, T - 16, T - 16).fill({ color: hexToNum(PAL.hi), alpha: 0.5 });
      if (!chk.ok) label(chk.reason, this.hover.x * T, this.hover.y * T - 14, 0xff6b5a);
      else {
        const armed = this.placementConfirm?.key === this.placementKey('furn', this.buildFurn, this.hover.x, this.hover.y, this.buildRot, this.buildQuality);
        if (armed) label('再次点击确认购买', this.hover.x * T, this.hover.y * T - 14, 0x8ddb4a);
      }
    }

    // 选中
    const sel = this.selection;
    if (sel) {
      if (sel.kind === 'room') {
        const r = this.tavern.roomById(sel.id);
        if (r) g.rect(r.x * T + 1, r.y * T + 1, r.w * T - 2, r.h * T - 2).stroke({ width: 2, color: hexToNum(PAL.hi) });
      } else if (sel.kind === 'furn') {
        const f = this.tavern.furnById(sel.id);
        if (f) {
          const [fw, fh] = furnFootprint(f.kind, f.dir);
          g.rect(f.x * T, f.y * T, fw * T, fh * T).stroke({ width: 2, color: hexToNum(PAL.hi) });
          for (const u of this.tavern.useTiles(f)) {
            const okTile = this.tavern.walkable(u.x, u.y);
            g.rect(u.x * T + 10, u.y * T + 10, T - 20, T - 20).fill({ color: okTile ? hexToNum(PAL.hi) : hexToNum(PAL.coral), alpha: 0.6 });
          }
        }
      } else if (sel.kind === 'staff') {
        const s = this.sim.staff.find((x) => x.id === sel.id);
        if (s) {
          const cp = this.tavern.clampFeet(s.x, s.y);
          g.circle((cp.x + 0.5) * T, (cp.y + 1) * T, 12).stroke({ width: 2, color: hexToNum(PAL.hi) });
          let px = Math.round(s.x), py = Math.round(s.y);
          for (const p of s.path) {
            g.moveTo((px + 0.5) * T, (py + 0.5) * T).lineTo((p.x + 0.5) * T, (p.y + 0.5) * T).stroke({ width: 2, color: hexToNum(PAL.cyan), alpha: 0.7 });
            px = p.x; py = p.y;
          }
        }
      }
    }

    // 员工状态：岗位色标 + 进度环 + 气泡
    for (const s of this.sim.staff) {
      const cp = this.tavern.clampFeet(s.x, s.y);
      const cx = (cp.x + 0.5) * T, cy = (cp.y + 1) * T;
      if (!this.pixelWorldVisible(cx, cy, 3)) continue;
      g.rect(cx - 4, cy + 1, 8, 3).fill({ color: JOB_COLOR[s.job] === undefined ? 0xffe6b0 : JOB_COLOR[s.job], alpha: 0.95 });
      if (s.task && s.actT > 0 && s.actTotal > 0) {
        const p = 1 - s.actT / s.actTotal;
        g.circle(cx, cy - 46, 7).stroke({ width: 2, color: 0x2a1a22, alpha: 0.6 });
        g.arc(cx, cy - 46, 7, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2).stroke({ width: 2, color: hexToNum(PAL.honey) });
      }
      if (s.needs.stamina < 25) label('汗', cx + 10, cy - 40, 0x39d7d2);
      if (s.bubble) bubble(s.bubble.text, cx, cy - 48, s.bubble.tone || 'neutral');
      else if (s.task && s.actT > 0) label(s.task.label, cx - 10, cy - 46, 0xffe6b0);
    }

    // 客人耐心环 + 订单气泡
    for (const gr of this.sim.groups) {
      const m = gr.members[0];
      if (!m) continue;
      const cp = this.tavern.clampFeet(m.x, m.y);
      const cx = (cp.x + 0.5) * T, cy = (cp.y + 1) * T;
      if (!this.pixelWorldVisible(cx, cy, 3)) continue;
      const speakingGuest = gr.members.find((member) => member.bubble);
      const origin = worldById(m.originWorldId || gr.originWorldId);
      const pct = gr.patience / gr.maxPatience;
      const col = pct > 0.5 ? hexToNum(PAL.acid) : pct > 0.25 ? hexToNum(PAL.honey) : hexToNum(PAL.coral);
      if (gr.state === 'wait' || gr.state === 'seated' || gr.state === 'ordered') {
        g.arc(cx, cy - 40, 8, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2).stroke({ width: 3, color: col });
      }
      if (gr.state === 'ordered') {
        const o = this.sim.orders.find((x) => x.id === gr.orderId);
        const dish = o ? this.sim.dishOf(o.dishId) : null;
        const t = this.tavern.furnById(gr.tableId);
        if (dish && t) {
          g.rect(t.x * T + 6, t.y * T - 16, 20, 14).fill({ color: 0x241a26, alpha: 0.9 }).stroke({ width: 1, color: hexToNum(PAL.panelEdge) });
          g.circle(t.x * T + 16, t.y * T - 9, 4).fill(hexToNum(dish.color || '#F5F1E6'));
        }
      }
      if (speakingGuest) {
        const speakerPos = this.tavern.clampFeet(speakingGuest.x, speakingGuest.y);
        bubble(speakingGuest.bubble.text, (speakerPos.x + 0.5) * T, (speakerPos.y + 1) * T - 48, speakingGuest.bubble.tone || 'neutral');
      } else if ((gr.state === 'wait' || gr.state === 'seating' || gr.state === 'toFac') && gr.leaveReason === '') {
        const w = wantById(gr.want);
        label(`${origin.icon}${origin.name}·${gr.size}人·${w.bubble}`, cx - 30, cy - 52, gr.state === 'wait' ? 0xf3b84b : 0xffe6b0);
      }
      if (gr.state === 'using') {
        const w = wantById(gr.want);
        const pct2 = gr.useT > 0 ? gr.useT : 0;
        label(`${w.verb || w.name}中 ${Math.ceil(pct2)}s`, cx - 22, cy - 48, 0x8ddb4a);
      }
    }

    // 设施使用中的专属动画：温泉蒸汽涟漪 / 客床 Zzz / 台球挥杆
    for (const gr of this.sim.groups) {
      if (gr.state !== 'using' || !gr.facId) continue;
      const f = this.tavern.furnById(gr.facId);
      if (!f) continue;
      const [fw, fh] = furnFootprint(f.kind, f.dir);
      const fcx = (f.x + fw / 2) * T, fcy = (f.y + fh / 2) * T;
      gr.members.forEach((m, i) => {
        const cp = this.tavern.clampFeet(m.x, m.y);
        const cx = (cp.x + 0.5) * T, cy = (cp.y + 1) * T, t = m.animT;
        if (!this.pixelWorldVisible(cx, cy, 3)) return;
        if (f.kind === 'pool') {
          g.ellipse(cx, cy - 11, 13, 4).fill({ color: 0x11455c, alpha: 0.5 });
          for (let k = 0; k < 2; k++) {
            const pr = (t * 0.7 + k * 0.5) % 1;
            g.ellipse(cx, cy - 11, 6 + pr * 13, 2 + pr * 5).stroke({ width: 1, color: 0xdff6ff, alpha: 0.5 * (1 - pr) });
          }
          for (let k = 0; k < 3; k++) {
            const pr = (t * 0.45 + k / 3) % 1;
            const wob = Math.sin((t + k) * 2.1) * 3;
            g.rect(cx - 2 + wob + (k - 1) * 5, cy - 26 - pr * 12, 3, 4).fill({ color: 0xf5f1e6, alpha: 0.32 * (1 - pr) });
          }
        } else if (BED_KINDS.includes(f.kind)) {
          for (let k = 0; k < 2; k++) {
            const pr = (t * 0.4 + k * 0.5) % 1;
            const zs = 3 + k, a = 0.85 * (1 - pr);
            const zx = cx + 8 + pr * 9, zy = cy - 22 - pr * 12;
            g.rect(zx, zy, zs * 2, 1).fill({ color: 0xdff6ff, alpha: a });
            g.rect(zx, zy + zs, zs * 2, 1).fill({ color: 0xdff6ff, alpha: a });
            for (let q = 0; q < zs; q++) g.rect(zx + zs * 2 - 2 - q * 2, zy + q + 1, 2, 1).fill({ color: 0xdff6ff, alpha: a });
          }
        } else if (f.kind === 'billiardtable') {
          if (i === 0) {
            const hx = cx, hy = cy - 20;
            const dx = fcx - hx, dy = fcy - hy, len = Math.hypot(dx, dy) || 1;
            const ux = dx / len, uy = dy / len;
            const push = Math.sin(t * 2.4) * 0.5 + 0.5;
            const tip = 6 + len * (0.3 + push * 0.55), butt = tip - 30;
            g.moveTo(hx + ux * butt, hy + uy * butt).lineTo(hx + ux * tip, hy + uy * tip)
              .stroke({ width: 2, color: 0xc9922f, alpha: 0.95 });
            g.circle(hx + ux * (butt + 2), hy + uy * (butt + 2), 1.5).fill({ color: 0x2a1a22, alpha: 0.8 });
            const prev = this.cuePhase.get(m.id) || 0;
            if (push > 0.93) {
              g.circle(hx + ux * tip, hy + uy * tip, 3).fill({ color: 0xfff3a8, alpha: 0.85 });
              if (prev <= 0.93) this.audio.play('cue', 0.3);
            }
            this.cuePhase.set(m.id, push);
          } else if (Math.sin(t * 1.1 + i) > 0.9) {
            g.rect(cx + 7, cy - 22, 2, 6).fill({ color: 0xfff3a8, alpha: 0.8 });
            g.rect(cx + 7, cy - 16, 2, 2).fill({ color: 0xfff3a8, alpha: 0.8 });
          }
        }
      });
    }

    // FX
    for (const f of this.sim.fx) {
      const cx = (f.x + 0.5) * T, cy = (f.y + 0.5) * T;
      if (!this.pixelWorldVisible(cx, cy, 3)) continue;
      if (f.kind === 'spark') g.rect(cx - 2, cy - 2 - (1 - f.t) * 12, 3, 3).fill(hexToNum(PAL.hi));
      else if (f.kind === 'portal') g.circle(cx, cy, (1 - f.t / 0.6) * 22).stroke({ width: 3, color: hexToNum(PAL.cyan), alpha: f.t });
      else if (f.kind === 'steam') g.rect(cx - 3, cy - 14 * (1 - f.t / 0.5), 5, 6).fill({ color: 0xf5f1e6, alpha: 0.6 * f.t * 2 });
      else if (f.kind === 'serve') g.circle(cx, cy, 10 * (1 - f.t / 0.5)).stroke({ width: 2, color: hexToNum(PAL.honey), alpha: f.t * 2 });
      else if (f.kind === 'heart') {
        const r = 3 + (1 - f.t / 0.9) * 2, yy = cy - 13 - (1 - f.t / 0.9) * 9;
        g.circle(cx - r * 0.6, yy, r).circle(cx + r * 0.6, yy, r).fill({ color: 0xff8fa8, alpha: Math.min(1, f.t * 2) });
        g.poly([cx - r * 1.2, yy + r * 0.4, cx + r * 1.2, yy + r * 0.4, cx, yy + r * 2.1]).fill({ color: 0xff8fa8, alpha: Math.min(1, f.t * 2) });
      }
      else if (f.kind === 'happy') label('★', cx, cy - 20, 0x8ddb4a);
      else if (f.kind === 'sad') label('×', cx, cy - 20, 0xff6b5a);
      else if (f.kind === 'event') g.circle(cx, cy, 30 * (1.2 - f.t)).stroke({ width: 4, color: hexToNum(PAL.magenta), alpha: f.t });
    }

    for (let i = li; i < this.labels.length; i++) this.labels[i].visible = false;
  }
}

const game = typeof document !== 'undefined' ? new Game() : null;
if (typeof window !== 'undefined' && game) window.__hotelGame = game;
game?.boot().catch((err) => {
  console.error(err);
  const d = document.createElement('div');
  d.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;color:#FF6B5A;font-family:monospace;padding:20px;text-align:center';
  d.textContent = '启动失败：' + (err && err.message ? err.message : String(err));
  document.body.appendChild(d);
});
