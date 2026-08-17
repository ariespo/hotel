import * as PIXI from 'pixi.js';
import { ACC_NAMES,                  appKey, avatarURL, defaultAppearance, drawAvatar, drawSprite, normalizeApp,            PRESETS, randomAppearance, THEMES } from './src/chargen.js';
import { furnPix, dirtPix, doorPix, equipAnimPix, hdQualityHardware, platePix, ROOM_WALL, T, wallPix } from './src/furniture.js';

const ACTOR_S = 0.5;          // 世界里的小人按 50% 画（美术画布 64×72 → 场内 32×36）
import { FLOOR_VARIANTS, floorVariant, glowPix, lightPoolPix, rugTile, wallDecoPix } from './src/floor.js';
import { contactShadow, edgeOcclusion, floorLightTint, nightShadeAlpha, tileWarmth, worldLights } from './src/light.js';
import { hexToNum, mix, PAL, Rng } from './src/pix.js';
import {
  BLUEPRINTS, BED_KINDS, DISHES, furnDef, furnQualityUnlock,              ING_PRICE,           JOB_COLOR, ROOM_FLOOR, ROOM_LABEL, STAR_THRESHOLDS, styleById, wantById, worldById,
} from './src/data.js';
import { DAY_LEN,            makeStaff, newEcon, Sim, worldIngredientPrice,            } from './src/sim.js';
import { canPersistSim } from './src/save-policy.js';
import { bedDisplayPlacement, bpById, dirDelta,            furnFootprint, rotateRoomPoint,            Tavern } from './src/world.js';
import {               UI } from './src/ui.js';
import { TitleScreen, validGameSave } from './src/title.js';
import { createSkyPlan, skyBandColor } from './src/sky.js';
import { resetPlayerProfile, savePlayerProfile } from './src/player-profile.js';
import { clampZoom, usableViewport } from './src/camera.js';
import { parseAndMigrateGameSave, SAVE_SCHEMA_VERSION, stringifyGameSave } from './src/save-schema.js';

const SAVE_KEY = 'wjbdy.save.v1';
const MORNING_KEY = 'wjbdy.morning.v1';
const ACTIVE_SLOT_KEY = 'wjbdy.save.active.v1';
const SAVE_SLOT_COUNT = 3;
const MATERIAL_PACK_KEY = 'wjbdy.material-pack.v1';
const normalizeMaterialPack = (pack) => pack === 'classic' ? 'classic' : 'hd';
const WORLD_ART_SCALE = 4;
const WORLD_MATERIALS = {
  'floor-wood': 'assets/world-materials/floor-walnut-v2.webp',
  'floor-kitchen': 'assets/world-materials/floor-kitchen-v2.webp',
  rug: 'assets/world-materials/rug-wine-v2.webp',
  wall: 'assets/world-materials/wall-beam-v2.webp',
  door: 'assets/world-materials/door-frame-v2.webp',
  'floor-storage': 'assets/world-materials/floor-storage-v3.webp',
  'floor-carpet': 'assets/world-materials/floor-carpet-v3.webp',
  'floor-tatami': 'assets/world-materials/floor-tatami-v3.webp',
  'floor-neon': 'assets/world-materials/floor-neon-v3.webp',
  'floor-astral': 'assets/world-materials/floor-astral-v3.webp',
  'floor-forge': 'assets/world-materials/floor-forge-v3.webp',
  'floor-frost': 'assets/world-materials/floor-frost-v3.webp',
  'floor-onsen': 'assets/world-materials/floor-onsen-v3.webp',
  'floor-parquet': 'assets/world-materials/floor-parquet-v3.webp',
  'floor-garden': 'assets/world-materials/floor-garden-v3.webp',
  furniture: 'assets/world-materials/furniture-target-v3.webp',
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
// 只列出 assets/ 里确实存在的音轨：抓不到的文件会在控制台刷 CORS/404 噪音。
// 补上 bgm-tavern / bgm-plan / bgm-night 后，把对应行加回来即可分阶段切换。
const BGM_MANIFEST                     = [];

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
    if (actorTex.size > 1400) actorTex.clear();
    actorTex.set(key, t);
  }
  return t;
}
const furnTex = new Map                      ();
const FURNITURE_ATLAS_FRAMES = {
  table: [0, 0, 128, 128], chair: [128, 0, 128, 128], plant: [256, 0, 128, 128],
  desk: [384, 0, 256, 128], prep: [0, 128, 256, 128], stove: [256, 128, 256, 128],
  sconce: [512, 128, 128, 128],
  sink: [0, 256, 256, 128], pass: [256, 256, 256, 128], shelf: [512, 256, 256, 128], bed: [768, 256, 256, 128],
  lamp: [0, 384, 128, 128], couch: [128, 384, 256, 128], bunk: [384, 384, 256, 128],
  bookshelf: [640, 384, 256, 128], teatable: [896, 384, 128, 128], vanity: [0, 512, 128, 128],
  keg: [0, 640, 128, 128], lightcol: [128, 640, 128, 128], statue: [256, 640, 128, 128],
  clock: [384, 640, 128, 128], banner: [512, 640, 128, 128], arcadem: [640, 640, 128, 128],
  crystal: [768, 640, 128, 128], lightbar: [896, 640, 256, 128], fireplace: [1152, 640, 256, 128],
  icebox: [1408, 640, 256, 128], bench: [1664, 640, 256, 128],
  billiardtable: [0, 768, 256, 128], piano: [256, 768, 256, 128], screen: [512, 768, 256, 128],
  aquarium: [768, 768, 256, 128], winecabinet: [1024, 768, 256, 128], flowerbed: [1280, 768, 256, 128],
  telescope: [1536, 768, 256, 128], cauldron: [1792, 768, 256, 128],
  doublebed: [0, 896, 256, 256], pool: [256, 896, 256, 256], fountain: [512, 896, 256, 256],
  kingbed: [768, 896, 384, 256],
};
function furnitureAtlasTexture(kind, atlas) {
  const frame = FURNITURE_ATLAS_FRAMES[kind];
  if (!atlas || !frame) return null;
  const key = `atlas|${kind}`;
  let t = furnTex.get(key);
  if (!t) {
    t = new PIXI.Texture({ source: atlas.source, frame: new PIXI.Rectangle(...frame) });
    furnTex.set(key, t);
  }
  return t;
}
function furnTexture(kind        , q        , accent = '#C9922F', atlas = null)               {
  const hd = furnitureAtlasTexture(kind, atlas);
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

  async unlock()                {
    if (this.unlocked) return;
    this.unlocked = true;
                                        
    const W = window                                                                 ;
    const C = W.AudioContext || W.webkitAudioContext;
    if (!C) return;
    this.ctx = new C();
    try { const p = JSON.parse(localStorage.getItem('wjbdy.vol.v1') || 'null'); if (p && typeof p.mv === 'number') { this.musicVol = p.mv; this.sfxVol = p.sv; } } catch (err) { /* 忽略 */ }
    this.gain = this.ctx.createGain();
    this.gain.gain.value = this.sfxVol;
    this.gain.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = this.musicBase * this.musicVol;
    this.musicGain.connect(this.ctx.destination);
    const files                     = [
      ...BGM_MANIFEST,
      ['build', 'assets/sfx-build.wav'], ['place', 'assets/sfx-place.wav'],
      ['serve', 'assets/sfx-serve.wav'], ['coin', 'assets/sfx-coin.wav'], ['portal', 'assets/sfx-portal.wav'],
      ['error', 'assets/sfx-error.wav'], ['chime', 'assets/sfx-chime.wav'], ['happy', 'assets/sfx-happy.wav'],
      ['world-travel', 'assets/world-travel.mp3'],
      ['angry', 'assets/sfx-angry.wav'], ['clean', 'assets/sfx-clean.wav'], ['sizzle', 'assets/sfx-sizzle.wav'],
      ['upgrade', 'assets/sfx-upgrade.wav'], ['alert', 'assets/sfx-alert.wav'], ['daybell', 'assets/sfx-daybell.wav'],
      ['splash', 'assets/sfx-splash.wav'], ['cue', 'assets/sfx-cue.wav'], ['snore', 'assets/sfx-snore.wav'],
      ['amb', 'assets/amb-tavern.wav'], ['amb-night', 'assets/amb-night.wav'],
    ];
    for (const [k, url] of files) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const buf = await res.arrayBuffer();
        this.buffers.set(k, await (this.ctx                ).decodeAudioData(buf));
      } catch (e) { /* 资源缺失时静音降级 */ }
    }
    this.playTrack(this.wantTrack);
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

  /** 分阶段 BGM：营业=bgm / 规划=bgm-plan / 结算=bgm-night，缺失时退回已有的那首 */
  wantTrack = 'bgm-plan';
          curTrack = '';
  playTrack(name        )       {
    this.wantTrack = name;
    if (!this.ctx || !this.musicGain) return;
    const key = this.buffers.has(name) ? name : this.buffers.has('bgm') ? 'bgm' : '';
    if (!key || key === this.curTrack) return;
    const b = this.buffers.get(key);
    if (!b) return;
    if (this.music) { try { this.music.stop(); } catch (e) { /* 已停止 */ } this.music = null; }
    const s = this.ctx.createBufferSource();
    s.buffer = b; s.loop = true;
    s.connect(this.musicGain);
    s.start();
    this.music = s;
    this.curTrack = key;
  }

  /** 游戏内部的阶段基准音量（营业/规划/结算），与玩家音量偏好相乘 */
          musicBase = 0.34;
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
    try { localStorage.setItem('wjbdy.vol.v1', JSON.stringify({ mv: this.musicVol, sv: this.sfxVol })); } catch (err) { /* 忽略 */ }
  }

  curVolumes()                           {
    return { m: this.musicVol, s: this.sfxVol };
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
class Game                    {
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

  get blocked()          { return this.titleActive || this.creatorPending || this.worldTravelActive || !!(this.ui && this.ui.modal); }

  async boot()                {
    document.documentElement.dataset.materialPack = this.materialPack;
    const host = document.getElementById('app')               ;
    this.titleScreen = new TitleScreen(document.body);
    this.app = new PIXI.Application();
    await this.app.init({ resizeTo: host, background: PAL.voidBg, antialias: false, roundPixels: true });
    host.appendChild(this.app.canvas);
    try {
      const f = new FontFace('FusionPixel', "url('assets/lib/fusion-pixel/FusionPixel-12px-zh_hans.woff2')");
      await f.load();
      document.fonts.add(f);
    } catch (e) { /* 字体缺失时回退系统字体 */ }
    for (const name of ['floor-wood', 'floor-kitchen', 'floor-storage', 'floor-carpet',
      'floor-neon', 'floor-astral', 'floor-forge', 'floor-frost',
      'floor-tatami', 'floor-onsen', 'floor-parquet', 'floor-garden']) {
      try {
        const tex = await PIXI.Assets.load(`assets/${name}.png`);
        tex.source.scaleMode = 'nearest';
        tex.source.addressMode = 'repeat';
        this.floorTextures.set(name, tex);
        const res = (tex.source                                     ).resource;
        if (res) this.floorBase.set(name, res                     );
      } catch (e) { /* 缺失贴图用纯色兜底 */ }
    }
    for (const [name, url] of Object.entries(WORLD_MATERIALS)) {
      try {
        const tex = await PIXI.Assets.load(url);
        tex.source.scaleMode = 'linear';
        this.worldMaterials.set(name, tex);
      } catch (e) { /* 高清材质缺失时保留原有程序贴图 */ }
    }
    this.app.stage.addChild(this.stars, this.worldBackgroundFar, this.worldBackgroundMid, this.worldBackgroundMask, this.starGlintsA, this.starGlintsB, this.worldBackgroundWeather, this.worldTravelLayer, this.world, this.labelLayer);
    this.worldBackgroundMask.renderable = false;
    this.world.addChild(this.floorLayer, this.lightLayer, this.wallLayer, this.wallSprites, this.decoSprites, this.dirtLayer, this.furnLayer, this.itemLayer, this.actorLayer, this.overlay);
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
      try { this.frame(Math.min(tk.deltaMS / 1000, 0.05)); }
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
      this.audio.playTrack(this.sim.dayActive ? 'bgm' : 'bgm-plan');
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
    this.ui.openCreator(defaultAppearance(), '店主', (app, name, sex, ownerOptions) => {
      this.newTavern(app, name, sex, ownerOptions);
      this.creatorPending = false;
      this.ui.render(true);
    });
  }

  newTavern(app            , name        , sex        , ownerOptions = {})       {
    this.tavern = new Tavern();
    this.sim = new Sim(this.tavern, newEcon(Math.floor(Math.random() * 1e9)));
    this.ownerName = name;
    const t = this.tavern;
    // 开局布局：中间前台（门厅），左侧餐饮→厨房→储藏，右侧横向走廊、上下各一间客房
    t.placeRoom(bpById('foyer4'), 0, 0, 0);
    t.placeRoom(bpById('dining6'), -6, 0, 0);
    t.placeRoom(bpById('kitchen6'), -6, 5, 0);
    t.placeRoom(bpById('storage4'), -10, 5, 0);
    t.placeRoom(bpById('corridor6'), 4, 1, 0);
    t.placeRoom(bpById('guestroom5'), 9, -3, 0);
    t.placeRoom(bpById('guestroom5'), 9, 3, 0);
    // 员工宿舍区：两段 6×2 走廊竖放串联向上，顶端走廊的左右两侧各一间员工休息室
    t.placeRoom(bpById('corridor6'), 1, -6, 1);
    t.placeRoom(bpById('corridor6'), 1, -12, 1);
    t.placeRoom(bpById('lounge5'), -4, -12, 0);
    t.placeRoom(bpById('lounge5'), 3, -12, 0);
    // 前台柜台：门厅正中，客人一进门就看到
    t.placeFurn('desk', 1, 2, 0, 1);
    // 厨房产线
    t.placeFurn('prep', -6, 6, 0, 1);
    t.placeFurn('stove', -3, 6, 0, 1);
    t.placeFurn('sink', -6, 8, 0, 1);
    t.placeFurn('pass', -2, 8, 0, 1);
    t.placeFurn('shelf', -10, 6, 0, 1);
    const tables                     = [[-5, 1], [-2, 1], [-5, 3], [-2, 3]];
    for (const [x, y] of tables) {
      t.placeFurn('table', x, y, 0, 1);
      t.placeFurn('chair', x - 1, y, 3, 1);
      t.placeFurn('chair', x, y + 1, 2, 1);
    }
    // 两间客房各一张床，开局就能接过夜的客人
    t.placeFurn('bed', 10, -2, 0, 1);
    t.placeFurn('lamp', 13, 0, 0, 1);
    t.placeFurn('bed', 10, 4, 0, 1);
    t.placeFurn('lamp', 13, 6, 0, 1);
    t.placeFurn('lamp', 7, 2, 0, 1);
    // 两间休息室：沙发＋双层床是标配，左边带书架、右边带茶桌梳妆台
    t.placeFurn('couch', -3, -12, 0, 1);
    t.placeFurn('bunk', -3, -10, 0, 1);
    t.placeFurn('bookshelf', -1, -12, 0, 1);
    t.placeFurn('couch', 4, -12, 0, 1);
    t.placeFurn('bunk', 4, -10, 0, 1);
    t.placeFurn('teatable', 7, -12, 0, 1);
    t.placeFurn('vanity', 7, -10, 0, 1);
    const owner = makeStaff(this.sim.rng, this.sim.id(), true, app, name, ownerOptions);
    owner.sex = sex;
    savePlayerProfile(ownerOptions.profile || {}, this.currentSlot);
    const e = t.entrance();
    owner.x = e.x; owner.y = e.y + 1;
    owner.job = 'free';
    this.sim.staff.push(owner);
    // 前台必须有人值守：开局送一名前台伙计（不收入职费）
    const clerk = makeStaff(this.sim.rng, this.sim.id(), false);
    clerk.job = 'front';
    clerk.x = e.x - 1; clerk.y = e.y + 2;
    this.sim.staff.push(clerk);
    // 开局伙计分到左边那间休息室（卧室 1 室 1 人，门上挂名）
    const leftLounge = t.rooms.filter((r) => r.kind === 'lounge').sort((a, b) => a.x - b.x)[0];
    if (leftLounge) leftLounge.occupant = clerk.id;
    this.sim.refreshPool();
    this.sim.manualOwner = this.manualPref();
    this.sim.toast(`${name}接过了钥匙：多元便携旅店，开张了。`);
    this.staticVersion = -1;
    this.cam = { x: 2, y: 3 };
    if (this.ui.compact) this.fitView();
    this.selection = null;
    this.resetBuildHistory('开局布局');
    this.saveMorning();
    this.save();
    this.ui.startTutorial(true);
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
      try { data = raw ? parseAndMigrateGameSave(raw) : null; } catch (e) { /* invalid */ }
      const valid = !!data;
      out.push({
        slot, valid,
        hasBackup: (() => { try { parseAndMigrateGameSave(localStorage.getItem(backupKeyFor(slot))); return true; } catch (error) { return false; } })(),
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
    try {
      const old = localStorage.getItem(saveKeyFor(slot));
      if (old) { try { parseAndMigrateGameSave(old); localStorage.setItem(backupKeyFor(slot), old); } catch (error) { /* 不用坏档覆盖备份 */ } }
      localStorage.setItem(saveKeyFor(slot), stringifyGameSave(data));
    } catch (e) { return false; }
    return true;
  }

  saveToSlot(slot        )          {
    if (!canPersistSim(this.sim)) { this.sim.toast('营业中不能主动存档：请先完成今日营业'); this.audio.play('error'); return false; }
    this.currentSlot = this.normalizeSlot(slot);
    this.rememberActiveSlot();
    const ok = this.save(this.currentSlot, true);
    if (ok) { this.sim.toast(`已主动保存到档位 ${this.currentSlot}`); this.audio.play('chime', 0.7); }
    return ok;
  }

  loadSlot(slot        )          {
    slot = this.normalizeSlot(slot);
    let raw = localStorage.getItem(saveKeyFor(slot));
    try { parseAndMigrateGameSave(raw); } catch (error) {
      const backup = localStorage.getItem(backupKeyFor(slot));
      try {
        parseAndMigrateGameSave(backup);
        raw = backup;
        localStorage.setItem(saveKeyFor(slot), backup);
        this.sim.toast(`档位 ${slot} 主存档损坏，已自动恢复最近备份`);
      } catch (backupError) { this.sim.toast(`档位 ${slot} 没有可读取的存档`); this.audio.play('error'); return false; }
    }
    try {
      this.loadFrom(raw);
      this.currentSlot = slot;
      this.rememberActiveSlot();
      this.creatorPending = false;
      this.ui.closeModal();
      this.audio.playTrack(this.sim.dayActive ? 'bgm' : 'bgm-plan');
      this.audio.playAmb(this.sim.dayActive ? 'amb' : 'amb-night');
      this.sim.toast(`已读取档位 ${slot}`);
      this.ui.render(true);
      this.ui.resumeTutorial();
      return true;
    } catch (e) { this.sim.toast(`档位 ${slot} 读取失败`); this.audio.play('error'); return false; }
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
    try { data = parseAndMigrateGameSave(raw); } catch (error) { this.sim.toast(`档位 ${slot} 无法导出：${error.message}`); return false; }
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
      const data = parseAndMigrateGameSave(raw);
      data.meta = { ...data.meta, version: SAVE_SCHEMA_VERSION, slot, importedAt: Date.now(), savedAt: Date.now() };
      const current = localStorage.getItem(saveKeyFor(slot));
      if (current) { try { parseAndMigrateGameSave(current); localStorage.setItem(backupKeyFor(slot), current); } catch (error) { /* ignore */ } }
      localStorage.setItem(saveKeyFor(slot), stringifyGameSave(data));
      this.sim.toast(`已导入并迁移到档位 ${slot}`);
      return true;
    } catch (error) { this.sim.toast(`导入失败：${error.message}`); this.audio.play('error'); return false; }
  }

  restoreBackup(slot = this.currentSlot) {
    slot = this.normalizeSlot(slot);
    const raw = localStorage.getItem(backupKeyFor(slot));
    try { parseAndMigrateGameSave(raw); } catch (error) { this.sim.toast(`档位 ${slot} 没有可恢复的有效备份`); return false; }
    localStorage.setItem(saveKeyFor(slot), raw);
    this.sim.toast(`已恢复档位 ${slot} 的最近备份`);
    return true;
  }

  setManualOwner(v         )       {
    this.sim.manualOwner = v;
    this.manualInput.x = 0; this.manualInput.y = 0;
    this.sim.manualVec.x = 0; this.sim.manualVec.y = 0;
    try { localStorage.setItem(Game.MANUAL_KEY, v ? '1' : '0'); } catch (e) { /* 隐私模式下忽略 */ }
    const own = this.sim.staff.find((x) => x.isOwner);
    if (own) { own.task = null; own.path = []; own.bubble = { text: v ? '听你指挥！' : '我自己忙去', t: 1.6 }; }
    this.sim.toast(v ? `已开启直控：${this.ui.compact ? '拖动屏下摇杆' : 'WASD / 方向键'}移动店主` : '已关闭直控：店主恢复自动干活，WASD 平移镜头');
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
    const data = parseAndMigrateGameSave(json)
                                                                                                                        
                                                                                          
                                                                       
     ;
    this.tavern = Tavern.load(data.tavern);
    this.sim = new Sim(this.tavern, data.sim.econ);
    this.sim.loadState(data.sim);
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
        this.openDetailAt(t.x, t.y);
      } else this.lastTap = { t: now, x: t.x, y: t.y };
    });
    cv.addEventListener('pointercancel', (e) => { this.pointers.delete(e.pointerId); this.drag = null; });
    cv.addEventListener('dblclick', (e) => {
      if (this.buildBp || this.buildFurn || this.moveRoomId !== null || this.moveFurnId !== null) return;
      const t = this.screenToTile(e.clientX, e.clientY);
      this.openDetailAt(t.x, t.y);
    });
    cv.addEventListener('contextmenu', (e) => { e.preventDefault(); this.cancelBuild(); });
    cv.addEventListener('wheel', (e) => { e.preventDefault(); this.setZoom(this.zoom * (e.deltaY < 0 ? 1.15 : 0.87)); }, { passive: false });
    window.addEventListener('keydown', (e) => {
      const tag = (e.target               ).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      this.keys.add(e.key.toLowerCase());
      const k = e.key.toLowerCase();
      if (k === ' ') { this.setPaused(!this.paused); e.preventDefault(); }
      else if (k === '1') this.setSpeed(1);
      else if (k === '2') this.setSpeed(2);
      else if (k === '3') this.setSpeed(4);
      else if (k === 'b') { this.ui.leftTab = 'room'; this.ui.render(true); }
      else if (k === 'r') {
        if (this.buildBp || this.buildFurn || this.moveFurnId !== null) this.rotateBuild();
        else if (this.selection && this.selection.kind === 'furn') this.rotateFurn(this.selection.id);
      }
      else if (k === 'escape') { this.cancelBuild(); this.selection = null; this.ui.closeModal(); }
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
    if (right) { this.cancelBuild(); return; }
    if (this.blocked) return;
    if (this.moveRoomId !== null) { this.tryMoveRoom(x, y); return; }
    if (this.moveFurnId !== null) { this.tryMoveFurn(x, y); return; }
    if (this.buildBp) { this.tryBuildRoom(x, y); return; }
    if (this.buildFurn) { this.tryBuildFurn(x, y); return; }
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
      this.selection = { kind: 'furn', id: f.id };
      return;
    }
    const r = this.tavern.roomAt(x, y);
    this.selection = r ? { kind: 'room', id: r.id } : null;
  }

  /** 双击：命中员工就开详情（点空地不打扰） */
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
    if (this.blocked) return;
    const own = this.sim.staff.find((s) => s.isOwner);
    if (!own) return;
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
    this.sim.toast('身边没人可搭话：走到伙计或客人旁边再按 E（设置里可开直控自己走）');
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
    this.tavern = Tavern.load(snapshot.tavern);
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
      furns: this.tavern.furnsIn(room.id).map((f) => ({ kind: f.kind, x: f.x - room.x, y: f.y - room.y, dir: f.dir, quality: f.quality })),
    });
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
    this.tavern = Tavern.load(data); this.sim.tavern = this.tavern;
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
    if (!to || !from || to.id !== from.id) { this.sim.toast('只能搬到同一个房间里'); this.audio.play('error', 0.5); return; }
    const chk = this.tavern.canPlaceFurn(f.kind, x, y, this.buildRot, f.id);
    if (!chk.ok) { this.sim.toast(chk.reason); this.audio.play('error', 0.5); return; }
    // 家具挪位后旧任务的坐标就废了：让所有人重新领活（本来就是几秒内的事）
    for (const s of this.sim.staff) { s.task = null; s.path = []; s.carry = null; }
    f.x = x; f.y = y; f.dir = this.buildRot;
    f.busyBy = undefined;
    this.tavern.reindex();
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
    this.clearPlacementConfirmation();
    this.roomCopy = null; this.buildBp = id; this.buildFurn = null; this.moveRoomId = null; this.moveFurnId = null; this.buildRot = 0;
  }
  startBuildFurn(kind        , q        )       {
    if (this.sim.dayActive) { this.sim.toast('营业中不能改造，先完成今天'); this.audio.play('error'); return; }
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
    const bp = bpById(this.buildBp          );
    const check = this.tavern.canPlaceRoom(bp, x, y, this.buildRot);
    if (!check.ok) { this.sim.toast(check.reason); this.audio.play('error'); return; }
    const copy = this.roomCopy;
    const area = (this.buildRot ? bp.h : bp.w) * (this.buildRot ? bp.w : bp.h);
    const roomUpgradeCost = copy ? Array.from({ length: Math.max(0, copy.quality - 1) }, (_, i) => Math.round(area * 26 * (i + 1))).reduce((a, b) => a + b, 0) : 0;
    const styleCost = copy ? styleById(copy.style).cost : 0;
    const furnitureCost = copy ? copy.furns.reduce((sum, f) => sum + furnDef(f.kind).cost[f.quality - 1], 0) : 0;
    const totalCost = bp.cost + roomUpgradeCost + styleCost + furnitureCost;
    if (this.sim.econ.coins < totalCost) { this.sim.toast(`界币不足，需要 ${totalCost}`); this.audio.play('error'); return; }
    if (copy) {
      const trial = Tavern.load(cloneData(this.tavern.serialize()));
      const trialRoom = trial.placeRoom(bp, x, y, this.buildRot);
      trialRoom.quality = copy.quality;
      const furniture = [...copy.furns].sort((a, b) => Number(a.kind === 'chair') - Number(b.kind === 'chair'));
      for (const f of furniture) {
        const fcheck = trial.canPlaceFurn(f.kind, x + f.x, y + f.y, f.dir);
        if (!fcheck.ok) { this.sim.toast(`蓝图家具无法落位：${furnDef(f.kind).name} · ${fcheck.reason}`); this.audio.play('error'); return; }
        trial.placeFurn(f.kind, x + f.x, y + f.y, f.dir, f.quality);
      }
      if (!trial.roomsConnectedByOpenings(trial.rooms, new Set(trial.furnIdx.keys()))) { this.sim.toast('蓝图会堵住门洞，换一个连接面再试'); this.audio.play('error'); return; }
    }
    const purchaseKey = this.placementKey(copy ? 'roomcopy' : 'room', bp.id, x, y, this.buildRot, totalCost);
    if (!this.confirmPlacement(purchaseKey, `是否购买并建造${copy?.name || bp.name}（-${totalCost}）？再次单击确认，双击直接购买`)) return;
    this.sim.econ.coins -= totalCost;
    const room = this.tavern.placeRoom(bp, x, y, this.buildRot);
    if (copy) {
      room.quality = copy.quality; room.style = copy.style;
      for (const f of [...copy.furns].sort((a, b) => Number(a.kind === 'chair') - Number(b.kind === 'chair'))) this.tavern.placeFurn(f.kind, x + f.x, y + f.y, f.dir, f.quality);
      this.tavern.reindex();
    }
    this.sim.toast(`${copy ? copy.name : ROOM_LABEL[bp.kind]}落位（-${totalCost}）`);
    this.audio.play('build');
    for (let i = 0; i < 14; i++) this.sim.fx.push({ x: room.x + Math.random() * room.w, y: room.y + Math.random() * room.h, t: 0.5 + Math.random() * 0.3, kind: 'spark' });
    this.selection = { kind: 'room', id: room.id };
    this.recordBuildState(`建造${copy?.name || bp.name}`);
    this.save();
  }

  tryBuildFurn(x        , y        )       {
    const kind = this.buildFurn          ;
    const def = furnDef(kind);
    const cost = def.cost[this.buildQuality - 1];
    const check = this.tavern.canPlaceFurn(kind, x, y, this.buildRot);
    if (!check.ok) { this.sim.toast(check.reason); this.audio.play('error'); return; }
    if (this.sim.econ.coins < cost) { this.sim.toast('界币不足'); this.audio.play('error'); return; }
    const purchaseKey = this.placementKey('furn', kind, x, y, this.buildRot, this.buildQuality);
    if (!this.confirmPlacement(purchaseKey, `是否购买并放置${def.name}（-${cost}）？再次单击确认，双击直接购买`)) return;
    this.sim.econ.coins -= cost;
    const f = this.tavern.placeFurn(kind, x, y, this.buildRot, this.buildQuality);
    this.audio.play('place');
    this.selection = { kind: 'furn', id: f.id };
    this.recordBuildState(`放置${def.name}`);
    this.save();
  }

  openDay()       {
    if (this.sim.sealed) { this.sim.toast('酒馆已被封印'); return; }
    if (this.sim.dayActive) return;
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
    this.sim.openDay();
    this.drawStars();
    this.paused = false;
    this.audio.play('portal');
    this.audio.playTrack('bgm');
    this.audio.playAmb('amb');
    this.audio.setMusicLevel(0.4);
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
        this.worldBackgroundId = '';
        this.ensureWorldBackground();
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        this.ui.render(true); this.save();
      }
      await this.fadeWorldTravel(0, 900);
      return !!arrived;
    } catch (err) {
      const arrived = this.sim.activatePendingWorldSwitch();
      this.worldBackgroundId = ''; this.ensureWorldBackground(); this.ui.render(true); this.save();
      this.sim.toast(`${arrived ? '已抵达目标世界，但穿越动画未能完整播放' : '穿越失败'}：${err?.message || '未知错误'}`);
      return !!arrived;
    } finally {
      this.cleanupWorldTravel(); this.worldTravelActive = false;
    }
  }

  openingReadiness() {
    const blocking = []; const warnings = [];
    const hasSeats = this.tavern.allTables().some((t) => this.tavern.tableSeats(t).length > 0);
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
    const stat = this.sim.closeDay();
    this.audio.setMusicLevel(0.24);
    this.audio.playTrack('bgm-night');
    this.audio.playAmb('amb-night');
    this.audio.play('daybell');
    this.audio.play('coin');
    this.save();
    this.ui.openSettlement(stat);
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
    if (this.sim.dayActive) {
      this.sim.toast('营业中不能解雇员工，请在收盘规划时处理');
      return false;
    }
    if (s && s.job === 'front' && !this.sim.staff.some((x) => x.id !== id && x.job === 'front')) {
      this.sim.toast('前台必须有人值守：先把别人调到前台再辞掉他');
      return false;
    }
    this.sim.fire(id);
    this.save();
    return true;
  }
  setJob(id        , job     )       {
    const s = this.sim.staff.find((x) => x.id === id);
    if (!s) return;
    if (this.sim.dayActive) { this.sim.toast('营业中不能调岗，请在收盘规划时安排'); return; }
    // 前台必须有人值守：最后一个前台不能改岗
    if (s.job === 'front' && job !== 'front'
      && !this.sim.staff.some((x) => x.id !== id && x.job === 'front')) {
      this.sim.toast('前台必须有人值守：先安排另一个人上前台');
      return;
    }
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
    if (!s || this.sim.dayActive) { if (this.sim.dayActive) this.sim.toast('营业中不能调整区域模式'); return; }
    s.roomMode = mode === 'strict' ? 'strict' : 'prefer';
    s.task = null; s.path = []; s.carry = null;
    this.save();
  }
  setPrio(id        , p        )       {
    const s = this.sim.staff.find((x) => x.id === id);
    if (s) { s.prio = Math.max(0, Math.min(3, p)); this.save(); }
  }
  setDutyMode(id, mode) {
    const s = this.sim.staff.find((person) => person.id === id);
    if (!s || this.sim.dayActive) { if (this.sim.dayActive) this.sim.toast('营业中不能调整职责'); return; }
    s.dutyMode = mode === 'manual' ? 'manual' : 'auto';
    this.save(); this.ui.render(true);
  }
  setDutyPriority(id, duty, priority) {
    const s = this.sim.staff.find((person) => person.id === id);
    if (!s || this.sim.dayActive || !s.dutyPriorities || !(duty in s.dutyPriorities)) return;
    s.dutyPriorities[duty] = Math.max(0, Math.min(4, priority));
    s.dutyMode = 'manual';
    this.save(); this.ui.render(true);
  }
  trainStaff(id, skill, choiceId = 'focus') { const ok = this.sim.trainStaff(id, skill, choiceId); if (ok) { this.save(); this.ui.render(true); } return ok; }
  buyStaffEquipment(id, equipmentId) { if (this.sim.buyStaffEquipment(id, equipmentId)) { this.save(); this.ui.render(true); } }
  learnStaffPerk(id, perkId) { if (this.sim.learnStaffPerk(id, perkId)) { this.save(); this.ui.render(true); } }
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
    this.sim.toast(`${ROOM_LABEL[r.kind]}升级到品质 ${'I'.repeat(r.quality)}`);
    this.audio.play('build');
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
    const check = this.tavern.canRemoveRoom(id);
    if (!check.ok) { this.sim.toast(check.reason); this.audio.play('error'); return; }
    const r = this.tavern.roomById(id);
    if (!r) return;
    const bp = BLUEPRINTS.find((b) => b.id === r.bp);
    const removed = this.tavern.removeRoom(id);
    let refund = Math.round((bp ? bp.cost : 0) * 0.7);
    for (const f of removed) refund += Math.round(furnDef(f.kind).cost[f.quality - 1] * 0.7);
    this.sim.econ.coins += refund;
    this.sim.toast(`拆除完成，返还 ${refund}`);
    this.selection = null;
    this.recordBuildState('拆除房间');
    this.save();
  }
  upgradeFurn(id        )       {
    const f = this.tavern.furnById(id);
    if (!f || f.quality >= 3) return;
    const nextQuality = f.quality + 1;
    const needStar = furnQualityUnlock(f.kind, nextQuality);
    const room = this.tavern.roomOfFurn(f);
    if (this.sim.stars() < needStar) { this.sim.toast(`品质 ${'I'.repeat(nextQuality)} 需要 ★${needStar}`); this.audio.play('error'); return; }
    if (!room || room.quality < nextQuality) { this.sim.toast(`先把所在房间升级到品质 ${'I'.repeat(nextQuality)}`); this.audio.play('error'); return; }
    const def = furnDef(f.kind);
    const cost = def.cost[f.quality] - def.cost[f.quality - 1];
    if (this.sim.econ.coins < cost) { this.sim.toast('界币不足'); this.audio.play('error'); return; }
    this.sim.econ.coins -= cost;
    f.quality++;
    this.tavern.version++;    // 触发静态层重建，否则新外观不刷新
    this.audio.play('place');
    this.recordBuildState('升级家具');
    this.save();
  }
  removeFurn(id        )       {
    if (this.sim.dayActive) { this.sim.toast('营业中不能拆除家具'); this.audio.play('error'); return; }
    const f = this.tavern.furnById(id);
    if (!f) return;
    this.sim.econ.coins += Math.round(furnDef(f.kind).cost[f.quality - 1] * 0.7);
    this.tavern.removeFurn(id);
    this.selection = null;
    this.recordBuildState('拆除家具');
    this.save();
  }
  rotateFurn(id        )       {
    const f = this.tavern.furnById(id);
    if (!f) return;
    if (this.sim.dayActive) { this.sim.toast('营业中不能旋转家具'); this.audio.play('error'); return; }
    for (let i = 1; i <= 4; i++) {
      const nd = (f.dir + i) % 4;
      const check = this.tavern.canPlaceFurn(f.kind, f.x, f.y, nd, f.id);
      if (check.ok) {
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
    this.ui.openEventResult(text, this.sim.lastEventResolution);
    this.save();
  }

  // ---------- 帧 ----------
  frame(dt        )       {
    const up = this.keys.has('w') || this.keys.has('arrowup');
    const down = this.keys.has('s') || this.keys.has('arrowdown');
    const left = this.keys.has('a') || this.keys.has('arrowleft');
    const right = this.keys.has('d') || this.keys.has('arrowright');
    if (this.sim.manualOwner) {
      // 直控店主：按键给方向，镜头缓动跟随
      this.sim.manualVec.x = Math.max(-1, Math.min(1, (right ? 1 : 0) - (left ? 1 : 0) + this.manualInput.x));
      this.sim.manualVec.y = Math.max(-1, Math.min(1, (down ? 1 : 0) - (up ? 1 : 0) + this.manualInput.y));
      const own = this.sim.staff.find((x) => x.isOwner);
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
    if (active) this.sim.update(dt * this.speed);
    else {
      this.sim.update(0);
      // 结算弹窗会冻结经营逻辑，但已被送客的角色仍应走完离场路径。
      if (this.blocked && !this.sim.running) this.sim.tickDepartures(dt);
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
      a.sp.visible = a.always || !!(this.tavern.furnById(a.furn) || {}).busyBy;
    }
    for (const s of this.sim.sounds) this.audio.play(s, s === 'portal' ? 0.5 : 0.8);
    this.sim.sounds.length = 0;

    if (this.sim.pendingEvent && !this.ui.modal) this.ui.openEvent();
    if (this.sim.dayActive && this.sim.dayT >= DAY_LEN && (!this.sim.groups.some((g) => !g.overnight) || this.sim.dayT > DAY_LEN + 90)) this.finishDay();

    this.render();
    this.ui.tick(dt);
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
    const zoom = this.zoom;
    if (this.app.renderer.width !== this.lastW || this.app.renderer.height !== this.lastH) {
      this.lastW = this.app.renderer.width; this.lastH = this.app.renderer.height;
      this.drawStars();
    }
    this.world.scale.set(zoom);
    const view = this.mapViewportRect();
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
    this.audio.setMusicLevel(this.worldTravelActive ? 0 : this.sim.dayActive ? 0.36 : 0.2);
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
          const hd = this.materialPack === 'hd' ? materialFrame(name, x - r.x, y - r.y) : null;
          const sp = new PIXI.Sprite(hd || floorTex(name, v));
          sp.width = T; sp.height = T;
          if (name === 'floor-tatami' && this.materialPack !== 'hd' && ((x + y) & 1)) {
            // 经典榻榻米：相邻格织向转 90°。高清图已带完整席面，再转会把席块拧碎。
            sp.anchor.set(0.5);
            sp.rotation = Math.PI / 2;
            sp.x = x * T + T / 2; sp.y = y * T + T / 2;
          } else {
            sp.x = x * T; sp.y = y * T;
            // 房间品质换材质：II 提亮、III 暖金光泽（与厨房棋盘格做通道叠加）
            let tint = (name === 'floor-kitchen' && ((x + y) & 1)) ? 0xE4EAF0 : 0xFFFFFF;
            const qt = this.materialPack === 'hd'
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
    const beamStrip = (x) => {
      const base = this.worldMaterials.get('wall');
      if (!base) return null;
      const fx = ((x % WORLD_ART_SCALE) + WORLD_ART_SCALE) % WORLD_ART_SCALE;
      const key = `beamstrip|${fx}`;
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
          const beam = this.materialPack === 'hd' ? beamStrip(x) : null;
          if (beam) {
            const trim = new PIXI.Sprite(beam);
            trim.anchor.set(0.5); trim.width = T; trim.height = th;
            trim.rotation = horiz ? 0 : Math.PI / 2;
            trim.x = side === 2 ? x * T + th / 2 : side === 3 ? (x + 1) * T - th / 2 : x * T + T / 2;
            trim.y = side === 0 ? y * T + th / 2 : side === 1 ? (y + 1) * T - th / 2 : y * T + T / 2;
            const beamStyle = styleById(this.tavern.roomStyle(r));
            let beamHex = r.quality >= 3 ? mix('#FFFFFF', '#E8B44A', 0.52)
              : r.quality >= 2 ? mix('#FFFFFF', '#C9922F', 0.3) : '#FFFFFF';
            if (beamStyle.id !== 'rustic') beamHex = mix(beamHex, beamStyle.trim || beamStyle.accent, 0.45);
            if (beamHex !== '#FFFFFF') trim.tint = hexToNum(beamHex);
            this.wallSprites.addChild(trim);
          } else {
            this.wallSprites.addChild(sp);
          }
          if (!nb && ((x * 5 + y * 3 + side) % 4 === 0)) {
            const pick = WALL_DECO[r.kind] || WALL_DECO.dining;
            const kindDeco = pick[(x + y + side) % pick.length];
            const hdSconce = kindDeco === 'sconce' && this.materialPack === 'hd' ? furnitureAtlasTexture('sconce', this.worldMaterials.get('furniture')) : null;
            const d = new PIXI.Sprite(hdSconce || decoTex(kindDeco, horiz));
            if (hdSconce) { d.width = 24; d.height = 24; d.rotation = horiz ? 0 : Math.PI / 2; }
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
      if (r.quality >= 2 && this.materialPack === 'hd') {
        const rail = beamStrip(r.x + r.y);
        const gold = r.quality >= 3 ? 0xF3D98A : 0xC9922F;
        const placeRail = (x, y, rot, len = T) => {
          if (!rail) return;
          const trim = new PIXI.Sprite(rail);
          trim.anchor.set(0.5); trim.width = len; trim.height = r.quality >= 3 ? 4 : 3;
          trim.rotation = rot; trim.x = x; trim.y = y; trim.tint = gold;
          this.wallSprites.addChild(trim);
        };
        for (let x = r.x; x < r.x + r.w; x++) {
          if ((!this.tavern.roomAt(x, r.y - 1) || gap(x, r.y, 0, -1)) && !gap(x, r.y, 0, -1)) placeRail(x * T + T / 2, r.y * T + 10, 0);
          if ((!this.tavern.roomAt(x, r.y + r.h) || gap(x, r.y + r.h - 1, 0, 1)) && !gap(x, r.y + r.h - 1, 0, 1)) placeRail(x * T + T / 2, (r.y + r.h) * T - 10, 0);
        }
        for (let y = r.y; y < r.y + r.h; y++) {
          if ((!this.tavern.roomAt(r.x - 1, y) || gap(r.x, y, -1, 0)) && !gap(r.x, y, -1, 0)) placeRail(r.x * T + 10, y * T + T / 2, Math.PI / 2);
          if ((!this.tavern.roomAt(r.x + r.w, y) || gap(r.x + r.w - 1, y, 1, 0)) && !gap(r.x + r.w - 1, y, 1, 0)) placeRail((r.x + r.w) * T - 10, y * T + T / 2, Math.PI / 2);
        }
        if (r.quality >= 3) {
          const boss = glowTex(7, '#F3D98A');
          for (const [cx, cy] of [[r.x, r.y], [r.x + r.w, r.y], [r.x, r.y + r.h], [r.x + r.w, r.y + r.h]]) {
            const med = new PIXI.Sprite(boss);
            med.anchor.set(0.5); med.alpha = 0.9;
            med.x = cx * T + (cx === r.x ? 10 : -10);
            med.y = cy * T + (cy === r.y ? 10 : -10);
            this.wallSprites.addChild(med);
          }
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
      const hdFurniture = !!(furnitureAtlas && FURNITURE_ATLAS_FRAMES[f.kind]);
      const sp = new PIXI.Sprite(furnTexture(f.kind, f.quality, fstyle.accent, furnitureAtlas));
      // 实例级微色差：同种家具不再千件一面（色相暖冷 4 档抖动）
      const jit = [0xFFFFFF, 0xF7EEE0, 0xFFF6E4, 0xEFF2F4][((f.id * 2654435761) >>> 0) % 4];
      const base = hexToNum(fstyle.furnTint);
      if (hdFurniture) {
        const qHex = f.quality >= 3 ? '#E8C070' : f.quality >= 2 ? '#F2D9A0' : '#FFFFFF';
        const styleHex = fstyle.id !== 'rustic' ? mix('#FFFFFF', fstyle.furnTint, 0.58) : '#FFFFFF';
        const merged = mix(styleHex, qHex, f.quality >= 2 ? 0.55 : 0);
        if (merged !== '#FFFFFF') sp.tint = hexToNum(merged);
      } else {
        sp.tint = (((base >> 16 & 255) * (jit >> 16 & 255) / 255) << 16) | (((base >> 8 & 255) * (jit >> 8 & 255) / 255) << 8) | Math.round((base & 255) * (jit & 255) / 255);
      }
      const [fw, fh] = furnFootprint(f.kind, f.dir);
      const [sourceW, sourceH] = furnFootprint(f.kind, 0);
      sp.width = sourceW * T; sp.height = sourceH * T;
      sp.anchor.set(0.5);
      sp.x = (f.x + fw / 2) * T;
      sp.y = (f.y + fh / 2) * T;
      sp.rotation = (f.dir === 0 ? 0 : f.dir === 1 ? Math.PI / 2 : f.dir === 2 ? Math.PI : Math.PI * 1.5);
      // -5：同底边时角色画在家具前面（坐在椅子上、贴着灶台干活）
      sp.zIndex = Math.round((f.y + fh) * 100) - 5;
      this.actorLayer.addChild(sp);
      this.furnSprites.push(sp);
      if (hdFurniture && f.quality >= 2) {
        const hwKey = `hdq|${sourceW}|${sourceH}|${f.quality}`;
        let hwTex = this.pixTex.get(hwKey);
        if (!hwTex) {
          hwTex = texFromCanvas(hdQualityHardware(sourceW, sourceH, f.quality).canvas);
          this.pixTex.set(hwKey, hwTex);
        }
        const hw = new PIXI.Sprite(hwTex);
        hw.anchor.set(0.5);
        hw.x = sp.x; hw.y = sp.y; hw.rotation = sp.rotation;
        hw.width = sourceW * T; hw.height = sourceH * T;
        hw.zIndex = sp.zIndex + 1;
        this.actorLayer.addChild(hw);
        this.furnSprites.push(hw);
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
    const sig = this.tavern.dirt.reduce((a, d) => a + d.x * 31 + d.y * 7 + d.level * 3, this.tavern.dirt.length * 1000);
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
    const put = (id        , app            , x        , y        , dir        , pose      , animT        , carry               , restOn             )       => {
      seen.add(id);
      let sp = this.actorSprites.get(id);
      if (!sp) {
        sp = new PIXI.Sprite();
        sp.anchor.set(0.5, 1);
        sp.roundPixels = true;
        this.actorLayer.addChild(sp);
        this.actorSprites.set(id, sp);
      }
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
      put(s.id, s.app, s.x, s.y, s.dir, spose, s.animT, s.carry, restOn);
    }
    for (const g of this.sim.guests) {
      const gr = this.sim.groups.find((x) => x.id === g.groupId);
      const pose       = gr && gr.state === 'eating' && !facUse.has(g.id) ? 'eat'
        : gr && (gr.state === 'seated' || gr.state === 'ordered') && !facUse.has(g.id) ? 'sit' : g.pose;
      put(g.id, g.app, g.x, g.y, g.dir, pose, g.animT, null, null);
    }
    for (const [id, sp] of this.actorSprites) {
      if (!seen.has(id)) { sp.destroy(); this.actorSprites.delete(id); const sh = this.actorShadows.get(id); if (sh) { sh.destroy(); this.actorShadows.delete(id); } }
    }
  }

          itemPool                = [];
          glowAnims                                                                                               = [];
          furnAnims                                                                                              = [];
          glowT = 0;
          itemUsed = 0;
          itemSprite(tex              , x        , y        )       {
    let sp = this.itemPool[this.itemUsed];
    if (!sp) {
      sp = new PIXI.Sprite();
      sp.roundPixels = true;
      this.itemLayer.addChild(sp);
      this.itemPool.push(sp);
    }
    sp.texture = tex; sp.x = x; sp.y = y; sp.visible = true;
    this.itemUsed++;
  }

  renderItems()       {
    this.itemUsed = 0;
    // 出餐台上的成品
    for (const f of this.tavern.furnsOfKind('pass')) {
      const n = f.plates || 0;
      const ready = this.sim.orders.filter((x) => x.stage === 'ready');
      for (let i = 0; i < n; i++) {
        const o = ready[i];
        const dish = o ? this.sim.dishOf(o.dishId) : DISHES[0];
        this.itemSprite(plateTexture(dish ? dish.color : PAL.cream, false), f.x * T + 4 + i * 14, f.y * T + 8);
      }
    }
    // 桌上的菜与脏盘
    for (const t of this.tavern.allTables()) {
      const group = this.sim.groups.find((g) => g.tableId === t.id && g.state === 'eating');
      if (group) {
        const o = this.sim.orders.find((x) => x.id === group.orderId);
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
      if (li >= this.labels.length) return;
      const t = this.labels[li++];
      t.text = text;
      t.x = Math.round(this.world.x + wx * this.zoom);
      t.y = Math.round(this.world.y + wy * this.zoom);
      t.visible = true;
      t.style.wordWrap = false;
      t.style.fill = color === undefined ? 0xffe6b0 : color;
    };
    const bubble = (text, wx, wy, tone = 'neutral') => {
      if (li >= this.labels.length || !text) return;
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

const game = new Game();
game.boot().catch((err) => {
  console.error(err);
  const d = document.createElement('div');
  d.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;color:#FF6B5A;font-family:monospace;padding:20px;text-align:center';
  d.textContent = '启动失败：' + (err && err.message ? err.message : String(err));
  document.body.appendChild(d);
});
