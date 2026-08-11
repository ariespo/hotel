// DOM 覆盖层 UI：顶栏 / 建造 / 员工 / 选中详情 / 事件卡 / 结算 / 捏脸与换装
import {
  ACCENT_COLORS,                  avatarURL, BD_NAMES, BODY_NAMES, CANVAS_H, CANVAS_W, CLOTH_COLORS, cloneApp,
  ACC_NAMES, drawSprite, EYE_COLORS, EYE_NAMES, FACE_NAMES, FRINGE_NAMES, HAIR_COLORS, HAIRLEN_NAMES, HAND_NAMES,
  HT_NAMES, PANTS_NAMES, PRESETS, RACE_NAMES, randomAppearance, SKINS, SOCK_NAMES, THEMES,
} from './chargen.js';
import { Rng } from './pix.js';
import { AI_PRESETS, loadAIConfig, presetById, refreshAIModels, saveAIConfig } from './ai.js';
import { aiConfigured, requestGameAI } from './ai-game.js';
import { loadPromptTasks, PROMPT_TASKS, resetPromptTasks, savePromptTasks } from './prompt-settings.js';
import { canPersistSim } from './save-policy.js';
import {
  AD_REQ_MULT, AD_TIERS, BLUEPRINTS, DISH_FUN, FLAVOR_LABEL, FLAVORS, FURN_DEFS, furnDef, furnQualityUnlock, ING_KEYS, ING_LABEL, ING_PRICE,                        JOB_LABEL, JOBS, STYLES,
  ROOM_LABEL, SKILL_KEYS, SKILL_LABEL, STAR_THRESHOLDS, TRAIT_CHEM, TRAIT_SAME, TRAITS, wantById,
} from './data.js';
import {                                    } from './sim.js';
import {                        } from './world.js';

                       
                           
                                                                                                                                                                                                                                            
                                               
                                                                                           
                                                 
                                  
                                
                               
                      
                                       
                                                    
                          
                          
                      
                             
                             
                                         
                                                            
                                           
                                           
                                    
                                                      
                                     
                                    
                                   
                                   
                                          
                                             
                                           
                                 
                                    
                                                    
                      
                          
                                
                                       
                             
                                      
                            
                   
  

const CSS = `
#ui{position:absolute;inset:0;pointer-events:none;font-size:14px;color:#5A4033;z-index:5}
#ui .pane{pointer-events:auto;background:
  radial-gradient(circle at 9px 9px, #C9922F 0 2px, rgba(0,0,0,0) 2.8px),
  radial-gradient(circle at calc(100% - 9px) 9px, #C9922F 0 2px, rgba(0,0,0,0) 2.8px),
  radial-gradient(circle at 9px calc(100% - 9px), #C9922F 0 2px, rgba(0,0,0,0) 2.8px),
  radial-gradient(circle at calc(100% - 9px) calc(100% - 9px), #C9922F 0 2px, rgba(0,0,0,0) 2.8px),
  #F5E6C8 url('assets/ui-paper2.png');
  background-size:auto,auto,auto,auto,420px;
  border:3px solid #B0895E;border-radius:14px;
  box-shadow:0 5px 14px rgba(90,64,51,.28), inset 0 0 0 1.5px rgba(255,250,235,.7), inset 0 0 18px rgba(150,110,60,.14)}
#ui button{font-family:inherit;font-size:13px;color:#6B4429;background:linear-gradient(rgba(255,250,235,.35), rgba(140,90,40,.14)), #F2D9B8 url('assets/ui-wood.png');background-size:auto,160px;border:2px solid #B98B5E;border-radius:9px;padding:4px 9px;cursor:pointer;box-shadow:0 2px 0 rgba(155,91,60,.45), inset 0 1px 0 rgba(255,255,255,.5);transition:filter .12s}
#ui button:hover{filter:brightness(1.08);border-color:#C97F2B}
#ui button:active{transform:translateY(1px);box-shadow:none}
#ui button.on{background:linear-gradient(rgba(255,255,255,.22), rgba(30,70,20,.18)), #7FB069;color:#FFFBEF;border-color:#5C8749;text-shadow:0 1px 0 rgba(60,40,20,.3);box-shadow:inset 0 2px 4px rgba(40,70,25,.35)}
#ui button.warn{border-color:#D96A57;color:#C65A48}
#ui button.purchaseConfirm{background:#D88958;color:#FFF8E6;border-color:#A94E3E;filter:brightness(1.08);animation:purchasePulse .7s steps(2,end) infinite}
#ui button:disabled{opacity:.45;cursor:not-allowed}
@keyframes purchasePulse{50%{box-shadow:0 0 0 3px #F3B84B88,inset 0 1px 0 rgba(255,255,255,.5)}}
#top{position:absolute;left:0;right:0;top:0;min-height:38px;display:flex;align-items:center;gap:10px;padding:0 10px;font-size:14px;border-radius:0 0 14px 14px;white-space:nowrap;overflow-x:auto;overflow-y:hidden;
  background:linear-gradient(rgba(255,235,200,.16), rgba(70,40,18,.22)), #D8AE7C url('assets/ui-wood.png');background-size:auto,340px;
  border-color:#8A5A38;box-shadow:0 3px 10px rgba(90,64,51,.35), inset 0 -2px 0 rgba(90,50,20,.25), inset 0 1px 0 rgba(255,245,220,.5)}
#top .dim{color:#8A6A4A}
#top .hi{color:#B45F10}
#top b{color:#6B3F1E}
#top .sep{width:2px;height:22px;background:#D8BC94}
#top b{color:#8A5A38}
#top>*{flex:0 0 auto}
#left{position:absolute;left:8px;top:46px;width:216px;max-height:calc(100% - 150px);overflow:auto;padding:8px}
#right{position:absolute;right:8px;top:46px;width:250px;max-height:calc(100% - 150px);overflow:auto;padding:8px}
#bottom{position:absolute;left:8px;right:8px;bottom:8px;min-height:76px;padding:7px 10px}
.tabs{display:flex;gap:4px;margin-bottom:6px;align-items:center}
.tabs button{flex:1;padding:3px 2px}
.tabs button.fold{flex:0 0 26px;padding:3px 0;color:#8A5A38}
.row{display:flex;justify-content:space-between;align-items:center;gap:6px}
.card{border:2px solid #E3C9A4;border-left:5px solid #C9922F;border-radius:10px;padding:5px 5px 5px 7px;margin-bottom:6px;background:linear-gradient(rgba(255,255,255,.35), rgba(180,130,70,.06)), #FDF1DE;cursor:pointer;box-shadow:inset 0 1px 0 rgba(255,255,255,.6)}
.card:hover{border-color:#C97F2B}
.card.sel{border-color:#7FB069}
.dim{color:#A08064}
.good{color:#6FA05C}.bad{color:#D96A57}.hi{color:#C97F2B}
#ui button.traitTag{padding:1px 6px;border-width:1px;border-radius:999px;font-size:12px;color:#A55D16;background:#FFF3D5;box-shadow:none}
.bar{height:8px;background:#EBD9BC;border-radius:5px;position:relative;overflow:hidden}
.bar i{display:block;height:100%;border-radius:5px;background:#5BB5AB}
img.av{image-rendering:pixelated;border:2px solid #C9A176;border-radius:8px;background:#F0E2C8;object-fit:cover;object-position:50% 0}
img.av.big{height:190px;object-position:50% 4%}
.pstrip{display:flex;gap:4px;flex-wrap:wrap}
.pstrip img{width:44px;height:56px;object-fit:cover;object-position:50% 0;border:2px solid #E3C9A4;border-radius:8px;cursor:pointer;image-rendering:auto}
.pstrip img.on{border-color:#7FB069}
.modal{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#3A2C20B8;pointer-events:auto;z-index:20}
.mbox{background:#F5E6C8 url('assets/ui-paper2.png');background-size:420px;border:3px solid #B0895E;border-radius:16px;box-shadow:0 10px 28px rgba(60,40,25,.45), inset 0 0 0 1.5px rgba(255,250,235,.7), inset 0 0 22px rgba(150,110,60,.16);padding:14px;max-width:min(900px,94vw);max-height:92vh;overflow:auto}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(58px,1fr));gap:3px}
.grid button{padding:2px;font-size:12px;overflow:hidden;white-space:nowrap}
.scoregrid{display:grid;grid-template-columns:repeat(3,minmax(96px,1fr));gap:5px;margin:8px 0}.scoregrid>div{display:flex;justify-content:space-between;gap:8px;background:#E9D4AD88;border:1px solid #C6A87D;border-radius:7px;padding:4px 7px}
.sw{width:22px;height:22px;border:2px solid #B98B5E;border-radius:6px;cursor:pointer;display:inline-block}
.sw.on{border-color:#C97F2B;box-shadow:0 0 0 2px #FFF3D6}
h3{margin:2px 0 6px;font-size:15px;color:#B4722A;border-bottom:2px solid #E8CFA6;padding-bottom:2px}
h3 .dim{font-weight:normal}
.tic{width:15px;height:15px;vertical-align:-2px;margin-right:3px}
.star{color:#D99A3D;text-shadow:0 1px 0 #FFF3D6}
.mbox{position:relative}
.mbox .x{position:absolute;top:8px;right:8px;width:26px;height:26px;padding:0;border-radius:50%;font-size:12px;line-height:1}
#left::-webkit-scrollbar,#right::-webkit-scrollbar,.mbox::-webkit-scrollbar{width:8px}
#left::-webkit-scrollbar-thumb,#right::-webkit-scrollbar-thumb,.mbox::-webkit-scrollbar-thumb{background:#C9A176;border-radius:4px}
#left::-webkit-scrollbar-thumb:hover,#right::-webkit-scrollbar-thumb:hover,.mbox::-webkit-scrollbar-thumb:hover{background:#C97F2B}
#left::-webkit-scrollbar-track,#right::-webkit-scrollbar-track,.mbox::-webkit-scrollbar-track{background:rgba(201,161,118,.18);border-radius:4px}
canvas.prev{image-rendering:pixelated;background:#2A2A44;border:2px solid #C9A176;border-radius:8px}
.toasts{position:absolute;left:50%;transform:translateX(-50%);top:44px;text-align:center}
.toast{background:#F7E9CDEE;border:2px solid #B0895E;border-radius:12px;padding:3px 12px;margin-bottom:4px;display:inline-block;color:#6B4429;box-shadow:0 2px 6px rgba(90,64,51,.25), inset 0 1px 0 rgba(255,255,255,.5)}
#chatter{position:absolute;left:50%;transform:translateX(-50%);bottom:96px;pointer-events:none;display:flex;flex-direction:column;align-items:center;gap:3px;max-width:72vw}
#chatter div{background:#F7E9CDD9;border:2px solid #B0895E;border-radius:12px;padding:2px 12px;color:#6B4429;font-size:13px;box-shadow:0 2px 6px rgba(90,64,51,.18)}
#ui input[type=range]{-webkit-appearance:none;appearance:none;height:26px;background:transparent;cursor:pointer}
#ui input[type=range]::-webkit-slider-runnable-track{height:10px;border-radius:6px;background:#E7D2B2 url('assets/ui-wood.png');background-size:120px;border:1px solid #C9A176;box-shadow:inset 0 1px 3px rgba(90,64,51,.35)}
#ui input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:26px;height:26px;margin-top:-9px;border:none;background:url('assets/ui-knob.png') center/contain no-repeat;filter:drop-shadow(0 2px 2px rgba(90,64,51,.4))}
#ui input[type=range]::-moz-range-track{height:10px;border-radius:6px;background:#E7D2B2;border:1px solid #C9A176;box-shadow:inset 0 1px 3px rgba(90,64,51,.35)}
#ui input[type=range]::-moz-range-thumb{width:26px;height:26px;border:none;background:url('assets/ui-knob.png') center/contain no-repeat}
#ui input[type=text],#ui input[type=url],#ui input[type=password],#ui input:not([type]),#ui select,#ui textarea{font-family:inherit;font-size:13px;color:#5A4033;background:#FFFDF6;border:2px solid #D8BC94;border-radius:8px;padding:3px 7px;box-shadow:inset 0 2px 4px rgba(120,85,45,.18)}
#ui input:focus,#ui select:focus{outline:none;border-color:#C97F2B}
.rail{position:absolute;top:46px;display:flex;flex-direction:column;gap:6px;z-index:6}
#railL{left:8px}
#railR{right:8px}
.rail button{pointer-events:auto;width:44px;height:44px;padding:6px;border-radius:12px;background:#F5E6C8 url('assets/ui-paper2.png');background-size:200px;border:2px solid #B0895E;box-shadow:0 3px 8px rgba(90,64,51,.25), inset 0 1px 0 rgba(255,255,255,.6)}
.rail button:hover{border-color:#C97F2B}
.rail img{width:100%;height:100%;object-fit:contain;display:block}
#scrim{position:fixed;inset:0;background:rgba(40,28,20,.38);z-index:13;display:none;pointer-events:auto}
#ui.compact #top{height:34px;min-height:34px;font-size:12px;gap:6px;padding:0 8px;overflow-x:auto;white-space:nowrap;align-items:center}
#ui.compact #top>*{flex:0 0 auto}
#ui.compact #top b:first-child{display:none}
#ui.compact #top .sep{height:16px}
#ui.compact #left{top:38px;bottom:0;left:0;max-height:none;width:min(78vw,320px);z-index:14;border-radius:0 14px 14px 0}
#ui.compact #right{top:38px;bottom:0;right:0;max-height:none;width:min(78vw,320px);z-index:14;border-radius:14px 0 0 14px}
#ui.compact .rail{top:44px}
#ui.compact .rail button{width:48px;height:48px;border-radius:14px}
#ui.compact #bottom{min-height:0;max-height:28vh;overflow:auto;padding:6px 8px;font-size:13px}
#ui.compact #chatter{bottom:30vh;font-size:12px;max-width:86vw}
#ui.compact .toasts{top:36px;font-size:12px}
#ui.compact .mbox{max-width:96vw;max-height:86vh;padding:12px}
#ui.compact.scrimOn #scrim{display:block}
.prompt-editor{display:block;margin:5px 0 12px;width:100%;min-height:88px;box-sizing:border-box;resize:vertical;line-height:1.55}
.prompt-card{padding:8px 10px;border:2px solid #E3C9A4;border-left:5px solid #8A74B8;border-radius:10px;background:#FFF8E9;margin-top:8px}
.creator-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:8px}.creator-head h3{flex:1;margin:0}.creator-presets,.creator-groups,.creator-cats,.creator-actions{display:flex;gap:5px;flex-wrap:wrap}.creator-presets{margin-bottom:9px}.creator-layout{display:grid;grid-template-columns:minmax(270px,310px) minmax(330px,1fr);gap:12px;align-items:start;min-width:min(820px,88vw)}
.creator-preview{position:sticky;top:-10px;padding:9px;border:2px solid #D5B78B;border-radius:12px;background:#FFF8EAEF;box-shadow:0 4px 12px #684a3022}.creator-preview-art{display:grid;grid-template-columns:minmax(0,1fr) 108px;gap:7px;align-items:start}.creator-preview canvas{width:100%;height:auto;aspect-ratio:16/9}.creator-preview img.big{width:108px;height:144px}.creator-pose{margin:5px 0 7px}.creator-identity{display:grid;grid-template-columns:1fr auto;gap:6px}.creator-identity label{display:flex;align-items:center;gap:5px}.creator-identity input{min-width:0;width:100%;box-sizing:border-box}.creator-summary{margin:7px 0;padding:6px 8px;border-radius:8px;background:#E8D7B788}.creator-editor{min-width:0}.creator-groups{padding-bottom:7px;border-bottom:2px solid #E8CFA6}.creator-cats{margin:7px 0}.creator-cat-lock{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:7px 0}.creator-lock.on{background:#8A74B8!important;color:#fff!important;border-color:#66508F!important}.creator-options{max-height:390px;overflow:auto;padding:3px}.creator-options .sw{width:28px;height:28px}.creator-history button{min-width:34px}.creator-done{width:100%;margin-top:8px;border-color:#8DDB4A!important}
@media(max-width:650px){#ui.compact .mbox:has(#cr){max-width:100vw;width:100vw;max-height:100vh;height:100vh;border-radius:0;padding:10px;box-sizing:border-box}.creator-head{position:sticky;top:-10px;z-index:4;background:#F5E6C8;padding:5px 0}.creator-layout{display:flex;flex-direction:column;min-width:0;width:100%;gap:9px}.creator-preview{position:static;width:100%;box-sizing:border-box}.creator-preview-art{grid-template-columns:minmax(0,1fr) 86px}.creator-preview img.big{width:86px;height:112px}.creator-identity{grid-template-columns:1fr}.creator-groups{position:sticky;top:36px;z-index:3;background:#F5E6C8;padding:7px 0}.creator-groups button{flex:1;min-width:54px}.creator-cats{overflow-x:auto;flex-wrap:nowrap;padding-bottom:3px}.creator-cats button{flex:0 0 auto}.creator-options{max-height:none;overflow:visible}.creator-presets{overflow-x:auto;flex-wrap:nowrap}.creator-presets button{flex:0 0 auto}}
`;

function el(html        )              {
  const d = document.createElement('div');
  d.innerHTML = html.trim();
  return d.firstElementChild               ;
}

const ORDER_STAGE                         = {
  queued: '排队', prep: '备餐', cook: '下锅', ready: '待上菜', served: '已上菜', void: '作废',
};

export const PURCHASE_ACTIONS = Object.freeze(['hire', 'uproom', 'upfurn', 'buy', 'rstyle', 'adpost', 'rdgo']);

export function nightInteractionAction(sim       , kind                   , owner       , target       , group        )            {
  if (!sim || sim.dayActive || !owner || !target) return '';
  if (kind === 'guest') return group?.overnight ? 'raid' : '';
  if (kind === 'staff' && target.aff >= 80 && target.age >= 18 && owner.age >= 18) return 'romance';
  return '';
}

function bar(v        , max        , color        )         {
  const pct = Math.max(0, Math.min(100, (v / max) * 100));
  return `<span class="bar" style="display:inline-block;width:64px"><i style="width:${pct}%;background:${color}"></i></span>`;
}

function htmlText(value        )         {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export class UI {
  g         ;
  root             ;
  top             ;
  left             ;
  right             ;
  bottom             ;
  toastBox             ;
  leftTab = 'room';
  rightTab = 'staff';
  modal                     = null;
  aiStaffChatSession = null;
  collapsed = { left: false, right: false };
  compact = false;
          railL             ;
          railR             ;
          chatterBox             ;
          scrim             ;
          acc = 0;
          interactionLock = false;
          interactionRelease = 0;
          purchaseConfirm = null;
          panelHTML = new WeakMap();

  constructor(g         ) {
    this.g = g;
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    this.root = el('<div id="ui"></div>');
    document.body.appendChild(this.root);
    this.top = el('<div id="top" class="pane"></div>');
    this.left = el('<div id="left" class="pane"></div>');
    this.right = el('<div id="right" class="pane"></div>');
    this.bottom = el('<div id="bottom" class="pane"></div>');
    this.toastBox = el('<div class="toasts"></div>');
    this.chatterBox = el('<div id="chatter"></div>');
    this.railL = el('<div id="railL" class="rail"></div>');
    this.railR = el('<div id="railR" class="rail"></div>');
    this.scrim = el('<div id="scrim"></div>');
    this.root.append(this.top, this.left, this.right, this.bottom, this.toastBox, this.chatterBox, this.railL, this.railR, this.scrim);
    this.scrim.addEventListener('click', () => { this.collapsed.left = this.collapsed.right = true; this.render(true); });
    // 小屏/竖屏：抽屉式侧栏，进入时双栏折起、视野适配整店
    const mm = window.matchMedia('(max-width: 1040px)');
    const applyMM = ()       => {
      const was = this.compact;
      this.compact = mm.matches;
      this.root.classList.toggle('compact', this.compact);
      if (this.compact && !was) {
        this.collapsed.left = this.collapsed.right = true;
        if (this.g.sim) this.g.fitView();
      }
      this.render(true);
    };
    this.compact = mm.matches;
    this.root.classList.toggle('compact', this.compact);
    if (mm.addEventListener) mm.addEventListener('change', applyMM);
    // 侧栏折叠状态：窄屏默认折起，玩家选择持久化
    try {
      const pref = JSON.parse(localStorage.getItem('wjbdy.ui.v1') || 'null');
      if (this.compact) this.collapsed = { left: true, right: true };
      else if (pref) this.collapsed = { left: !!pref.left, right: !!pref.right };
      else if (window.innerWidth < 900) this.collapsed = { left: true, right: true };
    } catch (err) { /* 读不到就算了 */ }
    this.renderRails();
    // 面板每 0.2 秒刷新一次。按压期间锁住重绘，防止 pointerdown 后原按钮被替换、click 丢失。
    this.root.addEventListener('pointerdown', (e) => {
      if ((e.target               ).closest?.('[data-act]')) {
        clearTimeout(this.interactionRelease);
        this.interactionLock = true;
      }
    }, true);
    const releaseInteraction = () => {
      clearTimeout(this.interactionRelease);
      this.interactionRelease = setTimeout(() => { this.interactionLock = false; this.render(false); }, 0);
    };
    window.addEventListener('pointerup', releaseInteraction, true);
    window.addEventListener('pointercancel', releaseInteraction, true);
    this.root.addEventListener('click', (e) => this.onClick(e));
    this.root.addEventListener('change', (e) => this.onChange(e));
  }

  setPanelHTML(node        , html        )       {
    if (this.panelHTML.get(node) === html) return;
    const top = node.scrollTop, left = node.scrollLeft;
    node.innerHTML = html;
    node.scrollTop = top; node.scrollLeft = left;
    this.panelHTML.set(node, html);
  }

  purchaseKey(t       , act        )         {
    return [act, t.dataset.v || '', t.dataset.n || '', t.dataset.id || '', t.dataset.s || ''].join('|');
  }

  needsPurchaseConfirmation(act        , t       )          {
    if (act === 'rstyle') {
      const room = this.g.tavern.roomById(parseInt(t.dataset.v || '0', 10));
      const style = STYLES.find((item) => item.id === t.dataset.s);
      return !!(room && style && style.cost > 0 && this.g.tavern.roomStyle(room) !== style.id);
    }
    return PURCHASE_ACTIONS.includes(act);
  }

  clearPurchaseConfirmation(refresh = false)       {
    const pending = this.purchaseConfirm;
    if (!pending) return;
    clearTimeout(pending.timer);
    if (pending.element?.isConnected) {
      pending.element.innerHTML = pending.originalHTML;
      pending.element.classList.remove('purchaseConfirm');
      pending.element.removeAttribute('aria-label');
    }
    this.purchaseConfirm = null;
    if (refresh) this.render(true);
  }

  confirmPurchase(t       , act        )          {
    const key = this.purchaseKey(t, act);
    const now = performance.now();
    if (this.purchaseConfirm?.key === key && now < this.purchaseConfirm.expires) {
      this.clearPurchaseConfirmation(false);
      return true;
    }
    this.clearPurchaseConfirmation(false);
    const originalHTML = t.innerHTML;
    t.textContent = `确认购买？ ${t.textContent.trim()}`;
    t.classList.add('purchaseConfirm');
    t.setAttribute('aria-label', '再次点击确认购买；双击可直接购买');
    const pending = { key, element: t, originalHTML, expires: now + 6500, timer: 0 };
    pending.timer = setTimeout(() => this.clearPurchaseConfirmation(true), 6500);
    this.purchaseConfirm = pending;
    this.g.sim.toast('再次单击确认购买；双击可直接购买');
    this.renderToasts();
    return false;
  }

          renderRails()       {
    const btn = (side        , tab        , icon        , name        ) =>
      `<button data-act="rail" data-s="${side}" data-v="${tab}" title="${name}"><img src="assets/${icon}.png" alt="${name}"></button>`;
    this.railL.innerHTML = btn('left', 'room', 'ic-room', '房间') + btn('left', 'furn', 'ic-furn', '家具') + btn('left', 'menu', 'ic-menu', '菜单') + btn('left', 'econ', 'ic-econ', '经营');
    this.railR.innerHTML = btn('right', 'staff', 'ic-staff', '员工') + btn('right', 'guest', 'ic-guest', '客人') + btn('right', 'task', 'ic-econ', '工作') + btn('right', 'log', 'ic-log', '日志');
  }

          applyCollapse()       {
    this.left.style.display = this.collapsed.left ? 'none' : '';
    this.right.style.display = this.collapsed.right ? 'none' : '';
    this.railL.style.display = this.collapsed.left ? '' : 'none';
    this.railR.style.display = this.collapsed.right ? '' : 'none';
    this.root.classList.toggle('scrimOn', this.compact && (!this.collapsed.left || !this.collapsed.right));
    try { localStorage.setItem('wjbdy.ui.v1', JSON.stringify(this.collapsed)); } catch (err) { /* 忽略 */ }
  }

          onClick(e       )       {
    const t = (e.target               ).closest('[data-act]')                      ;
    if (!t) return;
    const act = t.dataset.act          ;
    const v = t.dataset.v || '';
    const g = this.g;
    if (this.needsPurchaseConfirmation(act, t)) {
      if (!this.confirmPurchase(t, act)) return;
    } else this.clearPurchaseConfirmation(false);
    if (act === 'pause') g.setPaused(!g.paused);
    else if (act === 'speed') g.setSpeed(parseInt(v, 10));
    else if (act === 'ltab') { this.leftTab = v; this.render(true); }
    else if (act === 'collapse') { this.collapsed[v                    ] = true; this.render(true); }
    else if (act === 'rail') {
      const side = t.dataset.s === 'right' ? 'right' : 'left';
      if (this.compact) this.collapsed[side === 'left' ? 'right' : 'left'] = true;
      this.collapsed[side] = false;
      if (side === 'left') this.leftTab = v; else this.rightTab = v;
      this.render(true);
    }
    else if (act === 'rtab') { this.rightTab = v; this.render(true); }
    else if (act === 'bp') g.startBuildRoom(v);
    else if (act === 'furn') g.startBuildFurn(v, parseInt(t.dataset.q || '1', 10));
    else if (act === 'cancelbuild') g.cancelBuild();
    else if (act === 'rotate') g.rotateBuild();
    else if (act === 'open') g.openDay();
    else if (act === 'home') { const e = g.tavern.entrance(); g.focusOn(e.x, e.y + 2); }
    else if (act === 'cheat') {
      const e = g.sim.econ;
      e.rep = STAR_THRESHOLDS[5];
      e.coins = 200000;
      g.sim.toast('爽文模式：满星 + 200000 界币，万界任你建');
      g.sim.log.unshift('✨ 爽文降临：星级拉满，界币 200000 到账');
      g.save();
    }
    else if (act === 'heat') g.setHeat(v);
    else if (act === 'selstaff') { g.select('staff', parseInt(v, 10)); const s = g.sim.staff.find((x) => x.id === parseInt(v, 10)); if (s) g.focusOn(s.x, s.y); }
    else if (act === 'selroom') { g.select('room', parseInt(v, 10)); const r = g.tavern.roomById(parseInt(v, 10)); if (r) g.focusOn(r.x + r.w / 2, r.y + r.h / 2); }
    else if (act === 'roomfurn') {
      const id = parseInt(v, 10);
      if (g.tavern.roomById(id)) {
        g.cancelBuild();
        g.select('room', id);
        this.leftTab = 'furn';
        this.collapsed.left = false;
        if (this.compact) this.collapsed.right = true;
      }
    }
    else if (act === 'hire') g.hire(parseInt(v, 10));
    else if (act === 'rotbuild') g.rotateBuild();
    else if (act === 'fire') this.openFireConfirm(parseInt(v, 10));
    else if (act === 'job') g.setJob(parseInt(t.dataset.id          , 10), v       );
    else if (act === 'prio') g.setPrio(parseInt(t.dataset.id          , 10), parseInt(v, 10));
    else if (act === 'wage') g.setWage(parseInt(t.dataset.id          , 10), parseInt(v, 10));
    else if (act === 'sroom') g.setStaffRoom(parseInt(t.dataset.id          , 10), v === 'null' ? null : parseInt(v, 10));
    else if (act === 'uproom') g.upgradeRoom(parseInt(v, 10));
    else if (act === 'moveroom') g.startMoveRoom(parseInt(v, 10));
    else if (act === 'rstyle') g.setRoomStyle(parseInt(v, 10), t.dataset.s          );
    else if (act === 'delroom') g.demolishRoom(parseInt(v, 10));
    else if (act === 'upfurn') g.upgradeFurn(parseInt(v, 10));
    else if (act === 'delfurn') g.removeFurn(parseInt(v, 10));
    else if (act === 'rotfurn') g.rotateFurn(parseInt(v, 10));
    else if (act === 'movefurn') g.startMoveFurn(parseInt(v, 10));
    else if (act === 'buy') g.buyStock(v          , parseInt(t.dataset.n          , 10));
    else if (act === 'menuitem') { const m = g.sim.econ.menu; if (m[v] === false) delete m[v]; else m[v] = false; g.save(); }
    else if (act === 'deldish') { g.sim.deleteCustomDish(v); g.save(); }
    else if (act === 'rding') { this.syncRdName(); const k = v          ; this.rd.ing[k] = Math.max(0, Math.min(4, this.rd.ing[k] + parseInt(t.dataset.d || '0', 10))); this.openResearch(); }
    else if (act === 'rdflavor') { this.syncRdName(); const i = this.rd.flavors.indexOf(v); if (i < 0) this.rd.flavors.push(v); else this.rd.flavors.splice(i, 1); this.openResearch(); }
    else if (act === 'rdfun') { this.syncRdName(); const i = this.rd.fun.indexOf(v); if (i < 0) this.rd.fun.push(v); else this.rd.fun.splice(i, 1); this.openResearch(); }
    else if (act === 'rddrink') { this.syncRdName(); this.rd.drink = !this.rd.drink; this.rd.chefId = 0; this.openResearch(); }
    else if (act === 'rdgo') this.runResearch();
    else if (act === 'dress') this.openWardrobe(parseInt(v, 10));
    else if (act === 'event') { g.resolveEvent(parseInt(v, 10)); }
    else if (act === 'eventcustom') this.runCustomEvent();
    else if (act === 'eventcustomretry') this.runCustomEvent(this.eventCustomContext?.action || '继续处理当前事件');
    else if (act === 'eventback') this.openEvent();
    else if (act === 'airetryevent') {
      if (this.eventAIContext) {
        this.showModal(`<h3>事件结果</h3><div>${htmlText(this.eventAIContext.text)}</div><div class="hi" data-ai-event-status style="margin-top:10px">AI 正在演绎事件结果…</div><div class="row" style="margin-top:8px"><button data-act="closemodal">跳过 AI，继续</button></div>`);
        this.generateAIEventResult();
      }
    }
    else if (act === 'airetryday') {
      if (this.settlementAIStat) { this.renderSettlement(this.settlementAIStat, { loading: true }); this.generateAISettlement(); }
    }
    else if (act === 'aichatsend') this.sendAIStaffChat(parseInt(v, 10));
    else if (act === 'aibg') this.generateAIBackground(parseInt(v, 10));
    else if (act === 'viewbg') this.openAIBackground(parseInt(v, 10));
    else if (act === 'aidishname') this.generateAIDishName();
    else if (act === 'finale') this.openFinale();
    else if (act === 'closemodal') { this.closeModal(); if (!this.g.sim.dayActive) { this.g.audio.playTrack('bgm-plan'); this.g.audio.playAmb('amb-night'); } }
    else if (act === 'newgame') g.newGame();
    else if (act === 'loadmorning') g.loadMorning();
    else if (act === 'savemenu') this.openSaveManager();
    else if (act === 'saveslot') { g.saveToSlot(parseInt(v, 10)); this.openSaveManager(); }
    else if (act === 'loadslot') this.openLoadSlotConfirm(parseInt(v, 10));
    else if (act === 'loadslotgo') g.loadSlot(parseInt(v, 10));
    else if (act === 'help') this.openHelp();
    else if (act === 'prompts') this.openPromptSettings();
    else if (act === 'promptsave') this.savePromptSettings();
    else if (act === 'promptreset') { resetPromptTasks(); this.openPromptSettings('已恢复四项默认任务文本。'); }
    else if (act === 'settings') this.openSettings();
    else if (act === 'aipreset') {
      const current = this.syncAIForm();
      const preset = presetById(v);
      saveAIConfig({ ...current, preset: preset.id, baseUrl: preset.baseUrl || current.baseUrl, model: '', models: [], refreshedAt: 0 });
      this.openSettings();
    }
    else if (act === 'airefresh') this.refreshAISettings();
    else if (act === 'aiclear') {
      const current = this.syncAIForm();
      saveAIConfig({ ...current, apiKey: '', model: '', models: [], refreshedAt: 0 });
      this.openSettings();
    }
    else if (act === 'detail') this.openStaffDetail(parseInt(v, 10));
    else if (act === 'traitinfo') this.openTraitInfo(v, parseInt(t.dataset.id || '0', 10));
    else if (act === 'manage') { g.select('staff', parseInt(v, 10)); this.closeModal(); }
    else if (act === 'dtab') { this.detailTab = v          ; this.openStaffDetail(this.detailId); }
    else if (act === 'chat') {
      if (aiConfigured()) this.openAIStaffChat(this.detailId);
      else { g.sim.chatWith(this.detailId); this.openStaffDetail(this.detailId); }
    }
    else if (act === 'iact') this.runInteract(v, parseInt(t.dataset.id          , 10), t.dataset.k          );
    else if (act === 'nightlocal') this.startNightScene(false);
    else if (act === 'nightai') this.startNightScene(true);
    else if (act === 'nightchoice') {
      const choice = this.nightStoryContext?.result?.choices?.[parseInt(v, 10)];
      if (choice) this.continueNightStory(`${choice.label}（意图：${choice.intent}）`);
    }
    else if (act === 'nightcustom') {
      const input = this.modal?.querySelector('[data-night-input]')                    ;
      const line = input?.value.trim() || '';
      if (line) this.continueNightStory(line); else input?.focus();
    }
    else if (act === 'nightretry') this.continueNightStory(this.nightStoryContext?.lastAction || '继续当前场景');
    else if (act === 'nightexit') { this.nightStoryContext = null; this.closeModal(); }
    else if (act === 'adopen') this.openAdPanel(parseInt(v, 10), true);
    else if (act === 'adtier') { this.adSpec.tier = v; this.openAdPanel(this.adSlot); }
    else if (act === 'adsex') { this.adSpec.sex = v; this.openAdPanel(this.adSlot); }
    else if (act === 'adbias') { this.adSpec.bias = v; this.openAdPanel(this.adSlot); }
    else if (act === 'adpost') { if (g.sim.postAd(parseInt(v, 10), { ...this.adSpec })) { this.closeModal(); g.save(); } else this.openAdPanel(this.adSlot); }
    else if (act === 'adclear') { g.sim.withdrawAd(parseInt(v, 10)); g.save(); }
    else if (act === 'firec') this.openFireConfirm(parseInt(v, 10));
    else if (act === 'firego') { if (g.fire(parseInt(v, 10))) this.closeModal(); }
    else if (act === 'manual') { g.setManualOwner(v === '1'); this.openSettings(); }
    else if (act === 'confirmnew') this.openConfirmRestart();
    this.render(true);
  }

          onChange(e       )       {
    const t = e.target                    ;
    if (t.dataset.act === 'markup') { this.g.setMarkup(parseFloat(t.value)); this.render(true); }
    if (t.dataset.act === 'adrace') { this.adSpec.race = parseInt(t.value, 10); this.openAdPanel(this.adSlot); }
    if (t.dataset.act === 'restock') { this.g.sim.econ.autoRestock = t.checked; this.g.save(); }
    if (t.dataset.act === 'occupant') {
      if (this.g.sim.assignBedroom(parseInt(t.value, 10), parseInt(t.dataset.v || '0', 10))) this.g.save();
      this.render(true);
    }
    if (t.dataset.act === 'volm') this.g.audio.setMusicVol(parseFloat(t.value));
    if (t.dataset.act === 'vols') { this.g.audio.setSfxLevel(parseFloat(t.value)); this.g.audio.play('coin', 0.8); }
    if (['aiurl', 'aikey', 'aimodel'].includes(t.dataset.act)) this.syncAIForm();
    if (t.dataset.act === 'rdchef') { this.syncRdName(); this.rd.chefId = parseInt(t.value, 10); this.openResearch(); }
  }

  tick(dt        )       {
    this.acc += dt;
    if (this.acc > 0.2) { this.acc = 0; this.render(false); }
    this.renderToasts();
    const ch = this.g.sim.chatter;
    const html = ch.map((c) => `<div>${c.text}</div>`).join('');
    if (html !== this.lastChatter) { this.lastChatter = html; this.chatterBox.innerHTML = html; }
  }

          lastChatter = '';

          renderToasts()       {
    const list = this.g.sim.toasts;
    this.toastBox.innerHTML = list.slice(-3).map((t) => `<div class="toast">${t.text}</div>`).join('');
  }

  render(force         )       {
    if (!force && (this.interactionLock || this.purchaseConfirm)) return;
    this.renderTop();
    this.renderLeft();
    this.renderRight();
    this.renderBottom();
    this.applyCollapse();
    if (force) this.renderToasts();
  }

          renderTop()       {
    const g = this.g; const s = g.sim; const e = s.econ;
    const stars = s.stars();
    const nextTh = STAR_THRESHOLDS[Math.min(5, stars + 1)];
    const timePct = s.dayActive ? (s.dayT / 300) * 100 : 0;
    const lowStock = ING_KEYS.filter((k) => e.stock[k] < 10);
    this.setPanelHTML(this.top, `
      <b>多元便携旅店</b>
      <span class="sep"></span>第 ${e.day} 天
      <span>${s.dayActive ? `<span class="hi">营业中·${this.phase()}</span> <span class="bar" style="display:inline-block;width:90px"><i style="width:${timePct}%;background:#F3B84B"></i></span>` : '<span class="dim">收盘规划</span>'}</span>
      <span class="sep"></span>
      <button data-act="pause" class="${g.paused ? 'on' : ''}">${g.paused ? '▶ 继续' : '⏸ 暂停'}</button>
      ${[1, 2, 4].map((n) => `<button data-act="speed" data-v="${n}" class="${g.speed === n && !g.paused ? 'on' : ''}">${n}×</button>`).join('')}
      <span class="sep"></span>
      <span class="hi"><img class="tic" src="assets/ic-econ.png" alt="币">${Math.round(e.coins)}</span>
      <span>声望 <span class="star">${'★'.repeat(stars)}</span><span class="dim">${'☆'.repeat(5 - stars)}</span> ${Math.round(e.rep)}/${nextTh}</span>
      ${s.endingSeen ? '<span class="good">🏆 五星认证</span>' : ''}
      ${e.strikes ? `<span class="bad">封印警告 ${e.strikes}/3</span>` : ''}
      ${lowStock.length ? `<span class="bad">缺料：${lowStock.map((k) => ING_LABEL[k]).join('/')}</span>` : ''}
      <span style="flex:1"></span>
      <button data-act="home">回店</button>
      ${s.dayActive ? '' : '<button data-act="open">开门营业</button>'}
      <button data-act="savemenu">💾 档位 ${this.g.currentSlot}</button>
      <button data-act="help">帮助</button>
      <button data-act="prompts">提示词</button>
      <button data-act="settings">⚙ 设置</button>`);
  }

          phase()         {
    const t = this.g.sim.dayT;
    return t < 45 ? '暖场' : t < 160 ? '上客' : t < 180 ? '低谷' : t < 270 ? '晚高峰' : '收尾';
  }

          renderLeft()       {
    const g = this.g;
    const stars = g.sim.stars();
    let body = '';
    if (this.leftTab === 'room') {
      body = BLUEPRINTS.filter((b) => b.buildable).map((b) => {
        const locked = b.unlock > stars;
        return `<div class="card ${g.buildBp === b.id ? 'sel' : ''}" ${locked ? '' : `data-act="bp" data-v="${b.id}"`}>
          <div class="row"><b>${b.name}</b><span class="${g.sim.econ.coins < b.cost ? 'bad' : 'hi'}">${b.cost}</span></div>
          <div class="dim">${locked ? `★${b.unlock} 解锁` : b.note}</div></div>`;
      }).join('');
      body += `<div class="dim">选中蓝图后在地图上点击落位；R 旋转，Esc 取消。新房间必须与已有房间贴边。</div>`;
    } else if (this.leftTab === 'furn') {
      const sel = g.selection;
      const room = sel && sel.kind === 'room' ? g.tavern.roomById(sel.id)
        : sel && sel.kind === 'furn' ? (() => { const f = g.tavern.furnById(sel.id); return f ? g.tavern.roomOfFurn(f) : null; })() : null;
      if (!room) {
        body = '<h3>布置家具</h3><div class="dim">请先在地图上点击一个具体房间，再查看该房间可以布置的家具。</div>';
      } else {
        const available = FURN_DEFS.filter((f) => f.rooms.includes(room.kind));
        body = `<div class="row"><b>${ROOM_LABEL[room.kind]} #${room.id}</b><span class="dim">可布置 ${available.length} 类</span></div>
          <div class="dim" style="margin-bottom:6px">只显示适用于当前房间的家具；放置后可以继续布置同一房间。</div>`;
        body += available.map((f) => {
          const q = g.buildFurn === f.kind ? g.buildQuality : 1;
          return `<div class="card ${g.buildFurn === f.kind ? 'sel' : ''}">
            <div class="row" data-act="furn" data-v="${f.kind}" data-q="${q}"><b>${f.name}</b><span class="hi">${f.cost[q - 1]}</span></div>
            <div class="dim">${f.note}</div>
            <div class="row">品质 ${[1, 2, 3].map((k) => {
              const needStar = furnQualityUnlock(f.kind, k);
              const locked = stars < needStar || room.quality < k;
              const why = stars < needStar ? `需要 ★${needStar}` : room.quality < k ? `需要房间品质 ${'I'.repeat(k)}` : '';
              return `<button ${locked ? `disabled title="${why}"` : `data-act="furn" data-v="${f.kind}" data-q="${k}"`} class="${g.buildFurn === f.kind && g.buildQuality === k ? 'on' : ''}">${'I'.repeat(k)}${locked ? '🔒' : ''}</button>`;
            }).join('')}</div>
          </div>`;
        }).join('');
      }
    } else if (this.leftTab === 'menu') {
      const e = g.sim.econ, s = g.sim;
      const group = (drink         , title        )         => {
        const best = s.bestSkill(drink ? 'mix' : 'cook');
        const cards = s.allDishes().filter((d) => d.drink === drink).map((d) => {
          const st = s.dishStatus(d);
          const ing = ING_KEYS.filter((k) => d.ing[k]).map((k) =>
            `<span class="${e.stock[k] >= (d.ing[k] || 0) ? '' : 'bad'}">${ING_LABEL[k]}×${d.ing[k]}</span>`).join(' ');
          const badges           = [];
          if (!st.facility) badges.push(drink ? '需酒吧+酒桶' : '需厨房+灶台+出餐口');
          if (!st.skillOk) badges.push('厨艺不足');
          if (!st.stockOk) badges.push('缺料');
          const fl = (d.flavors || []).map((f) => FLAVOR_LABEL[f] || f).join('/');
          return `<div class="card">
            <div class="row"><b>${d.custom ? '🧪 ' : ''}${d.name}</b><span class="hi">${Math.round(d.price * e.markup)} 币</span></div>
            ${d.description ? `<div class="dim">${htmlText(d.description)}</div>` : ''}
            <div class="dim">${ing}${fl ? ` · 口味 ${fl}` : ''}${d.fun && d.fun.length ? ' · ' + d.fun.map((f) => (DISH_FUN.find((x) => x.id === f) || DISH_FUN[0]).name).join('/') : ''}</div>
            <div class="row"><span class="${st.skillOk ? 'dim' : 'bad'}">${drink ? '调酒' : '厨艺'} ≥${d.skill} · 当前 ${best.value}</span>
              <span><button data-act="menuitem" data-v="${d.id}" class="${st.on ? 'on' : ''}">${st.on ? '供应中' : '已下架'}</button>
              ${d.custom ? `<button data-act="deldish" data-v="${d.id}" class="warn">删</button>` : ''}</span></div>
            ${badges.length && st.on ? `<div class="bad">${badges.join(' · ')}</div>` : ''}
          </div>`;
        }).join('');
        return `<h3>${title} <span class="dim">（${drink ? '调酒' : '厨艺'}最高：${best.name} ${best.value}）</span></h3>` + cards;
      };
      body = `<div class="dim">下架的菜客人不会点；厨艺不足、缺料或缺设施的菜即使上架也做不出来。越贵的菜对厨师要求越高。</div>
        <div class="dim" style="margin:4px 0">🍳 收盘规划时点击厨房的灶台，可以研发新菜。</div>`
        + group(false, '餐食') + group(true, '饮品');
    } else {
      const e = g.sim.econ;
      body = `<h3>库存与定价</h3>` + ING_KEYS.map((k) => `<div class="row"><span>${ING_LABEL[k]} ${e.stock[k]}</span>
        <span><button data-act="buy" data-v="${k}" data-n="20">+20 (${ING_PRICE[k] * 20})</button></span></div>`).join('')
        + `<div class="row" style="margin-top:6px"><span>加价倍率 ${e.markup.toFixed(2)}×</span></div>
           <input data-act="markup" type="range" min="0.8" max="3" step="0.05" value="${e.markup}" style="width:100%">
           <div class="dim">高于 2× 会明显降低味道评价与点单率。</div>
           <label class="row"><span>次日自动补货</span><input data-act="restock" type="checkbox" ${e.autoRestock ? 'checked' : ''}></label>
           <h3 style="margin-top:8px">热图</h3>
           <div class="row">${['off', 'clean', 'traffic'].map((h) => `<button data-act="heat" data-v="${h}" class="${g.heat === h ? 'on' : ''}">${h === 'off' ? '关闭' : h === 'clean' ? '卫生' : '拥堵'}</button>`).join('')}</div>`;
    }
    this.setPanelHTML(this.left, `<div class="tabs">
      ${[['room', '房间', 'ic-room'], ['furn', '家具', 'ic-furn'], ['menu', '菜单', 'ic-menu'], ['econ', '经营', 'ic-econ']].map(([k, n, ic]) => `<button data-act="ltab" data-v="${k}" class="${this.leftTab === k ? 'on' : ''}"><img class="tic" src="assets/${ic}.png" alt="">${n}</button>`).join('')}<button class="fold" data-act="collapse" data-v="left" title="收起左栏">❮</button>
      </div>${body}
      ${g.buildBp || g.buildFurn ? `<div class="row" style="margin-top:6px"><button data-act="rotate">R 旋转</button><button data-act="cancelbuild" class="warn">取消</button></div>` : ''}`);
  }

          renderRight()       {
    const g = this.g; const s = g.sim;
    let body = '';
    if (this.rightTab === 'staff') {
      body = `<div class="dim" style="margin-bottom:4px">员工 ${s.staff.length}/${s.maxStaff()}　1 人 1 间卧室（休息室）</div>`;
      body += s.staff.map((st) => this.staffCard(st)).join('');
      body += '<h3>招募广告（3 个广告位）</h3>' + s.ads.map((ad, i) => {
        if (!ad.spec) {
          return `<div class="card"><div class="row"><b>广告位 ${i + 1}</b><span class="dim">空置</span></div>
            <div class="dim">发布广告才会有人来应聘：价位决定应聘者品质，附加要求可以指定种族/性别/数值偏向。</div>
            <div class="row"><button data-act="adopen" data-v="${i}">发布广告</button></div></div>`;
        }
        const t = s.adTier(ad.spec.tier);
        const req           = [];
        if (ad.spec.race >= 0) req.push(RACE_NAMES[ad.spec.race]);
        if (ad.spec.sex) req.push(ad.spec.sex);
        if (ad.spec.bias) req.push(SKILL_LABEL[ad.spec.bias           ] + '偏向');
        return `<div class="card"><div class="row"><b>广告位 ${i + 1}·${t.name}</b><span class="dim">第${ad.day}天发布</span></div>
          <div class="dim">要求：${req.length ? req.join('·') : '不限'}｜候选 ${ad.cands.length} 人</div>
          ${ad.cands.map((p) => this.candCard(p)).join('')}
          <div class="row"><button data-act="adopen" data-v="${i}">重发广告</button>
            <button data-act="adclear" data-v="${i}" class="warn">撤下</button></div></div>`;
      }).join('');
      if (s.pool.length) {
        body += `<h3>自来应聘（${s.pool.length}）</h3>` + s.pool.map((p) => this.candCard(p)).join('');
      }
    } else if (this.rightTab === 'guest') {
      body = s.groups.length ? s.groups.map((gr) => {
        const pct = Math.round((gr.patience / gr.maxPatience) * 100);
        const o = s.orders.find((x) => x.id === gr.orderId);
        const w = wantById(gr.want);
        const stateTxt = gr.state === 'wait' ? '前台等位' : gr.state === 'seating' ? '自行入座中'
          : gr.state === 'seated' ? '等点单' : gr.state === 'ordered' ? '等菜' : gr.state === 'eating' ? '用餐'
          : gr.state === 'toFac' ? '前往' + w.name : gr.state === 'using' ? (gr.overnight ? '过夜中' : (w.verb || w.name) + '中') : '离店';
        return `<div class="card"><div class="row"><b>${gr.size}人组·${w.name}</b><span class="dim">${stateTxt}</span></div>
        <div class="row">耐心 ${bar(pct, 100, pct > 50 ? '#8DDB4A' : pct > 25 ? '#F3B84B' : '#FF6B5A')}</div>
        <div class="dim">${gr.members.map((m) => m.race).join('/')}${o ? ' · ' + (g.sim.dishOf(o.dishId).name || '') + '（' + ORDER_STAGE[o.stage] + '）' : ''}</div></div>`;
      }).join('') : '<div class="dim">店里还没有客人。</div>';
    } else if (this.rightTab === 'task') {
      const queue = s.workQueue();
      const waiting = queue.filter((x) => !x.staff).length;
      body = `<div class="row"><b>工作队列</b><span class="${waiting ? 'bad' : 'good'}">待领取 ${waiting}</span></div>`;
      body += queue.length ? queue.map((q) => `<div class="card">
        <div class="row"><b>${q.label}</b><span class="${q.staff ? 'good' : 'bad'}">${q.status}</span></div>
        <div class="dim">${q.staff ? `认领：${q.staff}` : q.reason}${q.age >= 1 ? ` · 等待 ${Math.round(q.age)} 秒` : ''}</div>
      </div>`).join('') : '<div class="dim">目前没有积压工作。</div>';
    } else {
      body = s.log.length ? s.log.slice(0, 24).map((l) => `<div class="dim">· ${l}</div>`).join('') : '<div class="dim">暂无记录。</div>';
    }
    this.setPanelHTML(this.right, `<div class="tabs">
      ${[['staff', '员工', 'ic-staff'], ['guest', '客人', 'ic-guest'], ['task', '工作', 'ic-econ'], ['log', '日志', 'ic-log']].map(([k, n, ic]) => `<button data-act="rtab" data-v="${k}" class="${this.rightTab === k ? 'on' : ''}"><img class="tic" src="assets/${ic}.png" alt="">${n}</button>`).join('')}<button class="fold" data-act="collapse" data-v="right" title="收起右栏">❯</button>
      </div>${body}`);
  }

          candCard(p       )         {
    const bg = p.background;
    return `<div class="card"><div class="row"><img class="av" src="${avatarURL(p.app)}" width="36" height="36">
        <span style="flex:1"><b>${p.name}</b><div class="dim">${p.race}·${p.sex}·${p.age}岁</div></span>
        <span class="hi">日薪${p.wage}</span></div>
      <div class="dim">${SKILL_KEYS.map((k) => `${SKILL_LABEL[k]}${p.skills[k]}`).join(' ')}</div>
      <div class="row" style="justify-content:flex-start;flex-wrap:wrap">${p.traits.map((t) => this.traitTag(t)).join('')}<span class="dim" title="根据综合技能与性格自动规划">自动优先级 ${p.prio}</span></div>
      ${bg ? `<div class="dim">${htmlText(bg.background.slice(0, 56))}${bg.background.length > 56 ? '…' : ''}</div>` : ''}
      <div class="row"><button data-act="hire" data-v="${p.id}">雇用（入职费${p.wage * 3}）</button>
        ${bg ? `<button data-act="viewbg" data-v="${p.id}">查看背景</button>` : aiConfigured() ? `<button data-act="aibg" data-v="${p.id}">AI 生成背景</button>` : ''}</div></div>`;
  }

          staffCard(st       )         {
    const sel = this.g.selection && this.g.selection.kind === 'staff' && this.g.selection.id === st.id;
    const room = st.roomId ? this.g.tavern.roomById(st.roomId) : null;
    return `<div class="card ${sel ? 'sel' : ''}" data-act="selstaff" data-v="${st.id}">
      <div class="row"><img class="av" src="${avatarURL(st.app)}" width="36" height="36">
        <span style="flex:1"><b>${st.name}</b>${st.isOwner ? '<span class="hi">（店主）</span>' : ''}
          <div class="dim">${JOB_LABEL[st.job]}·${room ? ROOM_LABEL[room.kind] : '全店'}</div></span>
      </div>
      <div class="row"><span class="dim">体力</span>${bar(st.needs.stamina, 100, '#8DDB4A')}<span class="dim">士气</span>${bar(st.needs.morale, 100, '#39D7D2')}</div>
      ${st.isOwner ? '' : `<div class="row"><span class="dim">好感</span>${bar(st.aff, 100, this.g.sim.affLevel(st.aff).color)}<span style="color:${this.g.sim.affLevel(st.aff).color}">${this.g.sim.affLevel(st.aff).name}</span></div>`}
      <div class="row"><span class="dim" style="flex:1">${st.task ? '正在：' + st.task.label : st.free ? this.freeLabel(st.free.kind) : st.note || '待命'}</span><button data-act="detail" data-v="${st.id}">详情</button></div></div>`;
  }

  /** 休息室挂名：有住户显示「XX的卧室」 */
          roomName(r      )         {
    if (r.kind === 'lounge' && r.occupant) {
      const st = this.g.sim.staff.find((x) => x.id === r.occupant);
      if (st) return `${st.name}的卧室`;
    }
    return ROOM_LABEL[r.kind];
  }

          freeLabel(kind        )         {
    return { rest: '打烊偷闲：回房休息', cook: '打烊偷闲：厨房研菜', mix: '打烊偷闲：吧台调酒', chat: '打烊偷闲：串门聊天', wander: '打烊偷闲：随便逛逛',
      piano: '打烊偷闲：练琴', tend: '打烊偷闲：照料盆栽', snack: '打烊偷闲：偷吃零嘴',
      read: '打烊偷闲：翻书', tea: '打烊偷闲：泡茶歇脚', groom: '打烊偷闲：对镜梳妆', wait: '打烊偷闲：驻足等人',
      stargaze: '打烊偷闲：观星', game: '打烊偷闲：打电动', brew: '打烊偷闲：鼓捣炼金', watch: '打烊偷闲：看放映', stroll: '打烊偷闲：庭院散步' }[kind] || '打烊偷闲';
  }

          renderBottom()       {
    const g = this.g;
    const sel = g.selection;
    if (g.moveRoomId !== null) {
      const room = g.tavern.roomById(g.moveRoomId);
      this.setPanelHTML(this.bottom, `<b class="hi">移动房间：${room ? this.roomName(room) : ''}</b>
        <div class="dim">R 旋转 ${g.buildRot * 90}°；房间、家具、污渍与房内角色会整体转向。放下后按新共享墙的可用空间居中开门，不沿用旧门；绿色=可放，红色=重叠或无法形成连通门洞。</div>
        <div class="row"><button data-act="rotate">R 旋转</button><button data-act="moveroom" data-v="${g.moveRoomId}" class="warn">取消移动</button></div>`);
      return;
    }
    if (g.buildBp) {
      const b = BLUEPRINTS.find((x) => x.id === g.buildBp);
      this.setPanelHTML(this.bottom, `<b class="hi">建造：${b?.name}</b> ${b?.w}×${b?.h}（旋转 ${g.buildRot ? '是' : '否'}）
        <div class="dim">绿色=可建，红色=不可建。必须与已有房间贴边，系统会在共享边中点自动开门。</div>`);
      return;
    }
    if (g.buildFurn) {
      const d = furnDef(g.buildFurn);
      this.setPanelHTML(this.bottom, `<b class="hi">放置：${d.name} ${'I'.repeat(g.buildQuality)}</b> ${d.note}
        <div class="dim">R 旋转朝向（黄色箭头=使用面，必须留出通道）。椅子必须朝向餐桌。</div>`);
      return;
    }
    if (!sel) {
      this.setPanelHTML(this.bottom, `<div class="dim">左键选择房间/家具/角色；中键或 WASD 平移，滚轮缩放，空格暂停，B 建造，R 旋转，Delete 拆除。</div>`);
      return;
    }
    if (sel.kind === 'staff') { this.setPanelHTML(this.bottom, this.staffDetail(sel.id)); return; }
    if (sel.kind === 'room') { this.setPanelHTML(this.bottom, this.roomDetail(sel.id)); return; }
    if (sel.kind === 'furn') { this.setPanelHTML(this.bottom, this.furnDetail(sel.id)); return; }
    if (sel.kind === 'guest') {
      const gu = this.g.sim.guests.find((x) => x.id === sel.id);
      if (!gu) { this.setPanelHTML(this.bottom, '<div class="dim">客人已离店。</div>'); return; }
      const gr = this.g.sim.groups.find((x) => x.id === gu.groupId);
      this.setPanelHTML(this.bottom, `<div class="row"><img class="av" src="${avatarURL(gu.app)}" width="64" height="64">
        <div style="flex:1"><b>${gu.name}</b> <span class="dim">${gu.race}</span>
        <div class="dim">${gr ? `同行 ${gr.size} 人 · 状态 ${gr.state} · 耐心 ${Math.round(gr.patience)}s · 预算 ${gr.budget}` : ''}</div>
        <div class="dim">口味偏好：${gr ? gr.taste.map((t) => g.sim.dishOf(t).name).join('、') : ''}${gr && gr.flavors && gr.flavors.length ? `（${gr.flavors.map((f) => FLAVOR_LABEL[f] || f).join('/')}党）` : ''}</div></div></div>`);
    }
  }

          staffDetail(id        )         {
    const st = this.g.sim.staff.find((x) => x.id === id);
    if (!st) return '<div class="dim">该员工已不在职。</div>';
    const rooms = this.g.tavern.rooms;
    return `<div class="row" style="align-items:flex-start">
      <img class="av" src="${avatarURL(st.app)}" width="76" height="76">
      <div style="flex:1">
        <div class="row"><b>${st.name}</b><span class="dim">${st.race}·${st.sex}·${st.age}岁·${st.ht}cm/${st.wt}kg·${HT_NAMES[st.app.ht]}${BD_NAMES[st.app.bd]}</span>
        <span>${st.traits.map((t) => this.traitTag(t, st.id)).join('')}</span></div>
        <div class="row" style="flex-wrap:wrap">${SKILL_KEYS.map((k) => `<span>${SKILL_LABEL[k]} ${bar(st.skills[k], 100, '#F3B84B')} ${st.skills[k]}</span>`).join('')}</div>
        <div class="row" style="flex-wrap:wrap"><span>体力${bar(st.needs.stamina, 100, '#8DDB4A')}</span><span>饥饿${bar(st.needs.hunger, 100, '#E45AD1')}</span><span>压力${bar(st.needs.stress, 100, '#FF6B5A')}</span><span>士气${bar(st.needs.morale, 100, '#39D7D2')}</span></div>
        <div class="row" style="flex-wrap:wrap">岗位 ${JOBS.map((j) => `<button data-act="job" data-id="${st.id}" data-v="${j}" class="${st.job === j ? 'on' : ''}">${JOB_LABEL[j]}</button>`).join('')}</div>
        <div class="row" style="flex-wrap:wrap">房间 <button data-act="sroom" data-id="${st.id}" data-v="null" class="${st.roomId ? '' : 'on'}">全店机动</button>
          ${rooms.map((r) => `<button data-act="sroom" data-id="${st.id}" data-v="${r.id}" class="${st.roomId === r.id ? 'on' : ''}">${ROOM_LABEL[r.kind]}#${r.id}</button>`).join('')}</div>
        <div class="row" title="数值越高，空闲时越先领取新任务">抢单优先级 ${[0, 1, 2, 3].map((p) => `<button data-act="prio" data-id="${st.id}" data-v="${p}" class="${st.prio === p ? 'on' : ''}">${p}</button>`).join('')}
          <span>日薪 ${st.wage}</span><button data-act="wage" data-id="${st.id}" data-v="${st.wage + 5}">+5</button><button data-act="wage" data-id="${st.id}" data-v="${Math.max(5, st.wage - 5)}">-5</button>
          <button data-act="dress" data-v="${st.id}">换装</button>
          ${st.isOwner ? '' : `<button data-act="fire" data-v="${st.id}" class="warn">解雇</button>`}</div>
      </div></div>`;
  }

          roomDetail(id        )         {
    const r = this.g.tavern.roomById(id);
    if (!r) return '<div class="dim">房间不存在。</div>';
    const furns = this.g.tavern.furnsIn(r.id);
    const staff = this.g.sim.staff.filter((s) => s.roomId === r.id);
    const upCost = Math.round((r.w * r.h) * 26 * r.quality);
    const slots = Math.floor(r.w * r.h * (0.40 + 0.10 * r.quality));
    const used = furns.reduce((s, f) => s + this.g.tavern.furnTiles(f).length, 0);
    return `<div class="row" style="align-items:flex-start"><div style="flex:1">
      <b>${this.roomName(r)} #${r.id}</b> <span class="dim">${r.w}×${r.h}｜房间品质 ${'I'.repeat(r.quality)}</span>
      ${r.kind === 'lounge' ? `<div class="row"><span class="dim">住户（1 室 1 人）</span>
        <select data-act="occupant" data-v="${r.id}">
          <option value="0" ${!r.occupant ? 'selected' : ''}>空闲</option>
          ${this.g.sim.staff.filter((x) => !x.isOwner).map((x) => `<option value="${x.id}" ${r.occupant === x.id ? 'selected' : ''}>${x.name}</option>`).join('')}
        </select></div>` : ''}
      <div class="row" style="flex-wrap:wrap"><span>清洁 ${bar(r.clean, 100, '#8DDB4A')} ${Math.round(r.clean)}</span>
        <span>维护 ${bar(r.maint, 100, '#39D7D2')} ${Math.round(r.maint)}</span>
        <span>家具槽位 ${used}/${slots}</span></div>
      <div class="dim">家具：${furns.length ? furns.map((f) => furnDef(f.kind).name + '×' + 1).join('、') : '无'}｜驻守：${staff.length ? staff.map((s) => s.name).join('、') : '无'}</div>
      <div class="row" style="flex-wrap:wrap;align-items:center"><span class="dim">装修风格</span>
        ${STYLES.map((st) => {
          const cur = this.g.tavern.roomStyle(r) === st.id;
          const poor = !cur && st.cost > this.g.sim.econ.coins;
          return `<button data-act="rstyle" data-v="${r.id}" data-s="${st.id}" class="${cur ? 'on' : ''}" title="${st.note}${st.charm ? `｜氛围 +${st.charm}` : ''}">${st.name}${st.cost ? `<span class="${poor ? 'bad' : 'dim'}">·${st.cost}</span>` : ''}</button>`;
        }).join('')}
        <span class="dim">氛围 ${this.g.sim.charmIn(r.id).toFixed(2)}/1.60</span></div>
      <div class="row">${r.quality < 3 ? `<button data-act="uproom" data-v="${r.id}">升级房间（${upCost}，+槽位/舒适）</button>` : '<span class="dim">已达最高房间品质</span>'}
        <button data-act="roomfurn" data-v="${r.id}">布置家具</button>
        <button data-act="moveroom" data-v="${r.id}" class="${this.g.moveRoomId === r.id ? 'on' : ''}" ${this.g.sim.dayActive ? 'disabled title="营业结束后才能移动房间"' : ''}>↔ 移动房间</button>
        <button data-act="delroom" data-v="${r.id}" class="warn">拆除（返还70%）</button></div>
    </div></div>`;
  }

          furnDetail(id        )         {
    const f = this.g.tavern.furnById(id);
    if (!f) return '<div class="dim">家具不存在。</div>';
    const d = furnDef(f.kind);
    const upCost = d.cost[Math.min(2, f.quality)] - d.cost[f.quality - 1];
    const dirs = ['南', '西', '北', '东'];
    let extra = '';
    if (f.kind === 'table') extra = `座位 ${this.g.tavern.tableSeats(f).length} 张椅子｜脏盘 ${f.dirty || 0}`;
    if (f.kind === 'pass') extra = `待取餐 ${f.plates || 0}/${(d.cap            )[f.quality - 1]}`;
    if (d.time) extra += `｜处理时长 ${d.time[f.quality - 1]}s`;
    if (d.charm) {
      const room = this.g.tavern.roomOfFurn(f);
      extra += `｜氛围 +${d.charm[f.quality - 1].toFixed(2)}${room ? `（本房间合计 ${this.g.sim.charmIn(room.id).toFixed(2)}/1.60）` : ''}`;
    }
    if (f.kind === 'icebox') extra += '｜同房间灶台优先来这里取料';
    return `<div class="row" style="align-items:flex-start"><div style="flex:1">
      <b>${d.name}</b> <span class="dim">品质 ${'I'.repeat(f.quality)}｜使用面朝${dirs[f.dir]}</span>
      <div class="dim">${d.note}${extra ? '｜' + extra : ''}</div>
      ${this.g.moveFurnId === f.id ? `<div class="hi">搬动中：在同一房间点新位置放下，放下前可随意转向</div>
      <div class="row"><button data-act="rotbuild" class="on">⟳ 转个方向（R）</button><button data-act="movefurn" data-v="${f.id}">取消搬动</button></div>` : ''}
      <div class="row"><button data-act="rotfurn" data-v="${f.id}">R 旋转朝向</button>
        <button data-act="movefurn" data-v="${f.id}" class="${this.g.moveFurnId === f.id ? 'on' : ''}">↔ 移动位置</button>
        ${f.quality < 3 ? (() => {
          const nq = f.quality + 1; const ns = furnQualityUnlock(f.kind, nq); const room = this.g.tavern.roomOfFurn(f);
          const locked = this.g.sim.stars() < ns || !room || room.quality < nq;
          const why = this.g.sim.stars() < ns ? `★${ns} 解锁` : `房间需品质 ${'I'.repeat(nq)}`;
          return locked ? `<button disabled title="${why}">升级（${why}）</button>` : `<button data-act="upfurn" data-v="${f.id}">升级（${upCost}）</button>`;
        })() : '<span class="dim">已满级</span>'}
        <button data-act="delfurn" data-v="${f.id}" class="warn">拆除（返还70%）</button></div>
    </div></div>`;
  }

  // ---------- 模态 ----------
          showModal(inner        , closable = true, preserveAIChat = false)              {
    this.closeModal(preserveAIChat);
    // 必经流程（捏脸）不给 ✕：关了就永远进不了店
    const x = closable ? '<button class="x" data-act="closemodal" title="关闭">✕</button>' : '';
    const m = el(`<div class="modal"><div class="mbox">${x}${inner}</div></div>`);
    this.root.appendChild(m);
    this.modal = m;
    return m;
  }

  closeModal(preserveAIChat = false)       {
    if (!preserveAIChat) this.finishAIStaffChatSession();
    if (this.modal) { this.modal.remove(); this.modal = null; }
  }

  finishAIStaffChatSession()       {
    const session = this.aiStaffChatSession;
    this.aiStaffChatSession = null;
    if (!session || session.exchanges <= 0) return;
    this.g.sim.chatWith(session.id, session.lastReply);
    this.g.save();
  }

  openHelp()       {
    this.showModal(`<h3>怎么玩</h3>
      <div>1. 收盘规划：招人、指派岗位、买料、建造房间与家具。</div>
      <div>2. 点“开门营业”，客人从位面门进来；员工按岗位自动跑迎宾→点单→取料→备餐→烹饪→出餐→上菜→收台→洗盘。</div>
      <div>3. 设备只有<b>使用面可达</b>时才能工作（黄色箭头），椅子必须朝向餐桌。</div>
      <div>4. 一天 5 分钟，可 1×/2×/4× 或暂停。结算支付工资、维护与补货；连续 3 次低于信用线会被位面房东封印。</div>
      <div>5. 声望升星解锁酒吧、休息室与更大房型。</div>
      <div>6. 顶栏“💾 档位”提供 3 个独立档位与主动保存；营业现场不会写入常规档，完成营业后再保存。</div>
      <div>7. 收盘规划时靠近睡着的住店客可进行夜间突袭；员工好感达到至交且双方成年后可发出共度春宵邀请。接入 AI 后可连续推演选项剧情。</div>
      <div>6. 「菜单」页签管理上下架：菜品消耗储备室食材，越贵的菜对厨师的厨艺/调酒要求越高，厨艺不足或缺料时做不出来。</div>
      <div>7. 收盘规划时点击厨房的灶台可以研发新菜：自定配方用量、指派厨师、复合口味与趣味选项，成功后自动上架。</div>
      <div>8. 住宿客入夜后会留在客房过夜（不占用收盘），次日开门统一按住宿价结账离店。</div>
      <div>9. 员工上限＝休息室数量＋店主：1 人 1 间卧室，分房后休息室挂名「XX的卧室」；搬家具时点「转个方向」或按 R 可在放下前转向。</div>
      <div class="row" style="margin-top:8px"><button data-act="closemodal">知道了</button></div>`);
  }

  openEvent()       {
    const s = this.g.sim;
    const card = s.pendingEvent;
    if (!card) return;
    const choices = card.choices.map((c, i) => {
      const chance = s.choiceChance(c);
      const best = c.skill ? s.bestSkill(c.skill) : null;
      const afford = !c.cost || s.econ.coins >= c.cost;
      return `<div class="card"><div class="row"><b>${c.label}</b>
        <span class="${afford ? 'hi' : 'bad'}">${c.cost ? '花费 ' + c.cost : ''}</span></div>
        <div class="dim">${c.note}${best ? `｜检定：${best.name} ${SKILL_LABEL[c.skill          ]} ${best.value} → 成功率 ${chance}%` : ''}</div>
        <button data-act="event" data-v="${i}" ${afford ? '' : 'disabled'}>选择</button></div>`;
    }).join('');
    const custom = aiConfigured() ? `<div class="card" style="border-left-color:#7A4BE0"><b>✦ 自定义处理（AI 推演）</b>
      <div class="dim" style="margin:5px 0 8px">描述店主要采取的行动。AI 会生成成功与失败结果，由游戏检定并在安全范围内结算真实数值。</div>
      <textarea data-event-custom maxlength="300" rows="3" placeholder="例如：让店主先安抚客人，再请最冷静的员工检查异常来源" style="width:100%;box-sizing:border-box"></textarea>
      <div class="row" style="margin-top:8px;justify-content:flex-end"><button data-act="eventcustom">使用 AI 推演</button></div></div>` : '';
    this.showModal(`<h3>⚡ ${card.title}</h3><div style="max-width:520px">${card.text}</div>${choices}${custom}
      <div class="dim">暂停中仍可拖动镜头查看酒馆。</div>`);
  }

  eventAIContext                 = null;
  eventCustomContext             = null;

  eventEffectsText(effects     )         {
    const parts = [];
    const signed = (value) => value > 0 ? `+${value}` : `${value}`;
    if (effects?.coins) parts.push(`界币 ${signed(effects.coins)}`);
    if (effects?.rep) parts.push(`声望 ${signed(effects.rep)}`);
    for (const [key, value] of Object.entries(effects?.stock || {})) if (value) parts.push(`${ING_LABEL[key] || key} ${signed(value)}`);
    if (effects?.cleanliness) parts.push(`平均清洁 ${signed(effects.cleanliness)}`);
    if (effects?.stress) parts.push(`平均压力 ${signed(effects.stress)}`);
    if (effects?.morale) parts.push(`平均士气 ${signed(effects.morale)}`);
    if (effects?.dirt) parts.push(`脏污 ${signed(effects.dirt)} 处`);
    return parts.join('｜') || '无直接数值变化';
  }

  async runCustomEvent(actionOverride = '')       {
    const s = this.g.sim;
    const input = this.modal?.querySelector('[data-event-custom]')                    ;
    const action = String(actionOverride || input?.value || '').trim().slice(0, 300);
    if (!action) { input?.focus(); return; }
    const facts = s.customEventFacts(action);
    if (!facts) return;
    this.eventCustomContext = { action };
    this.showModal(`<h3>✦ AI 正在推演事件</h3><div class="card"><b>玩家行动</b><div>${htmlText(action)}</div></div>
      <div class="hi" style="margin-top:10px">正在分析行动方式、难度、成功与失败结果…</div>
      <div class="dim" style="margin-top:8px">游戏将在 AI 返回后自行检定，并只采用受限制的结构化数值。</div>`);
    const startedModal = this.modal;
    try {
      const plan = await requestGameAI('event_custom', facts);
      if (this.modal !== startedModal) return;
      const resolved = s.resolveCustomEvent(action, plan);
      if (!resolved) { this.openEvent(); return; }
      this.g.save();
      this.eventCustomContext = null;
      const verdict = resolved.success ? '行动成功' : '行动失败';
      this.showModal(`<h3>⚡ ${htmlText(resolved.resultTitle || plan.title)}</h3>
        <div class="row" style="justify-content:flex-start;flex-wrap:wrap"><span class="${resolved.success ? 'good' : 'bad'}"><b>${verdict}</b></span>
        <span class="dim">${SKILL_LABEL[resolved.skill] || resolved.skill}检定：${htmlText(resolved.best?.name || '无人')} ${resolved.best?.value || 0}｜难度 ${resolved.difficulty}｜成功率 ${resolved.chance}%｜掷骰 ${resolved.roll}</span></div>
        <div style="max-width:700px;white-space:pre-wrap;line-height:1.75;margin-top:10px">${htmlText(resolved.narrative)}</div>
        <div class="card" style="margin-top:10px"><b>AI 推演影响</b><div>${htmlText(resolved.impact || '事件告一段落。')}</div>
        <div class="hi" style="margin-top:6px"><b>实际结算：</b>${htmlText(this.eventEffectsText(resolved.effects))}</div>
        <div class="dim" style="margin-top:5px">判定依据：${htmlText(resolved.choiceNote)}</div></div>
        <div class="row" style="margin-top:10px"><button data-act="closemodal">继续营业</button></div>`);
    } catch (err) {
      if (this.modal !== startedModal) return;
      this.showModal(`<h3>自定义事件推演失败</h3><div class="card"><b>玩家行动</b><div>${htmlText(action)}</div></div>
        <div class="bad" style="margin-top:8px">${htmlText(err?.message || '未知错误')}</div>
        <div class="row" style="margin-top:10px"><button data-act="eventcustomretry">重试 AI</button><button data-act="eventback">返回默认选项</button></div>`);
    }
  }

  openEventResult(text        , detail = null)       {
    if (detail && aiConfigured()) {
      this.eventAIContext = { text, detail };
      this.showModal(`<h3>事件结果</h3><div>${htmlText(text)}</div>
        <div class="hi" data-ai-event-status style="margin-top:10px">AI 正在演绎事件结果…</div>
        <div class="row" style="margin-top:8px"><button data-act="closemodal">跳过 AI，继续</button></div>`);
      this.generateAIEventResult();
      return;
    }
    this.showModal(`<h3>事件结果</h3><div style="max-width:480px">${htmlText(text)}</div>
      <div class="row" style="margin-top:8px"><button data-act="closemodal">继续</button></div>`);
  }

  async generateAIEventResult()       {
    const ctx = this.eventAIContext;
    if (!ctx) return;
    const startedModal = this.modal;
    const status = this.modal?.querySelector('[data-ai-event-status]')                    ;
    if (status) { status.className = 'hi'; status.textContent = 'AI 正在演绎事件结果…'; }
    try {
      const result = await requestGameAI('event_result', ctx.detail);
      if (this.modal !== startedModal) return;
      this.showModal(`<h3>⚡ ${htmlText(result.title)}</h3>
        <div style="max-width:680px;white-space:pre-wrap;line-height:1.75">${htmlText(result.narrative)}</div>
        <div class="card" style="margin-top:10px"><b>实际影响</b><div>${htmlText(result.impact)}</div><div class="dim">系统结果：${htmlText(ctx.text)}</div></div>
        <div class="row" style="margin-top:10px"><button data-act="closemodal">继续营业</button></div>`);
    } catch (err) {
      if (this.modal !== startedModal) return;
      this.showModal(`<h3>事件结果</h3><div>${htmlText(ctx.text)}</div>
        <div class="bad" style="margin-top:8px">AI 演绎失败：${htmlText(err?.message || '未知错误')}</div>
        <div class="row" style="margin-top:8px"><button data-act="airetryevent">重试 AI</button><button data-act="closemodal">直接继续</button></div>`);
    }
  }

  personById(id        )               {
    return this.g.sim.staff.find((person) => person.id === id) || this.g.sim.candById(id);
  }

  staffAIFacts(st       , playerText        )         {
    const sim = this.g.sim;
    const owner = sim.staff.find((person) => person.isOwner);
    return {
      world: '万界交汇处的一家奇幻酒馆，角色都是店内真实员工。',
      day: sim.econ.day,
      player: { name: owner?.name || '店主', line: playerText },
      employee: {
        name: st.name, sex: st.sex, age: st.age, race: st.race, job: JOB_LABEL[st.job],
        traits: st.traits.map((id) => { const trait = TRAITS.find((item) => item.id === id); return trait ? { name: trait.name, note: trait.note } : { name: id }; }),
        skills: Object.fromEntries(SKILL_KEYS.map((key) => [SKILL_LABEL[key], st.skills[key]])),
        affinity: { value: Math.round(st.aff), level: sim.affLevel(st.aff).name },
        state: { task: st.task?.label || st.note || '待命', stamina: Math.round(st.needs.stamina), morale: Math.round(st.needs.morale), stress: Math.round(st.needs.stress) },
        background: st.background || null,
      },
      recentConversation: (st.aiChatLog || []).slice(0, 5).reverse(),
    };
  }

  openAIStaffChat(id        , error = '')       {
    const st = this.g.sim.staff.find((person) => person.id === id);
    if (!st || st.isOwner) return;
    if (!aiConfigured()) { this.g.sim.chatWith(id); this.openStaffDetail(id); return; }
    if (!this.aiStaffChatSession || this.aiStaffChatSession.id !== id) {
      this.finishAIStaffChatSession();
      if (st.affCd > 0) { this.openStaffDetail(id); return; }
      this.aiStaffChatSession = { id, exchanges: 0, lastReply: '' };
    }
    const history = (st.aiChatLog || []).slice(0, 6).reverse();
    this.showModal(`<div class="row"><img class="av" src="${avatarURL(st.app)}" width="64" height="64">
        <div style="flex:1"><h3 style="margin:0">和 ${htmlText(st.name)} 聊聊</h3><div class="dim">${htmlText(st.race)}·${JOB_LABEL[st.job]}｜${this.g.sim.affLevel(st.aff).name} ${Math.round(st.aff)}</div></div></div>
      <div style="max-width:680px;max-height:260px;overflow:auto;margin-top:8px">
        ${history.length ? history.map((item) => `<div class="card"><div><b>${htmlText(item.playerName || '店主')}：</b>${htmlText(item.player)}</div><div style="margin-top:4px"><b>${htmlText(st.name)}：</b>${htmlText(item.reply)}</div></div>`).join('') : '<div class="dim">还没有 AI 对话记录。说点什么吧。</div>'}
      </div>
      ${error ? `<div class="bad" style="margin-top:7px">${htmlText(error)}</div>` : ''}
      <textarea id="aiplayerline" maxlength="120" rows="3" placeholder="输入店主想说的话……" style="width:100%;box-sizing:border-box;margin-top:8px"></textarea>
      <div class="row" style="margin-top:8px"><span class="dim">本次会话可连续发送；结束聊天后统一结算一次互动。</span>
        <span><button data-act="aichatsend" data-v="${st.id}">发送</button><button data-act="detail" data-v="${st.id}">结束聊天</button></span></div>`, true, true);
  }

  async sendAIStaffChat(id        )       {
    const st = this.g.sim.staff.find((person) => person.id === id);
    const input = this.modal?.querySelector('#aiplayerline')                    ;
    const line = input?.value.trim() || '';
    if (!st || !line) { if (input) input.focus(); return; }
    const startedModal = this.modal;
    const send = this.modal?.querySelector('[data-act="aichatsend"]')                     ;
    if (send) { send.disabled = true; send.textContent = '等待回复…'; }
    try {
      const result = await requestGameAI('staff_chat', this.staffAIFacts(st, line));
      if (this.modal !== startedModal) return;
      const reply = this.g.sim.showAIChatReply(st.id, result.reply);
      if (!reply) throw new Error('员工现在无法回应');
      if (this.aiStaffChatSession?.id === st.id) {
        this.aiStaffChatSession.exchanges++;
        this.aiStaffChatSession.lastReply = reply;
      }
      const owner = this.g.sim.staff.find((person) => person.isOwner);
      st.aiChatLog = st.aiChatLog || [];
      st.aiChatLog.unshift({ day: this.g.sim.econ.day, playerName: owner?.name || '店主', player: line.slice(0, 120), reply, emotion: result.emotion });
      if (st.aiChatLog.length > 8) st.aiChatLog.pop();
      this.g.save();
      this.openAIStaffChat(id);
    } catch (err) {
      if (this.modal === startedModal) this.openAIStaffChat(id, `AI 回复失败：${err?.message || '未知错误'}`);
    }
  }

  openAIBackground(id        , error = '')       {
    const person = this.personById(id);
    if (!person) return;
    const bg = person.background;
    this.showModal(`<div class="row"><img class="av" src="${avatarURL(person.app)}" width="64" height="64"><div style="flex:1"><h3 style="margin:0">${htmlText(person.name)}的人物背景</h3><div class="dim">${person.race}·${person.sex}·${person.age}岁</div></div></div>
      ${bg ? `<div class="card" style="margin-top:9px"><b>来店之前</b><div style="white-space:pre-wrap;line-height:1.65">${htmlText(bg.background)}</div></div>
        <div class="row"><span class="dim">个人目标</span><span>${htmlText(bg.aspiration)}</span></div>
        <div class="row"><span class="dim">日常习惯</span><span>${htmlText(bg.quirk)}</span></div>` : '<div class="dim" style="margin-top:9px">尚未生成人物背景。</div>'}
      ${error ? `<div class="bad" style="margin-top:7px">${htmlText(error)}</div>` : ''}
      <div class="row" style="margin-top:10px">${aiConfigured() ? `<button data-act="aibg" data-v="${person.id}">${bg ? '重新生成' : 'AI 生成背景'}</button>` : '<span class="dim">请先在设置中接入 AI</span>'}<button data-act="closemodal">关闭</button></div>`);
  }

  async generateAIBackground(id        )       {
    const person = this.personById(id);
    if (!person) return;
    const startedModal = this.showModal(`<h3>正在构思 ${htmlText(person.name)} 的背景…</h3><div class="hi">AI 会严格依据现有属性生成，不改变角色数值。</div><div class="row" style="margin-top:10px"><button data-act="closemodal">取消等待</button></div>`);
    const facts = {
      name: person.name, sex: person.sex, age: person.age, race: person.race,
      traits: person.traits.map((id2) => { const trait = TRAITS.find((item) => item.id === id2); return trait ? { name: trait.name, note: trait.note } : { name: id2 }; }),
      skills: Object.fromEntries(SKILL_KEYS.map((key) => [SKILL_LABEL[key], person.skills[key]])),
      jobInclination: JOB_LABEL[person.job], wage: person.wage,
      world: '角色来自万界之一，正在应聘或供职于跨位面酒馆《多元便携旅店》。',
    };
    try {
      const result = await requestGameAI('staff_background', facts);
      if (this.modal !== startedModal) return;
      person.background = result;
      this.g.save();
      this.openAIBackground(id);
    } catch (err) {
      if (this.modal === startedModal) this.openAIBackground(id, `生成失败：${err?.message || '未知错误'}`);
    }
  }

  detailTab                           = 'info';
  detailId = -1;

  traitTag(id        , staffId = 0)         {
    const trait = TRAITS.find((x) => x.id === id);
    return trait ? `<button class="traitTag" data-act="traitinfo" data-v="${trait.id}" data-id="${staffId}" title="查看性格说明">${trait.name}</button>` : `<span>${id}</span>`;
  }

  openTraitInfo(id        , staffId = 0)       {
    const trait = TRAITS.find((x) => x.id === id);
    if (!trait) return;
    const good           = [];
    const bad           = [];
    for (const [a, b, value] of TRAIT_CHEM) {
      if (a !== id && b !== id) continue;
      const other = a === id ? b : a;
      if (value > 0 && !good.includes(other)) good.push(other);
      if (value < 0 && !bad.includes(other)) bad.push(other);
    }
    const same = TRAIT_SAME[id] !== undefined ? TRAIT_SAME[id] : 1;
    const tags = (ids           ) => ids.length ? ids.map((x) => this.traitTag(x, staffId)).join(' ') : '<span class="dim">暂无明显倾向</span>';
    const back = staffId && this.g.sim.staff.some((s) => s.id === staffId)
      ? `<button data-act="detail" data-v="${staffId}">返回员工</button>` : '';
    this.showModal(`<h3>${trait.name}</h3>
      <div>${trait.note}</div>
      <div class="row" style="justify-content:flex-start;flex-wrap:wrap;margin-top:10px"><span class="good">相性好</span>${tags(good)}</div>
      <div class="row" style="justify-content:flex-start;flex-wrap:wrap;margin-top:7px"><span class="bad">对冲</span>${tags(bad)}</div>
      <div class="dim" style="margin-top:8px">遇到相同性格：${same > 0 ? '更容易合拍' : same < 0 ? '容易互相较劲' : '没有额外影响'}</div>
      <div class="row" style="margin-top:12px">${back}<button data-act="closemodal">关闭</button></div>`);
  }

  openStaffDetail(id        )       {
    // 从 AI 聊天返回详情时先结束会话，让本次统一结算后的冷却立即显示。
    if (this.aiStaffChatSession?.id === id) this.finishAIStaffChatSession();
    const sim = this.g.sim;
    const st = sim.staff.find((x) => x.id === id);
    if (!st) return;
    this.detailId = id;
    const lv = sim.affLevel(st.aff);
    const room = st.roomId ? this.g.tavern.roomById(st.roomId) : null;
    const own = sim.staff.find((x) => x.isOwner);
    const near = !!own && !st.isOwner && Math.hypot(own.x - st.x, own.y - st.y) < 2.2;
    const tabs = [['info', '资料'], ['skill', '技能'], ['rel', '关系']]                      ;
    let body = '';
    if (this.detailTab === 'info') {
      body = `<div class="row" style="flex-wrap:wrap">
          <span class="dim">种族</span><span>${st.race}</span>
          <span class="dim">性别</span><span>${st.sex}</span>
          <span class="dim">年龄</span><span>${st.age}</span>
          <span class="dim">身高/体重</span><span>${st.ht}cm / ${st.wt}kg</span></div>
        <div class="row" style="justify-content:flex-start;flex-wrap:wrap"><span class="dim">性格</span>${st.traits.map((t) => this.traitTag(t, st.id)).join('')}</div>
        <div class="row"><span class="dim">岗位</span><span>${JOB_LABEL[st.job]}</span><span class="dim">负责</span><span>${room ? ROOM_LABEL[room.kind] : '全店'}</span><span class="dim">日薪</span><span class="hi">${st.wage}</span></div>
        <div class="row"><span class="dim">卧室</span><span>${st.isOwner ? '<span class="dim">店主守店</span>' : (() => { const br = sim.bedroomOf(st.id); return br ? `休息室 #${br.id}` : '<span class="bad">无（打地铺）</span>'; })()}</span></div>
        <div class="row"><span class="dim">体力</span>${bar(st.needs.stamina, 100, '#8DDB4A')}<span class="dim">士气</span>${bar(st.needs.morale, 100, '#39D7D2')}</div>
        <div class="row"><span class="dim">压力</span>${bar(st.needs.stress, 100, '#FF6B5A')}<span class="dim">饥饿</span>${bar(st.needs.hunger, 100, '#F3B84B')}</div>
        <div class="dim">${st.task ? '正在：' + st.task.label : st.note || '待命中'}</div>
        ${st.background ? `<div class="card" style="margin-top:7px"><b>人物背景</b><div class="dim">${htmlText(st.background.background)}</div><button data-act="viewbg" data-v="${st.id}">查看完整背景</button></div>` : aiConfigured() && !st.isOwner ? `<button data-act="aibg" data-v="${st.id}" style="margin-top:7px">AI 生成员工背景</button>` : ''}`;
    } else if (this.detailTab === 'skill') {
      body = SKILL_KEYS.map((k) => `<div class="row"><span class="dim" style="width:52px">${SKILL_LABEL[k]}</span>${bar(st.skills[k], 100, '#F3B84B')}<span style="width:56px">${st.skills[k]}<span class="dim">+${Math.floor(st.exp[k] || 0)}</span></span></div>`).join('')
        + `<div class="dim">干活会攒经验，熟练度越高上菜/翻台/清洁越快。好感加成：当前 +${Math.round(st.aff / 4)}% 动作速度。</div>`;
    } else {
      const rels = sim.relsOf(st.id);
      body = `<div class="row"><span class="dim">好感度</span>${bar(st.aff, 100, lv.color)}<span style="color:${lv.color}">${lv.name} ${Math.round(st.aff)}</span></div>
        <div class="dim">已聊 ${st.chats} 次｜第 ${st.hireDay} 天入职｜${st.affCd > 0 ? `再等 ${Math.ceil(st.affCd)} 秒才想聊` : '现在愿意聊两句'}</div>
        <div class="row" style="justify-content:flex-start;flex-wrap:wrap;margin-top:6px"><span class="dim">性格</span>${st.traits.map((t) => this.traitTag(t, st.id)).join('')}</div>
        <h3 style="margin:8px 0 2px">店内关系</h3>
        ${rels.length ? rels.map((r) => {
          const chem = sim.chemistry(st, r.mate);
          const tag = chem >= 3 ? '<span class="hi">·莫逆</span>' : chem >= 1 ? '<span class="dim">·合拍</span>' : chem <= -3 ? '<span class="bad">·犯冲</span>' : chem <= -1 ? '<span class="bad">·不合</span>' : '';
          return `<div class="row"><span style="flex:1">${r.mate.name}<span class="dim">（${JOB_LABEL[r.mate.job]}）</span>${tag}</span><span class="${r.v >= 25 ? 'hi' : r.v <= -25 ? 'bad' : 'dim'}">${sim.relLabel(r.v)} ${Math.round(r.v)}</span></div>`;
        }).join('') : ''}
        ${st.chatLog.length ? `<h3 style="margin:8px 0 2px">互动记录</h3>${st.chatLog.map((l) => `<div class="dim">· ${l}</div>`).join('')}` : ''}`;
    }
    this.showModal(`<div class="row"><img class="av" src="${avatarURL(st.app)}" width="76" height="76">
        <div style="flex:1"><h3 style="margin:0">${st.name}${st.isOwner ? '<span class="hi">（店主）</span>' : ''}</h3>
          <div class="dim">${st.race}·${JOB_LABEL[st.job]}${st.isOwner ? '' : `｜<span style="color:${lv.color}">${lv.name}</span>`}</div></div></div>
      <div class="tabs">${tabs.map(([k, n]) => `<button data-act="dtab" data-v="${k}" class="${this.detailTab === k ? 'on' : ''}">${n}</button>`).join('')}</div>
      ${body}
      <div class="row" style="margin-top:12px">
        ${st.isOwner || !near ? '' : `<button data-act="chat" ${st.affCd > 0 ? 'disabled title="互动冷却中"' : ''}>聊两句</button>`}
        <button data-act="dress" data-v="${st.id}">换装</button>
        ${st.isOwner ? '' : `<button data-act="manage" data-v="${st.id}">岗位与工资</button>`}
        ${st.isOwner ? '' : `<button data-act="firec" data-v="${st.id}" style="border-color:#B33C4E">解雇</button>`}
        <button data-act="closemodal">关闭</button>
      </div>`);
  }

  interactMsg = '';
          interactNear = false;
          interactTimer = 0;

  /** 店主走到伙计/客人身边时弹出的互动面板 */
  openInteract(kind                   , id        , msg = '')       {
    const sim = this.g.sim;
    this.interactMsg = msg;
    const own = sim.staff.find((x) => x.isOwner);
    if (kind === 'staff') {
      const st = sim.staff.find((x) => x.id === id);
      if (!st || st.isOwner) return;
      const d = own ? Math.hypot(own.x - st.x, own.y - st.y) : 99;
      const near = d < 2.8;
      const sameRoom = !!own && this.g.tavern.roomAt(Math.round(own.x), Math.round(own.y))?.id === this.g.tavern.roomAt(Math.round(st.x), Math.round(st.y))?.id;
      const lv = sim.affLevel(st.aff);
      const acts                     = [['chat2', '聊两句'], ['praise', '称赞'], ['urge', '催一催'], ['scold', '贬低']];
      if (sameRoom && nightInteractionAction(sim, 'staff', own, st) === 'romance') acts.push(['romance', '邀请共度春宵']);
      this.showModal(`<div class="row"><img class="av" src="${avatarURL(st.app)}" width="64" height="64">
          <div style="flex:1"><h3 style="margin:0">${st.name}</h3>
            <div class="dim">${st.race}·${JOB_LABEL[st.job]}｜<span style="color:${lv.color}">${lv.name} ${Math.round(st.aff)}</span></div>
            <div class="dim">${st.task ? '正在：' + st.task.label : '待命中'}｜压力 ${Math.round(st.needs.stress)}｜体力 ${Math.round(st.needs.stamina)}</div></div></div>
        <div class="dim" style="margin-top:6px">${near ? '就在你身边，说点什么？' : `太远了（${d.toFixed(1)} 格）：走到 2.8 格内才能搭话。`}${st.affCd > 0 ? `｜深入互动冷却 ${Math.ceil(st.affCd)} 秒` : ''}</div>
        ${this.interactMsg ? `<div class="hi" style="margin-top:8px">${this.interactMsg}</div>` : ''}
        <div class="row" style="margin-top:10px;flex-wrap:wrap">
          ${acts.map(([a, n]) => `<button data-act="iact" data-v="${a}" data-id="${st.id}" data-k="staff" ${near && (!['chat2', 'praise'].includes(a) || st.affCd <= 0) ? '' : 'disabled'}>${n}</button>`).join('')}
        </div>
        <div class="row" style="margin-top:8px">
          <button data-act="detail" data-v="${st.id}">看详情</button>
          <button data-act="closemodal">走开</button>
        </div>`);
      this.watchInteract('staff', id, near);
      return;
    }
    const gu = sim.guests.find((x) => x.id === id);
    const gr = gu ? sim.groupOfGuest(id) : null;
    if (!gu || !gr) return;
    const d = own ? Math.hypot(own.x - gu.x, own.y - gu.y) : 99;
    const near = d < 2.8;
    const sameRoom = !!own && this.g.tavern.roomAt(Math.round(own.x), Math.round(own.y))?.id === this.g.tavern.roomAt(Math.round(gu.x), Math.round(gu.y))?.id;
    const w = wantById(gr.want);
    const pct = Math.round((gr.patience / gr.maxPatience) * 100);
    const cost = 12 + gr.size * 6;
    const acts                     = [['gpraise', '称赞'], ['treat', `请一杯 -${cost}`], ['gmock', '贬低']];
    if (sameRoom && nightInteractionAction(sim, 'guest', own, gu, gr) === 'raid') acts.push(['raid', '进行突袭']);
    this.showModal(`<div class="row"><img class="av" src="${avatarURL(gu.app)}" width="64" height="64">
        <div style="flex:1"><h3 style="margin:0">${gu.name}</h3>
          <div class="dim">${gu.race}·${gr.size}人同行｜需求：${w.name}</div>
          <div class="row"><span class="dim">耐心</span>${bar(gr.patience, gr.maxPatience, pct > 50 ? '#8DDB4A' : pct > 25 ? '#F3B84B' : '#FF6B5A')}<span>${pct}%</span></div></div></div>
      <div class="dim" style="margin-top:6px">${near ? '客人正看着你，要搭话吗？' : `太远了（${d.toFixed(1)} 格）：走到 2.8 格内才能搭话。`}${gr.intCd > 0 ? `｜刚聊过，${Math.ceil(gr.intCd)} 秒后才会再理你` : ''}</div>
      ${this.interactMsg ? `<div class="hi" style="margin-top:8px">${this.interactMsg}</div>` : ''}
      <div class="row" style="margin-top:10px;flex-wrap:wrap">
        ${acts.map(([a, n]) => `<button data-act="iact" data-v="${a}" data-id="${gu.id}" data-k="guest" ${near ? '' : 'disabled'}>${n}</button>`).join('')}
      </div>
      <div class="row" style="margin-top:8px"><button data-act="closemodal">走开</button></div>`);
    this.watchInteract('guest', id, near);
  }

  /** 面板开着时店主走近/走远了就重画一次（按钮的可用状态跟着变） */
          watchInteract(kind                   , id        , near         )       {
    const m = this.modal;
    this.interactNear = near;
    window.clearInterval(this.interactTimer);
    this.interactTimer = window.setInterval(() => {
      if (this.modal !== m) { window.clearInterval(this.interactTimer); return; }
      const own = this.g.sim.staff.find((x) => x.isOwner);
      const tgt = kind === 'staff' ? this.g.sim.staff.find((x) => x.id === id) : this.g.sim.guests.find((x) => x.id === id);
      if (!own || !tgt) { window.clearInterval(this.interactTimer); this.closeModal(); return; }
      const now = Math.hypot(own.x - tgt.x, own.y - tgt.y) < 2.8;
      if (now !== this.interactNear) this.openInteract(kind, id, this.interactMsg);
    }, 260);
  }

  runInteract(action        , id        , kind        )       {
    const sim = this.g.sim;
    let msg = '';
    if (kind === 'staff') {
      if (action === 'romance') { window.clearInterval(this.interactTimer); this.openNightPrompt('romance', 'staff', id); return; }
      if (action === 'chat2') {
        if (aiConfigured()) { window.clearInterval(this.interactTimer); this.openAIStaffChat(id); return; }
        msg = sim.chatWith(id) || '（他正忙着，没接话）';
      }
      else if (action === 'praise') msg = sim.praiseStaff(id);
      else if (action === 'urge') msg = sim.urgeStaff(id);
      else if (action === 'scold') msg = sim.scoldStaff(id);
      this.openInteract('staff', id, msg);
      return;
    }
    const gr = sim.groupOfGuest(id);
    if (!gr) { this.closeModal(); return; }
    if (action === 'raid') { window.clearInterval(this.interactTimer); this.openNightPrompt('raid', 'guest', id); return; }
    if (action === 'gpraise') msg = sim.praiseGuest(gr.id);
    else if (action === 'gmock') msg = sim.mockGuest(gr.id);
    else if (action === 'treat') msg = sim.treatGuest(gr.id);
    this.openInteract('guest', id, msg);
  }

  nightStoryContext                 = null;

  nightTarget(ctx       )             {
    return ctx?.kind === 'staff'
      ? this.g.sim.staff.find((person) => person.id === ctx.id)
      : this.g.sim.guests.find((person) => person.id === ctx?.id);
  }

  openNightPrompt(scene                   , kind                   , id        )       {
    const sim = this.g.sim;
    const owner = sim.staff.find((person) => person.isOwner);
    const target = kind === 'staff' ? sim.staff.find((person) => person.id === id) : sim.guests.find((person) => person.id === id);
    const group = kind === 'guest' ? sim.groupOfGuest(id) : null;
    const ownerRoom = owner ? this.g.tavern.roomAt(Math.round(owner.x), Math.round(owner.y)) : null;
    const targetRoom = target ? this.g.tavern.roomAt(Math.round(target.x), Math.round(target.y)) : null;
    if (sim.dayActive || !owner || !target || !ownerRoom || ownerRoom.id !== targetRoom?.id || Math.hypot(owner.x - target.x, owner.y - target.y) >= 2.8) {
      sim.toast('只能在收盘规划时靠近目标展开夜间互动'); return;
    }
    if (scene === 'raid' && !group?.overnight) { sim.toast('只有已经入睡的住店客可以触发夜间突袭'); return; }
    if (scene === 'romance' && (target.age < 18 || owner.age < 18 || target.aff < 80)) { sim.toast('双方必须成年，且员工好感达到至交后才能发出邀请'); return; }
    this.nightStoryContext = { scene, kind, id, targetName: target.name, turns: [], result: null, lastAction: '' };
    const title = scene === 'raid' ? `夜间突袭 · ${target.name}` : `邀请共度春宵 · ${target.name}`;
    const note = scene === 'raid'
      ? '你准备突然拜访正在客房休息的住店客。对方可能受惊、质问或拒绝交流。'
      : '这是一项私密邀请，而不是命令。只有对方明确接受，剧情才会继续；亲密内容会含蓄带过。';
    this.showModal(`<h3>🌙 ${htmlText(title)}</h3><div>${htmlText(note)}</div>
      <div class="card" style="margin-top:9px"><b>剧情边界</b><div class="dim">所有角色均为成年人；尊重拒绝和边界；不改变经营数值；不描写露骨色情内容。</div></div>
      <div class="row" style="margin-top:10px"><button data-act="nightlocal">使用本地简短演出</button>${aiConfigured() ? '<button data-act="nightai">使用 AI 推演剧情</button>' : '<button data-act="settings">设置 AI 后推演</button>'}<button data-act="nightexit">取消</button></div>`);
  }

  startNightScene(useAI         )       {
    const ctx = this.nightStoryContext;
    const target = this.nightTarget(ctx);
    if (!ctx || !target) { this.closeModal(); return; }
    if (useAI) {
      const action = ctx.scene === 'raid' ? '店主在深夜靠近客房，敲门后表明身份，准备进行一次突然查房。' : `店主私下询问${target.name}是否愿意共度一个亲密而安静的夜晚，并明确表示拒绝也完全没关系。`;
      this.continueNightStory(action);
      return;
    }
    const narrative = ctx.scene === 'raid'
      ? `敲门声惊醒了${target.name}。店主说明来意后，对方裹紧被子，带着戒备确认门锁与房间状况。短暂的查房没有发现异常，店主道歉并退出客房，把安静还给了住店客。`
      : `店主把邀请说出口，也把拒绝的余地完整留给了${target.name}。对方沉默片刻，确认这不是工作命令后才给出自己的回答。两人约定尊重彼此的边界；灯火渐暗，镜头停在门外，只留下低声交谈与温暖的夜色。`;
    this.showModal(`<h3>🌙 ${htmlText(ctx.scene === 'raid' ? '深夜查房' : '灯火之后')}</h3><div style="max-width:720px;white-space:pre-wrap;line-height:1.8">${htmlText(narrative)}</div><div class="row" style="margin-top:10px"><button data-act="nightexit">结束剧情</button></div>`);
  }

  nightStoryFacts(ctx       , action        )       {
    const sim = this.g.sim;
    const owner = sim.staff.find((person) => person.isOwner);
    const target = this.nightTarget(ctx);
    const group = ctx.kind === 'guest' ? sim.groupOfGuest(ctx.id) : null;
    const traits = (person       ) => (person?.traits || []).map((id) => (TRAITS.find((item) => item.id === id) || { name: id }).name);
    return {
      scene: ctx.scene,
      sceneMeaning: ctx.scene === 'raid' ? '夜间突然拜访或查房；不是性行为，也不是暴力袭击' : '成年人之间可拒绝的私密邀请；亲密内容淡出处理',
      location: ctx.kind === 'guest' ? '住店客正在休息的客房' : `${target?.name || '员工'}的员工休息室附近`,
      day: sim.econ.day,
      owner: { name: owner?.name || '店主', adult: (owner?.age || 0) >= 18, age: owner?.age, race: owner?.race, traits: traits(owner) },
      target: ctx.kind === 'staff'
        ? { type: '员工', name: target?.name, adult: (target?.age || 0) >= 18, age: target?.age, sex: target?.sex, race: target?.race, affinity: target?.aff, affinityLevel: sim.affLevel(target?.aff || 0).name, traits: traits(target), background: target?.background || null }
        : { type: '住店客', name: target?.name, adult: true, race: target?.race, sleeping: !!group?.overnight, partySize: group?.size || 1 },
      history: ctx.turns.slice(-8).map((turn) => ({ playerAction: turn.player, summary: turn.summary })),
      playerAction: String(action).slice(0, 240),
      immutable: '本剧情不改变任何经营数值、角色属性或既有事实。',
    };
  }

  renderNightStory(state = {})       {
    const ctx = this.nightStoryContext;
    if (!ctx) return null;
    const result = state.result || ctx.result;
    const history = ctx.turns.length > 1 ? `<details class="card" style="margin-top:8px"><summary>前情摘要（${ctx.turns.length - 1} 段）</summary>${ctx.turns.slice(0, -1).map((turn) => `<div class="dim" style="margin-top:5px">${htmlText(turn.summary)}</div>`).join('')}</details>` : '';
    const body = state.loading ? '<div class="card hi">AI 正在推演下一段剧情，请稍候…</div>'
      : state.error ? `<div class="card"><div class="bad">AI 剧情生成失败：${htmlText(state.error)}</div><button data-act="nightretry">重试本段</button></div>`
        : result ? `<div class="card" style="border-left-color:#7A4BE0"><h3>📖 ${htmlText(result.title)}</h3><div style="white-space:pre-wrap;line-height:1.85;max-width:760px">${htmlText(result.narrative)}</div></div>${history}
          <h3 style="margin-top:10px">接下来怎么做？</h3><div class="row" style="flex-wrap:wrap;justify-content:flex-start">${result.choices.map((choice, i) => `<button data-act="nightchoice" data-v="${i}" title="${htmlText(choice.intent)}">${htmlText(choice.label)}</button>`).join('')}</div>
          <textarea data-night-input maxlength="240" rows="3" placeholder="也可以输入自定义行动或台词……" style="width:100%;box-sizing:border-box;margin-top:8px"></textarea>
          <div class="row" style="margin-top:7px"><span class="dim">选择或输入内容后，AI 会继续保持当前剧情。</span><button data-act="nightcustom">继续自定义剧情</button></div>` : '';
    return this.showModal(`<h3>🌙 ${htmlText(ctx.scene === 'raid' ? '夜间突袭' : '共度春宵邀请')} · ${htmlText(ctx.targetName)}</h3>${body}<div class="row" style="margin-top:10px"><button data-act="nightexit">结束并返回收盘规划</button></div>`);
  }

  async continueNightStory(action        )       {
    const ctx = this.nightStoryContext;
    if (!ctx || !aiConfigured()) { this.startNightScene(false); return; }
    ctx.lastAction = String(action).slice(0, 240);
    const waitingModal = this.renderNightStory({ loading: true });
    try {
      const result = await requestGameAI('night_story', this.nightStoryFacts(ctx, ctx.lastAction));
      if (this.nightStoryContext !== ctx || this.modal !== waitingModal) return;
      ctx.result = result;
      ctx.turns.push({ player: ctx.lastAction, summary: result.summary });
      const records = this.g.sim.econ.aiNightStories = this.g.sim.econ.aiNightStories || [];
      records.push({ day: this.g.sim.econ.day, scene: ctx.scene, target: ctx.targetName, title: result.title, summary: result.summary });
      if (records.length > 24) records.splice(0, records.length - 24);
      this.g.save();
      this.renderNightStory({ result });
    } catch (err) {
      if (this.nightStoryContext === ctx && this.modal === waitingModal) this.renderNightStory({ error: err?.message || '未知错误' });
    }
  }

          adSlot = 0;
          adSpec                                                            = { tier: 'flyer', race: -1, sex: '', bias: '' };

  // ---------- 新菜研发 ----------
          rd = {
    name: '', ing: { grain: 1, veg: 1, meat: 0, spice: 0, ether: 0 }                          ,
    chefId: 0, flavors: []            , fun: []            , drink: false, description: '', msg: '', aiBusy: false,
  };

  /** 重新渲染面板前把菜名输入框的值捞回来（重渲染会重建 DOM） */
          syncRdName()       {
    const inp = document.getElementById('rdname')                           ;
    if (inp) this.rd.name = inp.value;
  }

          rdNameSuggestion()         {
    const ing = this.rd.ing;
    const dom = (['ether', 'spice', 'meat', 'veg', 'grain']            ).reduce((b, k) => ing[k] * ING_PRICE[k] > ing[b] * ING_PRICE[b] ? k : b, 'grain'          );
    const pre                         = { grain: '麦浪', veg: '青灵', meat: '蛮兽', spice: '焰舌', ether: '星髓' };
    const suf = ['杂烩', '特酿', '一锅端', '狂想曲', '惊喜盒子'];
    return pre[dom] + suf[Math.floor(Math.random() * suf.length)];
  }

  /** 新菜研发面板（收盘规划期点厨房灶台打开）：配方用量 + 指派厨师 + 口味多选 + 趣味选项 */
  openResearch()       {
    const s = this.g.sim;
    const rd = this.rd;
    if (!rd.name) rd.name = this.rdNameSuggestion();
    const skillKey = rd.drink ? 'mix' : 'cook';
    if (!rd.chefId || !s.staff.some((x) => x.id === rd.chefId)) {
      let best = 0;
      for (const st of s.staff) if (st.skills[skillKey] > best) { best = st.skills[skillKey]; rd.chefId = st.id; }
    }
    const chef = s.staff.find((x) => x.id === rd.chefId);
    const st = s.dishStats(rd.ing, rd.flavors, rd.fun, rd.drink);
    const total = ING_KEYS.reduce((a, k) => a + rd.ing[k], 0);
    const chance = chef ? Math.max(20, Math.min(98, Math.round(55 + (chef.skills[skillKey] - st.skill) * 1.6))) : 0;
    const stockShort = ING_KEYS.filter((k) => rd.ing[k] > s.econ.stock[k]);
    const canGo = total >= 2 && total <= 10 && rd.flavors.length > 0 && !!chef && !stockShort.length && s.econ.coins >= st.fee;
    this.showModal(`<h3>🍳 新菜研发</h3>
      <div class="dim">试验会消耗配方食材和研发费；厨师${rd.drink ? '调酒' : '厨艺'}越贴近门槛，成功率越高。成功后自动写入菜单。</div>
      <div class="row" style="margin-top:6px"><span class="dim" style="width:56px">菜名</span>
        <input id="rdname" style="flex:1" maxlength="12" value="${rd.name.replace(/"/g, '&quot;')}">
        ${aiConfigured() ? `<button data-act="aidishname" ${rd.aiBusy ? 'disabled' : ''}>${rd.aiBusy ? '取名中…' : 'AI 取名'}</button>` : ''}</div>
      ${rd.description ? `<div class="dim" style="margin-left:62px">${htmlText(rd.description)}</div>` : ''}
      <div class="row"><span class="dim" style="width:56px">品类</span>
        <button data-act="rddrink" class="${rd.drink ? '' : 'on'}">餐食（灶台）</button>
        <button data-act="rddrink" class="${rd.drink ? 'on' : ''}">饮品（酒桶）</button></div>
      <div class="row"><span class="dim" style="width:56px">厨师</span>
        <select data-act="rdchef" style="flex:1">
          ${s.staff.map((x) => `<option value="${x.id}" ${x.id === rd.chefId ? 'selected' : ''}>${x.name} · ${SKILL_LABEL[skillKey]} ${x.skills[skillKey]}</option>`).join('')}
        </select></div>
      <div style="margin-top:6px"><span class="dim">配方用量（0–4 份，共 ${total}/10）</span>
        ${ING_KEYS.map((k) => `<div class="row"><span style="width:56px" class="${s.econ.stock[k] < rd.ing[k] ? 'bad' : ''}">${ING_LABEL[k]}</span>
          <button data-act="rding" data-v="${k}" data-d="-1" style="flex:0 0 36px">−</button><b style="width:20px;text-align:center">${rd.ing[k]}</b><button data-act="rding" data-v="${k}" data-d="1" style="flex:0 0 36px">＋</button>
          <span class="dim">库存 ${s.econ.stock[k]}</span></div>`).join('')}</div>
      <div class="row" style="flex-wrap:wrap;margin-top:6px"><span class="dim" style="width:56px">口味</span>
        ${FLAVORS.map((f) => `<button data-act="rdflavor" data-v="${f.id}" class="${rd.flavors.includes(f.id) ? 'on' : ''}">${f.name}</button>`).join('')}</div>
      <div class="row" style="flex-wrap:wrap"><span class="dim" style="width:56px">趣味</span>
        ${DISH_FUN.map((f) => `<button data-act="rdfun" data-v="${f.id}" class="${rd.fun.includes(f.id) ? 'on' : ''}">${f.name}</button>`).join('')}</div>
      ${rd.fun.length ? `<div class="dim">${DISH_FUN.filter((f) => rd.fun.includes(f.id)).map((f) => `${f.name}：${f.note}`).join('；')}</div>` : ''}
      <div class="card" style="margin-top:8px">
        <div class="row"><span>预计售价</span><span class="hi">${st.price} 币</span></div>
        <div class="row"><span>${rd.drink ? '调酒' : '厨艺'}门槛</span><span class="${chef && chef.skills[skillKey] >= st.skill ? 'hi' : 'bad'}">${st.skill}（${chef ? `${chef.name} ${chef.skills[skillKey]}` : '无人'} → 成功率 ${chance}%）</span></div>
        <div class="row"><span>研发费</span><span class="${s.econ.coins >= st.fee ? '' : 'bad'}">${st.fee} 币</span></div>
        ${stockShort.length ? `<div class="bad">缺料：${stockShort.map((k) => ING_LABEL[k]).join('、')}</div>` : ''}
      </div>
      ${rd.msg ? `<div class="bad" style="margin-top:6px">${rd.msg}</div>` : ''}
      <div class="row" style="margin-top:8px">
        <button data-act="rdgo" ${canGo && !rd.aiBusy ? '' : 'disabled'}>点火研发（-${st.fee}）</button>
        <button data-act="closemodal">收工</button>
      </div>`);
    rd.msg = '';
  }

  async generateAIDishName()       {
    if (this.rd.aiBusy) return;
    this.syncRdName();
    const rd = this.rd;
    const sim = this.g.sim;
    const chef = sim.staff.find((person) => person.id === rd.chefId);
    const stats = sim.dishStats(rd.ing, rd.flavors, rd.fun, rd.drink);
    const facts = {
      category: rd.drink ? '饮品' : '餐食',
      ingredients: ING_KEYS.filter((key) => rd.ing[key] > 0).map((key) => ({ name: ING_LABEL[key], amount: rd.ing[key] })),
      flavors: rd.flavors.map((id) => FLAVOR_LABEL[id] || id),
      features: rd.fun.map((id) => (DISH_FUN.find((item) => item.id === id) || { name: id }).name),
      chef: chef ? { name: chef.name, race: chef.race, skill: chef.skills[rd.drink ? 'mix' : 'cook'] } : null,
      fixedNumbers: { price: stats.price, skillRequirement: stats.skill, researchFee: stats.fee },
      existingMenuNames: sim.allDishes().map((dish) => dish.name),
    };
    rd.aiBusy = true;
    this.openResearch();
    const startedModal = this.modal;
    try {
      const result = await requestGameAI('dish_name', facts);
      rd.name = result.name;
      rd.description = result.description;
      rd.msg = '';
    } catch (err) {
      rd.msg = `AI 取名失败：${err?.message || '未知错误'}`;
    } finally {
      rd.aiBusy = false;
      if (this.modal === startedModal) this.openResearch();
    }
  }

          runResearch()       {
    this.syncRdName();
    const r = this.g.sim.researchDish({ ...this.rd, ing: { ...this.rd.ing } });
    if (r.ok) {
      this.rd = { name: '', ing: { grain: 1, veg: 1, meat: 0, spice: 0, ether: 0 }, chefId: 0, flavors: [], fun: [], drink: false, description: '', msg: '', aiBusy: false };
      this.g.save();
      this.openEventResult(r.msg);
    } else {
      this.rd.msg = r.msg;
      this.openResearch();
    }
  }

  /** 招募广告面板：选价位档 + 附加要求，实时算价 */
  openAdPanel(slot        , reset = false)       {
    const s = this.g.sim;
    this.adSlot = slot;
    if (reset) {
      const cur = s.ads[slot] && s.ads[slot].spec;
      this.adSpec = cur ? { ...cur } : { tier: 'flyer', race: -1, sex: '', bias: '' };
    }
    const spec = this.adSpec;
    const cost = s.adCost(spec);
    const t = s.adTier(spec.tier);
    const afford = s.econ.coins >= cost;
    this.showModal(`<h3>发布招募广告 · 广告位 ${slot + 1}</h3>
      <div class="dim">价位决定应聘者的数值区间与日薪；附加要求越多，广告费越贵。发布后立刻收到 3–5 位符合要求的候选者。</div>
      <div class="row" style="margin-top:8px"><span class="dim" style="width:56px">价位</span>
        ${AD_TIERS.map((x) => `<button data-act="adtier" data-v="${x.id}" class="${spec.tier === x.id ? 'on' : ''}">${x.name} ${x.cost}</button>`).join('')}</div>
      <div class="dim">${t.note}｜数值区间 ${t.lo}–${t.hi}</div>
      <div class="row" style="margin-top:8px"><span class="dim" style="width:56px">种族</span>
        <select data-act="adrace" style="flex:1">
          <option value="-1" ${spec.race < 0 ? 'selected' : ''}>不限（便宜）</option>
          ${RACE_NAMES.map((r, i) => `<option value="${i}" ${spec.race === i ? 'selected' : ''}>${r}</option>`).join('')}
        </select><span class="dim">×${AD_REQ_MULT.race}</span></div>
      <div class="row"><span class="dim" style="width:56px">性别</span>
        ${[['', '不限'], ['女', '女'], ['男', '男']].map(([v, n]) => `<button data-act="adsex" data-v="${v}" class="${spec.sex === v ? 'on' : ''}">${n}</button>`).join('')}
        <span class="dim">×${AD_REQ_MULT.sex}</span></div>
      <div class="row" style="flex-wrap:wrap"><span class="dim" style="width:56px">数值偏向</span>
        <button data-act="adbias" data-v="" class="${spec.bias === '' ? 'on' : ''}">不限</button>
        ${SKILL_KEYS.map((k) => `<button data-act="adbias" data-v="${k}" class="${spec.bias === k ? 'on' : ''}">${SKILL_LABEL[k]}</button>`).join('')}
        <span class="dim">×${AD_REQ_MULT.bias}</span></div>
      <div class="row" style="margin-top:10px"><b>广告费</b><span class="${afford ? 'hi' : 'bad'}">${cost}</span>
        <span class="dim">现有 ${Math.floor(s.econ.coins)}</span></div>
      <div class="row" style="margin-top:8px">
        <button data-act="adpost" data-v="${slot}" ${afford ? '' : 'disabled'}>发布（-${cost}）</button>
        <button data-act="closemodal">算了</button>
      </div>`);
  }

  openFireConfirm(id        )       {
    const st = this.g.sim.staff.find((x) => x.id === id);
    if (!st || st.isOwner) return;
    this.showModal(`<h3 class="bad">确认解雇 ${st.name}？</h3>
      <div>解雇后需要支付 <span class="bad">${st.wage * 2} 界币</span>补偿，员工会立即离开，卧室也会空出。</div>
      ${this.g.sim.dayActive ? '<div class="bad" style="margin-top:8px">营业中不能解雇，请在收盘规划时处理。</div>' : ''}
      <div class="row" style="margin-top:12px">
        <button data-act="firego" data-v="${st.id}" style="border-color:#B33C4E" ${this.g.sim.dayActive ? 'disabled' : ''}>确认解雇</button>
        <button data-act="closemodal">取消</button>
      </div>`);
  }

  openSaveManager()       {
    const slots = this.g.saveSlots();
    const canSave = canPersistSim(this.g.sim);
    const rows = slots.map((slot) => `<div class="card" style="margin-top:7px;border-left-color:${slot.slot === this.g.currentSlot ? '#7FB069' : '#B0895E'}">
      <div class="row"><b>档位 ${slot.slot}${slot.slot === this.g.currentSlot ? ' · 当前' : ''}</b><span class="${slot.valid ? 'hi' : 'dim'}">${slot.valid ? `第 ${slot.day} 天 · ${'★'.repeat(slot.stars) || '无星'}` : '空档位'}</span></div>
      <div class="dim">${slot.valid ? `${htmlText(slot.ownerName)} · ${slot.coins} 界币${slot.savedAt ? ` · ${new Date(slot.savedAt).toLocaleString()}` : ''}` : '可以把当前旅店保存到这里。'}</div>
      <div class="row" style="margin-top:6px"><button data-act="saveslot" data-v="${slot.slot}" ${canSave ? '' : 'disabled'}>${slot.valid ? '覆盖保存' : '保存到此档位'}</button>${slot.valid ? `<button data-act="loadslot" data-v="${slot.slot}">读取</button>` : ''}</div>
    </div>`).join('');
    this.showModal(`<h3>💾 存档管理</h3>
      <div class="dim">自动存档写入当前档位；主动保存会把当前档位切换到所选位置。营业过程中的订单和客人属于实时状态，只能在收盘规划期主动存档。</div>
      ${!canSave ? '<div class="bad" style="margin-top:7px">正在营业：完成今日营业后才能主动保存。</div>' : ''}
      ${rows}<div class="row" style="margin-top:10px"><button data-act="closemodal">关闭</button></div>`);
  }

  openLoadSlotConfirm(slot        )       {
    const info = this.g.saveSlots().find((item) => item.slot === slot);
    if (!info?.valid) { this.openSaveManager(); return; }
    this.showModal(`<h3>读取档位 ${slot}？</h3>
      <div>将切换到 <b>${htmlText(info.ownerName)}</b> 的第 ${info.day} 天旅店进度。</div>
      <div class="dim">当前档位已经自动保存；若正在营业，读取后会离开当前营业现场。</div>
      <div class="row" style="margin-top:10px"><button data-act="loadslotgo" data-v="${slot}">确认读取</button><button data-act="savemenu">取消</button></div>`);
  }

  openPromptSettings(status = '') {
    const tasks = loadPromptTasks();
    const cards = Object.entries(PROMPT_TASKS).map(([key, meta]) => `<section class="prompt-card">
      <div class="row"><b>${htmlText(meta.label)}</b><span class="dim">最多 2000 字</span></div>
      <div class="dim">${htmlText(meta.description)}</div>
      <textarea class="prompt-editor" data-prompt-key="${key}" maxlength="2000" spellcheck="false">${htmlText(tasks[key])}</textarea>
    </section>`).join('');
    this.showModal(`<h3>提示词</h3>
      <div class="dim">这里只修改 AI 的任务重点和叙事风格。角色事实、数值边界、内容安全规则和 JSON 返回格式由游戏固定附加，不能在这里覆盖。</div>
      ${status ? `<div class="good" style="margin-top:7px">${htmlText(status)}</div>` : ''}
      ${cards}
      <div class="row" style="margin-top:12px"><button data-act="promptreset" class="warn">恢复默认</button><span style="flex:1"></span><button data-act="promptsave">保存任务文本</button><button data-act="closemodal">关闭</button></div>`);
  }

  savePromptSettings() {
    const current = loadPromptTasks();
    if (this.modal) {
      for (const input of this.modal.querySelectorAll('[data-prompt-key]')) current[input.dataset.promptKey] = input.value;
    }
    savePromptTasks(current);
    this.openPromptSettings('四项任务文本已保存，仅存放在当前浏览器。');
  }

  openSettings()       {
    const manual = this.g.sim.manualOwner;
    const vols = this.g.audio.curVolumes();
    const ai = loadAIConfig();
    const lastRefresh = ai.refreshedAt ? new Date(ai.refreshedAt).toLocaleString() : '';
    const modelOptions = ai.models.length
      ? ai.models.map((model) => `<option value="${htmlText(model)}" ${model === ai.model ? 'selected' : ''}>${htmlText(model)}</option>`).join('')
      : '<option value="">请先刷新模型</option>';
    this.showModal(`<h3>⚙ 设置</h3>
      <div class="row"><span>店主操控</span><span class="${manual ? 'hi' : 'dim'}">${manual ? '玩家直控' : '自动干活'}</span></div>
      <div class="row">
        <button data-act="manual" data-v="0" class="${manual ? '' : 'on'}">自动干活</button>
        <button data-act="manual" data-v="1" class="${manual ? 'on' : ''}">直控店主</button>
      </div>
      <div class="dim">直控：WASD / 方向键 移动店主，此时镜头跟随店主；关闭时店主自己接派工，WASD 平移镜头。其他员工始终自动干活。</div>
      <div class="row" style="margin-top:10px"><span style="width:56px">音乐</span><input data-act="volm" type="range" min="0" max="1" step="0.05" value="${vols.m}" style="flex:1"></div>
      <div class="row"><span style="width:56px">音效</span><input data-act="vols" type="range" min="0" max="1" step="0.05" value="${vols.s}" style="flex:1"></div>
      <div class="row" style="margin-top:10px"><span>操作</span><span class="dim">空格暂停 · 1/2/3 变速 · R 旋转 · F 聚焦 · E 与身边的伙计/客人搭话 · 点角色开互动菜单 · 双击伙计看详情 · 鼠标拖拽平移 · 滚轮缩放</span></div>
      <h3 style="margin:14px 0 6px">AI 接入</h3>
      <div class="dim">支持 OpenAI Chat Completions 兼容接口。选择预设或填写自定义 API 根地址，再输入 Key 并刷新模型。</div>
      <div class="row" style="margin-top:7px;justify-content:flex-start;flex-wrap:wrap">
        ${AI_PRESETS.map((preset) => `<button data-act="aipreset" data-v="${preset.id}" class="${ai.preset === preset.id ? 'on' : ''}">${preset.name}</button>`).join('')}
      </div>
      <label class="row" style="margin-top:7px"><span style="width:72px">接口地址</span><input data-act="aiurl" type="url" value="${htmlText(ai.baseUrl)}" placeholder="https://example.com/v1" autocomplete="off" spellcheck="false" style="flex:1;min-width:240px"></label>
      <label class="row" style="margin-top:5px"><span style="width:72px">API Key</span><input data-act="aikey" type="password" value="${htmlText(ai.apiKey)}" placeholder="sk-..." autocomplete="off" spellcheck="false" style="flex:1;min-width:240px"></label>
      <div class="row" style="margin-top:6px">
        <span style="width:72px">游戏模型</span>
        <select data-act="aimodel" style="flex:1;min-width:220px" ${ai.models.length ? '' : 'disabled'}>${modelOptions}</select>
        <button data-act="airefresh">刷新模型</button>
      </div>
      <div data-ai-status class="${lastRefresh ? 'good' : 'dim'}" style="margin-top:5px">${lastRefresh ? `已加载 ${ai.models.length} 个模型 · ${lastRefresh}` : '尚未刷新模型'}</div>
      <div class="dim" style="margin-top:4px">Key 仅保存在当前浏览器，不进入游戏存档或仓库；正式部署通过同源代理转发。共享设备请在离开前清除。</div>
      ${['localhost', '127.0.0.1'].includes(location.hostname) ? '<div class="dim">本地静态服务器会尝试直连供应商，可能受浏览器 CORS 限制；部署版不受此限制。</div>' : ''}
      <div class="row" style="margin-top:5px;justify-content:flex-end"><button data-act="aiclear" class="warn">清除 AI 配置</button></div>
      <h3 style="margin:12px 0 4px">沙盒选项</h3>
      <div class="row"><span class="dim" style="flex:1">用于自由建造和测试，不属于正常经营流程。</span><button data-act="cheat" title="一键满星 + 20 万界币">满星 + 200000 界币</button></div>
      <div class="row" style="margin-top:12px">
        <button data-act="confirmnew" style="border-color:#B33C4E">↺ 重新游戏</button>
        <button data-act="closemodal">关闭</button>
      </div>`);
  }

  syncAIForm()       {
    const current = loadAIConfig();
    if (!this.modal) return current;
    const urlInput = this.modal.querySelector('[data-act="aiurl"]')                    ;
    const keyInput = this.modal.querySelector('[data-act="aikey"]')                    ;
    const modelInput = this.modal.querySelector('[data-act="aimodel"]')                    ;
    if (!urlInput && !keyInput && !modelInput) return current;
    const nextUrl = urlInput ? urlInput.value.trim() : current.baseUrl;
    const addressChanged = nextUrl !== current.baseUrl;
    return saveAIConfig({
      ...current,
      preset: addressChanged ? 'custom' : current.preset,
      baseUrl: nextUrl,
      apiKey: keyInput ? keyInput.value : current.apiKey,
      model: addressChanged ? '' : (modelInput ? modelInput.value : current.model),
      models: addressChanged ? [] : current.models,
      refreshedAt: addressChanged ? 0 : current.refreshedAt,
    });
  }

  async refreshAISettings()       {
    const status = this.modal?.querySelector('[data-ai-status]')                    ;
    const button = this.modal?.querySelector('[data-act="airefresh"]')                     ;
    const startedModal = this.modal;
    if (button) button.disabled = true;
    if (status) { status.className = 'hi'; status.textContent = '正在连接并读取模型列表…'; }
    try {
      const updated = await refreshAIModels(this.syncAIForm());
      saveAIConfig(updated);
      if (this.modal === startedModal) this.openSettings();
    } catch (err) {
      if (this.modal === startedModal && status) {
        status.className = 'bad';
        status.textContent = `${err?.message || '刷新失败'}${['localhost', '127.0.0.1'].includes(location.hostname) ? '（本地直连还可能被 CORS 拦截）' : ''}`;
      }
      if (button) button.disabled = false;
    }
  }

  openConfirmRestart()       {
    this.showModal(`<h3 class="bad">重新游戏？</h3>
      <div>当前酒馆的进度、房间、员工与档位 ${this.g.currentSlot} 存档都会被清空；其他档位不受影响，然后从捏店主开始重来。</div>
      <div class="row" style="margin-top:12px">
        <button data-act="newgame" style="border-color:#B33C4E">确认重来</button>
        <button data-act="settings">返回设置</button>
      </div>`);
  }

  settlementAIStat                 = null;

  openSettlement(stat         )       {
    if (stat.sealed) {
      this.showModal(`<h3 class="bad">酒馆被位面房东封印</h3>
        <div>连续 3 次日结低于信用线（${stat.creditLine}），门厅的传送门被贴上了封条。</div>
        <div class="dim">当前界币 ${Math.round(stat.coinsAfter)}</div>
        <div class="row" style="margin-top:10px">
          ${this.g.hasMorningSave() ? '<button data-act="loadmorning">读取晨间存档</button>' : ''}
          <button data-act="newgame">新开一家酒馆</button></div>`);
      return;
    }
    this.settlementAIStat = stat;
    if (aiConfigured()) {
      this.renderSettlement(stat, { loading: true });
      this.generateAISettlement();
    } else this.renderSettlement(stat, {});
  }

  settlementFacts(stat       )         {
    const sim = this.g.sim;
    const report = stat.report || {};
    const mapStock = (stock       ) => Object.fromEntries(Object.entries(stock || {}).map(([key, value]) => [ING_LABEL[key] || key, value]));
    return {
      world: '《多元便携旅店》是一家接待不同位面来客的奇幻酒馆。所有数值和工作统计都是不可改写的事实。',
      tavern: { rooms: this.g.tavern.rooms.length, furniture: this.g.tavern.furns.length, stars: sim.stars() },
      day: stat.day,
      finance: report.finance || { revenue: stat.revenue, wages: stat.wages, maintenance: stat.maintenance, restock: stat.restock, net: stat.revenue - stat.wages - stat.maintenance - stat.restock, coinsAfter: stat.coinsAfter },
      guests: report.guests || { served: stat.served, lost: stat.lost, averageScore: stat.avgScore, scoreBreakdown: stat.scoreBreakdown },
      reputation: report.reputation || { delta: stat.repDelta, after: sim.econ.rep },
      inventory: { used: mapStock(report.stockUsed), before: mapStock(report.started?.stock), after: mapStock(report.finished?.stock) },
      sales: {
        dishes: Object.values(report.dishSales || {}),
        facilities: Object.values(report.facilitySales || {}),
        lostReasons: report.lostReasons || {},
      },
      staffWork: (report.finished?.staff || []).map((row) => ({
        name: row.name, job: JOB_LABEL[row.job] || row.job, completedTotal: row.total, completedTasks: row.tasks,
        needsBefore: row.needsBefore, needsAfter: row.needsAfter,
        skillGrowth: Object.fromEntries(Object.entries(row.skillDelta || {}).map(([key, value]) => [SKILL_LABEL[key] || key, value])), leftAfterShift: row.left,
      })),
      characters: sim.staff.map((staff) => ({
        name: staff.name, role: staff.isOwner ? '店主' : JOB_LABEL[staff.job], race: staff.race,
        traits: staff.traits.map((id) => (TRAITS.find((item) => item.id === id) || { name: id }).name),
        affinityToOwner: staff.isOwner ? 100 : Math.round(staff.aff), background: staff.background || null,
      })),
      events: (report.events || []).slice(0, 10).map((event) => ({ ...event, effects: { ...event.effects, stock: mapStock(event.effects?.stock) } })),
    };
  }

  renderSettlement(stat       , state = {})       {
    const s = this.g.sim;
    const net = stat.revenue - stat.wages - stat.maintenance - stat.restock;
    const partLabels = { quality: '品质', wait: '等待', service: '服务', hygiene: '卫生', comfort: '舒适', spectacle: '观赏' };
    const parts = stat.scoreBreakdown || {};
    const scored = Object.entries(partLabels).filter(([key]) => Number.isFinite(parts[key]));
    const weakest = scored.length ? [...scored].sort((a, b) => parts[a[0]] - parts[b[0]])[0] : null;
    const scoreRows = scored.length ? `<div class="scoregrid">${scored.map(([key, label]) => `<div><span class="dim">${label}</span><b class="${parts[key] < 3 ? 'bad' : parts[key] >= 4 ? 'good' : ''}">${parts[key].toFixed(2)}★</b></div>`).join('')}</div>
      ${weakest ? `<div class="dim">今日主要短板：<span class="bad">${weakest[1]} ${parts[weakest[0]].toFixed(2)}★</span></div>` : ''}` : '';
    const work = stat.report?.finished?.staff || [];
    const workRows = work.map((row) => `<div class="row"><span><b>${htmlText(row.name)}</b><span class="dim"> · ${JOB_LABEL[row.job] || row.job}</span></span><span>${row.total ? Object.entries(row.tasks).map(([label, count]) => `${htmlText(label)}×${count}`).join(' · ') : '<span class="dim">本日无完成记录</span>'}</span></div>`).join('');
    const story = state.story;
    const aiPanel = story ? `<div class="card" style="margin-top:12px;border-left-color:#7A4BE0"><h3>📖 ${htmlText(story.title)}</h3>
        <div style="white-space:pre-wrap;line-height:1.8;max-width:760px">${htmlText(story.chapter)}</div>
        ${story.afterHours.length ? `<h3 style="margin-top:12px">打烊后的灯火</h3>${story.afterHours.map((line) => `<div style="margin:4px 0"><b>${htmlText(line.speaker)}：</b>${htmlText(line.line)}</div>`).join('')}` : ''}
        <div class="dim" style="margin-top:8px">${htmlText(story.closingNote)}</div></div>`
      : state.loading ? '<div class="card hi" style="margin-top:10px">AI 正在把今日营业记录整理成小说章节，请稍候…</div>'
        : state.error ? `<div class="card"><div class="bad">AI 日结生成失败：${htmlText(state.error)}</div><button data-act="airetryday">重试 AI</button></div>` : '';
    this.showModal(`<h3>第 ${stat.day} 天结算</h3>
      <div class="row"><span>营业收入</span><span class="good">+${stat.revenue}</span></div>
      <div class="row"><span>工资</span><span class="bad">-${stat.wages}</span></div>
      <div class="row"><span>房间与家具维护</span><span class="bad">-${stat.maintenance}</span></div>
      <div class="row"><span>补货</span><span class="bad">-${stat.restock}</span></div>
      <div class="row"><b>净收益</b><b class="${net >= 0 ? 'good' : 'bad'}">${net >= 0 ? '+' : ''}${net}</b></div>
      <div class="row"><span>接待 ${stat.served} 位客人 · 流失 ${stat.lost} 组</span><span>平均评价 ${stat.avgScore.toFixed(2)}★</span></div>
      ${scoreRows}
      <div class="row"><span>声望变化</span><span class="${stat.repDelta >= 0 ? 'good' : 'bad'}">${stat.repDelta >= 0 ? '+' : ''}${stat.repDelta} → ${Math.round(s.econ.rep)}（${'★'.repeat(s.stars())}）</span></div>
      <div class="row"><span>信用线 ${stat.creditLine}</span><span class="${stat.coinsAfter < stat.creditLine ? 'bad' : ''}">结余 ${Math.round(stat.coinsAfter)}</span></div>
      <h3 style="margin-top:10px">员工工作统计</h3>${workRows || '<div class="dim">没有可统计的员工工作。</div>'}
      ${aiPanel}
      ${stat.fiveStarReached ? '<div class="card" style="margin-top:9px"><b class="good">五星声望达成：位面评议会已抵达门厅</b><div class="dim">完成今日结算后，接受酒馆的最终认证。</div></div>' : ''}
      <div class="row" style="margin-top:10px">${stat.fiveStarReached ? '<button data-act="finale">确认，进入五星庆典</button>' : `<button data-act="closemodal">${state.loading ? '跳过 AI，确认进入打烊模式' : '确认，进入打烊模式'}</button>`}</div>`);
  }

  async generateAISettlement()       {
    const stat = this.settlementAIStat;
    if (!stat) return;
    const startedModal = this.modal;
    try {
      const story = await requestGameAI('day_story', this.settlementFacts(stat));
      if (this.modal !== startedModal) return;
      const allowed = new Set(this.g.sim.staff.map((staff) => staff.name));
      story.afterHours = story.afterHours.filter((line) => allowed.has(line.speaker));
      this.g.sim.econ.aiChronicles = this.g.sim.econ.aiChronicles || [];
      this.g.sim.econ.aiChronicles.push({ day: stat.day, ...story });
      if (this.g.sim.econ.aiChronicles.length > 20) this.g.sim.econ.aiChronicles.shift();
      this.g.save();
      this.renderSettlement(stat, { story });
    } catch (err) {
      if (this.modal === startedModal) this.renderSettlement(stat, { error: err?.message || '未知错误' });
    }
  }

  openFinale()       {
    const g = this.g; const s = g.sim;
    this.showModal(`<h3 class="good">🏆 万界五星酒馆认证</h3>
      <div>位面评议会穿过门厅，在来自不同世界的客人与员工见证下，将第五颗星嵌进了酒馆招牌。</div>
      <div class="card" style="margin-top:10px">
        <div class="row"><span>经营天数</span><b>${s.econ.day - 1} 天</b></div>
        <div class="row"><span>酒馆规模</span><b>${g.tavern.rooms.length} 间房 · ${g.tavern.furns.length} 件家具</b></div>
        <div class="row"><span>店内成员</span><b>${s.staff.length} 人</b></div>
        <div class="row"><span>最终声望</span><b>${Math.round(s.econ.rep)} · ★★★★★</b></div>
      </div>
      <div class="dim" style="margin-top:8px">主线经营目标已经完成。五星招牌家具的品质 III 现已开放，之后可以继续无限经营和扩建。</div>
      <div class="row" style="margin-top:12px"><button data-act="closemodal">继续无限经营</button><button data-act="confirmnew">另开新店</button></div>`);
  }

  // ---------- 捏脸 / 换装 ----------
  openCreator(initial            , name        , onDone                                                      , dressOnly = false, sex0 = '女')       {
    let app = cloneApp(initial);
    let sex = sex0;
    let pose                           = 'walk';
    const locks = new Set        ();
    const cats                                                                                                                    = [
      { key: 'face', label: '脸型', names: FACE_NAMES, get: () => app.face, set: (v) => { app.face = v; } },
      { key: 'eye', label: '眼睛', names: EYE_NAMES, get: () => app.eye, set: (v) => { app.eye = v; } },
      { key: 'fringe', label: '刘海', names: FRINGE_NAMES, get: () => app.fringe, set: (v) => { app.fringe = v; } },
      { key: 'hairLen', label: '发型', names: HAIRLEN_NAMES, get: () => app.hairLen, set: (v) => { app.hairLen = v; } },
      { key: 'acc', label: '面饰', names: ACC_NAMES, get: () => app.acc || 0, set: (v) => { app.acc = v; } },
      { key: 'top', label: '衣装', names: BODY_NAMES, get: () => app.wear.top, set: (v) => { app.wear.top = v; } },
      { key: 'leg', label: '裤子', names: PANTS_NAMES, get: () => app.wear.leg || 0, set: (v) => { app.wear.leg = v; } },
      { key: 'sock', label: '袜子腿型', names: SOCK_NAMES, get: () => app.wear.sock || 0, set: (v) => { app.wear.sock = v; } },
      { key: 'race', label: '种族', names: RACE_NAMES, get: () => app.race, set: (v) => { app.race = v; } },
      { key: 'ht', label: '身高', names: HT_NAMES, get: () => app.ht, set: (v) => { app.ht = v; } },
      { key: 'bd', label: '体型', names: BD_NAMES, get: () => app.bd, set: (v) => { app.bd = v; } },
      { key: 'skin', label: '肤色', names: SKINS.map(() => ''), get: () => app.skin, set: (v) => { app.skin = v; }, colors: SKINS },
      { key: 'hairC', label: '发色', names: HAIR_COLORS.map(() => ''), get: () => app.hairC, set: (v) => { app.hairC = v; }, colors: HAIR_COLORS },
      { key: 'eyeC', label: '瞳色', names: EYE_COLORS.map(() => ''), get: () => app.eyeC, set: (v) => { app.eyeC = v; }, colors: EYE_COLORS },
      { key: 'clothA', label: '主衣色', names: CLOTH_COLORS.map(() => ''), get: () => app.clothA, set: (v) => { app.clothA = v; }, colors: CLOTH_COLORS },
      { key: 'clothB', label: '辅衣色', names: CLOTH_COLORS.map(() => ''), get: () => app.clothB, set: (v) => { app.clothB = v; }, colors: CLOTH_COLORS },
      { key: 'accC', label: '点缀色', names: ACCENT_COLORS.map(() => ''), get: () => app.accC, set: (v) => { app.accC = v; }, colors: ACCENT_COLORS },
      { key: 'hand', label: '配饰', names: HAND_NAMES, get: () => app.wear.hand, set: (v) => { app.wear.hand = v; } },
    ];
    const groups = [
      { key: 'face', label: '面部', cats: ['face', 'eye', 'skin', 'eyeC', 'acc'] },
      { key: 'hair', label: '发型', cats: ['fringe', 'hairLen', 'hairC'] },
      { key: 'body', label: '身体', cats: ['race', 'ht', 'bd'] },
      { key: 'outfit', label: '服装', cats: ['top', 'leg', 'sock', 'hand'] },
      { key: 'color', label: '配色', cats: ['clothA', 'clothB', 'accC'] },
    ];
    const visibleCats = ()              => {
      return dressOnly ? cats.filter((c) => ['acc', 'top', 'leg', 'sock', 'clothA', 'clothB', 'accC', 'hand'].includes(c.key)) : cats;
    };
    let visible = visibleCats();
    let activeCat = visible[0].key;
    let activeGroup = groups.find((group) => group.cats.includes(activeCat))?.key || 'face';
    let history = [cloneApp(app)];
    let historyIndex = 0;
    const remember = () => {
      history = history.slice(0, historyIndex + 1);
      history.push(cloneApp(app));
      if (history.length > 30) history.shift();
      historyIndex = history.length - 1;
    };
    const m = this.showModal(`<div id="cr"></div>`, dressOnly);
    const host = m.querySelector('#cr')               ;
    const draw = ()       => {
      const cv = host.querySelector('canvas.prev')                            ;
      if (!cv) return;
      const ctx = cv.getContext('2d');
      if (!ctx) return;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, cv.width, cv.height);
      const frame = Math.floor(performance.now() / 160) % 4;
      for (const [i, d] of [0, 2].entries()) {
        const pix = drawSprite(app, d, pose, pose === 'idle' ? frame % 2 : frame, null);
        ctx.drawImage(pix.canvas, 0, 0, CANVAS_W, CANVAS_H, i * 128, 0, 128, 144);
      }
      const av = host.querySelector('img.big')                           ;
      if (av) av.src = avatarURL(app);
    };
    const rerender = ()       => {
      const currentName = host.querySelector('#crname')?.value;
      if (currentName !== undefined) name = currentName;
      visible = visibleCats();
      if (!visible.some((c) => c.key === activeCat)) activeCat = visible[0].key;
      const availableGroups = groups.map((group) => ({ ...group, cats: group.cats.filter((key) => visible.some((cat) => cat.key === key)) })).filter((group) => group.cats.length);
      if (!availableGroups.some((group) => group.key === activeGroup)) activeGroup = availableGroups[0].key;
      const group = availableGroups.find((item) => item.key === activeGroup);
      if (!group.cats.includes(activeCat)) activeCat = group.cats[0];
      const cat = visible.find((c) => c.key === activeCat)                     ;
      host.innerHTML = `<div class="creator-head"><div><h3>${dressOnly ? '纸娃娃换装' : '捏一个店主'}</h3><div class="dim">先选样板，再按面部、发型、身体、服装与配色逐组调整。</div></div>
        <div class="creator-history"><button data-undo title="撤销" ${historyIndex <= 0 ? 'disabled' : ''}>↶</button><button data-redo title="重做" ${historyIndex >= history.length - 1 ? 'disabled' : ''}>↷</button></div></div>
      <div class="creator-presets">${PRESETS.map((ps) => `<button data-preset="${ps.id}">${ps.name}</button>`).join('')}</div>
      <div class="creator-layout">
        <section class="creator-preview">
          <div class="creator-preview-art"><canvas class="prev" width="256" height="144"></canvas><img class="av big" src="${avatarURL(app)}" width="108" height="144"></div>
          <div class="row creator-pose"><span class="dim">正面 / 背面</span><span>${['idle', 'walk', 'work'].map((p) => `<button data-pose="${p}" class="${pose === p ? 'on' : ''}">${p === 'idle' ? '待机' : p === 'walk' ? '行走' : '工作'}</button>`).join('')}</span></div>
          ${dressOnly ? '' : `<div class="creator-identity"><label><span>姓名</span><input id="crname" value="${htmlText(name)}" maxlength="20"></label><div>性别 ${['女', '男'].map((s) => `<button data-sex="${s}" class="${sex === s ? 'on' : ''}">${s}</button>`).join('')}</div></div>`}
          <div class="creator-summary">${RACE_NAMES[app.race]} · ${HT_NAMES[app.ht]}${BD_NAMES[app.bd]}<br><span class="dim">已锁定 ${locks.size} 项，随机外观时会保留</span></div>
          <div class="creator-actions"><button data-rand="1">随机外观</button>${THEMES.map((th) => `<button data-theme="${th.id}">${th.name}</button>`).join('')}</div>
          <button class="creator-done" data-done="1">${dressOnly ? '换上这套服装' : '就这个店主'}</button>
          ${dressOnly ? '<button data-act="closemodal" style="width:100%;margin-top:6px">取消</button>' : ''}
        </section>
        <section class="creator-editor">
          <div class="creator-groups">${availableGroups.map((item) => `<button data-group="${item.key}" class="${activeGroup === item.key ? 'on' : ''}">${item.label}</button>`).join('')}</div>
          <div class="creator-cats">${group.cats.map((key) => { const item = visible.find((entry) => entry.key === key); return `<button data-cat="${key}" class="${activeCat === key ? 'on' : ''}">${locks.has(key) ? '🔒 ' : ''}${item.label}</button>`; }).join('')}</div>
          <div class="creator-cat-lock"><div><b>${cat.label}</b><div class="dim">选择样式，或锁定后继续随机其他部分。</div></div><button class="creator-lock ${locks.has(cat.key) ? 'on' : ''}" data-lockbtn="${cat.key}">${locks.has(cat.key) ? '🔒 已锁定' : '🔓 锁定此项'}</button></div>
          <div class="grid creator-options">${cat.names.map((n, i) => cat.colors
        ? `<span class="sw ${cat.get() === i ? 'on' : ''}" data-opt="${i}" style="background:${cat.colors[i]}" title="${cat.label} ${i + 1}"></span>`
        : `<button data-opt="${i}" class="${cat.get() === i ? 'on' : ''}">${n}</button>`).join('')}</div>
        </section>
      </div>`;
      draw();
    };
    host.addEventListener('click', (e) => {
      const t = (e.target               ).closest('[data-group],[data-cat],[data-lockbtn],[data-undo],[data-redo],[data-opt],[data-pose],[data-sex],[data-rand],[data-theme],[data-preset],[data-done]')                      ;
      if (!t) return;
      let changed = false;
      if (t.dataset.group) {
        activeGroup = t.dataset.group;
        const group = groups.find((item) => item.key === activeGroup);
        const first = group?.cats.find((key) => visible.some((cat) => cat.key === key));
        if (first) activeCat = first;
      }
      else if (t.dataset.cat) activeCat = t.dataset.cat;
      else if (t.dataset.lockbtn) {
        if (locks.has(t.dataset.lockbtn)) locks.delete(t.dataset.lockbtn); else locks.add(t.dataset.lockbtn);
      }
      else if (t.hasAttribute('data-undo') && historyIndex > 0) app = cloneApp(history[--historyIndex]);
      else if (t.hasAttribute('data-redo') && historyIndex < history.length - 1) app = cloneApp(history[++historyIndex]);
      else if (t.dataset.opt !== undefined) {
        const cat = visible.find((c) => c.key === activeCat)                     ;
        cat.set(parseInt(t.dataset.opt, 10));
        changed = true;
      } else if (t.dataset.pose) pose = t.dataset.pose          ;
      else if (t.dataset.sex) {
        sex = t.dataset.sex;
      }
      else if (t.dataset.preset) {
        const ps = PRESETS.find((q) => q.id === t.dataset.preset);
        if (ps) {
          const made = ps.make();
          if (dressOnly) { app.wear = made.wear; app.clothA = made.clothA; app.clothB = made.clothB; app.accC = made.accC; }
          else app = made;
          if (ps.sex !== '不定') sex = ps.sex;
          changed = true;
        }
      }
      else if (t.dataset.theme) {
        // 成套换装：五官/发型/身形保持不变，只替换衣着与配色
        const themed = randomAppearance(new Rng(Math.floor(Math.random() * 1e9)), app.race, false, t.dataset.theme);
        app.clothA = themed.clothA; app.clothB = themed.clothB; app.accC = themed.accC;
        app.wear.top = themed.wear.top; app.hairC = themed.hairC; app.eyeC = themed.eyeC;
        changed = true;
      }
      else if (t.dataset.rand) {
        const keepVals = new Map                ();
        for (const c of visible) if (locks.has(c.key)) keepVals.set(c.key, c.get());
        const base = cloneApp(app);
        app = randomAppearance(new Rng(Math.floor(Math.random() * 1e9)), locks.has('race') ? base.race : undefined, false);
        if (dressOnly) {
          app.race = base.race; app.ht = base.ht; app.bd = base.bd; app.skin = base.skin;
          app.face = base.face; app.eye = base.eye; app.fringe = base.fringe; app.hairLen = base.hairLen; app.hairC = base.hairC; app.eyeC = base.eyeC;
        }
        for (const [k, v] of keepVals) {
          const cc = visible.find((x) => x.key === k);
          if (cc) cc.set(v);
        }
        changed = true;
      } else if (t.dataset.done) {
        const inp = host.querySelector('#crname')                           ;
        const nm = inp && inp.value.trim() ? inp.value.trim() : name;
        this.closeModal();
        onDone(app, nm, sex);
        return;
      }
      if (changed) remember();
      rerender();
    });
    rerender();
    const timer = window.setInterval(() => { if (this.modal !== m) { clearInterval(timer); return; } draw(); }, 160);
  }

  openWardrobe(id        )       {
    const st = this.g.sim.staff.find((x) => x.id === id);
    if (!st) return;
    this.openCreator(st.app, st.name, (app) => { this.g.dressStaff(id, app); this.render(true); }, true, st.sex);
  }
}
