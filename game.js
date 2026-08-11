import * as PIXI from 'pixi.js';
import { ACC_NAMES,                  appKey, avatarURL, defaultAppearance, drawAvatar, drawSprite, normalizeApp,            PRESETS, randomAppearance, THEMES } from './src/chargen.js';
import { furnPix, dirtPix, doorPix, equipAnimPix, platePix, ROOM_WALL, T, wallPix } from './src/furniture.js';

const ACTOR_S = 0.5;          // 世界里的小人按 50% 画（美术画布 64×72 → 场内 32×36）
import { FLOOR_VARIANTS, floorVariant, glowPix, rugTile, wallDecoPix } from './src/floor.js';
import { hexToNum, mix, PAL, Rng } from './src/pix.js';
import {
  BLUEPRINTS, BED_KINDS, DISHES, furnDef, furnQualityUnlock,              ING_PRICE,           JOB_COLOR, ROOM_FLOOR, ROOM_LABEL, styleById, wantById,
} from './src/data.js';
import { DAY_LEN,            makeStaff, newEcon, Sim,            } from './src/sim.js';
import { canPersistSim } from './src/save-policy.js';
import { bpById, dirDelta,            furnFootprint,            Tavern } from './src/world.js';
import {               UI } from './src/ui.js';
import { TitleScreen, validGameSave } from './src/title.js';

const SAVE_KEY = 'wjbdy.save.v1';
const MORNING_KEY = 'wjbdy.morning.v1';
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
function furnTexture(kind        , q        , accent = '#C9922F')               {
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
}

// ---------- 游戏 ----------
class Game                    {
  app                   ;
  world = new PIXI.Container();
  floorLayer = new PIXI.Container();
  wallLayer = new PIXI.Graphics();
  dirtLayer = new PIXI.Container();
  furnLayer = new PIXI.Container();
          furnSprites                = [];
  itemLayer = new PIXI.Container();
  actorLayer = new PIXI.Container();
  overlay = new PIXI.Graphics();
  labelLayer = new PIXI.Container();
  stars = new PIXI.Graphics();

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
          lastTap                                             = null;
  drag                                                                                          = null;
  pointers = new Map                                  ();
  pinchDist = 0;
  labels              = [];
  floorTextures = new Map                      ();
  floorBase = new Map                           ();
  decoSprites = new PIXI.Container();
  pixTex = new Map                      ();
  wallSprites = new PIXI.Container();
  ownerName = '店主';
  static MANUAL_KEY = 'wjbdy.manual.v1';
          lastW = 0;
          lastH = 0;

  get blocked()          { return this.titleActive || this.creatorPending || !!(this.ui && this.ui.modal); }

  async boot()                {
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
    this.app.stage.addChild(this.stars, this.world, this.labelLayer);
    this.world.addChild(this.floorLayer, this.wallLayer, this.wallSprites, this.decoSprites, this.dirtLayer, this.furnLayer, this.itemLayer, this.actorLayer, this.overlay);
    this.actorLayer.sortableChildren = true;
    for (let i = 0; i < 14; i++) {
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
    const saved = localStorage.getItem(SAVE_KEY);
    this.titleScreen.activate({
      hasSave: validGameSave(saved),
      onInteract: () => this.audio.unlock(),
      onChoose: (action) => this.chooseTitleAction(action),
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

  chooseTitleAction(action        )          {
    this.audio.play('chime', 0.7);
    if (action === 'continue') {
      const saved = localStorage.getItem(SAVE_KEY);
      if (!validGameSave(saved)) return false;
      try {
        this.loadFrom(saved);
        this.sim.manualOwner = this.manualPref();
        this.creatorPending = false;
      } catch (err) {
        localStorage.removeItem(SAVE_KEY);
        return false;
      }
      this.titleActive = false;
      this.ui.root.inert = false;
      this.ui.root.removeAttribute('aria-hidden');
      this.ui.root.style.visibility = '';
      this.audio.playTrack(this.sim.dayActive ? 'bgm' : 'bgm-plan');
      this.audio.playAmb(this.sim.dayActive ? 'amb' : 'amb-night');
      this.ui.render(true);
      return true;
    }
    this.titleActive = false;
    this.ui.root.inert = false;
    this.ui.root.removeAttribute('aria-hidden');
    this.ui.root.style.visibility = '';
    this.newGame();
    return true;
  }

  // ---------- 初始局 ----------
  startCreator()       {
    this.creatorPending = true;
    this.ui.openCreator(defaultAppearance(), '店主', (app, name, sex) => {
      this.newTavern(app, name, sex);
      this.creatorPending = false;
      this.ui.render(true);
    });
  }

  newTavern(app            , name        , sex        )       {
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
    const owner = makeStaff(this.sim.rng, this.sim.id(), true, app, name);
    owner.sex = sex;
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
    this.sim.toast(`${name}接过了钥匙：多元编写旅店，开张了。`);
    this.staticVersion = -1;
    this.cam = { x: 2, y: 3 };
    if (this.ui.compact) this.fitView();
    this.selection = null;
    this.saveMorning();
    this.save();
  }

  // ---------- 存档 ----------
  save()       {
    // 营业中的客人、订单、路径和计时是瞬时状态，当前存档格式有意不保存它们。
    // 因此营业中不覆盖稳定的收盘规划存档；刷新/重开会回到开门前检查点。
    if (!canPersistSim(this.sim)) return false;
    const data = {
      tavern: this.tavern.serialize(), sim: this.sim.serialize(), ownerName: this.ownerName, cam: this.cam, zoom: this.zoom,
    };
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (e) { /* 存储不可用时忽略 */ }
    return true;
  }
  saveMorning()       {
    try { localStorage.setItem(MORNING_KEY, localStorage.getItem(SAVE_KEY) || JSON.stringify({ tavern: this.tavern.serialize(), sim: this.sim.serialize(), ownerName: this.ownerName })); } catch (e) { /* ignore */ }
  }
  hasMorningSave()          { return !!localStorage.getItem(MORNING_KEY); }

  setManualOwner(v         )       {
    this.sim.manualOwner = v;
    this.sim.manualVec.x = 0; this.sim.manualVec.y = 0;
    try { localStorage.setItem(Game.MANUAL_KEY, v ? '1' : '0'); } catch (e) { /* 隐私模式下忽略 */ }
    const own = this.sim.staff.find((x) => x.isOwner);
    if (own) { own.task = null; own.path = []; own.bubble = { text: v ? '听你指挥！' : '我自己忙去', t: 1.6 }; }
    this.sim.toast(v ? '已开启直控：WASD / 方向键 移动店主' : '已关闭直控：店主恢复自动干活，WASD 平移镜头');
  }

  manualPref()          {
    try { return localStorage.getItem(Game.MANUAL_KEY) === '1'; } catch (e) { return false; }
  }

  loadFrom(json        )       {
    const data = JSON.parse(json)     
                                                                                                                        
                                                                                          
                                                                       
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
  }

  newGame()       {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(MORNING_KEY);
    this.ui.closeModal();
    this.tavern = new Tavern();
    this.sim = new Sim(this.tavern, newEcon(Math.floor(Math.random() * 1e9)));
    this.staticVersion = -1;
    this.startCreator();
  }

  loadMorning()       {
    const m = localStorage.getItem(MORNING_KEY);
    if (!m) return;
    this.loadFrom(m);
    this.sim.sealed = false;
    this.sim.econ.strikes = 0;
    this.ui.closeModal();
    this.creatorPending = false;
    this.sim.toast('已读取晨间存档');
    this.save();
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
      this.click(t.x, t.y, e.button === 2);
      // 双击同一格上的员工 → 详情页
      const now = performance.now();
      if (this.lastTap && now - this.lastTap.t < 420 && Math.abs(this.lastTap.x - t.x) <= 1 && Math.abs(this.lastTap.y - t.y) <= 1) {
        this.lastTap = null;
        this.openDetailAt(t.x, t.y);
      } else this.lastTap = { t: now, x: t.x, y: t.y };
    });
    cv.addEventListener('pointercancel', (e) => { this.pointers.delete(e.pointerId); this.drag = null; });
    cv.addEventListener('dblclick', (e) => {
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

  setZoom(z        )       { this.zoom = Math.max(0.5, Math.min(3, Math.round(z * 20) / 20)); }

  /** 小屏竖屏：把整个酒馆收进视野 */
  fitView()       {
    const rs = this.tavern.rooms;
    if (!rs.length) return;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const r of rs) { x0 = Math.min(x0, r.x); y0 = Math.min(y0, r.y); x1 = Math.max(x1, r.x + r.w); y1 = Math.max(y1, r.y + r.h); }
    const wPx = (x1 - x0) * T + 60, hPx = (y1 - y0) * T + 150;
    const vw = this.app.screen.width, vh = this.app.screen.height;
    this.setZoom(Math.min(1, vw / wPx, vh / hPx));
    this.cam = { x: (x0 + x1) / 2, y: (y0 + y1) / 2 - 1 };
  }

  click(x        , y        , right         )       {
    if (right) { this.cancelBuild(); return; }
    if (this.blocked) return;
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
      // 收盘规划期点灶台 → 新菜研发
      if (!this.sim.dayActive && f.kind === 'stove') this.ui.openResearch();
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

  moveFurnId                = null;

  startMoveFurn(id        )       {
    const f = this.tavern.furnById(id);
    if (!f) return;
    this.buildBp = null; this.buildFurn = null;
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
    this.staticVersion = -1;
    this.moveFurnId = null;
    this.selection = { kind: 'furn', id: f.id };
    this.audio.play('place', 0.8);
    this.sim.toast(`${furnDef(f.kind).name}搬好了`);
    this.save();
  }

  startBuildRoom(id        )       {
    if (this.sim.dayActive) { this.sim.toast('营业中不能建造，先完成今天'); this.audio.play('error'); return; }
    this.buildBp = id; this.buildFurn = null; this.buildRot = 0;
  }
  startBuildFurn(kind        , q        )       {
    if (this.sim.dayActive) { this.sim.toast('营业中不能改造，先完成今天'); this.audio.play('error'); return; }
    const sel = this.selection;
    const room = sel && sel.kind === 'room' ? this.tavern.roomById(sel.id)
      : sel && sel.kind === 'furn' ? (() => { const f = this.tavern.furnById(sel.id); return f ? this.tavern.roomOfFurn(f) : null; })() : null;
    const needStar = furnQualityUnlock(kind, q);
    if (this.sim.stars() < needStar) { this.sim.toast(`家具品质 ${'I'.repeat(q)} 需要 ★${needStar}`); this.audio.play('error'); return; }
    if (!room || room.quality < q) { this.sim.toast(`先把当前房间升级到品质 ${'I'.repeat(q)}`); this.audio.play('error'); return; }
    this.buildFurn = kind; this.buildQuality = q; this.buildBp = null; this.buildRot = 0;
  }
  cancelBuild()       {
    if (this.moveFurnId !== null) { this.moveFurnId = null; this.sim.toast('取消搬动'); }
    this.buildBp = null; this.buildFurn = null;
  }

  rotateBuild()       {
    if (this.moveFurnId !== null) this.buildRot = (this.buildRot + 1) % 4;
    else if (this.buildBp) this.buildRot = this.buildRot ? 0 : 1;
    else if (this.buildFurn) this.buildRot = (this.buildRot + 1) % 4;
    else if (this.selection && this.selection.kind === 'furn') this.rotateFurn(this.selection.id);
  }

  tryBuildRoom(x        , y        )       {
    const bp = bpById(this.buildBp          );
    const check = this.tavern.canPlaceRoom(bp, x, y, this.buildRot);
    if (!check.ok) { this.sim.toast(check.reason); this.audio.play('error'); return; }
    if (this.sim.econ.coins < bp.cost) { this.sim.toast('界币不足'); this.audio.play('error'); return; }
    this.sim.econ.coins -= bp.cost;
    const room = this.tavern.placeRoom(bp, x, y, this.buildRot);
    this.sim.toast(`${ROOM_LABEL[bp.kind]}落位（-${bp.cost}）`);
    this.audio.play('build');
    for (let i = 0; i < 14; i++) this.sim.fx.push({ x: room.x + Math.random() * room.w, y: room.y + Math.random() * room.h, t: 0.5 + Math.random() * 0.3, kind: 'spark' });
    this.selection = { kind: 'room', id: room.id };
    this.save();
  }

  tryBuildFurn(x        , y        )       {
    const kind = this.buildFurn          ;
    const def = furnDef(kind);
    const cost = def.cost[this.buildQuality - 1];
    const check = this.tavern.canPlaceFurn(kind, x, y, this.buildRot);
    if (!check.ok) { this.sim.toast(check.reason); this.audio.play('error'); return; }
    if (this.sim.econ.coins < cost) { this.sim.toast('界币不足'); this.audio.play('error'); return; }
    this.sim.econ.coins -= cost;
    const f = this.tavern.placeFurn(kind, x, y, this.buildRot, this.buildQuality);
    this.audio.play('place');
    this.selection = { kind: 'furn', id: f.id };
    this.save();
  }

  openDay()       {
    if (this.sim.sealed) { this.sim.toast('酒馆已被封印'); return; }
    if (this.sim.dayActive) return;
    const hasSeats = this.tavern.allTables().some((t) => this.tavern.tableSeats(t).length > 0);
    const hasStorage = this.tavern.furnsOfKind('shelf').length > 0 || this.tavern.furnsOfKind('icebox').length > 0;
    const hasFoodLine = this.tavern.rooms.some((r) => r.kind === 'kitchen')
      && this.tavern.furnsOfKind('stove').length > 0 && this.tavern.furnsOfKind('pass').length > 0;
    const hasDrinkLine = this.tavern.rooms.some((r) => r.kind === 'bar') && this.tavern.furnsOfKind('keg').length > 0;
    const missing = [];
    if (!this.tavern.furnsOfKind('desk').length) missing.push('前台柜台');
    if (!hasSeats) missing.push('餐桌和朝向餐桌的椅子');
    if (!hasStorage) missing.push('储物架或冰柜');
    if (!hasFoodLine && !hasDrinkLine) missing.push('完整厨房（灶台、出餐台）或吧台（酒桶）');
    if (!this.tavern.furnsOfKind('sink').length) missing.push('水槽');
    if (missing.length) {
      this.sim.toast(`无法开门：缺少${missing.join('、')}`);
      this.audio.play('error');
      return;
    }
    this.cancelBuild();
    this.save();
    this.saveMorning();
    this.sim.openDay();
    this.paused = false;
    this.audio.play('portal');
    this.audio.playTrack('bgm');
    this.audio.playAmb('amb');
    this.audio.setMusicLevel(0.4);
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
  setPrio(id        , p        )       {
    const s = this.sim.staff.find((x) => x.id === id);
    if (s) { s.prio = Math.max(0, Math.min(3, p)); this.save(); }
  }
  setWage(id        , w        )       {
    const s = this.sim.staff.find((x) => x.id === id);
    if (s) { s.wage = Math.max(5, w); this.save(); }
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
    this.save();
  }
  removeFurn(id        )       {
    if (this.sim.dayActive) { this.sim.toast('营业中不能拆除家具'); this.audio.play('error'); return; }
    const f = this.tavern.furnById(id);
    if (!f) return;
    this.sim.econ.coins += Math.round(furnDef(f.kind).cost[f.quality - 1] * 0.7);
    this.tavern.removeFurn(id);
    this.selection = null;
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
    const cost = ING_PRICE[k] * n;
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
      this.sim.manualVec.x = (right ? 1 : 0) - (left ? 1 : 0);
      this.sim.manualVec.y = (down ? 1 : 0) - (up ? 1 : 0);
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
    // 灯光动效：火苗快速闪烁、灯带缓慢呼吸、灶台无人时只剩余烬
    this.glowT = (this.glowT || 0) + dt;
    for (const ga of this.glowAnims) {
      const busy = ga.furn ? !!(this.tavern.furnById(ga.furn) || {}).busyBy : true;
      const t = this.glowT * ga.speed + ga.phase;
      const flick = Math.sin(t) * 0.5 + Math.sin(t * 2.7 + 1.3) * 0.3 + Math.sin(t * 6.1 + 0.7) * 0.2;
      ga.sp.alpha = Math.max(0.03, (ga.base + flick * ga.amp) * (busy ? 1 : 0.35));
    }
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

  drawStars()       {
    const g = this.stars;
    g.clear();
    const w = this.app.renderer.width, h = this.app.renderer.height;
    g.rect(0, 0, w, h).fill(hexToNum(PAL.voidBg));
    const rng = new Rng(4242);
    for (let i = 0; i < 150; i++) {
      const x = rng.next() * w, y = rng.next() * h;
      const s = rng.chance(0.15) ? 2 : 1;
      g.rect(Math.round(x), Math.round(y), s, s).fill(rng.chance(0.2) ? hexToNum(PAL.cyan) : hexToNum(PAL.star));
    }
  }

  render()       {
    const zoom = this.zoom;
    if (this.app.renderer.width !== this.lastW || this.app.renderer.height !== this.lastH) {
      this.lastW = this.app.renderer.width; this.lastH = this.app.renderer.height;
      this.drawStars();
    }
    this.world.scale.set(zoom);
    this.world.x = Math.round(this.app.renderer.width / 2 - this.cam.x * T * zoom);
    this.world.y = Math.round(this.app.renderer.height / 2 - this.cam.y * T * zoom);

    if (this.staticVersion !== this.tavern.version) { this.rebuildStatic(); this.staticVersion = this.tavern.version; }
    this.rebuildDirt();
    this.renderActors();
    this.renderItems();
    this.renderOverlay();
    // 音乐层：营业中提高
    this.audio.setMusicLevel(this.sim.dayActive ? 0.36 : 0.2);
  }

  rebuildStatic()       {
    this.floorLayer.removeChildren();
    this.furnLayer.removeChildren();
    const wall = this.wallLayer;
    wall.clear();
    this.wallSprites.removeChildren();
    this.decoSprites.removeChildren();
    this.glowAnims = [];
    this.furnAnims = [];
    const floorTex = (name        , v        )               => {
      const key = `f|${name}|${v}`;
      let tex = this.pixTex.get(key);
      if (!tex) { tex = texFromCanvas(floorVariant(name, v, this.floorBase.get(name) || null).canvas); this.pixTex.set(key, tex); }
      return tex;
    };
    const rugTex = (edge        , accent        , body        , seed        )               => {
      const key = `r|${edge}|${accent}|${body}|${seed}`;
      let tex = this.pixTex.get(key);
      if (!tex) { tex = texFromCanvas(rugTile(edge, accent, body, seed).canvas); this.pixTex.set(key, tex); }
      return tex;
    };
    const glowTex = (r        , c        )               => {
      const key = `g|${r}|${c}`;
      let tex = this.pixTex.get(key);
      if (!tex) { tex = texFromCanvas(glowPix(r, c).canvas); this.pixTex.set(key, tex); }
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
          const sp = new PIXI.Sprite(floorTex(name, v));
          if (name === 'floor-tatami' && ((x + y) & 1)) {
            // 榻榻米经典铺法：相邻格织向转 90°（贴图四边对称，旋转不破缝）
            sp.anchor.set(0.5);
            sp.rotation = Math.PI / 2;
            sp.x = x * T + T / 2; sp.y = y * T + T / 2;
          } else {
            sp.x = x * T; sp.y = y * T;
            // 房间品质换材质：II 提亮、III 暖金光泽（与厨房棋盘格做通道叠加）
            let tint = (name === 'floor-kitchen' && ((x + y) & 1)) ? 0xE4EAF0 : 0xFFFFFF;
            const qt = r.quality >= 3 ? 0xFFF0D2 : r.quality >= 2 ? 0xFBF6EA : 0xFFFFFF;
            tint = (((tint >> 16 & 255) * (qt >> 16 & 255) / 255) << 16) | (((tint >> 8 & 255) * (qt >> 8 & 255) / 255) << 8) | Math.round((tint & 255) * (qt & 255) / 255);
            if (tint !== 0xFFFFFF) sp.tint = tint;
          }
          this.floorLayer.addChild(sp);
        }
      }
      // 地毯：酒吧/休息室/餐饮房间内缩一格铺一张，边饰自动拼接
      const baseRug = RUG[r.kind];
      const rug                               = baseRug && stl.trim
        ? [stl.trim, mix(stl.wall || '#2A1A22', stl.trim, 0.18)]                    
        : baseRug;
      if (rug && r.w >= 4 && r.h >= 3) {
        const x0 = r.x + 1, y0 = r.y + 1, x1 = r.x + r.w - 2, y1 = r.y + r.h - 2;
        for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
          const edge = (y === y0 ? 1 : 0) | (y === y1 ? 2 : 0) | (x === x0 ? 4 : 0) | (x === x1 ? 8 : 0);
          const sp = new PIXI.Sprite(rugTex(edge, rug[0], rug[1], ((x * 31 + y * 17) % 7)));
          sp.x = x * T; sp.y = y * T;
          sp.alpha = stl.trim ? 0.6 : 0.94;   // 风格房间让地砖纹理透出来，地毯只当一层染色
          this.floorLayer.addChild(sp);
        }
      }
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
    for (const r of this.tavern.rooms) {
      for (let x = r.x; x < r.x + r.w; x++) for (let y = r.y; y < r.y + r.h; y++) {
        const sides                             = [[0, 0, -1], [1, 0, 1], [2, -1, 0], [3, 1, 0]];
        for (const [side, dx, dy] of sides) {
          const nb = this.tavern.roomAt(x + dx, y + dy);
          if (nb && nb.id === r.id) continue;
          if (nb && nb.id < r.id && !isDoor(x, y, x + dx, y + dy)) continue;   // 内墙只画一次
          const horiz = side === 0 || side === 1;
          if (nb && isDoor(x, y, x + dx, y + dy)) {
            const sp = new PIXI.Sprite(doorTex(horiz));
            if (side === 0) { sp.x = x * T; sp.y = y * T - 1; }
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
          this.wallSprites.addChild(sp);
          if (!nb && ((x * 5 + y * 3 + side) % 4 === 0)) {
            const pick = WALL_DECO[r.kind] || WALL_DECO.dining;
            const kindDeco = pick[(x + y + side) % pick.length];
            const d = new PIXI.Sprite(decoTex(kindDeco, horiz));
            d.tint = hexToNum(styleById(this.tavern.roomStyle(r)).furnTint);
            d.anchor.set(0.5);
            if (side === 0) { d.x = x * T + T / 2; d.y = y * T + 4; }
            else if (side === 1) { d.x = x * T + T / 2; d.y = (y + 1) * T - 4; d.scale.y = -1; }
            else if (side === 2) { d.x = x * T + 4; d.y = y * T + T / 2; }
            else { d.x = (x + 1) * T - 4; d.y = y * T + T / 2; d.scale.x = -1; }
            this.decoSprites.addChild(d);
            if (kindDeco === 'sconce') {
              const gl = new PIXI.Sprite(glowTex(20, '#F3B84B'));
              gl.anchor.set(0.5);
              gl.blendMode = 'add';
              gl.alpha = 0.5;
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
      // 房间升级外观：II 级起沿内墙加护墙线条，III 级金色并带角柱（门口留断口）
      if (r.quality >= 2) {
        const col = r.quality >= 3 ? 0xC9922F : 0x8A5A38;
        const hi = r.quality >= 3 ? 0xF3D98A : 0xB5763F;
        const gap = (x        , y        , dx        , dy        )          => isDoor(x, y, x + dx, y + dy);
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
    // 位面门（门厅入口）
    const e = this.tavern.entrance();
    wall.rect(e.x * T + 3, e.y * T - 1, T - 6, 5).fill(hexToNum(PAL.cyan));
    wall.rect(e.x * T + 7, e.y * T - 3, T - 14, 3).fill(hexToNum(PAL.magenta));
    // 家具：和角色同层，按底边 y 排序 —— 站在家具上方（更小的 y）的角色会被家具挡住
    for (const sp of this.furnSprites) sp.destroy();
    this.furnSprites.length = 0;
    for (const f of this.tavern.furns) {
      const fstyle = styleById(this.tavern.roomStyle(this.tavern.roomOfFurn(f)));
      const sp = new PIXI.Sprite(furnTexture(f.kind, f.quality, fstyle.accent));
      // 实例级微色差：同种家具不再千件一面（色相暖冷 4 档抖动）
      const jit = [0xFFFFFF, 0xF7EEE0, 0xFFF6E4, 0xEFF2F4][((f.id * 2654435761) >>> 0) % 4];
      const base = hexToNum(fstyle.furnTint);
      sp.tint = (((base >> 16 & 255) * (jit >> 16 & 255) / 255) << 16) | (((base >> 8 & 255) * (jit >> 8 & 255) / 255) << 8) | Math.round((base & 255) * (jit & 255) / 255);
      const [fw, fh] = furnFootprint(f.kind, f.dir);
      sp.anchor.set(0.5);
      sp.x = (f.x + fw / 2) * T;
      sp.y = (f.y + fh / 2) * T;
      sp.rotation = (f.dir === 0 ? 0 : f.dir === 1 ? Math.PI / 2 : f.dir === 2 ? Math.PI : Math.PI * 1.5);
      // -5：同底边时角色画在家具前面（坐在椅子上、贴着灶台干活）
      sp.zIndex = Math.round((f.y + fh) * 100) - 5;
      this.actorLayer.addChild(sp);
      this.furnSprites.push(sp);
      if (f.kind === 'lamp' || f.kind === 'fireplace' || f.kind === 'lightbar' || f.kind === 'lightcol' || f.kind === 'stove') {
        const warm = f.kind === 'fireplace' ? '#E4732C' : f.kind === 'stove' ? '#E4732C'
          : (f.kind === 'lightbar' || f.kind === 'lightcol') ? fstyle.accent : fstyle.glow;
        const rad = f.kind === 'fireplace' ? 40 : f.kind === 'stove' ? 30 : f.kind === 'lightbar' ? 30 + f.quality * 6 : 26 + f.quality * 4;
        const gl = new PIXI.Sprite(glowTex(rad, warm));
        gl.anchor.set(0.5);
        gl.x = (f.x + fw / 2) * T;
        gl.y = (f.y + fh / 2) * T;
        gl.blendMode = 'add';
        gl.alpha = 0.5;
        this.decoSprites.addChild(gl);
        // 火苗类闪得快而猛，灯带只是呼吸；灶台没人用时只留一点余烬
        const prof = f.kind === 'fireplace' ? { base: 0.5, amp: 0.3, speed: 7 }
          : f.kind === 'stove' ? { base: 0.12, amp: 0.38, speed: 9 }
          : f.kind === 'lamp' ? { base: 0.5, amp: 0.15, speed: 2.2 }
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
        facUse.set(m.id, f.kind);
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
        if (!this.shadowTex) this.shadowTex = texFromCanvas(glowPix(9, '#1A1016').canvas);
        sh = new PIXI.Sprite(this.shadowTex);
        sh.anchor.set(0.5, 0.5);
        this.actorLayer.addChild(sh);
        this.actorShadows.set(id, sh);
      }
      const fk = facUse.get(id);
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
        sp.rotation = -Math.PI / 2;
        sp.scale.set(ACTOR_S, ACTOR_S);
        sp.y = (c.y + 0.6) * T + Math.sin(animT * 1.6) * 1.2;
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
      sh.scale.set(1.1, 0.4);
      sh.alpha = 0.3;
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
    let li = 0;
    // 标签在屏幕空间（不随缩放模糊）
    const label = (text        , wx        , wy        , color = 0xffe6b0)       => {
      if (li >= this.labels.length) return;
      const t = this.labels[li++];
      t.text = text;
      t.x = Math.round(this.world.x + wx * this.zoom);
      t.y = Math.round(this.world.y + wy * this.zoom);
      t.visible = true;
      t.style.fill = color === undefined ? 0xffe6b0 : color;
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
      const chk = this.tavern.canPlaceRoom(bp, this.hover.x, this.hover.y, this.buildRot);
      const col = chk.ok ? hexToNum(PAL.acid) : hexToNum(PAL.coral);
      g.rect(this.hover.x * T, this.hover.y * T, w * T, h * T).fill({ color: col, alpha: 0.28 }).stroke({ width: 2, color: col });
      if (!chk.ok) label(chk.reason, this.hover.x * T, this.hover.y * T - 14, 0xff6b5a);
      else label(`${bp.name} -${bp.cost}`, this.hover.x * T, this.hover.y * T - 14, 0x8ddb4a);
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
      if (s.bubble) label(s.bubble.text, cx - 8, cy - 46, 0xfff3a8);
      else if (s.task && s.actT > 0) label(s.task.label, cx - 10, cy - 46, 0xffe6b0);
    }

    // 客人耐心环 + 订单气泡
    for (const gr of this.sim.groups) {
      const m = gr.members[0];
      if (!m) continue;
      const cp = this.tavern.clampFeet(m.x, m.y);
      const cx = (cp.x + 0.5) * T, cy = (cp.y + 1) * T;
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
      if ((gr.state === 'wait' || gr.state === 'seating' || gr.state === 'toFac') && gr.leaveReason === '') {
        const w = wantById(gr.want);
        label(`${gr.size}人·${w.bubble}`, cx - 20, cy - 52, gr.state === 'wait' ? 0xf3b84b : 0xffe6b0);
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
