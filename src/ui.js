// DOM 覆盖层 UI：顶栏 / 建造 / 员工 / 选中详情 / 事件卡 / 结算 / 捏脸与换装
import {
  ACCENT_COLORS,                             BD_NAMES, BODY_NAMES, CANVAS_H, CANVAS_W, CLOTH_COLORS, cloneApp,
  ACC_NAMES, drawSprite, EYE_COLORS, EYE_NAMES, FACE_NAMES, FRINGE_NAMES, HAIR_COLORS, HAIRLEN_NAMES, HAND_NAMES,
  HT_NAMES, PANTS_NAMES, PRESETS, RACE_NAMES, randomAppearance, SKINS, SOCK_NAMES, THEMES,
} from './chargen.js';
import { Rng } from './pix.js';
import { AI_PRESETS, loadAIConfig, presetById, refreshAIModels, saveAIConfig } from './ai.js';
import { aiConfigured, ownerCreatorCatalogs, requestGameAI } from './ai-game.js';
import { composeNightPromptModules, composeWorldPromptModules, loadPromptTasks, NIGHT_PROMPT_MODULES, parseNightPromptModules, parseWorldPromptModules, PROMPT_TASKS, resetPromptTasks, savePromptTasks, WORLD_PROMPT_STAGES } from './prompt-settings.js';
import { loadPlayerProfile, savePlayerProfile } from './player-profile.js';
import { canPersistSim } from './save-policy.js';
import { advanceTutorialState, loadTutorialState, resetTutorialState, retreatTutorialState, saveTutorialState, TUTORIAL_STEPS, tutorialActionMatches } from './tutorial.js';
import {
  AD_REQ_MULT, AD_TIERS, BLUEPRINTS, DISH_FUN, DUTIES, DUTY_LABEL, FLAVOR_LABEL, FLAVORS, FURN_DEFS, furnDef, furnQualityUnlock, ING_KEYS, ING_LABEL, ING_PRICE,                        JOB_LABEL, JOBS, SEASON_NAMES, STYLES,
  ROOM_LABEL, SKILL_KEYS, SKILL_LABEL, STAR_THRESHOLDS, TRAIT_CHEM, TRAIT_SAME, TRAITS, wantById,
  WORLD_PROFILES, worldById,
} from './data.js';
import { AGE_MAX, fairWageRange, jobFocusSkill, restockPlan, STAFF_EQUIPMENT, STAFF_PERKS, staffAnalysis, TRAINING_PROGRAMS, worldIngredientPrice } from './sim.js';
import { CUSTOM_WORLD_LIMIT, customWorldCreationCost, normalizeCustomWorld, worldFestivalForDay, worldRuleForDay, worldSwitchCost } from './world-system.js';
import { portraitURL as illustratedPortraitURL } from './portrait-v2.js';
import {                        } from './world.js';

// V2 在分层美术资产完成前仅供验收，不降低正式游戏的默认立绘质量。
if (typeof document !== 'undefined') document.documentElement.classList.add('portrait-v2');
const portraitURL = illustratedPortraitURL;

export const OWNER_SKILL_PRESETS = [
  { id: 'balanced', name: '均衡店主', note: '所有能力稳定，适合第一次经营。', skills: { looks: 38, cook: 38, mix: 38, serve: 38, clean: 38, carry: 38, calm: 38 } },
  { id: 'chef', name: '料理主理人', note: '擅长餐食与饮品，前厅和杂务较弱。', skills: { looks: 30, cook: 56, mix: 46, serve: 32, clean: 34, carry: 34, calm: 34 } },
  { id: 'host', name: '魅力经营者', note: '擅长迎宾、服务和处理投诉。', skills: { looks: 48, cook: 28, mix: 30, serve: 58, clean: 30, carry: 30, calm: 42 } },
  { id: 'operator', name: '现场管家', note: '移动、清洁和后勤能力突出。', skills: { looks: 30, cook: 30, mix: 28, serve: 36, clean: 48, carry: 54, calm: 40 } },
  { id: 'veteran', name: '沉着老练', note: '各项稳健，尤其擅长化解风险。', skills: { looks: 36, cook: 36, mix: 36, serve: 36, clean: 36, carry: 36, calm: 50 } },
];

export const TARGET_RECRUIT_SKILL_PRESETS = [
  { id: 'balanced', name: '全能轮岗', note: '各项能力稳定，适合随时补位。', skills: { looks: 50, cook: 50, mix: 50, serve: 50, clean: 50, carry: 50, calm: 50 } },
  { id: 'front', name: '前厅接待', note: '擅长仪表、服务与安抚客人。', skills: { looks: 64, cook: 38, mix: 40, serve: 68, clean: 42, carry: 44, calm: 54 } },
  { id: 'chef', name: '料理专精', note: '主攻厨艺、清洁与高压出品。', skills: { looks: 38, cook: 76, mix: 50, serve: 42, clean: 58, carry: 44, calm: 52 } },
  { id: 'bartender', name: '调酒专精', note: '主攻调酒、服务与临场应对。', skills: { looks: 48, cook: 42, mix: 76, serve: 58, clean: 44, carry: 42, calm: 54 } },
  { id: 'service', name: '跑堂服务', note: '上菜快、路线稳，兼顾客诉处理。', skills: { looks: 46, cook: 38, mix: 40, serve: 68, clean: 46, carry: 66, calm: 46 } },
  { id: 'attendant', name: '设施场务', note: '负责设施准备、照看与收尾，兼顾三类特色能力。', skills: { looks: 42, cook: 38, mix: 38, serve: 48, clean: 66, carry: 66, calm: 66 } },
  { id: 'support', name: '后勤清洁', note: '擅长清洁、搬运和稳定现场。', skills: { looks: 38, cook: 44, mix: 38, serve: 42, clean: 72, carry: 68, calm: 48 } },
];

export function specialEmployeeRecruit(name) {
  if (String(name).trim().toLowerCase() !== 'samb') return null;
  const appearance = PRESETS.find((preset) => preset.id === 'loli').make();
  appearance.race = RACE_NAMES.indexOf('吸血鬼');
  return {
    appearance,
    name: 'SAMB',
    sex: '女',
    options: {
      age: 300,
      traits: ['lazy', 'clumsy'],
      skillPreset: 'samb',
      skills: { looks: 90, cook: 45, mix: 45, serve: 45, clean: 45, carry: 45, calm: 10 },
      backgroundPreset: 'samb',
      profile: {
        role: '作为摆设的杂鱼吸血鬼',
        background: '曾经参与了某个王国的建设，但因为被友人背叛，王国分裂，从此一蹶不振，兜兜转转来到了多元旅店。傲娇，喜欢自称“妾身”，自傲于高阶吸血鬼的身份，但是实力却很杂鱼。',
        aspiration: '维持高阶吸血鬼的体面，同时在旅店里找回一点干劲。',
        quirk: '习惯自称“妾身”，嘴上自傲，实际经常偷懒和闯小祸。',
      },
    },
  };
}

export const OWNER_BACKGROUND_PRESETS = [
  {
    id: 'wanderer', name: '位面旅人', role: '多元便携旅店的店主与见多识广的位面旅人',
    background: '曾沿着不稳定的星门在不同世界之间旅行，为了换取路费做过向导、账房和临时厨工。见过繁华驿站，也在荒凉边境替陌生人守过一夜炉火。后来接过多元便携旅店的钥匙，希望把这里经营成任何旅人都能暂时放下戒备的停靠处。',
  },
  {
    id: 'quartermaster', name: '公会后勤官', role: '多元便携旅店的店主与前跨位面冒险者公会后勤官',
    background: '过去负责冒险者公会的物资、住宿与伤员安置，擅长在混乱中清点库存、安排人手并安抚争执。一次公会远征解散后，带着旧账本和几封未寄出的感谢信离开。如今经营旅店，想证明照料他人的日常工作同样可以成为值得骄傲的事业。',
  },
  {
    id: 'heir', name: '失落王国遗民', role: '多元便携旅店的店主与失落王国最后的民间继承人',
    background: '故乡在一次位面潮汐中从星图上消失，只留下随身携带的家族食谱、礼仪笔记和几件旧饰物。没有军队，也不执着于复国，而是希望通过一间向所有种族开放的旅店保存故乡待客的方式，让那些已经失去归处的人仍能在灯下得到姓名和一顿热饭。',
  },
  {
    id: 'scholar', name: '星门研究者', role: '多元便携旅店的店主与长期观察位面门扉的民间学者',
    background: '年轻时沉迷记录星门开启的规律、来客的语言和不同世界的生活习惯，却逐渐发现，真正理解一个世界不能只依靠图表。于是把研究室改成旅店前厅，用账本记录经营，也用日记记录每位旅人的故事，希望从一餐一宿与真实交谈中理解万界。',
  },
];

                       
                           
                                                                                                                                                                                                                                            
                                               
                                                                                           
                                                 
                                  
                                
                               
                      
                                       
                                                    
                          
                          
                      
                             
                             
                                         
                                                            
                                           
                                           
                                    
                                                      
                                     
                                    
                                   
                                   
                                          
                                             
                                           
                                 
                                    
                                                    
                      
                          
                                
                                       
                             
                                      
                            
                   
  

const CSS = `
#ui{position:absolute;inset:0;pointer-events:none;font-size:14px;color:#5A4033;z-index:5}
#ui .pane{pointer-events:auto;background:
  radial-gradient(circle at 9px 9px, #C9922F 0 2px, rgba(0,0,0,0) 2.8px),
  radial-gradient(circle at calc(100% - 9px) 9px, #C9922F 0 2px, rgba(0,0,0,0) 2.8px),
  radial-gradient(circle at 9px calc(100% - 9px), #C9922F 0 2px, rgba(0,0,0,0) 2.8px),
  radial-gradient(circle at calc(100% - 9px) calc(100% - 9px), #C9922F 0 2px, rgba(0,0,0,0) 2.8px),
  #F5E6C8 url('assets/ui-paper-target-v2.webp');
  background-size:auto,auto,auto,auto,420px;
  border:3px solid #B0895E;border-radius:14px;
  box-shadow:0 5px 14px rgba(90,64,51,.28), inset 0 0 0 1.5px rgba(255,250,235,.7), inset 0 0 18px rgba(150,110,60,.14)}
#ui button{font-family:inherit;font-size:13px;color:#6B4429;background:linear-gradient(rgba(255,250,235,.35), rgba(140,90,40,.14)), #F2D9B8 url('assets/ui-paper-target-v2.webp');background-size:auto,160px;border:2px solid #B98B5E;border-radius:9px;padding:4px 9px;cursor:pointer;box-shadow:0 2px 0 rgba(155,91,60,.45), inset 0 1px 0 rgba(255,255,255,.5);transition:filter .12s}
#ui button:hover{filter:brightness(1.08);border-color:#C97F2B}
#ui button:active{transform:translateY(1px);box-shadow:none}
#ui button.on{background:linear-gradient(rgba(255,255,255,.22), rgba(30,70,20,.18)), #7FB069;color:#FFFBEF;border-color:#5C8749;text-shadow:0 1px 0 rgba(60,40,20,.3);box-shadow:inset 0 2px 4px rgba(40,70,25,.35)}
#ui button.warn{border-color:#D96A57;color:#C65A48}
#ui button.purchaseConfirm{background:#D88958;color:#FFF8E6;border-color:#A94E3E;filter:brightness(1.08);animation:purchasePulse .7s steps(2,end) infinite}
#ui button:disabled{opacity:.45;cursor:not-allowed}
@keyframes purchasePulse{50%{box-shadow:0 0 0 3px #F3B84B88,inset 0 1px 0 rgba(255,255,255,.5)}}
#top{position:absolute;left:0;right:0;top:0;min-height:38px;display:flex;align-items:center;gap:10px;padding:0 10px;font-size:14px;border-radius:0 0 14px 14px;white-space:nowrap;overflow-x:auto;overflow-y:hidden;
  background:linear-gradient(rgba(255,235,200,.16), rgba(70,40,18,.22)), #D8AE7C url('assets/ui-walnut-target-v2.webp');background-size:auto,340px;
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
img.portrait{image-rendering:pixelated;width:112px;height:144px;flex:0 0 112px;object-fit:contain;border:2px solid #94749A;border-radius:5px;background:#1B1932;box-shadow:0 5px 14px #35244655,inset 0 0 0 2px #e9c99455}
html.portrait-v2 img.portrait{image-rendering:auto;width:120px;height:160px;flex-basis:120px;object-fit:cover;border-color:#796B83;border-radius:8px;background:#D8D4DF}
img.portrait.compact{width:88px;height:113px;flex-basis:88px} html.portrait-v2 img.portrait.compact{width:96px;height:128px;flex-basis:96px}.portrait-head{align-items:flex-start!important}.portrait-head>div{min-width:0}.portrait-note{padding:7px 9px;border-left:3px solid #94749A;background:#5d477018;border-radius:0 7px 7px 0}
img.portrait.list{width:42px;height:56px;flex:0 0 42px;border-width:1px;border-radius:6px;box-shadow:0 2px 6px #35244644}
.pstrip{display:flex;gap:4px;flex-wrap:wrap}
.pstrip img{width:44px;height:56px;object-fit:cover;object-position:50% 0;border:2px solid #E3C9A4;border-radius:8px;cursor:pointer;image-rendering:auto}
.pstrip img.on{border-color:#7FB069}
.modal{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#3A2C20B8;pointer-events:auto;z-index:20;animation:uiModalIn 180ms ease-out}
.mbox{background:#F5E6C8 url('assets/ui-paper-target-v2.webp');background-size:420px;border:3px solid #B0895E;border-radius:16px;box-shadow:0 10px 28px rgba(60,40,25,.45), inset 0 0 0 1.5px rgba(255,250,235,.7), inset 0 0 22px rgba(150,110,60,.16);padding:14px;max-width:min(900px,94vw);max-height:92vh;overflow:auto}
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
.toast{background:#F7E9CDEE;border:2px solid #B0895E;border-radius:12px;padding:3px 12px;margin-bottom:4px;display:inline-block;color:#6B4429;box-shadow:0 2px 6px rgba(90,64,51,.25), inset 0 1px 0 rgba(255,255,255,.5);animation:uiToastIn 200ms ease-out}
#chatter{position:absolute;left:50%;transform:translateX(-50%);bottom:96px;pointer-events:none;display:flex;flex-direction:column;align-items:center;gap:3px;max-width:72vw}
#chatter div{background:#F7E9CDD9;border:2px solid #B0895E;border-radius:12px;padding:2px 12px;color:#6B4429;font-size:13px;box-shadow:0 2px 6px rgba(90,64,51,.18)}
#ui input[type=range]{-webkit-appearance:none;appearance:none;height:26px;background:transparent;cursor:pointer}
#ui input[type=range]::-webkit-slider-runnable-track{height:10px;border-radius:6px;background:#E7D2B2 url('assets/ui-walnut-target-v2.webp');background-size:120px;border:1px solid #C9A176;box-shadow:inset 0 1px 3px rgba(90,64,51,.35)}
#ui input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:20px;height:20px;margin-top:-6px;border:2px solid #725129;border-radius:50%;background:radial-gradient(circle at 35% 30%,#f6ddb0,#b88945 60%,#6f4a21);box-shadow:0 2px 3px rgba(50,30,16,.4)}
#ui input[type=range]::-moz-range-track{height:10px;border-radius:6px;background:#E7D2B2;border:1px solid #C9A176;box-shadow:inset 0 1px 3px rgba(90,64,51,.35)}
#ui input[type=range]::-moz-range-thumb{width:20px;height:20px;border:2px solid #725129;border-radius:50%;background:radial-gradient(circle at 35% 30%,#f6ddb0,#b88945 60%,#6f4a21);box-shadow:0 2px 3px rgba(50,30,16,.4)}
#ui input[type=text],#ui input[type=number],#ui input[type=url],#ui input[type=password],#ui input:not([type]),#ui select,#ui textarea{font-family:inherit;font-size:13px;color:#5A4033;background:#FFFDF6;border:2px solid #D8BC94;border-radius:8px;padding:3px 7px;box-shadow:inset 0 2px 4px rgba(120,85,45,.18)}
#ui input:focus,#ui select:focus{outline:none;border-color:#C97F2B}
.rail{position:absolute;top:46px;display:flex;flex-direction:column;gap:6px;z-index:6}
#railL{left:8px}
#railR{right:8px}
.rail button{pointer-events:auto;width:44px;height:44px;padding:6px;border-radius:12px;background:#F5E6C8 url('assets/ui-paper-target-v2.webp');background-size:200px;border:2px solid #B0895E;box-shadow:0 3px 8px rgba(90,64,51,.25), inset 0 1px 0 rgba(255,255,255,.6)}
.rail button:hover{border-color:#C97F2B}
.rail img{width:100%;height:100%;object-fit:contain;display:block}
#scrim{position:fixed;inset:0;background:rgba(40,28,20,.38);z-index:13;display:none;pointer-events:auto}
#owner-stick{position:fixed;left:max(14px,env(safe-area-inset-left));bottom:calc(96px + env(safe-area-inset-bottom));width:104px;height:104px;display:none;align-items:center;justify-content:center;pointer-events:auto;touch-action:none;z-index:7;border:3px solid #B0895E;border-radius:50%;background:radial-gradient(circle,#F5E6C899 0 45%,#8A5A3877 47% 100%);box-shadow:0 5px 16px #3a2c2066,inset 0 0 0 2px #fff6;overscroll-behavior:contain}
#owner-stick:after{content:'移动';position:absolute;top:calc(100% + 3px);left:50%;transform:translateX(-50%);padding:1px 7px;border-radius:9px;background:#3A2C20AA;color:#FFF8E6;font-size:11px;white-space:nowrap}
.owner-stick-knob{width:42px;height:42px;border:3px solid #725129;border-radius:50%;background:radial-gradient(circle at 35% 30%,#f6ddb0,#b88945 60%,#6f4a21);box-shadow:0 3px 7px #32200f88;will-change:transform}
#ui.compact.manual-owner #owner-stick{display:flex}
.mobile-manual{display:none}
#ui.compact .mobile-manual{display:inline-block}
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
.prompt-tabs{display:flex;gap:6px;position:sticky;top:-12px;z-index:2;padding:8px 0;background:#F5E6C8;flex-wrap:wrap}.prompt-tabs button{min-width:100px}.prompt-tabs button.on{background:#7A4BE0;color:#fff;border-color:#5E3EA0}.prompt-pane{display:none}.prompt-pane.on{display:block}.world-prompt-tabs,.world-builder-tabs{position:static;top:auto}.world-prompt-stage-pane{display:none}.world-prompt-stage-pane.on{display:block}.prompt-module-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:8px}.prompt-module{padding:8px 9px;border:2px solid #E3C9A4;border-radius:9px;background:#FFF8E9}.prompt-module textarea{width:100%;min-height:112px;box-sizing:border-box;margin-top:5px;resize:vertical;line-height:1.5}
.world-title{font-weight:900;border-color:var(--world-tint,#C9922F);box-shadow:0 0 0 1px color-mix(in srgb,var(--world-tint,#C9922F) 35%,transparent);white-space:nowrap}.world-picker{display:flex;gap:5px;overflow-x:auto;padding:4px 0 8px}.world-picker button{flex:0 0 auto}.world-card-tabs{position:static;background:transparent}.world-card-tabs button{min-width:70px}.world-card-body{min-height:280px;max-height:55vh;overflow:auto;padding-right:4px}.world-hero{display:flex;align-items:center;gap:14px;padding:14px;border:2px solid var(--world-card-tint);border-radius:12px;background:linear-gradient(135deg,#FFF8E9,color-mix(in srgb,var(--world-card-tint) 16%,#FFF8E9))}.world-hero h2{margin:0 0 4px}.world-glyph{font-size:46px;min-width:56px;text-align:center;color:var(--world-card-tint);text-shadow:0 2px 0 #fff}.world-timeline .card{border-left-color:var(--world-tint,#7A4BE0)}
.decision-toolbar{display:flex;gap:5px;flex-wrap:wrap;align-items:center;margin:6px 0}.decision-toolbar label{display:flex;align-items:center;gap:4px}.decision-toolbar select{max-width:116px}.candidate-card.recommended{border-left-color:#58A947;background:linear-gradient(135deg,#FFF8E9,#EAF8DE)}.candidate-summary{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.candidate-details{margin:4px 0}.candidate-details summary{cursor:pointer;color:#7A4BE0}.compare-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px}.compare-grid .card{min-width:0}.world-decision-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin:7px 0}.world-decision-grid .card{margin:0}.relation-meter{height:6px;border-radius:4px;background:#E1D0B5;overflow:hidden;margin-top:4px}.relation-meter i{display:block;height:100%;background:#7A4BE0}.filter-empty{padding:12px;text-align:center;border:1px dashed #C9A176;border-radius:8px;color:#87684e}
#tutorial-layer{position:fixed;inset:0;z-index:30;pointer-events:none;display:none}.tutorial-card{pointer-events:auto;position:absolute;left:50%;bottom:82px;transform:translateX(-50%);width:min(520px,calc(100vw - 24px));box-sizing:border-box;padding:12px 14px;border:3px solid #A77943;border-radius:14px;background:#FFF7E6 url('assets/ui-paper-target-v2.webp');background-size:240px;color:#5A4033;box-shadow:0 12px 35px #24170b77,inset 0 1px 0 #fff}.tutorial-head{display:flex;align-items:center;gap:8px}.tutorial-step{font-size:11px;color:#fff;background:#8A74B8;border-radius:999px;padding:2px 7px;white-space:nowrap}.tutorial-card h2{font-size:17px;margin:0;color:#9A5E22;flex:1}.tutorial-card p{margin:8px 0 6px;line-height:1.55}.tutorial-card ul{margin:5px 0 8px;padding-left:20px;line-height:1.5}.tutorial-card li+li{margin-top:3px}.tutorial-actions{display:flex;gap:6px;align-items:center;flex-wrap:wrap}.tutorial-actions .spacer{flex:1}.tutorial-hint{font-size:12px;color:#8A5B32}.tutorial-target{outline:4px solid #F3B84B!important;outline-offset:3px!important;filter:drop-shadow(0 0 7px #F3B84BCC);animation:tutorialPulse 1.15s ease-in-out infinite}.tutorial-satisfied{outline-color:#8DDB4A!important;filter:drop-shadow(0 0 7px #8DDB4ACC)}@keyframes tutorialPulse{50%{outline-offset:7px;filter:drop-shadow(0 0 12px #F3B84B)}}
.creator-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:8px}.creator-head h3{flex:1;margin:0}.creator-presets,.creator-groups,.creator-cats,.creator-actions{display:flex;gap:5px;flex-wrap:wrap}.creator-presets{margin-bottom:9px}.creator-layout{display:grid;grid-template-columns:minmax(270px,310px) minmax(330px,1fr);gap:12px;align-items:start;min-width:min(820px,88vw)}
.creator-preview{position:sticky;top:-10px;padding:9px;border:2px solid #D5B78B;border-radius:12px;background:#FFF8EAEF;box-shadow:0 4px 12px #684a3022}.creator-preview-art{display:grid;grid-template-columns:minmax(0,1fr) 108px;gap:7px;align-items:start}.creator-preview canvas{width:100%;height:auto;aspect-ratio:16/9}.creator-preview img.big{width:108px;height:144px}html.portrait-v2 .creator-preview-art{grid-template-columns:minmax(0,1fr) 120px}html.portrait-v2 .creator-preview img.big{width:120px;height:160px}.creator-pose{margin:5px 0 7px}.creator-identity{display:grid;grid-template-columns:1fr auto;gap:6px}.creator-identity label{display:flex;align-items:center;gap:5px}.creator-identity label span{white-space:nowrap;flex:0 0 auto}.creator-identity input{min-width:0;width:100%;box-sizing:border-box}.creator-personality{display:grid;grid-template-columns:90px 1fr 1fr;gap:5px;margin-top:6px;align-items:center}.creator-personality label{display:flex;flex-direction:column;gap:2px}.creator-personality label span{white-space:nowrap}.creator-personality input,.creator-personality select{width:100%;min-width:0;box-sizing:border-box}.creator-summary{margin:7px 0;padding:6px 8px;border-radius:8px;background:#E8D7B788}.creator-editor{min-width:0}.creator-groups{padding-bottom:7px;border-bottom:2px solid #E8CFA6}.creator-cats{margin:7px 0}.creator-cat-lock{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:7px 0}.creator-lock.on{background:#8A74B8!important;color:#fff!important;border-color:#66508F!important}.creator-options{max-height:390px;overflow:auto;padding:3px}.creator-options .sw{width:28px;height:28px}.creator-history button{min-width:34px}.creator-done{width:100%;margin-top:8px;border-color:#8DDB4A!important}
.owner-skill-presets{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px;margin:7px 0}.owner-skill-presets button{text-align:left;white-space:normal}.owner-skill-presets small{display:block;color:#87684e;margin-top:2px}.owner-growth{position:relative;overflow:hidden;border-left-color:#7A4BE0!important;background:linear-gradient(115deg,#fff7db,#efe3ff,#fff7db);animation:ownerGrowthGlow 1.6s ease-in-out infinite alternate}.owner-growth:after{content:'✦';position:absolute;right:12px;top:7px;color:#7A4BE0;font-size:24px;animation:ownerGrowthSpark 1.2s ease-in-out infinite}@keyframes ownerGrowthGlow{to{box-shadow:0 0 18px #9e72e866,inset 0 0 12px #fff}}@keyframes ownerGrowthSpark{50%{transform:scale(1.3) rotate(15deg);opacity:.45}}
.creator-background,.creator-ai-design{padding:9px 10px;border:2px solid #D9BC91;border-radius:11px;background:#FFF8E9;margin-bottom:9px}.creator-background-presets{display:flex;gap:5px;flex-wrap:wrap;margin:6px 0}.creator-background label{display:block;margin-top:6px}.creator-background input,.creator-background textarea,.creator-ai-design textarea{width:100%;box-sizing:border-box}.creator-background textarea{min-height:116px;resize:vertical;line-height:1.55}.creator-ai-design{border-color:#A78BD0;background:linear-gradient(135deg,#FFF8E9,#F2EAFE)}.creator-ai-design textarea{min-height:86px;resize:vertical;line-height:1.5}.creator-ai-skills{margin-top:5px;padding:5px 7px;border-radius:7px;background:#7A4BE014;color:#6A4B91}.creator-ai-status{margin-top:6px}.creator-ai-design button{border-color:#8D6CC0}.creator-ai-design.generating{animation:ownerGrowthGlow 1.4s ease-in-out infinite alternate}
@media(max-width:650px){#ui.compact .mbox:has(#cr){max-width:100vw;width:100vw;max-height:100vh;height:100vh;border-radius:0;padding:10px;box-sizing:border-box}.prompt-module-grid,.world-decision-grid,.compare-grid{grid-template-columns:1fr}.prompt-tabs button{flex:1;min-width:84px}.creator-head{position:sticky;top:-10px;z-index:4;background:#F5E6C8;padding:5px 0}.creator-layout{display:flex;flex-direction:column;min-width:0;width:100%;gap:9px}.creator-preview{position:static;width:100%;box-sizing:border-box}.creator-preview-art{grid-template-columns:minmax(0,1fr) 86px}.creator-preview img.big{width:86px;height:112px}html.portrait-v2 .creator-preview-art{grid-template-columns:minmax(0,1fr) 92px}html.portrait-v2 .creator-preview img.big{width:92px;height:123px}.creator-identity{grid-template-columns:1fr}.creator-personality{grid-template-columns:74px 1fr 1fr}.creator-groups{position:sticky;top:36px;z-index:3;background:#F5E6C8;padding:7px 0}.creator-groups button{flex:1;min-width:54px}.creator-cats{overflow-x:auto;flex-wrap:nowrap;padding-bottom:3px}.creator-cats button{flex:0 0 auto}.creator-options{max-height:none;overflow:visible}.creator-presets{overflow-x:auto;flex-wrap:nowrap}.creator-presets button{flex:0 0 auto}.tutorial-card{bottom:12px;max-height:58vh;overflow:auto;padding:10px 11px}.tutorial-card h2{font-size:15px}.tutorial-card p,.tutorial-card ul{font-size:12px}}

/* 商业版 UI 基础设计系统：集中覆盖旧样式，避免并行维护第二套组件。 */
#ui{--paper:#f2e7d2;--paper-clean:#fbf6eb;--paper-deep:#e4d3b6;--walnut:#24170f;--walnut-2:#3a2518;--ink:#39291f;--ink-muted:#786552;--brass:#9a763f;--brass-soft:#c2a36b;--oxblood:#7c241f;--positive:#5f8f42;--info:#3f8992;--rose:#c25d71;--warning:#c47a2c;--danger:#a64037;--line:#b9a17d;--portrait-face-y:14%;--ui-font:"Z Labs RoundPix 12px M CN","Microsoft YaHei UI","PingFang SC","Noto Sans CJK SC",sans-serif;font-family:var(--ui-font);font-size:16px;line-height:1.5;color:var(--ink);font-variant-numeric:tabular-nums;-webkit-font-smoothing:none;-moz-osx-font-smoothing:unset;font-smooth:never;text-rendering:optimizeLegibility}
#ui:after{content:"";position:absolute;inset:0;z-index:19;pointer-events:none;border:12px solid transparent;border-image:url('assets/ui-frame-ornament-v2.webp') 54 / 12px stretch}
#ui h1,#ui h2,#ui h3,#ui .ui-title{font-family:inherit;line-height:1.3;letter-spacing:.02em}
#ui button,#ui input,#ui select,#ui textarea,#ui label,#ui summary{font-family:inherit}
#ui button{box-sizing:border-box;font-size:15px;line-height:1.35;border-width:1px;border-color:var(--line);border-radius:4px;background-color:#ead8b9;background-image:linear-gradient(#fff9edc4,#dbc29bc4),url('assets/ui-paper-target-v2.webp');background-size:auto,220px;color:var(--ink);text-shadow:none;box-shadow:inset 0 0 0 1px #fff9df88,inset 0 -2px #8f66302b,0 1px 1px #2d1d1022;transition:background-color 160ms ease-out,border-color 160ms ease-out,transform 160ms ease-out,box-shadow 160ms ease-out,filter 160ms ease-out}
#ui button:hover{filter:none;border-color:var(--brass);background-color:#efdfc4;transform:translateY(-1px);box-shadow:inset 0 0 0 1px #fff9dfaa,inset 0 -2px #8f66303a,0 4px 8px #2d1d1033}
#ui button:focus-visible,#ui input:focus-visible,#ui select:focus-visible,#ui textarea:focus-visible,#ui summary:focus-visible{outline:2px solid var(--info);outline-offset:2px}
#ui button:active{transform:translateY(1px) scale(.98);box-shadow:inset 0 1px 2px #3c281c33}
#ui button.on{background:var(--oxblood);border-color:#571713;color:#fff9ec;text-shadow:none;box-shadow:inset 0 1px #ffffff22}
#ui button.warn{border-color:var(--danger);color:var(--danger);background:#fff5ec}
#ui button:disabled{opacity:.46;filter:grayscale(.35);cursor:not-allowed;transform:none}
#ui .card{border:1px solid var(--line);border-left-width:1px;border-radius:5px;padding:8px;margin-bottom:8px;background-color:var(--paper-clean);background-image:linear-gradient(#ffffff5c,#8f6d3320),url('assets/ui-paper-target-v2.webp');background-size:auto,280px;box-shadow:0 1px 0 #fff inset,0 0 0 1px #9a763f18;cursor:default;transition:border-color 160ms ease-out,box-shadow 160ms ease-out,transform 160ms ease-out}
#ui .card:hover{border-color:var(--brass);box-shadow:0 1px 0 #fff inset,0 4px 10px #3a210f2a,0 0 0 1px #9a763f33;transform:translateY(-1px)}
#ui .good{color:var(--positive)}#ui .bad{color:var(--danger)}#ui .hi{color:#865c23}#ui .dim{color:var(--ink-muted)}
.ui-icon{display:inline-block;width:1em;height:1em;vertical-align:-.12em;fill:none;stroke:currentColor;stroke-width:1.75;stroke-linecap:round;stroke-linejoin:round;pointer-events:none}
.metric-row{display:grid;grid-template-columns:20px 76px minmax(60px,1fr) 24px;align-items:center;gap:10px;min-height:28px;color:var(--ink);font-variant-numeric:tabular-nums}
.metric-row+.metric-row{margin-top:4px}.metric-icon{display:grid;place-items:center;width:20px;height:20px;color:var(--ink-muted)}.metric-icon .ui-icon{width:20px;height:20px}.metric-value{text-align:right;white-space:nowrap}.metric-band{font-size:13px;font-weight:700;text-align:center;white-space:nowrap}.metric-band.good{color:var(--positive)}.metric-band.bad{color:var(--danger)}.metric-band.neutral{color:var(--ink-muted)}
.metric-track{height:9px;border:1px solid #b7a486;border-radius:999px;background:#dfd4c1;overflow:hidden}.metric-track>i{display:block;height:100%;border-radius:inherit;background:var(--metric-color,var(--info))}
.skill-inline{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:3px;margin:7px 0}.skill-inline span{display:flex;flex-direction:column;align-items:center;gap:2px;min-width:0;font-size:11px;color:var(--ink-muted)}.skill-inline .ui-icon{width:16px;height:16px}.skill-inline b{font-weight:600;color:var(--ink)}
.portrait-safe{display:block;position:relative;flex:0 0 auto;overflow:hidden;border:1px solid #7e6a55;border-radius:4px;background:#d9d1c4;box-shadow:0 1px 2px #2b1d1433}.portrait-safe img{display:block;width:100%;height:100%;object-fit:cover;object-position:50% var(--portrait-face-y);image-rendering:auto}.portrait-main{width:108px;height:135px}.portrait-compare{width:128px;height:160px}.portrait-detail{width:112px;height:140px}.portrait-compact{width:72px;height:90px}.portrait-creator{width:120px;height:160px}.creator-preview .portrait-creator img.big{width:100%;height:100%}
.candidate-details,.mbox details{margin:6px 0}.candidate-details>summary,.mbox details>summary{position:relative;display:flex;align-items:center;min-height:36px;padding:0 8px 0 32px;cursor:pointer;color:var(--ink);list-style:none;border-radius:3px}.candidate-details>summary::-webkit-details-marker,.mbox details>summary::-webkit-details-marker{display:none}.candidate-details>summary:before,.mbox details>summary:before{content:"";position:absolute;left:12px;width:7px;height:7px;border-right:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(-45deg);transition:transform .12s}.candidate-details[open]>summary:before,.mbox details[open]>summary:before{transform:rotate(45deg)}
.portrait-head{gap:12px}.candidate-card>.row:first-child{align-items:flex-start}
#ui .pane{border:7px solid transparent;border-image:url('assets/ui-frame-ornament-v2.webp') 54 / 7px stretch;border-radius:3px;background-color:var(--paper);background-image:linear-gradient(#ffffff28,#79572812),url('assets/ui-paper-target-v2.webp');background-size:auto,360px;box-shadow:0 3px 12px #170d0840,inset 0 0 0 1px #fff8df99,inset 0 0 18px #8f62221a}
#top{left:8px;right:8px;top:8px;height:72px;min-height:72px;box-sizing:border-box;padding:0 8px;gap:0;border-radius:0;background-color:var(--paper);background-image:linear-gradient(#ffffff26,#74522615),url('assets/ui-paper-target-v2.webp');background-size:auto,360px;border-color:var(--brass);box-shadow:0 2px 8px #160d0744,inset 0 -2px #a27b3e33;overflow-x:auto;font-size:17px;scrollbar-width:none}#top::-webkit-scrollbar{display:none}
#top .top-group{display:flex;align-items:center;align-self:stretch;gap:8px;padding:0 12px;border-right:1px solid #9a763f;box-shadow:inset -1px 0 #fff9e788;flex:0 0 auto}
#top .top-identity{min-width:205px;box-sizing:border-box;justify-content:center;padding-left:12px}.top-identity .brand-title{border:0;background:transparent;box-shadow:none;padding:0 10px;font-family:var(--ui-font);font-size:22px;font-weight:400;color:var(--oxblood);letter-spacing:.08em}.top-identity .brand-title:hover,.top-identity .brand-title:active{background:#7c241f0b;border-color:transparent;transform:none;box-shadow:none}.top-date{font-weight:600}.top-day-state{display:flex;align-items:center;gap:6px}.top-speed button{min-width:48px;height:48px;padding:4px 10px}.top-economy{min-width:405px;box-sizing:border-box;justify-content:center;font-variant-numeric:tabular-nums}.top-economy .ui-icon{width:18px;height:18px;color:#a97820}.top-status{display:flex;gap:8px;align-items:center}.top-status:empty{display:none}.top-actions{margin-left:auto;border-right:0!important}.top-actions>button,.top-actions-secondary button,.top-overflow-menu button{min-height:44px;padding:6px 14px;display:inline-flex;align-items:center;justify-content:center;gap:6px}.top-actions>button .ui-icon,.top-actions-secondary button .ui-icon,.top-overflow-menu button .ui-icon{width:16px;height:16px;flex:0 0 auto}.top-actions>button[data-act="readiness"]{min-width:124px}.top-actions>button[data-act="savemenu"]{min-width:100px}.top-actions-secondary{display:inline-flex;gap:5px;align-items:center}.top-actions-secondary button{min-height:44px;padding:6px 14px}.top-overflow{display:none;position:relative}.top-overflow>button{min-width:36px;min-height:44px;padding:6px 10px}.top-overflow-menu{display:none;position:fixed;top:78px;right:12px;min-width:150px;max-width:90vw;padding:8px;border:2px solid #B0895E;border-radius:10px;background:#F5E6C8 url('assets/ui-paper-target-v2.webp');background-size:420px;box-shadow:0 6px 18px rgba(0,0,0,.25);z-index:100;flex-direction:column;gap:5px}.top-overflow.open .top-overflow-menu{display:flex;animation:uiMenuIn 160ms ease-out}.top-overflow-menu button{width:100%;text-align:left;justify-content:flex-start}.primary-action{background:var(--oxblood)!important;border-color:#571713!important;color:#fff9ec!important;font-weight:700;min-width:112px;box-shadow:inset 0 1px #ffffff2b,0 1px 2px #2b100d44!important}.primary-action:hover{background:#912f28!important}
#left,#right{top:88px;bottom:92px;max-height:none;box-sizing:border-box;padding:22px;overflow:auto}#left{width:300px}#right{width:clamp(400px,28vw,460px)}
#bottom{height:76px;min-height:76px;left:8px;right:8px;bottom:8px;box-sizing:border-box;padding:0 16px;display:flex;align-items:center;overflow:hidden;transition:height .14s,max-height .14s}#bottom.bottom-expanded{height:auto;min-height:76px;max-height:32vh;align-items:flex-start;padding:12px 16px;overflow:auto}#bottom>*{width:100%}.bottom-shell{display:grid;grid-template-columns:32px minmax(0,1fr) 48px;align-items:center;gap:12px;min-height:74px}.bottom-info{display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:#6a4a2e;color:#fff8e7;font-family:var(--ui-font);font-weight:400}.bottom-content{min-width:0}.bottom-toggle{width:48px;height:42px;padding:0!important}.bottom-panel-mark{display:inline-block;width:20px;height:15px;border:1.5px solid currentColor;border-radius:2px;box-shadow:inset 0 4px currentColor;opacity:.8}#bottom.bottom-collapsed .bottom-content{display:none}#bottom.bottom-collapsed .bottom-shell{grid-template-columns:32px 1fr 48px}
#left>.tabs,#right>.tabs{position:sticky;top:-22px;z-index:4;margin:-22px -22px 14px;padding:12px 10px 10px;background:color-mix(in srgb,var(--paper) 96%,transparent);border-bottom:1px solid var(--line)}
.tabs button{min-height:58px;display:flex;align-items:center;justify-content:center;gap:5px;border:3px solid transparent;border-image:url('assets/ui-frame-ornament-v2.webp') 72 / 3px stretch;box-shadow:inset 0 0 0 1px #fff7df99,inset 0 -2px #6f481f25;transition:transform 160ms ease-out,box-shadow 160ms ease-out,background-color 160ms ease-out}.tabs button:hover{transform:translateY(-1px);box-shadow:inset 0 0 0 1px #d8ad6466,inset 0 -2px #6f481f35,0 3px 8px #24160d22}.tabs button.on{box-shadow:inset 0 0 0 1px #d8ad6466,inset 0 -3px #35100e55}.tabs .ui-icon{width:18px;height:18px}.tabs button.fold{flex:0 0 42px;width:42px;height:42px;padding:0}.panel-collapse-mark{display:inline-block;position:relative;width:19px;height:16px;border:1.5px solid currentColor;border-radius:2px}.panel-collapse-mark:before{content:"";position:absolute;top:1px;bottom:1px;width:4px;background:currentColor;opacity:.55}.panel-collapse-mark.left:before{left:1px}.panel-collapse-mark.right:before{right:1px}
.rail{top:88px;bottom:92px;gap:12px;padding:9px 10px;border:1px solid #765735;background-color:var(--walnut);background-image:linear-gradient(90deg,#00000038,#ffffff0b 45%,#0000003b),url('assets/ui-walnut-target-v2.webp');background-size:auto,260px;box-shadow:0 2px 8px #0c070577,inset 0 0 0 1px #c49a5526}#ui .rail button{width:72px;height:72px;padding:18px;border:1px solid #a27c43;border-radius:3px;background-color:var(--walnut-2);background-image:linear-gradient(#ffffff12,#00000025),url('assets/ui-walnut-target-v2.webp');background-size:auto,220px;color:var(--brass-soft);box-shadow:0 2px 6px #0c070555,inset 0 0 0 1px #e0b96a20}#ui .rail button:hover{border-color:#d0aa65;background-color:#49301f;background-image:linear-gradient(#ffffff1d,#00000015),url('assets/ui-walnut-target-v2.webp');transform:translateY(-2px) scale(1.04);box-shadow:0 8px 14px #0c070566,inset 0 0 0 1px #e0b96a55,0 0 12px #d0aa6540}#ui .rail button:active{transform:translateY(1px) scale(.98)}#ui .rail button .ui-icon{width:30px;height:30px}.rail .notice-dot{position:absolute;right:-4px;top:-4px}
.staff-summary{margin-bottom:20px!important;padding:3px 0;font-size:17px}.staff-recruit-entry{width:100%;min-height:48px;font-family:inherit;font-size:18px}.recruitment-head{position:sticky;top:67px;z-index:3;display:flex;align-items:center;gap:8px;margin:0 -2px 10px;padding:8px 2px;background:color-mix(in srgb,var(--paper) 96%,transparent);border-bottom:1px solid var(--line)}.recruitment-head h3{flex:1;margin:0;text-align:center}
.staff-card{box-sizing:border-box;min-width:0;overflow:hidden;min-height:260px;padding:10px!important;margin-bottom:10px!important}.staff-card-grid{display:grid;grid-template-columns:108px minmax(0,1fr);gap:16px;align-items:start;min-width:0}.staff-card-main{min-width:0;overflow:hidden}.staff-card-head{display:flex;align-items:flex-start;gap:8px;min-height:42px}.staff-identity{min-width:0}.staff-identity b{font-family:inherit;font-size:20px}.staff-role-tag{display:inline-block;margin-left:7px;padding:2px 7px;border-radius:3px;background:var(--paper-deep);color:var(--ink-muted);font-size:13px;font-weight:400;white-space:nowrap}.staff-metrics{margin:28px 0 8px;padding:9px 0 0;border-top:1px solid #ded1ba;min-width:0;overflow:hidden}.staff-metrics .metric-row{grid-template-columns:18px 64px minmax(32px,1fr) 22px;gap:6px}.staff-current{display:block;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.staff-detail-action{position:relative;flex:0 0 36px;width:36px;height:36px;padding:0!important}.staff-detail-mark{position:absolute;left:12px;top:10px;width:9px;height:9px;border-right:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(-45deg)}
.sr-only{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}.notice-dot{display:inline-block;position:relative;flex:0 0 auto;width:12px;height:12px;margin-left:4px;border:1px solid #7c1e19;border-radius:50%;background:radial-gradient(circle at 35% 30%,#e65442 0 18%,#b72c25 22% 64%,#7d1c18 68%);box-shadow:0 1px 1px #2c0d0a66,inset 0 0 0 1px #f28a7355;vertical-align:middle}.tabs button>.notice-dot{position:absolute;right:2px;top:2px;margin:0}.rail button>.notice-dot{position:absolute;right:-4px;top:-4px;margin:0}.modal-notice{position:absolute;z-index:3;right:46px;top:12px}
.mbox.modal-plain{border:1px solid var(--line);border-radius:5px;background:var(--paper-clean) url('assets/ui-paper-target-v2.webp');background-size:360px;box-shadow:0 10px 28px #170e0966}.mbox.modal-important{border:2px solid var(--brass);border-radius:4px;background:var(--paper-clean) url('assets/ui-paper-target-v2.webp');background-size:360px;box-shadow:0 14px 36px #120a066e,0 0 0 3px #2d1d13}.mbox.modal-important>h3:first-of-type{margin:-14px -14px 14px;padding:11px 48px 10px 14px;border:0;border-bottom:2px solid var(--brass);background-color:var(--walnut);background-image:linear-gradient(90deg,#1d120c99,#382319aa),url('assets/ui-walnut-target-v2.webp');background-size:auto,360px;color:#f4dfb8}.mbox.modal-danger{border:2px solid var(--danger);border-radius:4px;background:#fff5eb url('assets/ui-paper-target-v2.webp');background-size:360px;box-shadow:0 14px 36px #2d0b0866}.mbox.modal-danger>h3:first-of-type{color:var(--danger);border-bottom-color:#d5a19a}
.metric-row.with-label{grid-template-columns:18px 38px 34px minmax(48px,1fr) 22px}.metric-label{font-size:12px;white-space:nowrap}.metric-row.with-label .metric-value{font-weight:700}
.compare-tray{position:sticky;bottom:-10px;z-index:5;margin:10px -10px -10px;padding:9px 10px;border-top:1px solid var(--brass);background:linear-gradient(#f8f1e5f5,#e8d8bcf8);box-shadow:0 -5px 12px #24160d22}.compare-tray button{min-width:112px}.mbox:has(.candidate-compare-modal){width:min(1120px,96vw);max-width:min(1120px,96vw)}.candidate-compare-modal{width:100%}.candidate-compare-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px}.candidate-compare-head .spacer{flex:1}.compare-person-tabs{display:flex;gap:5px;flex-wrap:wrap}.compare-grid{display:grid;grid-template-columns:repeat(var(--compare-count,3),minmax(250px,1fr));gap:10px;align-items:stretch}.compare-column{display:flex;flex-direction:column;min-width:0;padding:10px;border:1px solid var(--line);border-radius:4px;background:#fffaf0}.compare-column.focused{border-color:var(--oxblood);box-shadow:inset 0 0 0 1px var(--oxblood)}.compare-portrait{display:flex;justify-content:center;margin-bottom:8px}.compare-identity{text-align:center;min-height:68px}.compare-identity h4{margin:0 0 4px;font-family:inherit;font-size:17px}.compare-analysis{min-height:44px;margin:8px 0;padding:7px;border:1px solid #d8c9af;border-radius:3px;background:#f4ead8}.compare-skills{display:grid;gap:3px;margin-top:4px}.compare-skills .metric-row{position:relative;padding:2px 4px;border-radius:3px}.compare-skills .gap-focus{padding-right:38px;background:repeating-linear-gradient(135deg,#8a612314 0 6px,#8a612306 6px 12px);box-shadow:inset 3px 0 var(--warning)}.compare-skills .gap-focus:after{content:"缺口";position:absolute;right:3px;top:50%;transform:translateY(-50%);font-size:10px;font-weight:700;color:#86551c}.compare-column details{margin-top:8px}.compare-column-actions{margin-top:auto;padding-top:8px}.compare-hire{background:var(--oxblood)!important;border-color:#571713!important;color:#fff9ec!important;font-weight:700;min-width:160px}.compare-footer{display:flex;justify-content:flex-end;align-items:center;gap:8px;margin-top:12px;padding-top:10px;border-top:1px solid var(--line)}
@media(max-width:650px){.metric-row{grid-template-columns:18px 56px minmax(44px,1fr) 22px}.skill-inline{grid-template-columns:repeat(4,minmax(0,1fr))}}
@media(max-width:650px){.candidate-compare-modal{width:94vw}.compare-grid{grid-template-columns:1fr}.compare-column:not(.focused){display:none}.compare-column{font-size:14px}.compare-footer{position:sticky;bottom:-14px;margin:10px -14px -14px;padding:10px 14px;background:var(--paper-clean)}.metric-row.with-label{grid-template-columns:18px 40px 36px minmax(64px,1fr) 22px}}
@media(max-width:1040px){#ui.compact{font-size:14px}#ui.compact button{font-size:13px}#ui.compact #top{height:40px;min-height:40px;padding:0 4px;gap:0;scrollbar-width:none}#ui.compact #top::-webkit-scrollbar{display:none}#ui.compact #top .top-group{padding:0 7px}#ui.compact #top .top-identity{display:none}#ui.compact #top .top-economy{min-width:0}#ui.compact #top .top-status,#ui.compact #top .top-actions-secondary{display:none}#ui.compact #top .top-actions>button,#ui.compact .top-overflow>button{min-width:0;min-height:30px;padding:2px 7px}#ui.compact .top-overflow-menu{top:46px;right:4px}#ui.compact #left,#ui.compact #right{top:44px;bottom:0;width:min(90vw,400px);max-height:none;padding:10px}#ui.compact #left>.tabs,#ui.compact #right>.tabs{top:-10px;margin:-10px -10px 10px;padding:8px 8px 7px}#ui.compact .tabs button{min-height:34px}#ui.compact .tabs button.fold{width:36px;height:36px;flex-basis:36px}#ui.compact .rail{top:48px;bottom:52px}#ui.compact #bottom{height:44px;min-height:0;max-height:32vh}#ui.compact .metric-row{grid-template-columns:18px 56px minmax(48px,1fr) 22px;gap:6px;min-height:24px}#ui.compact .metric-row+.metric-row{margin-top:4px}#ui.compact .metric-icon,#ui.compact .metric-icon .ui-icon{width:18px;height:18px}#ui.compact .metric-band{font-size:11px}#ui.compact .metric-track{height:7px}#ui.compact .portrait-main{width:88px;height:110px}#ui.compact .staff-summary{margin-bottom:8px!important;padding:0;font-size:14px}#ui.compact .staff-card{min-height:0;padding:10px!important;margin-bottom:8px!important}#ui.compact .staff-card-grid{grid-template-columns:88px minmax(0,1fr);gap:14px}#ui.compact .staff-card-head{min-height:36px}#ui.compact .staff-identity b{font-size:17px}#ui.compact .staff-role-tag{margin-left:6px;padding:1px 6px;font-size:11px}#ui.compact .staff-metrics{margin:8px 0 6px;padding:7px 0 0}#ui.compact .staff-metrics .metric-row{grid-template-columns:18px 56px minmax(32px,1fr) 22px;gap:6px}}
#ui.material-hd:after{border-image-source:url('assets/ui-frame-ornament-v3.webp');filter:drop-shadow(0 2px 2px #120904aa)}
#ui.material-hd .pane{border-width:9px;border-image:url('assets/ui-frame-ornament-v3.webp') 54 / 9px stretch;background-image:linear-gradient(135deg,#fffdf877 0%,#ead5ae44 48%,#aa794a1f 100%),url('assets/ui-paper-target-v2.webp');box-shadow:0 5px 18px #10090566,inset 0 1px #fffdf5cc,inset 0 -3px 12px #72451622}
#ui.material-hd .top-actions,#ui.material-hd .top-actions-secondary{gap:10px}
#ui.material-hd :is(.top-actions>button,.top-actions-secondary button,.top-overflow>button,.top-overflow-menu button,.primary-action,.staff-recruit-entry,.compare-hire,.compare-tray button){position:relative;isolation:isolate;overflow:visible;border:2px solid #c9a25a;border-radius:9px;border-image:none;background-color:#ead1a8;background-image:linear-gradient(180deg,#fff8e6 0%,#f0dcb6 48%,#e0c396 100%);color:#52331e;box-shadow:inset 0 1px #fffdf6cc,inset 0 -2px #8a623028,0 2px 4px #2b160b33;padding-left:18px;padding-right:18px}
#ui.material-hd :is(.top-actions>button,.top-actions-secondary button,.top-overflow>button,.top-overflow-menu button,.primary-action,.staff-recruit-entry,.compare-hire,.compare-tray button):before,#ui.material-hd :is(.top-actions>button,.top-actions-secondary button,.top-overflow>button,.top-overflow-menu button,.primary-action,.staff-recruit-entry,.compare-hire,.compare-tray button):after{content:"";position:absolute;top:50%;width:16px;height:112%;pointer-events:none;background:url('assets/ui-button-flourish-v3.webp') center/contain no-repeat;transform:translateY(-50%);z-index:1}
#ui.material-hd :is(.top-actions>button,.top-actions-secondary button,.top-overflow>button,.top-overflow-menu button,.primary-action,.staff-recruit-entry,.compare-hire,.compare-tray button):before{left:-8px}
#ui.material-hd :is(.top-actions>button,.top-actions-secondary button,.top-overflow>button,.top-overflow-menu button,.primary-action,.staff-recruit-entry,.compare-hire,.compare-tray button):after{right:-8px;transform:translateY(-50%) scaleX(-1)}
#ui.material-hd :is(.top-actions>button,.top-actions-secondary button,.top-overflow>button,.top-overflow-menu button,.primary-action,.staff-recruit-entry,.compare-hire,.compare-tray button):hover{border-color:#d8b56a;background-image:linear-gradient(180deg,#fffaf0 0%,#f4e3c4 48%,#e8d0a8 100%);transform:translateY(-1px);box-shadow:inset 0 1px #fffdf6ee,0 5px 10px #2b160b44}
#ui.material-hd button.on,#ui.material-hd .primary-action{background-image:linear-gradient(180deg,#a54339 0%,#7f2823 48%,#531612 100%)!important;border-color:#d4b06a!important;color:#fff5dc!important;text-shadow:0 1px #2a0908!important;box-shadow:inset 0 1px #ffd6c433,0 3px 7px #2d090955}
#ui.compact.material-hd :is(.top-actions>button,.top-actions-secondary button,.top-overflow>button,.top-overflow-menu button,.primary-action,.staff-recruit-entry,.compare-hire,.compare-tray button):before,#ui.compact.material-hd :is(.top-actions>button,.top-actions-secondary button,.top-overflow>button,.top-overflow-menu button,.primary-action,.staff-recruit-entry,.compare-hire,.compare-tray button):after{display:none}
#ui.material-hd .card{border-color:#aa8350;background-image:linear-gradient(145deg,#fffdf4a6,#efd9b466 52%,#b8844921),url('assets/ui-paper-target-v2.webp');box-shadow:0 3px 8px #3a210f24,inset 0 1px #fffdf1e8,inset 0 0 0 1px #d5aa6a4d}
#ui.material-hd #top .top-group{border-right-color:#9b6c30;box-shadow:inset -1px 0 #fff9e7c9,inset -3px 0 #6a421522}
#ui.material-hd #left>.tabs,#ui.material-hd #right>.tabs{border-bottom:2px solid #b08143;box-shadow:0 3px 7px #2b170b22,inset 0 -1px #fff7da}
@keyframes uiModalIn{from{opacity:0}to{opacity:1}}
@keyframes uiMboxIn{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}
@keyframes uiToastIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
@keyframes uiMenuIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
.mbox{animation:uiMboxIn 200ms cubic-bezier(.2,.7,.2,1)}
@media(prefers-reduced-motion:reduce){#ui *,#ui *:before,#ui *:after{transition-duration:0.01ms!important;animation-duration:0.01ms!important;animation-iteration-count:1!important}}
.creator-footer{position:sticky;bottom:0;z-index:6;margin:10px -14px -14px;padding:10px 14px;background:linear-gradient(#fff8eae8,#f5e6c8);border-top:1px solid var(--line)}
.creator-footer .creator-done{width:100%;margin-top:0}
.creator-footer [data-act="closemodal"]{width:100%;margin-top:6px}
@media (max-width:1899px){.top-actions-secondary{display:none}.top-overflow{display:inline-flex}}
@media (max-width:1040px) and (orientation:landscape){#ui.compact.manual-owner #owner-stick{left:max(96px,calc(env(safe-area-inset-left) + 88px))}#ui.compact.manual-owner.left-open #owner-stick{left:auto;right:max(14px,env(safe-area-inset-right))}}
@media(max-width:650px){.creator-footer{margin:10px -10px -10px;padding:10px}}
`;

function el(html        )              {
  const d = document.createElement('div');
  d.innerHTML = html.trim();
  return d.firstElementChild               ;
}

const ORDER_STAGE                         = {
  queued: '排队', prep: '备餐', cook: '下锅', ready: '待上菜', served: '已上菜', void: '作废',
};

export const PURCHASE_ACTIONS = Object.freeze(['hire', 'uproom', 'upfurn', 'buy', 'rstyle', 'adpost', 'rdgo', 'trainingchoice', 'staffequip', 'staffperk']);

export function metricLevel(value, max = 100, polarity = 'positive') {
  const pct = Math.max(0, Math.min(100, (Number(value) || 0) / Math.max(1, Number(max) || 100) * 100));
  const band = pct <= 33 ? 'low' : pct <= 66 ? 'mid' : 'high';
  const label = band === 'low' ? '低' : band === 'mid' ? '中' : '高';
  const tone = band === 'mid' ? 'neutral' : polarity === 'negative'
    ? (band === 'low' ? 'good' : 'bad') : (band === 'high' ? 'good' : 'bad');
  return { band, label, tone };
}

export function uiIcon(name, label = '') {
  const safeName = String(name || 'log').replace(/[^a-z-]/g, '');
  const aria = label ? `role="img" aria-label="${htmlText(label)}"` : 'aria-hidden="true"';
  return `<svg class="ui-icon" ${aria}><use href="assets/ui-icons.svg#icon-${safeName}"></use></svg>`;
}

export function noticeDot(active, label = '有新内容或待处理事项') {
  return active ? `<span class="notice-dot" role="status" aria-label="${htmlText(label)}" title="${htmlText(label)}"><span class="sr-only">${htmlText(label)}</span></span>` : '';
}

export function joystickVector(clientX, clientY, rect) {
  const radius = Math.max(1, Math.min(rect.width, rect.height) * 0.34);
  const dx = clientX - rect.left - rect.width / 2;
  const dy = clientY - rect.top - rect.height / 2;
  const scale = Math.min(1, radius / (Math.hypot(dx, dy) || 1));
  return { x: dx * scale / radius, y: dy * scale / radius, knobX: dx * scale, knobY: dy * scale };
}

export function isCoarsePointer(media = globalThis.matchMedia, nav = globalThis.navigator) {
  if (typeof media === 'function') {
    try {
      if (media('(pointer: coarse)')?.matches) return true;
    } catch { /* 旧内核可能不支持 pointer 查询 */ }
  }
  return Number(nav?.maxTouchPoints || 0) > 0;
}

export function idleMapHint(touch = isCoarsePointer()) {
  return touch
    ? '点选房间/家具/角色；单指拖移地图，双指缩放；暂停、建造、旋转请用界面按钮。'
    : '左键选择房间/家具/角色；中键或 WASD 平移，滚轮缩放，空格暂停，B 建造，R 旋转，Delete 拆除。';
}

export function metricRow({ icon, label, value, max = 100, color = 'var(--info)', polarity = 'positive', showLabel = false, compactValue = false, padValue = 0, className = '' }) {
  const safeMax = Math.max(1, Number(max) || 100);
  const safeValue = Math.max(0, Math.min(safeMax, Number(value) || 0));
  const pct = Math.round(safeValue / safeMax * 1000) / 10;
  const level = metricLevel(safeValue, safeMax, polarity);
  const fullValue = `${Math.round(safeValue)}/${Math.round(safeMax)}`;
  const textValue = compactValue ? String(Math.round(safeValue)).padStart(2, '0') : padValue ? `${String(Math.round(safeValue)).padStart(padValue, '0')}/${Math.round(safeMax)}` : fullValue;
  const safeClass = String(className || '').replace(/[^a-z0-9_-]+/gi, ' ').trim();
  return `<div class="metric-row metric-${level.band}${showLabel ? ' with-label' : ''}${safeClass ? ` ${safeClass}` : ''}" aria-label="${htmlText(label)} ${fullValue}，${level.label}"><span class="metric-icon" title="${htmlText(label)}">${uiIcon(icon)}</span>${showLabel ? `<span class="metric-label">${htmlText(label)}</span>` : ''}<span class="metric-value">${textValue}</span><span class="metric-track" aria-hidden="true"><i style="width:${pct}%;--metric-color:${htmlText(color)}"></i></span><span class="metric-band ${level.tone}">${level.label}</span></div>`;
}

export function portraitFrame(app, size = 'main', alt = '') {
  const safeSize = ['main', 'compare', 'detail', 'compact', 'creator'].includes(size) ? size : 'main';
  const imageClass = safeSize === 'creator' ? ' class="big"' : '';
  return `<span class="portrait-safe portrait-${safeSize}"><img${imageClass} src="${htmlText(portraitURL(app))}" alt="${htmlText(alt)}"></span>`;
}

export function toggleCandidateComparison(current, id, limit = 3) {
  const next = new Set(current || []);
  if (next.has(id)) next.delete(id);
  else if (next.size < limit) next.add(id);
  return next;
}

function recruitmentNoticeToken(ad) {
  return ad?.spec ? `${ad.day}:${(ad.cands || []).map((person) => person.id).join(',')}` : '';
}

/** 只根据未读与待处理数据生成通知；无状态的导航项必须保持 false。 */
export function navNoticeState(sim) {
  if (!sim) return { staff: false, world: false, task: false, econ: false, menu: false, room: false, furn: false };
  const econ = sim.econ || {};
  const staff = (sim.ads || []).some((ad, slot) => ad?.spec && (ad.cands || []).length
    && econ.recruitmentSeen?.[slot] !== recruitmentNoticeToken(ad));
  const world = (typeof sim.worlds === 'function' ? sim.worlds() : []).some((item) =>
    (Number(econ.worldKnowledge?.[item.id]?.level) || 0) > (Number(econ.worldSeenLevels?.[item.id]) || 0));
  const task = (typeof sim.workQueue === 'function' ? sim.workQueue() : []).some((item) => !item.staff);
  const lowStock = Object.values(econ.stock || {}).some((amount) => Number(amount) < 10);
  const econNotice = lowStock || Number(econ.strikes) > 0 || !!econ.pendingCertification || !!sim.pendingCertification;
  const menu = (typeof sim.allDishes === 'function' && typeof sim.dishStatus === 'function' ? sim.allDishes() : [])
    .some((dish) => { const status = sim.dishStatus(dish); return status.on && (!status.facility || !status.skillOk || !status.stockOk); });
  return { staff, world, task, econ: econNotice, menu, room: false, furn: false };
}

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
  aiGuestChatSession = null;
  chatAIController = null;
  pendingAIChat = null;
  settlementAIController = null;
  creatorAIController = null;
  adAIController = null;
  dynamicAIStatus = null;
  dynamicAIController = null;
  collapsed = { left: false, right: false };
  compact = false;
          railL             ;
          railR             ;
          chatterBox             ;
          scrim             ;
          tutorialLayer             ;
          ownerStick             ;
          tutorialState = null;
          tutorialActive = false;
          tutorialSlot = 0;
          tutorialRenderKey = '';
          acc = 0;
          interactionLock = false;
          interactionRelease = 0;
  purchaseConfirm = null;
  customWorldActiveTab = 'concept';
  customWorldResultNotice = false;
  worldPromptActiveStage = 'world_concept';
  candidateSort = 'gap';
  candidateJobFilter = 'all';
  candidateWorldFilter = 'all';
  candidateCompareIds = new Set();
  candidateCompareFocusId = 0;
  candidateGapHighlight = true;
  staffView = 'list';
  bottomCollapsed = false;
  topOverflowOpen = false;
  worldFilter = 'all';
  noticeState = { staff: false, world: false, task: false, econ: false, menu: false, room: false, furn: false };
          panelHTML = new WeakMap();

  constructor(g         ) {
    this.g = g;
    if (typeof document !== 'undefined' && !document.querySelector('link[href*="fontsapi.zeoseven.com/995"]')) {
      const font = document.createElement('link');
      font.rel = 'stylesheet';
      font.href = 'https://fontsapi.zeoseven.com/995/main/result.css';
      font.crossOrigin = 'anonymous';
      document.head.appendChild(font);
    }
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    this.root = el('<div id="ui"></div>');
    this.root.classList.toggle('material-hd', this.g.materialPack === 'hd');
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
    this.tutorialLayer = el('<div id="tutorial-layer"></div>');
    this.ownerStick = el('<div id="owner-stick" role="group" aria-label="店主移动摇杆"><div class="owner-stick-knob" aria-hidden="true"></div></div>');
    this.root.append(this.top, this.left, this.right, this.bottom, this.toastBox, this.chatterBox, this.railL, this.railR, this.scrim, this.ownerStick, this.tutorialLayer);
    this.bindOwnerStick();
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
    window.addEventListener('portrait-v2-assets-changed', () => this.render(true));
    this.root.addEventListener('click', (e) => this.onClick(e));
    document.addEventListener('pointerdown', (e) => {
      if (!this.topOverflowOpen) return;
      if (e.target?.closest?.('.top-overflow')) return;
      this.topOverflowOpen = false;
      this.renderTop();
    }, true);
    this.root.addEventListener('change', (e) => this.onChange(e));
    this.root.addEventListener('toggle', (e) => {
      const details = e.target;
      if (!(details instanceof HTMLDetailsElement)) return;
      details.querySelector(':scope > summary')?.setAttribute('aria-expanded', String(details.open));
    }, true);
    this.root.addEventListener('input', (e) => {
      const target = e.target;
      if (target?.dataset?.act === 'adworldname') this.adSpec.customWorldName = target.value;
    });
  }

  bindOwnerStick() {
    const knob = this.ownerStick.querySelector('.owner-stick-knob');
    let pointerId = null;
    let touchId = null;
    const touchCapable = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    const apply = (clientX, clientY) => {
      const v = joystickVector(clientX, clientY, this.ownerStick.getBoundingClientRect());
      this.g.setManualInput(v.x, v.y);
      knob.style.transform = `translate(${v.knobX}px,${v.knobY}px)`;
    };
    const reset = () => {
      this.g.setManualInput(0, 0);
      knob.style.transform = '';
    };
    const move = (e) => {
      if (e.pointerId !== pointerId) return;
      e.preventDefault(); e.stopPropagation();
      apply(e.clientX, e.clientY);
    };
    const stop = (e) => {
      if (e.pointerId !== pointerId) return;
      e.preventDefault(); e.stopPropagation(); pointerId = null;
      reset();
    };
    this.ownerStick.addEventListener('pointerdown', (e) => {
      // Android 浏览器走下面的原生 touch 路径，绕过部分内核不可靠的指针捕获。
      if (touchCapable && e.pointerType === 'touch') return;
      if (!this.g.sim.manualOwner) return;
      pointerId = e.pointerId; this.ownerStick.setPointerCapture?.(pointerId); move(e);
    });
    this.ownerStick.addEventListener('pointermove', move);
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
    this.ownerStick.addEventListener('lostpointercapture', stop);

    const activeTouch = (touches) => Array.from(touches).find((touch) => touch.identifier === touchId);
    this.ownerStick.addEventListener('touchstart', (e) => {
      if (!this.g.sim.manualOwner || touchId !== null || !e.changedTouches.length) return;
      const touch = e.changedTouches[0];
      touchId = touch.identifier;
      e.preventDefault(); e.stopPropagation();
      apply(touch.clientX, touch.clientY);
    }, { passive: false });
    window.addEventListener('touchmove', (e) => {
      const touch = activeTouch(e.touches);
      if (!touch) return;
      e.preventDefault(); e.stopPropagation();
      apply(touch.clientX, touch.clientY);
    }, { passive: false });
    const stopTouch = (e) => {
      if (!activeTouch(e.changedTouches)) return;
      e.preventDefault(); e.stopPropagation();
      touchId = null;
      reset();
    };
    window.addEventListener('touchend', stopTouch, { passive: false });
    window.addEventListener('touchcancel', stopTouch, { passive: false });
  }

  setPanelHTML(node        , html        )       {
    if (this.panelHTML.get(node) === html) return;
    const top = node.scrollTop, left = node.scrollLeft;
    node.innerHTML = html;
    node.scrollTop = top; node.scrollLeft = left;
    this.panelHTML.set(node, html);
  }

  setBottomHTML(html        )       {
    this.setPanelHTML(this.bottom, `<div class="bottom-shell"><span class="bottom-info" aria-hidden="true">i</span><div class="bottom-content">${html}</div><button class="bottom-toggle" data-act="bottomtoggle" aria-label="${this.bottomCollapsed ? '展开底部信息栏' : '收起底部信息栏'}" aria-expanded="${!this.bottomCollapsed}"><span class="bottom-panel-mark" aria-hidden="true"></span></button></div>`);
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
    const notices = this.noticeState || {};
    const btn = (side        , tab        , icon        , name        ) =>
      `<button data-act="rail" data-s="${side}" data-v="${tab}" title="${name}" aria-label="打开${name}面板">${uiIcon(icon)}${noticeDot(!!notices[tab], `${name}有新内容或待处理事项`)}</button>`;
    this.railL.innerHTML = btn('left', 'room', 'room', '房间') + btn('left', 'furn', 'furn', '家具') + btn('left', 'menu', 'menu', '菜单') + btn('left', 'econ', 'econ', '经营');
    this.railR.innerHTML = btn('right', 'staff', 'staff', '员工') + btn('right', 'guest', 'guest', '客人') + btn('right', 'world', 'world', '万界') + btn('right', 'task', 'task', '工作') + btn('right', 'log', 'log', '日志');
  }

          applyCollapse()       {
    this.left.style.display = this.collapsed.left ? 'none' : '';
    this.right.style.display = this.collapsed.right ? 'none' : '';
    this.railL.style.display = this.collapsed.left ? '' : 'none';
    this.railR.style.display = this.collapsed.right ? '' : 'none';
    this.root.classList.toggle('scrimOn', this.compact && (!this.collapsed.left || !this.collapsed.right));
    this.root.classList.toggle('left-open', !this.collapsed.left);
    try { localStorage.setItem('wjbdy.ui.v1', JSON.stringify(this.collapsed)); } catch (err) { /* 忽略 */ }
  }

          onClick(e       )       {
    const t = (e.target               ).closest('[data-act]')                      ;
    if (!t) return;
    const act = t.dataset.act          ;
    const v = t.dataset.v || '';
    const g = this.g;
    const fromOverflow = !!t.closest('.top-overflow-menu');
    if (this.needsPurchaseConfirmation(act, t)) {
      if (!this.confirmPurchase(t, act)) return;
    } else this.clearPurchaseConfirmation(false);
    if (act === 'tutorialnext') this.advanceTutorial();
    else if (act === 'tutorialprev') this.retreatTutorial();
    else if (act === 'tutorialresume') this.resumeTutorial(true);
    else if (act === 'tutorialstart' || act === 'tutorialrestart') this.startTutorial(true);
    else if (act === 'tutorialmin') this.minimizeTutorial();
    else if (act === 'tutorialskip') this.skipTutorial();
    else if (act === 'pause') g.setPaused(!g.paused);
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
    else if (act === 'rtab') { this.rightTab = v; if (v !== 'staff') this.staffView = 'list'; this.render(true); }
    else if (act === 'staffrecruit') { this.staffView = 'recruit'; this.render(true); }
    else if (act === 'staffback') { this.staffView = 'list'; this.render(true); }
    else if (act === 'bottomtoggle') { this.bottomCollapsed = !this.bottomCollapsed; this.renderBottom(); }
    else if (act === 'bp') g.startBuildRoom(v);
    else if (act === 'furn') g.startBuildFurn(v, parseInt(t.dataset.q || '1', 10));
    else if (act === 'cancelbuild') g.cancelBuild();
    else if (act === 'rotate') g.rotateBuild();
    else if (act === 'open') g.openDay();
    else if (act === 'readiness') this.openReadiness();
    else if (act === 'home') g.focusHome();
    else if (act === 'fullview') g.fitView();
    else if (act === 'worldcard') this.openWorldCard(v || g.sim.econ.currentWorldId);
    else if (act === 'worldcardtab') this.openWorldCard(t.dataset.id || g.sim.econ.currentWorldId, v);
    else if (act === 'worldfilter') { this.worldFilter = v; this.render(true); }
    else if (act === 'worldswitch') this.openWorldSwitchConfirm(v);
    else if (act === 'worldswitchgo') g.travelToWorld(v);
    else if (act === 'customworld') this.openCustomWorldBuilder();
    else if (act === 'customworldtab') {
      this.customWorldDraft = this.customWorldFormData();
      if (['concept', 'compile', 'review'].includes(v)) this.customWorldActiveTab = v;
      this.openCustomWorldBuilder();
    }
    else if (act === 'customworldgenerate') this.generateCustomWorld();
    else if (act === 'customworldsave') this.saveCustomWorld();
    else if (act === 'customworldcancelai') this.customWorldController?.abort();
    else if (act === 'worldarchive') this.openWorldArchiveConfirm(v);
    else if (act === 'worldarchivego') this.archiveCustomWorld(v);
    else if (act === 'worldrestore') this.restoreArchivedWorld(v);
    else if (act === 'cheat') {
      const e = g.sim.econ;
      e.rep = STAR_THRESHOLDS[5];
      e.certifiedStars = 5;
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
    else if (act === 'hire') {
      const id = parseInt(v, 10); const comparing = !!this.modal?.querySelector('.candidate-compare-modal');
      g.hire(id);
      if (!g.sim.candById(id)) {
        this.candidateCompareIds.delete(id);
        if (this.candidateCompareFocusId === id) this.candidateCompareFocusId = 0;
        if (comparing) this.closeModal();
      }
    }
    else if (act === 'directrecruit') this.openTargetRecruit();
    else if (act === 'rotbuild') g.rotateBuild();
    else if (act === 'fire') this.openFireConfirm(parseInt(v, 10));
    else if (act === 'job') g.setJob(parseInt(t.dataset.id          , 10), v       );
    else if (act === 'prio') g.setPrio(parseInt(t.dataset.id          , 10), parseInt(v, 10));
    else if (act === 'dutymode') g.setDutyMode(parseInt(t.dataset.id, 10), v);
    else if (act === 'dutyprio') g.setDutyPriority(parseInt(t.dataset.id, 10), t.dataset.s, parseInt(v, 10));
    else if (act === 'stafftrain') this.openStaffTrainingPlan(parseInt(t.dataset.id, 10), v);
    else if (act === 'trainingchoice') this.runStaffTraining(parseInt(t.dataset.id, 10), t.dataset.s, v);
    else if (act === 'staffequip') g.buyStaffEquipment(parseInt(t.dataset.id, 10), v);
    else if (act === 'staffperk') g.learnStaffPerk(parseInt(t.dataset.id, 10), v);
    else if (act === 'wage') g.setWage(parseInt(t.dataset.id          , 10), parseInt(v, 10));
    else if (act === 'sroom') g.setStaffRoom(parseInt(t.dataset.id          , 10), v === 'null' ? null : parseInt(v, 10));
    else if (act === 'roommode') g.setStaffRoomMode(parseInt(t.dataset.id, 10), v);
    else if (act === 'uproom') g.upgradeRoom(parseInt(v, 10));
    else if (act === 'moveroom') g.startMoveRoom(parseInt(v, 10));
    else if (act === 'rstyle') g.setRoomStyle(parseInt(v, 10), t.dataset.s          );
    else if (act === 'delroom') g.demolishRoom(parseInt(v, 10));
    else if (act === 'upfurn') g.upgradeFurn(parseInt(v, 10));
    else if (act === 'delfurn') g.removeFurn(parseInt(v, 10));
    else if (act === 'rotfurn') g.rotateFurn(parseInt(v, 10));
    else if (act === 'movefurn') g.startMoveFurn(parseInt(v, 10));
    else if (act === 'copyfurn') g.copyFurn(parseInt(v, 10));
    else if (act === 'copyroom') g.copyRoom(parseInt(v, 10));
    else if (act === 'saveroombp') { g.saveRoomBlueprint(parseInt(v, 10)); this.openBlueprintLibrary(); }
    else if (act === 'buildundo') g.undoBuild();
    else if (act === 'buildredo') g.redoBuild();
    else if (act === 'savelayout') { g.saveLayoutBlueprint(); this.openBlueprintLibrary(); }
    else if (act === 'blueprints') this.openBlueprintLibrary();
    else if (act === 'startroombp') { g.startSavedRoomBlueprint(parseInt(v, 10)); this.closeModal(); }
    else if (act === 'delroombp') { g.deleteRoomBlueprint(parseInt(v, 10)); this.openBlueprintLibrary(); }
    else if (act === 'applylayout') { if (g.applyLayoutBlueprint(parseInt(v, 10))) this.closeModal(); }
    else if (act === 'dellayout') { g.deleteLayoutBlueprint(parseInt(v, 10)); this.openBlueprintLibrary(); }
    else if (act === 'buy') g.buyStock(v          , parseInt(t.dataset.n          , 10));
    else if (act === 'menuitem') { const m = g.sim.econ.menu; if (m[v] === false) delete m[v]; else m[v] = false; g.save(); }
    else if (act === 'deldish') { g.sim.deleteCustomDish(v); g.save(); }
    else if (act === 'research') this.openResearch();
    else if (act === 'rding') { this.syncRdName(); const k = v          ; this.rd.ing[k] = Math.max(0, Math.min(4, this.rd.ing[k] + parseInt(t.dataset.d || '0', 10))); this.openResearch(); }
    else if (act === 'rdflavor') { this.syncRdName(); const i = this.rd.flavors.indexOf(v); if (i < 0) this.rd.flavors.push(v); else this.rd.flavors.splice(i, 1); this.openResearch(); }
    else if (act === 'rdfun') { this.syncRdName(); const i = this.rd.fun.indexOf(v); if (i < 0) this.rd.fun.push(v); else this.rd.fun.splice(i, 1); this.openResearch(); }
    else if (act === 'rddrink') { this.syncRdName(); this.rd.drink = !this.rd.drink; this.rd.chefId = 0; this.openResearch(); }
    else if (act === 'rdgo') this.runResearch();
    else if (act === 'aidishname') this.generateAIDishName(false);
    else if (act === 'aidishconcept') this.generateAIDishName(true);
    else if (act === 'dress') this.openWardrobe(parseInt(v, 10));
    else if (act === 'event') { g.resolveEvent(parseInt(v, 10)); }
    else if (act === 'eventroll') this.runDiceEvent(parseInt(v, 10));
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
    else if (act === 'aiguestchatsend') this.sendAIGuestChat(parseInt(v, 10));
    else if (act === 'aicancelchat') this.chatAIController?.abort();
    else if (act === 'aichatretry') this.retryAIChat();
    else if (act === 'aichatlocal') this.useLocalChatFallback();
    else if (act === 'aicancelday') this.settlementAIController?.abort();
    else if (act === 'localday') this.renderSettlement(this.settlementAIStat, { story: this.localSettlementStory(this.settlementAIStat) });
    else if (act === 'interactback') { this.finishAIGuestChatSession(); this.openInteract('guest', parseInt(v, 10)); }
    else if (act === 'aiprofilepolish') this.polishPlayerProfile();
    else if (act === 'ownerprofile') this.openOwnerProfileEditor();
    else if (act === 'ownersave') this.saveOwnerProfile();
    else if (act === 'ownerprompts') { this.syncPlayerProfileForm(); this.openPromptSettings(); }
    else if (act === 'aibg') this.generateAIBackground(parseInt(v, 10));
    else if (act === 'viewbg') this.openAIBackground(parseInt(v, 10));
    else if (act === 'finale') this.openFinale();
    else if (act === 'closemodal') { this.closeModal(); if (!this.g.sim.dayActive) { this.g.audio.playTrack('bgm-plan'); this.g.audio.playAmb('amb-night'); } }
    else if (act === 'newgame') g.newGame();
    else if (act === 'loadmorning') g.loadMorning();
    else if (act === 'savemenu') this.openSaveManager();
    else if (act === 'saveslot') { g.saveToSlot(parseInt(v, 10)); this.openSaveManager(); }
    else if (act === 'loadslot') this.openLoadSlotConfirm(parseInt(v, 10));
    else if (act === 'loadslotgo') g.loadSlot(parseInt(v, 10));
    else if (act === 'exportsave') g.exportSave(parseInt(v, 10));
    else if (act === 'restoresave') { if (g.restoreBackup(parseInt(v, 10))) this.openSaveManager(); }
    else if (act === 'importpick') this.modal?.querySelector(`[data-save-import][data-v="${v}"]`)?.click();
    else if (act === 'help') this.openHelp();
    else if (act === 'prompts') this.openPromptSettings();
    else if (act === 'prompttab') this.switchPromptTab(v);
    else if (act === 'promptworldstage') this.switchWorldPromptStage(v);
    else if (act === 'promptsave') this.savePromptSettings();
    else if (act === 'promptmodreset') {
      const stage = t.dataset.stage; const moduleId = t.dataset.module;
      const input = this.modal?.querySelector(`[data-world-stage="${stage}"][data-world-module="${moduleId}"]`);
      const defaults = parseWorldPromptModules(stage, PROMPT_TASKS[stage]?.defaultText || '');
      if (input && defaults[moduleId] !== undefined) input.value = defaults[moduleId];
    }
    else if (act === 'promptreset') { const tab = this.activePromptTab(); resetPromptTasks(); this.openPromptSettings('已恢复默认任务文本；玩家身份与背景保持不变。', false, tab); }
    else if (act === 'settings') this.openSettings();
    else if (act === 'aipreset') {
      const current = this.syncAIForm();
      const preset = presetById(v);
      saveAIConfig({ ...current, preset: preset.id, baseUrl: preset.baseUrl || current.baseUrl, model: '', models: [], refreshedAt: 0 });
      this.openSettings();
    }
    else if (act === 'airefresh') this.refreshAISettings();
    else if (act === 'aicanceldynamic') {
      this.dynamicAIController?.abort();
      this.dynamicAIStatus = { state: 'cancelled', text: '已取消本日 AI 经营事件' };
    }
    else if (act === 'airetrydynamic') this.requestDynamicBusinessEvent(true);
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
    else if (act === 'adpost') this.postRecruitmentAd(parseInt(v, 10));
    else if (act === 'adcancelai') this.adAIController?.abort();
    else if (act === 'adclear') { g.sim.withdrawAd(parseInt(v, 10)); g.save(); }
    else if (act === 'adseen') {
      const slot = parseInt(v, 10); const ad = g.sim.ads[slot];
      if (ad?.spec) { g.sim.econ.recruitmentSeen[slot] = this.recruitmentToken(ad); g.save(); }
    }
    else if (act === 'candcompare') {
      const id = parseInt(v, 10);
      const before = this.candidateCompareIds.size; const wasSelected = this.candidateCompareIds.has(id);
      this.candidateCompareIds = toggleCandidateComparison(this.candidateCompareIds, id);
      if (!wasSelected && before >= 3 && !this.candidateCompareIds.has(id)) g.sim.toast('最多同时比较 3 名候选人');
      if (!this.candidateCompareIds.has(this.candidateCompareFocusId)) this.candidateCompareFocusId = 0;
      if (this.modal?.querySelector('.candidate-compare-modal')) {
        if (this.candidateComparisonPeople().length >= 2) this.openCandidateComparison(); else this.closeModal();
      }
    }
    else if (act === 'candcompareopen') this.openCandidateComparison();
    else if (act === 'candcomparefocus') { this.candidateCompareFocusId = parseInt(v, 10); this.openCandidateComparison(); }
    else if (act === 'candgaphighlight') { this.candidateGapHighlight = !this.candidateGapHighlight; this.openCandidateComparison(); }
    else if (act === 'firec') this.openFireConfirm(parseInt(v, 10));
    else if (act === 'firego') { if (g.fire(parseInt(v, 10))) this.closeModal(); }
    else if (act === 'manual') { g.setManualOwner(v === '1'); this.openSettings(); }
    else if (act === 'materialpack') { g.setMaterialPack(v); this.openSettings(); }
    else if (act === 'mobilemanual') g.setManualOwner(!g.sim.manualOwner);
    else if (act === 'overflow-toggle') { this.topOverflowOpen = !this.topOverflowOpen; }
    else if (act === 'confirmnew') this.openConfirmRestart();
    if (fromOverflow && act !== 'overflow-toggle') this.topOverflowOpen = false;
    this.handleTutorialAction(act, v);
    this.render(true);
  }

          onChange(e       )       {
    const t = e.target                    ;
    if (t.dataset.act === 'markup') { this.g.setMarkup(parseFloat(t.value)); this.render(true); }
    if (t.dataset.act === 'adrace') { this.adSpec.race = parseInt(t.value, 10); this.openAdPanel(this.adSlot); }
    if (t.dataset.act === 'adworld') {
      this.adSpec.birthWorldId = t.value;
      if (t.value !== 'ai_custom') this.adSpec.customWorldName = '';
      this.openAdPanel(this.adSlot);
    }
    if (t.dataset.act === 'candsort') { this.candidateSort = t.value; this.render(true); }
    if (t.dataset.act === 'candjobfilter') { this.candidateJobFilter = t.value; this.render(true); }
    if (t.dataset.act === 'candworldfilter') { this.candidateWorldFilter = t.value; this.render(true); }
    if (t.dataset.act === 'restock') { this.g.sim.econ.autoRestock = t.checked; this.g.save(); }
    if (t.dataset.act === 'restockbudget') {
      this.g.sim.econ.restockBudget = Math.max(0, Math.min(999999, Math.round(Number(t.value) || 0)));
      this.g.save(); this.render(true);
    }
    if (t.dataset.act === 'restocktarget') {
      const key = t.dataset.v;
      if (ING_KEYS.includes(key)) {
        this.g.sim.econ.restockTargets[key] = Math.max(0, Math.min(999, Math.round(Number(t.value) || 0)));
        this.g.save(); this.render(true);
      }
    }
    if (t.dataset.saveImport !== undefined) {
      const file = t.files?.[0];
      const slot = parseInt(t.dataset.v || '1', 10);
      if (file) file.text().then((raw) => { this.g.importSaveText(raw, slot); this.openSaveManager(); }).catch((error) => this.g.sim.toast(`读取导入文件失败：${error.message}`));
    }
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

  currentTutorialState()       {
    const slot = this.g.currentSlot || 1;
    if (!this.tutorialState || this.tutorialSlot !== slot) {
      this.tutorialSlot = slot;
      this.tutorialState = loadTutorialState(slot);
      this.tutorialActive = false;
    }
    return this.tutorialState;
  }

  persistTutorial()       {
    this.tutorialState = saveTutorialState(this.tutorialState, this.g.currentSlot || 1);
    return this.tutorialState;
  }

  startTutorial(restart = false)       {
    this.closeModal();
    this.tutorialSlot = this.g.currentSlot || 1;
    const current = loadTutorialState(this.tutorialSlot);
    this.tutorialState = restart || !current.started || current.completed || current.skipped
      ? resetTutorialState(this.tutorialSlot) : current;
    this.tutorialActive = true;
    if (this.tutorialState.index === 0) {
      this.collapsed = { left: true, right: true };
      this.g.selection = null;
    }
    this.render(true);
  }

  resumeTutorial(closeOpenModal = false)          {
    const state = this.currentTutorialState();
    if (!state.started || state.completed || state.skipped) return false;
    if (closeOpenModal) this.closeModal();
    this.tutorialActive = true;
    this.render(true);
    return true;
  }

  minimizeTutorial()       {
    this.tutorialActive = false;
    this.render(true);
    this.g.sim.toast('引导已最小化，可从顶栏“继续引导”恢复');
  }

  skipTutorial()       {
    const state = this.currentTutorialState();
    this.tutorialState = { ...state, started: true, skipped: true, completed: false };
    this.persistTutorial();
    this.tutorialActive = false;
    this.render(true);
    this.g.sim.toast('已跳过引导，可在“帮助”中重新开始');
  }

  advanceTutorial()       {
    const state = this.currentTutorialState();
    const step = TUTORIAL_STEPS[state.index];
    if (step?.action && !state.satisfied) {
      this.g.sim.toast('请先点击引导中高亮的按钮');
      return false;
    }
    this.tutorialState = advanceTutorialState(state);
    this.persistTutorial();
    if (this.tutorialState.completed) {
      this.tutorialActive = false;
      this.g.sim.toast('新手引导完成；祝你经营顺利！');
    }
    return true;
  }

  retreatTutorial()       {
    const state = this.currentTutorialState();
    if (state.index <= 0) return false;
    this.tutorialState = retreatTutorialState(state);
    this.persistTutorial();
    return true;
  }

  handleTutorialAction(act        , value        )       {
    if (!this.tutorialActive) return;
    const state = this.currentTutorialState();
    const step = TUTORIAL_STEPS[state.index];
    if (!tutorialActionMatches(step, act, value)) return;
    if (step.id === 'opening' && !this.g.sim.dayActive) return;
    this.tutorialState = { ...state, satisfied: true };
    this.persistTutorial();
  }

  renderTutorial()       {
    for (const node of document.querySelectorAll('.tutorial-target')) node.classList.remove('tutorial-target', 'tutorial-satisfied');
    const state = this.currentTutorialState();
    if (!this.tutorialActive || !state.started || state.completed || state.skipped) {
      this.tutorialLayer.style.display = 'none';
      if (this.tutorialLayer.innerHTML) this.tutorialLayer.innerHTML = '';
      this.tutorialRenderKey = '';
      return;
    }
    const step = TUTORIAL_STEPS[state.index];
    const selector = state.satisfied && step.afterTarget ? step.afterTarget : step.target;
    if (selector) {
      const target = [...document.querySelectorAll(selector)].find((node) => {
        const rect = node.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && getComputedStyle(node).visibility !== 'hidden';
      });
      if (target) target.classList.add('tutorial-target', ...(state.satisfied ? ['tutorial-satisfied'] : []));
    }
    const waiting = !!step.action && !state.satisfied;
    const points = step.points?.length ? `<ul>${step.points.map((point) => `<li>${htmlText(point)}</li>`).join('')}</ul>` : '';
    const primary = state.index === TUTORIAL_STEPS.length - 1 ? '完成引导' : state.satisfied ? '看完了，下一步' : '下一步';
    const renderKey = `${state.index}|${state.satisfied ? 1 : 0}|${waiting ? 1 : 0}`;
    if (this.tutorialRenderKey !== renderKey) {
      this.tutorialLayer.innerHTML = `<section class="tutorial-card" role="dialog" aria-label="新手引导">
        <div class="tutorial-head"><span class="tutorial-step">${state.index + 1}/${TUTORIAL_STEPS.length} · ${htmlText(step.chapter)}</span><h2>${htmlText(step.title)}</h2></div>
        <p>${htmlText(step.body)}</p>${points}
        ${waiting ? '<div class="tutorial-hint">请点击画面中金色高亮的入口；打开后可以先阅读实际面板。</div>' : state.satisfied ? '<div class="tutorial-hint good">已打开目标面板。确认看懂后再进入下一步。</div>' : ''}
        <div class="tutorial-actions" style="margin-top:9px"><button data-act="tutorialmin">暂时收起</button><button data-act="tutorialskip" class="warn">跳过引导</button><span class="spacer"></span><button data-act="tutorialprev" ${state.index <= 0 ? 'disabled' : ''}>← 上一步</button><button data-act="tutorialnext" ${waiting ? 'disabled' : ''}>${primary}</button></div>
      </section>`;
      this.tutorialRenderKey = renderKey;
    }
    this.tutorialLayer.style.display = 'block';
  }

  render(force         )       {
    if (!force && (this.interactionLock || this.purchaseConfirm)) return;
    this.root.classList.toggle('manual-owner', this.compact && this.g.sim.manualOwner);
    this.noticeState = navNoticeState(this.g.sim);
    this.renderRails();
    this.renderTop();
    this.renderLeft();
    this.renderRight();
    this.renderBottom();
    this.applyCollapse();
    this.renderTutorial();
    if (force) this.renderToasts();
  }

  renderTop()       {
    const g = this.g; const s = g.sim; const e = s.econ;
    const world = s.currentWorld();
    const tutorial = this.currentTutorialState();
    const stars = s.stars();
    const nextTh = STAR_THRESHOLDS[Math.min(5, stars + 1)];
    const timePct = s.dayActive ? (s.dayT / 300) * 100 : 0;
    const lowStock = ING_KEYS.filter((k) => e.stock[k] < 10);
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.world = world.id;
      document.documentElement.style.setProperty('--world-tint', world.visuals?.atmosphere?.tint || '#F3B84B');
    }
    this.setPanelHTML(this.top, `
      <div class="top-group top-identity"><button data-act="worldcard" data-v="${htmlText(world.id)}" class="brand-title" title="万界旅店账簿 · 当前驻留：${htmlText(world.name)}，点击查看世界卡">万界旅店账簿</button></div>
      <div class="top-group top-date"><span>第 ${e.day} 天</span><span class="dim">${SEASON_NAMES[s.seasonIndex()]}</span><span class="top-day-state">${s.dayActive ? `<span class="hi">营业中·${this.phase()}</span><span class="bar" style="display:inline-block;width:72px"><i style="width:${timePct}%;background:var(--warning)"></i></span>` : '<span class="dim">收盘规划</span>'}</span></div>
      <div class="top-group top-speed"><button data-act="pause" class="${g.paused ? 'on' : ''}" aria-label="${g.paused ? '继续' : '暂停'}">${g.paused ? '▶' : 'Ⅱ'}</button>${[1, 2, 4].map((n) => `<button data-act="speed" data-v="${n}" class="${g.speed === n && !g.paused ? 'on' : ''}">${n}X</button>`).join('')}</div>
      <div class="top-group top-economy"><span class="hi">${uiIcon('econ', '界币')} ${Math.round(e.coins)}</span><span>声望 <span class="star">${'★'.repeat(stars)}</span><span class="dim">${'☆'.repeat(5 - stars)}</span> ${Math.round(e.rep)}/${nextTh}</span></div>
      <div class="top-group top-status">${stars < 5 && e.rep >= nextTh ? `<span class="hi">待完成 ★${stars + 1} 经营认证</span>` : ''}${s.endingSeen ? '<span class="good">五星认证</span>' : ''}${e.strikes ? `<span class="bad">封印警告 ${e.strikes}/3</span>` : ''}${lowStock.length ? `<span class="bad">缺料：${lowStock.map((k) => ING_LABEL[k]).join('/')}</span>` : ''}${this.dynamicAIStatus?.state === 'loading' ? `<span class="hi">✦ ${htmlText(this.dynamicAIStatus.text)}</span><button data-act="aicanceldynamic">取消</button>` : this.dynamicAIStatus?.state === 'error' ? `<span class="bad">${htmlText(this.dynamicAIStatus.text)}</span><button data-act="airetrydynamic">重试</button>` : ''}</div>
      <div class="top-group top-actions">${s.dayActive ? '' : `<button data-act="readiness">${uiIcon('ready', '营业准备')} 营业准备</button><button data-act="open" class="primary-action">开门营业</button>`}${tutorial.started && !tutorial.completed && !tutorial.skipped && !this.tutorialActive ? `<button data-act="tutorialresume">继续引导 ${tutorial.index + 1}/${TUTORIAL_STEPS.length}</button>` : ''}<button data-act="mobilemanual" class="mobile-manual ${s.manualOwner ? 'on' : ''}">${s.manualOwner ? '自动' : '直控'}</button><button data-act="savemenu">${uiIcon('save', '档位')} 档位 ${this.g.currentSlot}</button><span class="top-actions-secondary"><button data-act="help">${uiIcon('help', '帮助')} 帮助</button><button data-act="prompts">${uiIcon('prompt', '提示词')} 提示词</button><button data-act="home">回店</button><button data-act="fullview" title="容纳全部房间">全店视图</button><button data-act="settings">设置</button></span><div class="top-overflow ${this.topOverflowOpen ? 'open' : ''}"><button data-act="overflow-toggle" aria-label="更多工具" aria-haspopup="true" aria-expanded="${this.topOverflowOpen}">⋮</button><div class="top-overflow-menu" role="menu"><button data-act="help" role="menuitem">${uiIcon('help', '帮助')} 帮助</button><button data-act="prompts" role="menuitem">${uiIcon('prompt', '提示词')} 提示词</button><button data-act="home" role="menuitem">回店</button><button data-act="fullview" role="menuitem" title="容纳全部房间">全店视图</button><button data-act="settings" role="menuitem">设置</button></div></div></div>`);
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
      body = `<div class="row" style="flex-wrap:wrap;margin-bottom:7px"><button data-act="buildundo" ${g.buildHistoryIndex <= 0 ? 'disabled' : ''}>↶ 撤销</button><button data-act="buildredo" ${g.buildHistoryIndex >= g.buildHistory.length - 1 ? 'disabled' : ''}>↷ 重做</button><button data-act="blueprints">蓝图库</button><button data-act="savelayout">保存整店布局</button></div>`;
      body += BLUEPRINTS.filter((b) => b.buildable).map((b) => {
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
          if (!st.facility) badges.push(drink ? '需酒吧/酒廊+酒桶' : '需厨房+灶台+出餐口');
          if (!st.skillOk) badges.push('厨艺不足');
          if (!st.stockOk) badges.push('缺料');
          if (!st.seasonOk) badges.push(`非当前时令（${d.seasons.map((index) => SEASON_NAMES[index]).join('/')}）`);
          const fl = (d.flavors || []).map((f) => FLAVOR_LABEL[f] || f).join('/');
          return `<div class="card">
            <div class="row"><b>${d.custom ? '🧪 ' : ''}${d.name}</b><span class="hi">${Math.round(d.price * e.markup)} 币</span></div>
            ${d.description ? `<div class="dim">${htmlText(d.description)}</div>` : ''}
            <div class="dim">${d.school || '万界经典'}${d.combo ? ' · 套餐' : ''}${d.seasons ? ` · 时令 ${d.seasons.map((index) => SEASON_NAMES[index]).join('/')}` : ''} · 招牌 ${'★'.repeat(d.mastery?.level || 0)}${'☆'.repeat(3 - (d.mastery?.level || 0))}（累计 ${d.mastery?.sales || 0} 份${d.mastery?.next ? `，下级 ${d.mastery.next}` : '，已满级'}）</div>
            <div class="dim">${ing}${fl ? ` · 口味 ${fl}` : ''}${d.fun && d.fun.length ? ' · ' + d.fun.map((f) => (DISH_FUN.find((x) => x.id === f) || DISH_FUN[0]).name).join('/') : ''}</div>
            <div class="row"><span class="${st.skillOk ? 'dim' : 'bad'}">${drink ? '调酒' : '厨艺'} ≥${d.skill} · 当前 ${best.value}</span>
              <span><button data-act="menuitem" data-v="${d.id}" class="${st.on ? 'on' : ''}">${st.on ? '供应中' : '已下架'}</button>
              ${d.custom ? `<button data-act="deldish" data-v="${d.id}" class="warn">删</button>` : ''}</span></div>
            ${badges.length && st.on ? `<div class="bad">${badges.join(' · ')}</div>` : ''}
          </div>`;
        }).join('');
        return `<h3>${title} <span class="dim">（${drink ? '调酒' : '厨艺'}最高：${best.name} ${best.value}）</span></h3>` + cards;
      };
      body = `<div class="row"><div class="dim" style="flex:1">下架的菜客人不会点；厨艺不足、缺料或缺设施的菜即使上架也做不出来。越贵的菜对厨师要求越高。</div>
        <button data-act="research" ${s.dayActive ? 'disabled title="请在打烊后研发"' : ''}>🧪 研发新菜</button></div>`
        + group(false, '餐食') + group(true, '饮品');
    } else {
      const e = g.sim.econ;
      const plan = restockPlan(e);
      body = `<h3>库存与定价</h3>` + ING_KEYS.map((k) => { const unit = worldIngredientPrice(e, k); return `<div class="row"><span>${ING_LABEL[k]} ${e.stock[k]}</span>
        <span><button data-act="buy" data-v="${k}" data-n="20">+20 (${unit * 20})</button><span class="dim"> · 当地单价 ${unit}${unit === ING_PRICE[k] ? '' : `（基础 ${ING_PRICE[k]}）`}</span></span></div>`; }).join('')
        + `<div class="row" style="margin-top:6px"><span>加价倍率 ${e.markup.toFixed(2)}×</span></div>
           <input data-act="markup" type="range" min="0.8" max="3" step="0.05" value="${e.markup}" style="width:100%">
           <div class="dim">高于 2× 会明显降低味道评价与点单率。</div>
           <label class="row"><span>次日自动补货</span><input data-act="restock" type="checkbox" ${e.autoRestock ? 'checked' : ''}></label>
           <div class="card" style="margin-top:6px"><div class="row"><b>自动补货计划</b><span class="dim">预算 0 = 不限</span></div>
           <label class="row"><span>预算上限</span><input data-act="restockbudget" type="number" min="0" max="999999" value="${e.restockBudget}" style="width:86px"></label>
           ${ING_KEYS.map((key) => `<label class="row"><span>${ING_LABEL[key]}目标</span><input data-act="restocktarget" data-v="${key}" type="number" min="0" max="999" value="${e.restockTargets[key]}" style="width:64px"><span class="${plan.items[key].shortfall ? 'bad' : 'dim'}">预计 +${plan.items[key].amount} / ${plan.items[key].cost} 币${plan.items[key].shortfall ? ` · 缺 ${plan.items[key].shortfall}` : ''}</span></label>`).join('')}
           <div class="row"><b>预计费用 ${plan.total}</b><b class="${plan.balanceAfter < 0 ? 'bad' : 'good'}">补货后余额 ${plan.balanceAfter}</b></div></div>
           <h3 style="margin-top:8px">热图</h3>
           <div class="row">${['off', 'clean', 'traffic'].map((h) => `<button data-act="heat" data-v="${h}" class="${g.heat === h ? 'on' : ''}">${h === 'off' ? '关闭' : h === 'clean' ? '卫生' : '拥堵'}</button>`).join('')}</div>`;
    }
    this.setPanelHTML(this.left, `<div class="tabs">
      ${[['room', '房间', 'room'], ['furn', '家具', 'furn'], ['menu', '菜单', 'menu'], ['econ', '经营', 'econ']].map(([k, n, icon]) => `<button data-act="ltab" data-v="${k}" class="${this.leftTab === k ? 'on' : ''}">${uiIcon(icon)}${n}${noticeDot(!!this.noticeState[k], `${n}有待处理事项`)}</button>`).join('')}<button class="fold" data-act="collapse" data-v="left" title="收起左栏" aria-label="收起左侧面板"><span class="panel-collapse-mark left"></span></button>
      </div>${body}
      ${g.buildBp || g.buildFurn ? `<div class="row" style="margin-top:6px"><button data-act="rotate">R 旋转</button><button data-act="cancelbuild" class="warn">取消</button></div>` : ''}`);
  }

  recruitmentToken(ad) {
    return ad?.spec ? `${ad.day}:${(ad.cands || []).map((person) => person.id).join(',')}` : '';
  }

  allRecruitmentCandidates() {
    const sim = this.g.sim;
    return [...sim.ads.flatMap((ad) => ad.cands || []), ...sim.pool];
  }

  requiredRecruitmentJobs() {
    const kinds = new Set(this.g.tavern.rooms.map((room) => room.kind));
    const jobs = ['front', 'cleaner'];
    if (kinds.has('kitchen')) jobs.push('cook');
    if (['dining', 'parlor', 'bar'].some((kind) => kinds.has(kind))) jobs.push('server');
    if (['bar', 'parlor'].some((kind) => kinds.has(kind))) jobs.push('bartender');
    if (['onsen', 'billiard', 'theater', 'garden', 'observatory', 'arcade', 'alchemy'].some((kind) => kinds.has(kind))) jobs.push('attendant');
    if (kinds.has('guestroom')) jobs.push('porter');
    return [...new Set(jobs)];
  }

  recruitmentGap() {
    const staff = this.g.sim.staff;
    const rows = this.requiredRecruitmentJobs().map((job) => {
      const coverage = staff.reduce((best, person) => Math.max(best, staffAnalysis(person).roles.find((row) => row.job === job)?.score || 0), 0);
      return { job, coverage };
    }).sort((a, b) => a.coverage - b.coverage);
    return rows[0] || { job: 'front', coverage: 0 };
  }

  candidateRoleScore(person, job) {
    return staffAnalysis(person).roles.find((row) => row.job === job)?.score || 0;
  }

  filteredSortedCandidates(rows) {
    const gap = this.recruitmentGap();
    const filtered = rows.filter((person) => {
      const analysis = staffAnalysis(person);
      if (this.candidateJobFilter !== 'all' && analysis.recommendedJob !== this.candidateJobFilter) return false;
      if (this.candidateWorldFilter !== 'all' && (person.originWorldName || '未知') !== this.candidateWorldFilter) return false;
      return true;
    });
    return [...filtered].sort((a, b) => {
      if (this.candidateSort === 'wage') return a.wage - b.wage || staffAnalysis(b).score - staffAnalysis(a).score;
      if (this.candidateSort === 'score') return staffAnalysis(b).score - staffAnalysis(a).score || a.wage - b.wage;
      if (this.candidateSort === 'world') return String(a.originWorldName || '').localeCompare(String(b.originWorldName || ''), 'zh-CN') || staffAnalysis(b).score - staffAnalysis(a).score;
      return this.candidateRoleScore(b, gap.job) - this.candidateRoleScore(a, gap.job) || staffAnalysis(b).score - staffAnalysis(a).score;
    });
  }

  bestGapCandidateId() {
    const gap = this.recruitmentGap();
    return [...this.allRecruitmentCandidates()].sort((a, b) => this.candidateRoleScore(b, gap.job) - this.candidateRoleScore(a, gap.job) || staffAnalysis(b).score - staffAnalysis(a).score)[0]?.id || 0;
  }

  candidateDecisionControls() {
    const all = this.allRecruitmentCandidates();
    const worlds = [...new Set(all.map((person) => person.originWorldName || '未知'))].sort((a, b) => a.localeCompare(b, 'zh-CN'));
    const gap = this.recruitmentGap();
    return `<div class="card" style="border-left-color:#58A947"><div class="row"><b>当前最缺：${JOB_LABEL[gap.job]}岗位</b><span class="dim">现有最高匹配 ${gap.coverage}</span></div>
      <div class="decision-toolbar"><label>排序<select data-act="candsort"><option value="gap" ${this.candidateSort === 'gap' ? 'selected' : ''}>缺口匹配</option><option value="score" ${this.candidateSort === 'score' ? 'selected' : ''}>综合评分</option><option value="wage" ${this.candidateSort === 'wage' ? 'selected' : ''}>日薪从低</option><option value="world" ${this.candidateSort === 'world' ? 'selected' : ''}>出生世界</option></select></label>
      <label>岗位<select data-act="candjobfilter"><option value="all">全部</option>${JOBS.filter((job) => job !== 'free').map((job) => `<option value="${job}" ${this.candidateJobFilter === job ? 'selected' : ''}>${htmlText(JOB_LABEL[job])}</option>`).join('')}</select></label>
      <label>世界<select data-act="candworldfilter"><option value="all">全部</option>${worlds.map((name) => `<option value="${htmlText(name)}" ${this.candidateWorldFilter === name ? 'selected' : ''}>${htmlText(name)}</option>`).join('')}</select></label></div>
      <div class="dim">绿色候选人为当前岗位缺口的最佳匹配；可勾选最多 3 人并排比较。</div></div>`;
  }

  candidateComparisonPeople() {
    const candidates = this.allRecruitmentCandidates();
    const validIds = new Set(candidates.map((person) => person.id));
    for (const id of this.candidateCompareIds) if (!validIds.has(id)) this.candidateCompareIds.delete(id);
    return candidates.filter((person) => this.candidateCompareIds.has(person.id)).slice(0, 3);
  }

  candidateComparisonTray() {
    if (!this.allRecruitmentCandidates().length) return '';
    const chosen = this.candidateComparisonPeople();
    return `<div class="compare-tray"><div class="row"><span><b>候选人并排比较</b><span class="dim"> · 已选 ${chosen.length}/3</span></span><button data-act="candcompareopen" ${chosen.length < 2 ? 'disabled title="至少选择两名候选人"' : ''}>打开比较</button></div></div>`;
  }

  candidateAnalysisSentence(person, analysis, gap) {
    const strengths = analysis.strengths.map((item) => SKILL_LABEL[item.key]).join('、');
    const weakness = SKILL_LABEL[analysis.weaknesses[0]?.key] || '暂无明显短板';
    return `擅长${strengths}，推荐${JOB_LABEL[analysis.recommendedJob]}；${JOB_LABEL[gap.job]}缺口匹配 ${this.candidateRoleScore(person, gap.job)}，需留意${weakness}。`;
  }

  openCandidateComparison() {
    const chosen = this.candidateComparisonPeople();
    if (chosen.length < 2) { this.g.sim.toast('至少选择 2 名候选人才能比较'); return; }
    if (!chosen.some((person) => person.id === this.candidateCompareFocusId)) this.candidateCompareFocusId = chosen[0].id;
    const gap = this.recruitmentGap();
    const gapSkill = jobFocusSkill(gap.job);
    const tabs = `<div class="compare-person-tabs">${chosen.map((person) => `<button data-act="candcomparefocus" data-v="${person.id}" class="${person.id === this.candidateCompareFocusId ? 'on' : ''}">${htmlText(person.name)}</button>`).join('')}</div>`;
    const columns = chosen.map((person) => {
      const analysis = staffAnalysis(person);
      const focused = person.id === this.candidateCompareFocusId;
      const background = person.background;
      const skills = SKILL_KEYS.map((key) => metricRow({
        icon: key, label: SKILL_LABEL[key], value: person.skills[key], color: 'var(--info)', showLabel: true, compactValue: true,
        className: this.candidateGapHighlight && key === gapSkill ? 'gap-focus' : '',
      })).join('');
      return `<section class="compare-column ${focused ? 'focused' : ''}" data-candidate-id="${person.id}">
        <div class="compare-portrait">${portraitFrame(person.app, 'compare', person.name)}</div>
        <div class="compare-identity"><h4>${htmlText(person.name)}</h4><div>${htmlText(person.originWorldName || '未知世界')} · 日薪 ${person.wage}</div><div class="dim">推荐岗位：${JOB_LABEL[analysis.recommendedJob]} · 综合 ${analysis.score}</div></div>
        <div class="compare-analysis">${htmlText(this.candidateAnalysisSentence(person, analysis, gap))}</div>
        <div class="compare-skills">${skills}</div>
        ${background ? `<details><summary aria-expanded="false">背景与求职动机</summary><div class="dim">${htmlText(this.candidateBackgroundSummary(background))}</div><div>${htmlText(background.aspiration || background.background || '')}</div>${background.quirk ? `<div class="dim">习惯：${htmlText(background.quirk)}</div>` : ''}</details>` : ''}
        <div class="compare-column-actions"><button data-act="candcomparefocus" data-v="${person.id}" class="${focused ? 'on' : ''}">${focused ? '已选为雇用对象' : '选为雇用对象'}</button><button data-act="candcompare" data-v="${person.id}">移出比较</button></div>
      </section>`;
    }).join('');
    const focus = chosen.find((person) => person.id === this.candidateCompareFocusId) || chosen[0];
    this.showModal(`<h3>候选人并排比较</h3><section class="candidate-compare-modal"><div class="candidate-compare-head"><span>当前缺口：<b>${JOB_LABEL[gap.job]}</b> · 主能力 ${SKILL_LABEL[gapSkill]}</span><span class="spacer"></span><button data-act="candgaphighlight" class="${this.candidateGapHighlight ? 'on' : ''}">固定高亮当前缺口：${this.candidateGapHighlight ? '开' : '关'}</button></div>${tabs}<div class="compare-grid" style="--compare-count:${chosen.length}">${columns}</div><div class="compare-footer"><span class="dim">选中候选人后仍需再次确认入职费</span><button class="compare-hire" data-act="hire" data-v="${focus.id}">雇用「${htmlText(focus.name)}」</button></div></section>`, true, false, { variant: 'important' });
  }

  candidateBackgroundSummary(background) {
    const text = String(background?.background || '').trim();
    const first = text.split(/(?<=[。！？!?])/)[0] || text;
    return first.slice(0, 72) + (first.length > 72 ? '…' : '');
  }

  hasNewRecruitment() {
    return this.g.sim.ads.some((ad, slot) => ad.spec && (ad.cands || []).length && this.g.sim.econ.recruitmentSeen?.[slot] !== this.recruitmentToken(ad));
  }

  hasNewWorldInfo() {
    return this.g.sim.worlds().some((world) => {
      const level = this.g.sim.econ.worldKnowledge?.[world.id]?.level || 0;
      return level > (Number(this.g.sim.econ.worldSeenLevels?.[world.id]) || 0);
    });
  }

  worldDecisionSummary(world) {
    const effectLabels = { patience: '客人耐心', budget: '消费预算', hygiene: '卫生要求', comfort: '舒适需求', spectacle: '观赏需求', etiquette: '礼仪要求' };
    const effects = { ...(world.hospitality?.servicePriorities || {}), ...(world.environmentRule?.effects || {}) };
    const topWants = Object.entries(world.hospitality?.wantWeights || {}).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => wantById(id).name);
    const good = Object.entries(effects).filter(([, value]) => Number(value) >= 1.06).map(([key]) => `${effectLabels[key] || key}有利`);
    if (topWants.length) good.unshift(`高需求：${topWants.join('、')}`);
    const risks = Object.entries(effects).filter(([, value]) => Number(value) <= .95).map(([key]) => `${effectLabels[key] || key}不利`);
    const built = new Set(this.g.tavern.rooms.map((room) => room.kind));
    const missing = (world.recommendedFacilities || []).filter((kind) => !built.has(kind));
    if (missing.length) risks.push(`缺少：${missing.map((kind) => ROOM_LABEL[kind] || kind).join('、')}`);
    const ingredientByFlavor = { umami: ['meat', 'veg'], spicy: ['spice', 'meat'], sweet: ['grain', 'veg'], sour: ['veg', 'spice'], mellow: ['grain', 'ether'], weird: ['ether', 'spice'] };
    const ingredients = [...new Set((world.hospitality?.flavorLikes || []).flatMap((flavor) => ingredientByFlavor[flavor] || []))];
    if (topWants.includes('吃饭')) ingredients.push('grain', 'meat', 'veg');
    if (topWants.includes('喝一杯')) ingredients.push('grain', 'ether');
    const stock = [...new Set(ingredients)].slice(0, 4).map((key) => `${ING_LABEL[key]}≥${key === 'ether' || key === 'spice' ? 25 : 45}`);
    return {
      advantages: good.slice(0, 3).join('；') || '经营条件均衡',
      risks: risks.slice(0, 3).join('；') || `注意礼仪：${world.culture?.taboos?.[0] || '暂无明显风险'}`,
      facilities: (world.recommendedFacilities || []).map((kind) => ROOM_LABEL[kind] || kind).join('、') || '无特定设施',
      stock: stock.join('、') || '维持常规补货线',
    };
  }

  factionRelationLabel(value) {
    if (value >= 60) return '盟友'; if (value >= 30) return '信赖'; if (value >= 10) return '友好';
    if (value <= -40) return '敌对'; if (value <= -15) return '疏远'; if (value < 0) return '戒备'; return '中立';
  }

          renderRight()       {
    const g = this.g; const s = g.sim;
    let body = '';
    if (this.rightTab === 'staff') {
      if (this.staffView === 'list') {
        body = `<div class="dim staff-summary">员工 ${s.staff.length}/${s.maxStaff()}　1 人 1 间卧室（休息室）</div>`;
        body += s.staff.map((st) => this.staffCard(st)).join('');
        body += `<button class="staff-recruit-entry" data-act="staffrecruit">＋　新增员工</button>`;
      } else {
        body = `<div class="recruitment-head"><button data-act="staffback">返回员工</button><h3>招聘中心</h3><span style="width:72px"></span></div>`;
        const directUnlocked = s.stars() >= 4;
      body += `<div class="card" style="border-left-color:#8A74B8"><div class="row"><b>定向招募 · 员工 DIY</b><span class="${directUnlocked ? 'good' : 'dim'}">${directUnlocked ? '四星已解锁' : '需要 ★★★★'}</span></div>
        <div class="dim">自行决定员工的姓名、外貌、性格与岗位能力；确认后按生成工资支付正常入职费。</div>
        <div class="row"><button data-act="directrecruit" ${directUnlocked && s.staff.length < s.maxStaff() ? '' : 'disabled'}>${s.staff.length >= s.maxStaff() ? '先准备空卧室' : directUnlocked ? '创建定向员工' : '四星后开放'}</button></div></div>`;
      if (this.allRecruitmentCandidates().length) body += this.candidateDecisionControls();
      const bestGapId = this.bestGapCandidateId();
      body += '<h3>招募广告（3 个广告位）</h3>' + s.ads.map((ad, i) => {
        if (!ad.spec) {
          return `<div class="card"><div class="row"><b>广告位 ${i + 1}</b><span class="dim">空置</span></div>
            <div class="dim">发布广告才会有人来应聘：先选择出生世界，再指定价位、种族、性别和数值偏向。</div>
            <div class="row"><button data-act="adopen" data-v="${i}">发布广告</button></div></div>`;
        }
        const t = s.adTier(ad.spec.tier);
        const req           = [];
        const birthWorld = ad.spec.customWorldName || s.worldById(ad.spec.birthWorldId || WORLD_PROFILES[0].id).name;
        req.push(`出生世界：${birthWorld}`);
        if (ad.spec.race >= 0) req.push(RACE_NAMES[ad.spec.race]);
        if (ad.spec.sex) req.push(ad.spec.sex);
        if (ad.spec.bias) req.push(SKILL_LABEL[ad.spec.bias           ] + '偏向');
        const unseen = s.econ.recruitmentSeen?.[i] !== this.recruitmentToken(ad);
        const candidates = this.filteredSortedCandidates(ad.cands);
        return `<div class="card"><div class="row"><b>广告位 ${i + 1}·${t.name}${noticeDot(unseen, '有未读候选人')}</b><span class="dim">第${ad.day}天发布</span></div>
          <div class="dim">要求：${req.length ? req.join('·') : '不限'}｜候选 ${ad.cands.length} 人</div>
          ${candidates.length ? candidates.map((p) => this.candCard(p, bestGapId)).join('') : '<div class="filter-empty">此广告没有符合当前筛选条件的候选人</div>'}
          <div class="row">${unseen ? `<button data-act="adseen" data-v="${i}">标记已读</button>` : ''}<button data-act="adopen" data-v="${i}">重发广告</button>
            <button data-act="adclear" data-v="${i}" class="warn">撤下</button></div></div>`;
      }).join('');
      if (s.pool.length) {
        const pool = this.filteredSortedCandidates(s.pool);
        body += `<h3>自来应聘（${s.pool.length}）</h3>` + (pool.length ? pool.map((p) => this.candCard(p, bestGapId)).join('') : '<div class="filter-empty">没有符合当前筛选条件的自来应聘者</div>');
      }
      body += this.candidateComparisonTray();
      }
    } else if (this.rightTab === 'guest') {
      body = s.groups.length ? s.groups.map((gr) => {
        const pct = Math.round((gr.patience / gr.maxPatience) * 100);
        const o = s.orders.find((x) => x.id === gr.orderId);
        const w = wantById(gr.want);
        const stateTxt = gr.state === 'wait' ? '前台等位' : gr.state === 'seating' ? '带位中'
          : gr.state === 'seated' ? '等点单' : gr.state === 'ordered' ? '等菜' : gr.state === 'eating' ? '用餐'
          : gr.state === 'facility_prepare' ? '等待准备' : gr.state === 'facility_escort' ? '等待带位'
          : gr.state === 'toFac' ? '带位前往' + w.name : gr.state === 'facility_waiting_attend' ? '等待场务照看'
          : gr.state === 'using' ? (gr.overnight ? '过夜中' : (w.verb || w.name) + '中') : '离店';
        const regular = gr.regularId ? s.regulars.find((profile) => profile.id === gr.regularId) : null;
        const worlds = (gr.worldIds || [gr.originWorldId]).map((id) => s.worldById(id));
        return `<div class="card"><div class="row"><b>${gr.size}人组·${w.name}</b><span class="dim">${stateTxt}</span></div>
        <div class="row"><span class="hi">${worlds.map((world) => `${world.icon} ${world.name}`).join(' × ')}</span><span>${htmlText(gr.travelPurpose || '')}</span></div>
        ${regular ? `<div class="row"><span class="hi">★ 常客 ${htmlText(regular.name)} · 第 ${regular.visits} 次来店</span><span>好感 ${Math.round(regular.aff)}</span></div>${regular.offer ? `<div class="dim">${htmlText(regular.offer.text)}</div>` : ''}` : ''}
        <div class="row">耐心 ${bar(pct, 100, pct > 50 ? '#8DDB4A' : pct > 25 ? '#F3B84B' : '#FF6B5A')}</div>
        <div class="dim">${gr.members.map((m) => m.race).join('/')}${o ? ' · ' + (g.sim.dishOf(o.dishId).name || '') + '（' + ORDER_STAGE[o.stage] + '）' : ''}</div></div>`;
      }).join('') : '<div class="dim">店里还没有客人。</div>';
    } else if (this.rightTab === 'world') {
      const forecast = new Set(s.econ.worldForecast || []);
      const allWorlds = s.worlds();
      const unlocked = allWorlds.filter((world) => world.custom || world.unlockStars <= s.stars());
      const current = s.currentWorld();
      const filteredWorlds = allWorlds.filter((world) => {
        const info = s.econ.worldKnowledge?.[world.id] || { level: 0 };
        if (this.worldFilter === 'visited') return info.level > 0;
        if (this.worldFilter === 'unlocked') return (world.custom || world.unlockStars <= s.stars()) && world.id !== current.id;
        if (this.worldFilter === 'custom') return !!world.custom;
        if (this.worldFilter === 'existing') return world.source?.mode === 'existing_work';
        return true;
      });
      body = `<div class="card" style="border-left-color:#7A4BE0" data-act="worldcard" data-v="${htmlText(current.id)}"><b>当前驻留 · ${htmlText(current.icon)} ${htmlText(current.name)}</b><div>${htmlText(current.tagline || current.identity.summary)}</div><div class="dim">点击查看世界卡、经营摘要与势力委托</div></div><div class="card"><b>位面潮汐预报 · 第 ${s.econ.day} 天</b><div class="dim">今日客流增强：${unlocked.filter((world) => forecast.has(world.id)).map((world) => `${world.icon} ${world.name}`).join('、') || '暂无'}</div></div>
      <div class="decision-toolbar">${[['all', '全部'], ['visited', '已到访'], ['unlocked', '可穿越'], ['custom', '自定义'], ['existing', '作品世界']].map(([id, label]) => `<button data-act="worldfilter" data-v="${id}" class="${this.worldFilter === id ? 'on' : ''}">${label}</button>`).join('')}</div>`;
      body += filteredWorlds.map((world) => {
        const info = s.econ.worldKnowledge?.[world.id] || { level: 0, arrivals: 0, served: 0 };
        const unseen = info.level > (Number(s.econ.worldSeenLevels?.[world.id]) || 0);
        if (world.unlockStars > s.stars()) return `<div class="card"><div class="row"><b>未接通的位面</b><span class="dim">需要 ★${world.unlockStars}</span></div></div>`;
        if (!info.level) return `<div class="card"><div class="row"><b>${world.icon} 尚未到访</b><span class="dim">航路已接通</span></div><div class="dim">等待第一批旅客穿过位面门。</div></div>`;
        return `<div class="card" data-act="worldcard" data-v="${htmlText(world.id)}" style="border-left-color:${world.id === current.id ? '#8DDB4A' : forecast.has(world.id) ? '#E45AD1' : '#C9922F'}"><div class="row"><b>${world.icon} ${world.name}${world.id === current.id ? ' · 当前' : ''}${noticeDot(unseen, '有未读世界资料')}</b><span>${forecast.has(world.id) ? '潮汐增强' : `接待 ${info.served || 0} 人`}</span></div>
          <div>${htmlText(world.identity.summary)}</div>
          <div class="dim">环境：${htmlText(world.identity.environment)}｜文明：${htmlText(world.identity.civilization)}</div>
          <div class="dim">常见居民：${world.population.slice(0, 4).map((resident) => `${RACE_NAMES[resident.raceId]}（${resident.role}）`).join('、')}｜地区：${world.regions.map((region) => region.name).join('、')}</div>
          <div class="dim">礼仪提示：${htmlText(info.level >= 4 ? world.culture.etiquette : world.culture.etiquette.split('；')[0])}</div>
          ${info.level >= 2 ? `<div class="dim">常见需求：${Object.entries(world.hospitality.wantWeights).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => wantById(id).name).join('、')}｜装修倾向：${world.hospitality.roomStyleLikes.map((id) => STYLES.find((style) => style.id === id)?.name || id).join('、')}</div>` : '<div class="dim">完成首次服务可解锁需求与装修倾向。</div>'}
          ${info.level >= 3 ? `<div class="dim">口味偏好：${world.hospitality.flavorLikes.map((id) => FLAVOR_LABEL[id]).join('、')}｜重视：${world.culture.values.join('、')}</div>` : '<div class="dim">累计接待 3 人可解锁口味偏好。</div>'}
          ${info.level >= 4 ? `<div class="dim bad">礼仪雷区：${world.culture.taboos.join('、')}</div><div class="dim">世界线索：${world.storyHooks.join('；')}</div>` : '<div class="dim">获得明确评价或询问旅途，可解锁礼仪雷区与世界线索。</div>'}
        </div>`;
      }).join('') || '<div class="filter-empty">当前筛选下没有世界</div>';
    } else if (this.rightTab === 'task') {
      const queue = s.workQueue();
      const waiting = queue.filter((x) => !x.staff).length;
      body = `<div class="row"><b>工作队列</b><span class="${waiting ? 'bad' : 'good'}">待领取 ${waiting}</span></div>`;
      body += queue.length ? queue.map((q) => `<div class="card">
        <div class="row"><b>${q.label}</b><span class="${q.staff ? 'good' : 'bad'}">${q.status}</span></div>
        <div class="dim">${q.room ? `区域：${q.room} · ` : ''}${q.staff ? `认领：${q.staff}` : q.reason}${q.age >= 1 ? ` · 等待 ${Math.round(q.age)} 秒` : ''}</div>
      </div>`).join('') : '<div class="dim">目前没有积压工作。</div>';
    } else {
      body = s.log.length ? s.log.slice(0, 24).map((l) => `<div class="dim">· ${l}</div>`).join('') : '<div class="dim">暂无记录。</div>';
    }
    this.setPanelHTML(this.right, `<div class="tabs">
      ${[['staff', '员工', 'staff'], ['guest', '客人', 'guest'], ['world', '万界', 'world'], ['task', '工作', 'task'], ['log', '日志', 'log']].map(([k, n, icon]) => `<button data-act="rtab" data-v="${k}" class="${this.rightTab === k ? 'on' : ''}">${uiIcon(icon)}${n}${noticeDot(!!this.noticeState[k], `${n}有新内容或待处理事项`)}</button>`).join('')}<button class="fold" data-act="collapse" data-v="right" title="收起右栏" aria-label="收起右侧面板"><span class="panel-collapse-mark right"></span></button>
      </div>${body}`);
  }

  candCard(p, bestGapId = 0) {
    const bg = p.background;
    const analysis = staffAnalysis(p);
    const gap = this.recruitmentGap();
    const selected = this.candidateCompareIds.has(p.id);
    const recommended = p.id === bestGapId;
    return `<div class="card candidate-card ${recommended ? 'recommended' : ''}"><div class="row">${portraitFrame(p.app, 'main', p.name)}
        <span style="flex:1"><b>${p.name}</b><div class="dim">${p.race}·${p.sex}·${p.age}岁</div><div class="hi">出生世界：${htmlText(p.originWorldName || '未知')}</div></span>
        <span class="hi">日薪${p.wage}</span></div>
      ${recommended ? `<div class="good"><b>★ 最适合当前缺口</b> · ${JOB_LABEL[gap.job]}匹配 ${this.candidateRoleScore(p, gap.job)}</div>` : ''}
      ${p.worldSpecialty ? `<div class="hi">世界专长：${htmlText(p.worldSpecialty.name)} · ${htmlText(p.worldSpecialty.note)}</div>` : ''}
      <div class="skill-inline">${SKILL_KEYS.map((k) => `<span title="${htmlText(SKILL_LABEL[k])}">${uiIcon(k)}<b>${p.skills[k]}</b></span>`).join('')}</div>
      <div class="row" style="align-items:flex-start"><b class="hi">综合 ${analysis.score}</b><span>推荐：${JOB_LABEL[analysis.recommendedJob]}</span></div>
      <div class="dim"><span class="good">优势 ${analysis.strengths.map((item) => `${SKILL_LABEL[item.key]}${item.value}`).join('、')}</span> · <span class="bad">短板 ${analysis.weaknesses.map((item) => `${SKILL_LABEL[item.key]}${item.value}`).join('、')}</span></div>
      <div class="row" style="justify-content:flex-start;flex-wrap:wrap">${p.traits.map((t) => this.traitTag(t)).join('')}<span class="dim" title="根据综合技能与性格自动规划">自动优先级 ${p.prio}</span></div>
      ${bg ? `<div class="dim candidate-summary">${htmlText(this.candidateBackgroundSummary(bg))}</div><details class="candidate-details"><summary aria-expanded="false">展开背景与求职动机</summary><div class="dim">${htmlText(bg.role || '')}</div><div>${htmlText(bg.aspiration || bg.background || '')}</div>${bg.quirk ? `<div class="dim">习惯：${htmlText(bg.quirk)}</div>` : ''}</details>` : ''}
      <div class="row"><button data-act="candcompare" data-v="${p.id}" class="${selected ? 'on' : ''}">${selected ? '✓ 比较中' : '加入比较'}</button><button data-act="hire" data-v="${p.id}">雇用（入职费${p.wage * 3}）</button>
        ${bg ? `<button data-act="viewbg" data-v="${p.id}">查看背景</button>` : aiConfigured() ? `<button data-act="aibg" data-v="${p.id}">AI 生成背景</button>` : ''}</div></div>`;
  }

  staffCard(st       )         {
    const sel = this.g.selection && this.g.selection.kind === 'staff' && this.g.selection.id === st.id;
    const room = st.roomId ? this.g.tavern.roomById(st.roomId) : null;
    return `<div class="card staff-card ${sel ? 'sel' : ''}" data-act="selstaff" data-v="${st.id}">
      <div class="staff-card-grid">${portraitFrame(st.app, 'main', st.name)}
        <div class="staff-card-main"><div class="staff-card-head"><span class="staff-identity" style="flex:1"><b>${st.name}</b><span class="staff-role-tag">${st.isOwner ? '店主' : JOB_LABEL[st.job]}</span>
          <div class="dim">${JOB_LABEL[st.job]} · ${room ? `${st.roomMode === 'strict' ? '仅限' : '优先'} ${ROOM_LABEL[room.kind]}` : '全店机动'}</div></span><button class="staff-detail-action" data-act="detail" data-v="${st.id}" aria-label="查看${htmlText(st.name)}详情"><span class="staff-detail-mark" aria-hidden="true"></span></button></div>
          <span class="dim staff-current">${st.task ? '正在：' + st.task.label : st.free ? this.freeLabel(st.free.kind) : st.note || '待命'}</span>
          <div class="staff-metrics">${metricRow({ icon: 'stamina', label: '体力', value: st.needs.stamina, color: 'var(--positive)', padValue: 3 })}${metricRow({ icon: 'morale', label: '士气', value: st.needs.morale, color: 'var(--info)', padValue: 3 })}${metricRow({ icon: 'affinity', label: '好感', value: st.aff, color: 'var(--rose)', padValue: 3 })}</div>
        </div></div></div>`;
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
      stargaze: '打烊偷闲：观星', game: '打烊偷闲：打电动', brew: '打烊偷闲：鼓捣炼金', watch: '打烊偷闲：看放映', stroll: '打烊偷闲：庭院散步',
      fire: '打烊偷闲：围炉取暖', aquarium: '打烊偷闲：看鱼放空', billiards: '打烊偷闲：练台球', soak: '打烊偷闲：泡汤放松',
      flowers: '打烊偷闲：逛花坛', crystal: '打烊偷闲：对着水晶冥想', wine: '打烊偷闲：整理藏酒', cards: '打烊偷闲：桌边玩牌', sketch: '打烊偷闲：画店内速写' }[kind] || '打烊偷闲';
  }

  renderBottom()       {
    const g = this.g;
    const sel = g.selection;
    this.bottom.classList.toggle('bottom-collapsed', this.bottomCollapsed);
    this.bottom.classList.toggle('bottom-expanded', !this.bottomCollapsed && (g.moveRoomId !== null || !!g.buildBp || !!g.buildFurn || !!sel));
    if (g.moveRoomId !== null) {
      const room = g.tavern.roomById(g.moveRoomId);
      this.setBottomHTML(`<b class="hi">移动房间：${room ? this.roomName(room) : ''}</b>
        <div class="dim">R 旋转 ${g.buildRot * 90}°；房间、家具、污渍与房内角色会整体转向。放下后按新共享墙的可用空间居中开门，不沿用旧门；绿色=可放，红色=重叠或无法形成连通门洞。</div>
        <div class="row"><button data-act="rotate">R 旋转</button><button data-act="moveroom" data-v="${g.moveRoomId}" class="warn">取消移动</button></div>`);
      return;
    }
    if (g.buildBp) {
      const b = BLUEPRINTS.find((x) => x.id === g.buildBp);
      this.setBottomHTML(`<b class="hi">建造：${b?.name}</b> ${b?.w}×${b?.h}（旋转 ${g.buildRot ? '是' : '否'}）
        <div class="dim">绿色=可建，红色=不可建。必须与已有房间贴边，系统会在共享边中点自动开门。</div>`);
      return;
    }
    if (g.buildFurn) {
      const d = furnDef(g.buildFurn);
      this.setBottomHTML(`<b class="hi">放置：${d.name} ${'I'.repeat(g.buildQuality)}</b> ${d.note}
        <div class="dim">R 旋转朝向（黄色箭头=使用面，必须留出通道）。椅子必须朝向餐桌。</div>`);
      return;
    }
    if (!sel) {
      this.setBottomHTML(`<div class="dim">${idleMapHint()}</div>`);
      return;
    }
    if (sel.kind === 'staff') { this.setBottomHTML(this.staffDetail(sel.id)); return; }
    if (sel.kind === 'room') { this.setBottomHTML(this.roomDetail(sel.id)); return; }
    if (sel.kind === 'furn') { this.setBottomHTML(this.furnDetail(sel.id)); return; }
    if (sel.kind === 'guest') {
      const gu = this.g.sim.guests.find((x) => x.id === sel.id);
      if (!gu) { this.setBottomHTML('<div class="dim">客人已离店。</div>'); return; }
      const gr = this.g.sim.groups.find((x) => x.id === gu.groupId);
      this.setBottomHTML(`<div class="row portrait-head">${portraitFrame(gu.app, 'compact', gu.name)}
        <div style="flex:1"><b>${gu.name}</b> <span class="dim">${gu.race}</span>
        <div class="dim">${gr ? `同行 ${gr.size} 人 · 状态 ${gr.state} · 耐心 ${Math.round(gr.patience)}s · 预算 ${gr.budget}` : ''}</div>
        <div class="dim">口味偏好：${gr ? gr.taste.map((t) => g.sim.dishOf(t).name).join('、') : ''}${gr && gr.flavors && gr.flavors.length ? `（${gr.flavors.map((f) => FLAVOR_LABEL[f] || f).join('/')}党）` : ''}</div></div></div>`);
    }
  }

  staffDetail(id        )         {
    const st = this.g.sim.staff.find((x) => x.id === id);
    if (!st) return '<div class="dim">该员工已不在职。</div>';
    const rooms = this.g.tavern.rooms;
    const wage = fairWageRange(st);
    const totalWages = this.g.sim.staff.filter((person) => !person.isOwner).reduce((sum, person) => sum + person.wage, 0);
    const roleGuide = {
      front: ['主责：迎宾、带位、结账', '可补位：桌边服务', '不会做：烹饪、设施服务'], greeter: ['主责：迎宾、带位', '可补位：点单', '不会做：烹饪、设施服务'],
      server: ['主责：点单、上菜、桌边服务', '可补位：低优先级迎宾', '不会做：设施服务'], attendant: ['主责：设施准备、照看、收尾', '可补位：清洁、搬运', '不会做：烹饪、点单'],
      cook: ['主责：备餐、烹饪', '可补位：调酒', '不会做：设施服务'], bartender: ['主责：调酒', '可补位：点单', '不会做：设施服务'],
      cleaner: ['主责：清洁、整理', '可补位：设施收尾', '不会做：迎宾、烹饪'], porter: ['主责：搬运、收台', '可补位：设施服务', '不会做：迎宾、烹饪'], free: ['主责：依能力机动', '可补位：多数普通工作', '不会做：专业岗位优先任务'],
    }[st.job] || [];
    return `<div class="row" style="align-items:flex-start">
      ${portraitFrame(st.app, 'compact', st.name)}
      <div style="flex:1">
        <div class="row"><b>${st.name}</b><span class="dim">${st.race}·${st.sex}·${st.age}岁·${st.ht}cm/${st.wt}kg·${HT_NAMES[st.app.ht]}${BD_NAMES[st.app.bd]}</span>
        <span>${st.traits.map((t) => this.traitTag(t, st.id)).join('')}</span></div>
        <div class="row" style="flex-wrap:wrap">${SKILL_KEYS.map((k) => `<span>${SKILL_LABEL[k]} ${bar(st.skills[k], 100, '#F3B84B')} ${st.skills[k]}</span>`).join('')}</div>
        <div class="row" style="flex-wrap:wrap"><span>体力${bar(st.needs.stamina, 100, '#8DDB4A')}</span><span>饥饿${bar(st.needs.hunger, 100, '#E45AD1')}</span><span>压力${bar(st.needs.stress, 100, '#FF6B5A')}</span><span>士气${bar(st.needs.morale, 100, '#39D7D2')}</span></div>
        <div class="row" style="flex-wrap:wrap">岗位 ${JOBS.map((j) => `<button data-act="job" data-id="${st.id}" data-v="${j}" class="${st.job === j ? 'on' : ''}">${JOB_LABEL[j]}</button>`).join('')}</div>
        <div class="dim">${roleGuide.join('｜')}</div>
        <div class="row" style="flex-wrap:wrap">职责模式
          <button data-act="dutymode" data-id="${st.id}" data-v="auto" class="${st.dutyMode !== 'manual' ? 'on' : ''}">全自动（岗位模板）</button>
          <button data-act="dutymode" data-id="${st.id}" data-v="manual" class="${st.dutyMode === 'manual' ? 'on' : ''}">自定义优先级</button>
        </div>
        ${st.dutyMode === 'manual' ? `<div class="row" style="flex-wrap:wrap">${DUTIES.map((duty) => `<span>${DUTY_LABEL[duty]} ${[0, 1, 2, 3, 4].map((p) => `<button data-act="dutyprio" data-id="${st.id}" data-s="${duty}" data-v="${p}" class="${(st.dutyPriorities?.[duty] || 0) === p ? 'on' : ''}" title="${p === 0 ? '禁用此职责' : '数字越高越优先'}">${p}</button>`).join('')}</span>`).join('')}</div>` : '<div class="dim">当前按岗位自动安排；切换为自定义后，0 表示不做，4 表示最高优先。</div>'}
        <div class="row" style="flex-wrap:wrap">房间 <button data-act="sroom" data-id="${st.id}" data-v="null" class="${st.roomId ? '' : 'on'}">全店机动</button>
          ${rooms.map((r) => `<button data-act="sroom" data-id="${st.id}" data-v="${r.id}" class="${st.roomId === r.id ? 'on' : ''}">${ROOM_LABEL[r.kind]}#${r.id}</button>`).join('')}</div>
        ${st.roomId ? `<div class="row">区域模式
          <button data-act="roommode" data-id="${st.id}" data-v="prefer" class="${st.roomMode !== 'strict' ? 'on' : ''}">优先区域（可跨区救火）</button>
          <button data-act="roommode" data-id="${st.id}" data-v="strict" class="${st.roomMode === 'strict' ? 'on' : ''}">仅限区域（不接外区任务）</button></div>` : ''}
        <div class="row" title="数值越高，空闲时越先领取新任务">抢单优先级 ${[0, 1, 2, 3].map((p) => `<button data-act="prio" data-id="${st.id}" data-v="${p}" class="${st.prio === p ? 'on' : ''}">${p}</button>`).join('')}
          ${st.isOwner ? '<span class="dim">店主不领取工资</span>' : `<span>日薪 ${st.wage}</span><button data-act="wage" data-id="${st.id}" data-v="${st.wage + 5}" title="涨薪后全店日薪 ${totalWages + 5}">+5</button><button data-act="wage" data-id="${st.id}" data-v="${Math.max(5, st.wage - 5)}" title="降薪后全店日薪 ${totalWages - st.wage + Math.max(5, st.wage - 5)}">-5</button>`}
          <button data-act="dress" data-v="${st.id}">换装</button>
          ${st.isOwner ? '' : `<button data-act="fire" data-v="${st.id}" class="warn">解雇</button>`}</div>
        ${st.isOwner ? '' : `<div class="dim">合理工资 ${wage.min}–${wage.max}（建议 ${wage.recommended}） · 当前全店日薪 ${totalWages} · 涨薪后 ${totalWages + 5}</div>`}
        <div class="dim">外出进修、个人装备与职业技能已移至“查看详情 → 成长”。</div>
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
        <button data-act="copyroom" data-v="${r.id}" ${this.g.sim.dayActive ? 'disabled' : ''}>⧉ 复制房间</button>
        <button data-act="saveroombp" data-v="${r.id}" ${this.g.sim.dayActive ? 'disabled' : ''}>保存蓝图</button>
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
    const facility = this.g.sim.facilityStatus(f);
    if (facility) extra += `｜状态 ${facility.state}｜今日使用 ${facility.uses} 人次｜收入 ${facility.revenue}${facility.quality ? `｜当前服务质量 ${facility.quality.toFixed(1)}★` : ''}`;
    return `<div class="row" style="align-items:flex-start"><div style="flex:1">
      <b>${d.name}</b> <span class="dim">品质 ${'I'.repeat(f.quality)}｜使用面朝${dirs[f.dir]}</span>
      <div class="dim">${d.note}${extra ? '｜' + extra : ''}</div>
      ${this.g.moveFurnId === f.id ? `<div class="hi">搬动中：在同一房间点新位置放下，放下前可随意转向</div>
      <div class="row"><button data-act="rotbuild" class="on">⟳ 转个方向（R）</button><button data-act="movefurn" data-v="${f.id}">取消搬动</button></div>` : ''}
      <div class="row"><button data-act="rotfurn" data-v="${f.id}">R 旋转朝向</button>
        <button data-act="movefurn" data-v="${f.id}" class="${this.g.moveFurnId === f.id ? 'on' : ''}">↔ 移动位置</button>
        <button data-act="copyfurn" data-v="${f.id}" ${this.g.sim.dayActive ? 'disabled' : ''}>⧉ 复制家具</button>
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
  openWorldCard(id = this.g.sim.econ.currentWorldId, tab = 'overview') {
    const sim = this.g.sim; const econ = sim.econ;
    const worlds = sim.worlds();
    const world = sim.worldById(id);
    const unlocked = world.custom || world.unlockStars <= sim.stars();
    const current = world.id === econ.currentWorldId;
    const pending = econ.pendingWorldSwitch?.worldId === world.id;
    const knowledgeLevel = Number(econ.worldKnowledge?.[world.id]?.level) || 0;
    econ.worldSeenLevels ||= {};
    if (knowledgeLevel > (Number(econ.worldSeenLevels[world.id]) || 0)) { econ.worldSeenLevels[world.id] = knowledgeLevel; this.g.save(); }
    const tabs = [['overview', '概览'], ['rules', '规则'], ['society', '社会'], ['history', '历史'], ['factions', '势力'], ['economy', '经济'], ['people', '人物'], ['impact', '旅店影响']];
    if (!tabs.some(([key]) => key === tab)) tab = 'overview';
    const list = (rows, render) => rows?.length ? rows.map(render).join('') : '<div class="dim">暂无记录</div>';
    const namedRows = (rows) => list(rows, (row) => `<div class="card"><b>${htmlText(row.name || row)}</b>${row.detail ? `<div class="dim">${htmlText(row.detail)}</div>` : ''}</div>`);
    const rule = worldRuleForDay(world, econ.day);
    const festival = worldFestivalForDay(world, econ.day);
    const priceRows = ING_KEYS.map((key) => `<div class="row"><span>${ING_LABEL[key]}</span><span>${worldIngredientPrice({ ...econ, currentWorldId: world.id }, key)} / 份 <span class="dim">${Math.round((world.economy?.prices?.[key] || 1) * 100)}%</span></span></div>`).join('');
    let content = '';
    if (!unlocked) content = `<div class="card"><b>尚未建立稳定航路</b><div class="dim">达到 ${world.unlockStars} 星经营认证后解锁。当前只能确认其世界类型：${htmlText(world.genre || world.identity?.genre || '未知世界')}。</div></div>`;
    else if (tab === 'overview') {
      const decision = this.worldDecisionSummary(world);
      const commission = sim.worldCommission(world.id);
      const relation = sim.factionRelation(world.id, commission.faction.id);
      content = `<div class="world-hero" style="--world-card-tint:${htmlText(world.visuals?.atmosphere?.tint || '#F3B84B')}"><div class="world-glyph">${htmlText(world.icon)}</div><div><h2>${htmlText(world.name)}</h2><b>${htmlText(world.genre || world.identity?.genre || '')}</b><div>${htmlText(world.tagline || world.identity?.tagline || '')}</div></div></div>
      ${world.source?.mode === 'existing_work' ? `<div class="card hi"><b>既有作品世界</b><div>${htmlText(world.source.workName)} · 著名原作角色会作为稀有访客到店</div></div>` : ''}
      <div class="card">${htmlText(world.identity?.summary || '')}</div>
      <div class="world-decision-grid"><div class="card"><b class="good">优势</b><div>${htmlText(decision.advantages)}</div></div><div class="card"><b class="bad">风险</b><div>${htmlText(decision.risks)}</div></div><div class="card"><b>建议设施</b><div>${htmlText(decision.facilities)}</div></div><div class="card"><b>建议库存</b><div>${htmlText(decision.stock)}</div></div></div>
      <div class="card" style="border-left-color:#7A4BE0"><div class="row"><b>当前势力委托 · ${htmlText(commission.chain.name)}</b><span>${commission.stage}/${commission.chain.steps.length}</span></div><div>${htmlText(commission.complete ? '委托已完成，长期合作关系已经建立。' : commission.next?.title || '')}</div><div class="dim">委托方：${htmlText(commission.faction.name)} · ${this.factionRelationLabel(relation)} ${relation >= 0 ? '+' : ''}${relation}</div></div>
      <div class="card"><b>今日驻留规则</b><div>${htmlText(world.environmentRule?.name || '异界环境')}：${htmlText(world.environmentRule?.detail || '')}</div><div>${rule ? `${htmlText(rule.name)}：${htmlText(rule.detail)}` : '今日无额外法令'}</div>${festival ? `<div class="hi">节庆 · ${htmlText(festival.name)}：${htmlText(festival.detail)}</div>` : ''}</div>
      <div class="card"><b>天象与远景</b><div class="dim">${htmlText(world.visuals?.atmosphere?.weather || '')} · ${htmlText(world.visuals?.atmosphere?.horizon || '')}</div><div class="dim">环境声：${htmlText(world.visuals?.atmosphere?.sound || '')}</div></div>`;
    }
    else if (tab === 'rules') content = `<div class="card"><b>宇宙结构</b><div>${htmlText(world.cosmology?.cosmology || '')}</div></div><div class="card"><b>自然规律</b><div>${htmlText(world.cosmology?.naturalLaws || '')}</div></div><div class="card"><b>力量体系</b><div>${htmlText(world.cosmology?.powerSystem || '')}</div></div><div class="card"><b>死亡规则</b><div>${htmlText(world.cosmology?.deathRule || '')}</div></div><h3>当地法令与习惯</h3>${namedRows(world.localRules)}`;
    else if (tab === 'society') content = `<div class="card"><b>政治制度</b><div>${htmlText(world.society?.government || '')}</div></div>${[['语言', world.society?.languages], ['社会阶层', world.society?.classes], ['信仰', [world.society?.faith]], ['家庭', [world.society?.family]], ['教育', [world.society?.education]], ['服饰', [world.society?.clothing]], ['饮食', [world.society?.cuisine]]].map(([label, values]) => `<div class="card"><b>${label}</b><div class="dim">${(values || []).filter(Boolean).map(htmlText).join(' · ')}</div></div>`).join('')}<h3>地区</h3>${namedRows(world.regions?.map((region) => ({ name: region.name, detail: `${region.type || ''}${region.traits?.length ? ` · ${region.traits.join('、')}` : ''}` })))}`;
    else if (tab === 'history') content = `<div class="world-timeline">${namedRows(world.history)}</div><h3>当代矛盾</h3>${list(world.conflicts, (row) => `<div class="card">• ${htmlText(row)}</div>`)}`;
    else if (tab === 'factions') {
      const relations = sim.worldFactionRelations(world.id);
      const commission = sim.worldCommission(world.id);
      content = `<div class="card" style="border-left-color:#7A4BE0"><div class="row"><b>势力委托 · ${htmlText(commission.chain.name)}</b><span>${commission.stage}/${commission.chain.steps.length}</span></div><div>${htmlText(commission.complete ? '长期委托已完成。' : commission.next?.premise || '暂无后续阶段。')}</div><div class="dim">下一阶段：${htmlText(commission.next?.title || '已完成')}</div></div>` + list(world.factions, (faction) => {
        const value = Math.max(-100, Math.min(100, Number(relations[faction.id]) || 0));
        return `<div class="card"><div class="row"><b>${htmlText(faction.name)}</b><span class="${value >= 10 ? 'good' : value < 0 ? 'bad' : 'dim'}">${this.factionRelationLabel(value)} ${value >= 0 ? '+' : ''}${value}</span></div><div class="dim">${htmlText(faction.detail || '')}</div><div class="relation-meter"><i style="width:${Math.round((value + 100) / 2)}%"></i></div></div>`;
      });
    }
    else if (tab === 'economy') content = `<div class="card"><b>货币</b><div>${htmlText(world.economy?.currency || '')}</div><b>劳动制度</b><div>${htmlText(world.economy?.labor || '')}</div></div>${[['主要产业', world.economy?.industries], ['出口', world.economy?.exports], ['进口', world.economy?.imports]].map(([label, rows]) => `<div class="card"><b>${label}</b><div class="dim">${(rows || []).map(htmlText).join(' · ')}</div></div>`).join('')}<h3>当地采购价</h3>${priceRows}`;
    else if (tab === 'people') content = namedRows(world.notableCharacters?.map((character) => ({ name: `${character.visitor ? '✦ ' : ''}${character.name}`, detail: `${character.canonical ? '原作著名角色 · ' : ''}${character.detail || ''}${character.visitor ? ' · 可能作为稀有访客到店' : ' · 出现在传闻与图鉴中'}` })));
    else content = `<div class="card"><b>客流构成</b><div>约 60% 当前世界当地客、30% 其他已连接世界、10% 潮汐或使团。</div></div><div class="card"><b>环境规则</b><div>${htmlText(world.environmentRule?.detail || '')}</div></div><div class="card"><b>推荐设施</b><div>${(world.recommendedFacilities || []).map((kind) => ROOM_LABEL[kind] || kind).join(' · ') || '无特定设施'}</div></div><div class="card"><b>招聘</b><div>约 60% 候选人取自当地人口与职业结构。</div></div><h3>采购影响</h3>${priceRows}`;
    const worldButtons = worlds.map((row) => `<button data-act="worldcard" data-v="${htmlText(row.id)}" class="${row.id === world.id ? 'on' : ''}" title="${row.unlockStars > sim.stars() && !row.custom ? `${row.unlockStars} 星解锁` : row.genre || ''}">${htmlText(row.icon)} ${htmlText(row.name)}${row.unlockStars > sim.stars() && !row.custom ? ' 🔒' : ''}</button>`).join('');
    const action = unlocked && !current ? pending ? '<span class="hi">位面穿越准备中</span>' : econ.pendingWorldSwitch ? '<span class="dim">正在穿越其他世界</span>' : `<button data-act="worldswitch" data-v="${htmlText(world.id)}" ${sim.dayActive ? 'disabled title="请在打烊规划期切换"' : ''}>穿越至此 · ${worldSwitchCost(world)} 币</button>` : current ? '<span class="good">● 当前驻留世界</span>' : '';
    const management = world.custom && !current && !pending ? `<button data-act="worldarchive" data-v="${htmlText(world.id)}" class="warn" ${sim.dayActive ? 'disabled title="请在打烊规划期归档"' : ''}>归档世界</button>` : '';
    this.showModal(`<h3>🌐 世界航路</h3><div class="world-picker">${worldButtons}</div><div class="tabs world-card-tabs">${tabs.map(([key, label]) => `<button data-act="worldcardtab" data-id="${htmlText(world.id)}" data-v="${key}" class="${tab === key ? 'on' : ''}">${label}</button>`).join('')}</div><div class="world-card-body">${content}</div><div class="row" style="margin-top:10px">${action}${management}<span style="flex:1"></span>${sim.stars() >= 3 ? `<button data-act="customworld">AI 自定义世界 ${econ.customWorlds.length}/${CUSTOM_WORLD_LIMIT}</button>` : '<span class="dim">三星开放 AI 自定义世界</span>'}<button data-act="closemodal">关闭</button></div>`);
  }

  openWorldSwitchConfirm(id) {
    const sim = this.g.sim; const world = sim.unlockedWorlds().find((row) => row.id === id);
    if (!world) return;
    const prices = ING_KEYS.map((key) => `${ING_LABEL[key]} ${Math.round((world.economy?.prices?.[key] || 1) * 100)}%`).join(' · ');
    this.showModal(`<h3>确认穿越至 ${htmlText(world.icon)} ${htmlText(world.name)}？</h3><div class="card"><div>${htmlText(world.tagline || world.identity?.summary || '')}</div><div class="dim" style="margin-top:6px">抵达后客流以当地客为主；采购：${prices}</div><div class="dim">推荐设施：${(world.recommendedFacilities || []).map((kind) => ROOM_LABEL[kind] || kind).join('、') || '无特别限制'}</div></div><div class="card bad">将立即支付 ${worldSwitchCost(world)} 界币并开始穿越。动画结束后立即抵达目标世界，不再等待次日开门。</div><div class="row"><button data-act="worldswitchgo" data-v="${htmlText(world.id)}">确认穿越</button><button data-act="worldcard" data-v="${htmlText(world.id)}">返回世界卡</button></div>`, true, false, { variant: 'important' });
  }

  customWorldFormData() {
    const old = { name: '', sourceMode: 'auto', genre: '', concept: '', mustInclude: '', compileNotes: '', tone: '', mustAvoid: '', reviewNotes: '', ...(this.customWorldDraft || {}) };
    if (!this.modal) return old;
    const value = (key) => this.modal.querySelector(`[data-custom-world="${key}"]`)?.value ?? old[key];
    return {
      name: value('name'), sourceMode: value('sourceMode'), genre: value('genre'), concept: value('concept'), mustInclude: value('mustInclude'),
      compileNotes: value('compileNotes'), tone: value('tone'), mustAvoid: value('mustAvoid'), reviewNotes: value('reviewNotes'),
    };
  }

  openCustomWorldBuilder(status = '', isError = false) {
    const sim = this.g.sim; const econ = sim.econ;
    if (sim.stars() < 3) { sim.toast('三星后开放 AI 自定义世界'); return; }
    const draft = { name: '', sourceMode: 'auto', genre: '', concept: '', mustInclude: '', compileNotes: '', tone: '', mustAvoid: '', reviewNotes: '', ...(this.customWorldDraft || {}) };
    const result = this.customWorldResult;
    const fee = customWorldCreationCost(econ.customWorlds.length);
    const activeTab = ['concept', 'compile', 'review'].includes(this.customWorldActiveTab) ? this.customWorldActiveTab : 'concept';
    const tabs = [['concept', '① 概念提炼'], ['compile', '② 完整编译'], ['review', '③ 审核修复']];
    const tabButtons = tabs.map(([key, label]) => `<button data-act="customworldtab" data-v="${key}" class="${activeTab === key ? 'on' : ''}">${label}</button>`).join('');
    const sourceModeOptions = [['auto', 'AI 自动识别'], ['original', '原创世界'], ['existing_work', '既有作品世界']].map(([value, label]) => `<option value="${value}" ${draft.sourceMode === value ? 'selected' : ''}>${label}</option>`).join('');
    const stageContent = activeTab === 'concept'
      ? `<div class="dim">只填写世界名称也可以：AI 会识别它是原创构想还是既有作品世界，并补齐规律、文明、历史、势力、经济、人物、经营规则和对白。既有作品世界会保留著名原作角色作为稀有访客。</div>
        <div class="creator-identity" style="margin-top:8px"><label>世界名称<input data-custom-world="name" maxlength="24" value="${htmlText(draft.name)}" placeholder="如：逆潮天城或作品世界名"></label><label>来源模式<select data-custom-world="sourceMode">${sourceModeOptions}</select></label><label>类型（可选）<input data-custom-world="genre" maxlength="80" value="${htmlText(draft.genre)}" placeholder="如东方修仙、海洋科幻"></label></div>
        <label style="display:block;margin-top:7px"><b>世界构想（可选）</b><textarea class="prompt-editor" data-custom-world="concept" maxlength="2400" placeholder="可补充世界气质、自然规律、文明和想体验的冲突；留空时 AI 根据名称自行展开。">${htmlText(draft.concept)}</textarea></label>`
      : activeTab === 'compile'
        ? `<div class="dim">这一页直接约束完整设定的编译，不要求先填写概念页。</div>
          <label style="display:block;margin-top:7px"><b>必须包含</b><textarea class="prompt-editor" data-custom-world="mustInclude" maxlength="1200" placeholder="地点、文明、力量体系、人物、经营特色等，可逐行填写。">${htmlText(draft.mustInclude)}</textarea></label>
          <label style="display:block;margin-top:7px"><b>完整设定补充要求</b><textarea class="prompt-editor" data-custom-world="compileNotes" maxlength="1800" placeholder="例如：历史必须与当代矛盾互相因果；至少有一座适合旅店驻留的城市。">${htmlText(draft.compileNotes)}</textarea></label>
          <label style="display:block;margin-top:7px">叙事基调<input data-custom-world="tone" maxlength="120" value="${htmlText(draft.tone)}" placeholder="如宏大但有人间烟火、冷峻克制"></label>`
        : `<div class="dim">这一页可提前填写审核底线和修复重点，不要求概念或编译阶段已经完成。</div>
          <label style="display:block;margin-top:7px"><b>禁止包含</b><textarea class="prompt-editor" data-custom-world="mustAvoid" maxlength="1200" placeholder="不希望出现的专有名词、题材、表达或玩法倾向。">${htmlText(draft.mustAvoid)}</textarea></label>
          <label style="display:block;margin-top:7px"><b>审核与修复重点</b><textarea class="prompt-editor" data-custom-world="reviewNotes" maxlength="1800" placeholder="例如：检查普通人的日常生活；避免只有宏观设定而缺少经营影响。">${htmlText(draft.reviewNotes)}</textarea></label>`;
    const previewDecision = result ? this.worldDecisionSummary(result) : null;
    const preview = result ? `<div class="card" style="border-left-color:${htmlText(result.visuals?.atmosphere?.tint || '#7A4BE0')}"><div class="row"><h3>${htmlText(result.icon)} ${htmlText(result.name)}</h3><b>${htmlText(result.genre)}</b></div><div>${htmlText(result.tagline)}</div>${result.source?.mode === 'existing_work' ? `<div class="hi">既有作品世界 · ${htmlText(result.source.workName)} · ${result.notableCharacters?.filter((character) => character.canonical && character.visitor).length || 0} 名著名角色可到店</div>` : '<div class="dim">原创世界</div>'}<div class="dim" style="margin-top:5px">${htmlText(result.identity?.summary || '')}</div><div class="dim" style="margin-top:5px">地区 ${result.regions?.length || 0} · 历史 ${result.history?.length || 0} · 势力 ${result.factions?.length || 0} · 标志人物 ${result.notableCharacters?.length || 0}</div><div class="world-decision-grid"><div class="card"><b>优势</b><div>${htmlText(previewDecision.advantages)}</div></div><div class="card"><b>风险</b><div>${htmlText(previewDecision.risks)}</div></div><div class="card"><b>建议设施</b><div>${htmlText(previewDecision.facilities)}</div></div><div class="card"><b>建议库存</b><div>${htmlText(previewDecision.stock)}</div></div></div></div>` : '';
    const archived = econ.archivedWorlds?.length ? `<details><summary aria-expanded="false">已归档世界 ${econ.archivedWorlds.length}</summary>${econ.archivedWorlds.map((world) => `<div class="card"><div class="row"><b>${htmlText(world.icon || '◈')} ${htmlText(world.name)}</b><button data-act="worldrestore" data-v="${htmlText(world.id)}" ${econ.customWorlds.length >= CUSTOM_WORLD_LIMIT ? 'disabled' : ''}>重新生成</button></div><div class="dim">${htmlText(world.summary || '')}</div></div>`).join('')}</details>` : '';
    const generateLabel = this.customWorldBusy ? '生成中…' : draft.name.trim() ? '按名称填充全部世界内容' : result ? '重新生成完整世界' : '生成完整世界';
    const previewNotice = !!result && this.customWorldResultNotice;
    this.showModal(`<h3>✦ AI 自定义世界</h3><div class="dim">三个标签可随时切换和输入，无需按顺序完成；生成时 AI 会一次读取三页内容。生成预览免费，确认保存时收费并占用一个世界槽。</div>${status ? `<div class="${isError ? 'bad' : 'good'}" style="margin-top:7px">${htmlText(status)}</div>` : ''}
      <div class="prompt-tabs world-builder-tabs" data-custom-world-tabs>${tabButtons}</div><div data-custom-world-pane="${activeTab}">${stageContent}</div>
      ${preview}${archived}<div class="row" style="margin-top:10px"><button data-act="customworldgenerate" ${this.customWorldBusy || econ.customWorlds.length >= CUSTOM_WORLD_LIMIT ? 'disabled' : ''}>${generateLabel}</button>${this.customWorldBusy ? '<button data-act="customworldcancelai">取消</button>' : ''}${result ? `<button data-act="customworldsave" ${econ.coins < fee ? 'disabled' : ''}>确认保存 · ${fee} 币</button>` : ''}<span style="flex:1"></span><span class="dim">槽位 ${econ.customWorlds.length}/${CUSTOM_WORLD_LIMIT}</span><button data-act="worldcard" data-v="${htmlText(econ.currentWorldId)}">返回航路</button></div>`, true, false, { variant: result ? 'important' : 'plain', notice: previewNotice, noticeLabel: '新生成的世界预览' });
    if (previewNotice) this.customWorldResultNotice = false;
  }

  async generateCustomWorld() {
    const sim = this.g.sim; const econ = sim.econ;
    this.customWorldDraft = this.customWorldFormData();
    if (!aiConfigured()) { this.openCustomWorldBuilder('请先在设置中接入 AI 并选择模型。', true); return; }
    if (!this.customWorldDraft.concept.trim() && !this.customWorldDraft.name.trim()) { this.openCustomWorldBuilder('请至少填写世界名称或世界构想。', true); return; }
    if (econ.customWorlds.length >= CUSTOM_WORLD_LIMIT) { this.openCustomWorldBuilder('八个活动世界槽已满，请先归档一个自定义世界。', true); return; }
    this.customWorldBusy = true; this.customWorldResult = null;
    this.openCustomWorldBuilder('阶段 1/3：正在提炼世界概念…');
    const controller = new AbortController(); this.customWorldController = controller;
    const tasks = savePromptTasks(this.readPromptTasksForm());
    const requestedName = this.customWorldDraft.name.trim();
    const input = { ...this.customWorldDraft, name: requestedName, mustInclude: this.customWorldDraft.mustInclude.split(/[\n,，；;]/).map((row) => row.trim()).filter(Boolean), mustAvoid: this.customWorldDraft.mustAvoid.split(/[\n,，；;]/).map((row) => row.trim()).filter(Boolean) };
    try {
      const brief = await requestGameAI('world_concept', { input, existingWorlds: WORLD_PROFILES.map((world) => ({ name: world.name, genre: world.genre, tagline: world.tagline })) }, { signal: controller.signal, promptTasks: tasks });
      if (controller.signal.aborted) throw new Error('已取消生成');
      if (requestedName) brief.workingName = requestedName;
      this.customWorldDraft = {
        ...this.customWorldDraft,
        name: requestedName || brief.workingName,
        sourceMode: brief.sourceMode,
        genre: this.customWorldDraft.genre.trim() || brief.genre,
        concept: this.customWorldDraft.concept.trim() || brief.corePromise,
      };
      this.openCustomWorldBuilder('阶段 2/3：正在编译地理、历史、势力、经济与人物…');
      const compiled = await requestGameAI('world_compile', { input, brief, races: RACE_NAMES.map((name, id) => ({ id, name })), fixedWorldNames: WORLD_PROFILES.map((world) => world.name) }, { signal: controller.signal, promptTasks: tasks });
      if (controller.signal.aborted) throw new Error('已取消生成');
      if (requestedName) compiled.world.name = requestedName;
      this.openCustomWorldBuilder('阶段 3/3：正在检查原创性、一致性和经营平衡…');
      const reviewed = await requestGameAI('world_review', { input, brief, candidate: compiled.world, fixedWorldNames: WORLD_PROFILES.map((world) => world.name), allowedRanges: { allMultipliers: [.85, 1.2], activeCustomWorldLimit: CUSTOM_WORLD_LIMIT } }, { signal: controller.signal, promptTasks: tasks });
      this.customWorldResult = normalizeCustomWorld({ ...reviewed.world, name: requestedName || reviewed.world.name, generationBrief: JSON.stringify(brief), generatedAt: Date.now() }, `custom_${Date.now().toString(36)}`);
      this.customWorldResultNotice = true;
      this.customWorldBusy = false; this.customWorldController = null;
      this.openCustomWorldBuilder(`${requestedName ? `已根据“${requestedName}”` : '已'}填充全部世界内容；审核修复 ${reviewed.repairs?.length || 0} 项。保存前可先核对预览。`);
    } catch (error) {
      this.customWorldBusy = false; this.customWorldController = null;
      this.openCustomWorldBuilder(error?.message === '已取消生成' || controller.signal.aborted ? '已取消生成；输入内容已保留。' : `生成失败：${error?.message || '未知错误'}。可直接重试，尚未扣费。`, true);
    }
  }

  saveCustomWorld() {
    const sim = this.g.sim; const econ = sim.econ; const world = this.customWorldResult;
    if (!world || econ.customWorlds.length >= CUSTOM_WORLD_LIMIT) return;
    const cost = customWorldCreationCost(econ.customWorlds.length);
    if (econ.coins < cost) { this.openCustomWorldBuilder(`界币不足：保存该世界需要 ${cost} 界币。`, true); return; }
    econ.coins -= cost; econ.customWorlds.push(world);
    econ.archivedWorlds = (econ.archivedWorlds || []).filter((row) => row.name !== world.name);
    econ.worldKnowledge[world.id] = { level: 4, arrivals: 0, served: 0, firstDay: econ.day, reviewed: true, journeyAsked: true };
    this.customWorldResult = null; this.customWorldDraft = null; this.customWorldActiveTab = 'concept';
    sim.toast(`已锚定${world.source?.mode === 'existing_work' ? '作品' : '原创'}世界 ${world.icon} ${world.name}（-${cost} 界币）`); this.g.save(); this.openWorldCard(world.id);
  }

  openWorldArchiveConfirm(id) {
    const sim = this.g.sim; const world = sim.econ.customWorlds.find((row) => row.id === id);
    if (!world || sim.dayActive || id === sim.econ.currentWorldId || id === sim.econ.pendingWorldSwitch?.worldId) return;
    this.showModal(`<h3 class="bad">归档 ${htmlText(world.icon)} ${htmlText(world.name)}？</h3><div class="card">归档会保留名称、摘要和历史引用，但移除完整经营载荷并释放一个活动槽。恢复时需要重新生成并确认。</div><div class="row"><button data-act="worldarchivego" data-v="${htmlText(id)}" class="warn">确认归档</button><button data-act="worldcard" data-v="${htmlText(id)}">取消</button></div>`, true, false, { variant: 'danger' });
  }

  archiveCustomWorld(id) {
    const sim = this.g.sim; const econ = sim.econ; const world = econ.customWorlds.find((row) => row.id === id);
    if (!world || sim.dayActive || id === econ.currentWorldId || id === econ.pendingWorldSwitch?.worldId) return;
    econ.archivedWorlds.push({ id: world.id, name: world.name, icon: world.icon, genre: world.genre, source: world.source, summary: world.identity?.summary || '', archivedAt: Date.now(), generationBrief: world.generationBrief || '' });
    econ.archivedWorlds = econ.archivedWorlds.slice(-40); econ.customWorlds = econ.customWorlds.filter((row) => row.id !== id);
    delete econ.worldKnowledge[id]; sim.toast(`已归档 ${world.name}，释放一个自定义世界槽`); this.g.save(); this.openWorldCard(econ.currentWorldId);
  }

  restoreArchivedWorld(id) {
    const archived = this.g.sim.econ.archivedWorlds?.find((world) => world.id === id);
    if (!archived || this.g.sim.econ.customWorlds.length >= CUSTOM_WORLD_LIMIT) return;
    this.customWorldResult = null;
    this.customWorldActiveTab = 'concept';
    this.customWorldDraft = {
      name: archived.name, sourceMode: archived.source?.mode || 'auto', genre: archived.genre || '',
      concept: `重新生成已归档世界“${archived.name}”。保留以下核心记忆并补齐完整规则：${archived.summary || ''}\n旧创作简报：${archived.generationBrief || '无'}`,
      mustInclude: archived.summary || '', compileNotes: '保留旧世界的核心身份，同时补齐全部地区、历史、势力、经济、人物与经营字段。', tone: '',
      mustAvoid: archived.source?.mode === 'existing_work' ? '不要改写著名原作角色姓名；不要复制长段原作台词、歌词或完整场景。' : '不要复制现有作品的专有角色、势力、地点与历史', reviewNotes: '核对新版本与旧世界核心记忆的一致性。',
    };
    this.openCustomWorldBuilder('已载入归档摘要；重新生成并确认保存后才会重新占用槽位。');
  }

  openReadiness() {
    const check = this.g.openingReadiness();
    const forecast = new Set(this.g.sim.econ.worldForecast || []);
    const tide = WORLD_PROFILES.filter((world) => forecast.has(world.id));
    const rows = (items, cls) => items.length ? items.map((item) => `<div class="${cls}">· ${htmlText(item)}</div>`).join('') : `<div class="good">✓ 无</div>`;
    this.showModal(`<h3>营业准备检查</h3>
      <div class="dim">阻断项必须修复后才能开门；警告项允许开门，但会造成等待、闲置或产能浪费。</div>
      <h3 style="margin-top:10px">阻断项</h3>${rows(check.blocking, 'bad')}
      <h3 style="margin-top:10px">警告项</h3>${rows(check.warnings, 'hi')}
      <div class="card" style="margin-top:10px;border-left-color:#7A4BE0"><b>位面潮汐预报</b><div>今日预计客流增强：${tide.map((world) => `${world.icon} ${world.name}`).join('、') || '暂无'}</div><div class="dim">可据此调整菜单、员工岗位和设施覆盖；偏好设施缺失时客人仍会选择其他可用消费。</div></div>
      <div class="card" style="margin-top:10px"><b>当前产线</b><div>完整厨房线 ${check.productionLines} 条｜酒吧/酒廊饮品线 ${check.drinkLines} 条</div></div>
      <div class="row" style="margin-top:10px"><button data-act="closemodal">返回规划</button>${check.blocking.length ? '' : '<button data-act="closemodal">检查完成</button>'}</div>`);
  }

  openBlueprintLibrary()       {
    const rooms = this.g.roomBlueprints();
    const layouts = this.g.layoutBlueprints();
    const roomRows = rooms.length ? rooms.map((bp, index) => `<div class="card"><div class="row"><span><b>${htmlText(bp.name)}</b><span class="dim"> · 家具 ${bp.furns?.length || 0} · 品质 ${'I'.repeat(bp.quality || 1)}</span></span><span><button data-act="startroombp" data-v="${index}">放置</button><button data-act="delroombp" data-v="${index}" class="warn">删除</button></span></div></div>`).join('') : '<div class="dim">尚未保存房间蓝图。选中房间后点击“保存蓝图”。</div>';
    const layoutRows = layouts.length ? layouts.map((bp, index) => `<div class="card"><div class="row"><span><b>${htmlText(bp.name)}</b><span class="dim"> · 房间 ${bp.tavern?.rooms?.length || 0} · 家具 ${bp.tavern?.furns?.length || 0}</span></span><span><button data-act="applylayout" data-v="${index}">套用</button><button data-act="dellayout" data-v="${index}" class="warn">删除</button></span></div></div>`).join('') : '<div class="dim">尚未保存整店布局。</div>';
    this.showModal(`<h3>建造蓝图库</h3><div class="dim">房间蓝图会按当前品质、风格和家具重新购买；整店布局只调整现有同一批房间与家具的位置，不复制资产。</div><h3 style="margin-top:10px">房间蓝图</h3>${roomRows}<h3 style="margin-top:10px">整店布局</h3>${layoutRows}<div class="row" style="margin-top:10px"><button data-act="savelayout">保存当前整店布局</button><button data-act="closemodal">关闭</button></div>`);
  }

          showModal(inner        , closable = true, preserveAIChat = false, options = {})              {
    if (this.tutorialActive) {
      this.tutorialActive = false;
      this.tutorialLayer.style.display = 'none';
      for (const node of document.querySelectorAll('.tutorial-target')) node.classList.remove('tutorial-target', 'tutorial-satisfied');
    }
    this.closeModal(preserveAIChat);
    const variant = ['plain', 'important', 'danger'].includes(options?.variant) ? options.variant : 'plain';
    // 必经流程（捏脸）不给 ✕：关了就永远进不了店
    const x = closable ? '<button class="x" data-act="closemodal" title="关闭">✕</button>' : '';
    const notice = variant !== 'danger' ? noticeDot(!!options?.notice, options?.noticeLabel || '有未读重要内容') : '';
    const m = el(`<div class="modal modal-${variant}" role="presentation"><div class="mbox modal-${variant}" role="dialog" aria-modal="true">${x}${notice ? `<span class="modal-notice">${notice}</span>` : ''}${inner}</div></div>`);
    this.root.appendChild(m);
    this.modal = m;
    return m;
  }

  closeModal(preserveAIChat = false)       {
    this.chatAIController?.abort(); this.chatAIController = null;
    this.settlementAIController?.abort(); this.settlementAIController = null;
    this.creatorAIController?.abort(); this.creatorAIController = null;
    if (!preserveAIChat) { this.finishAIStaffChatSession(); this.finishAIGuestChatSession(); }
    if (this.modal) { this.modal.remove(); this.modal = null; }
  }

  finishAIStaffChatSession()       {
    const session = this.aiStaffChatSession;
    this.aiStaffChatSession = null;
    if (!session || session.exchanges <= 0) return;
    this.g.sim.chatWith(session.id, session.lastReply);
    this.g.save();
  }

  finishAIGuestChatSession()       {
    const session = this.aiGuestChatSession;
    this.aiGuestChatSession = null;
    if (!session || session.exchanges <= 0) return;
    const guest = this.g.sim.guests.find((person) => person.id === session.id);
    const group = guest ? this.g.sim.groupOfGuest(guest.id) : null;
    if (!guest || !group) return;
    guest.aff = Math.max(-100, Math.min(100, Math.round((guest.aff || 0) + Math.min(5, 1 + session.exchanges))));
    group.intCd = Math.max(group.intCd || 0, 18);
    group.greeted = true;
    guest.bubble = { text: session.lastReply, t: 3.2 };
    this.g.save();
  }

  openHelp()       {
    const tutorial = this.currentTutorialState();
    const guideAction = tutorial.started && !tutorial.completed && !tutorial.skipped
      ? `<button data-act="tutorialresume">继续引导 ${tutorial.index + 1}/${TUTORIAL_STEPS.length}</button>`
      : `<button data-act="tutorialstart">开始新手引导</button>`;
    this.showModal(`<h3>引导与帮助</h3>
      <div class="card" style="border-left-color:#8A74B8"><div class="row"><div><b>分步新手引导</b><div class="dim">逐步高亮地图、顶栏、房间、家具、菜单、经营、员工、营业、客人、工作与日志。</div></div><span>${tutorial.completed ? '<span class="good">已完成</span>' : tutorial.skipped ? '<span class="dim">已跳过</span>' : ''}</span></div>
        <div class="row" style="margin-top:7px">${guideAction}<button data-act="tutorialrestart">从头重新引导</button></div></div>
      <h3 style="margin-top:10px">快速参考</h3>
      <div class="card"><b>规划期</b><div class="dim">建房与布置家具 → 检查菜单和库存 → 调整员工岗位/负责区域 → 保存 → 开门。</div></div>
      <div class="card"><b>营业期</b><div class="dim">客人从位面门进入；员工自动执行迎宾、点单、取料、制作、上菜、收台和清洁。用客人页看耐心，用工作页查积压，用日志找离店原因。</div></div>
      <div class="card"><b>常见故障</b><div class="dim">设备黄色使用面必须可达，椅子必须朝向桌子；菜品还需要对应设施、足够食材和技能。卫生/拥堵热图可定位环境问题。</div></div>
      <div class="card"><b>日结与成长</b><div class="dim">营业收入实时入账；日结扣工资、维护和补货。声望升星解锁房型与家具品质，连续 3 次低于信用线会被封印。</div></div>
      <div class="card"><b>角色与 AI</b><div class="dim">点击角色看详情，靠近按 E 互动。AI 设置、模型选择和玩家背景在“设置/提示词”中管理；AI 不会替代真实经营数值结算。</div></div>
      <div class="row" style="margin-top:8px"><button data-act="closemodal">关闭</button></div>`);
  }

  openEvent()       {
    const s = this.g.sim;
    const card = s.pendingEvent;
    if (!card) return;
    const choices = card.choices.map((c, i) => {
      const chance = s.choiceChance(c, card);
      const actor = card.challengeFallback ? s.staff.find((person) => person.id === card.actorId) : null;
      const best = c.skill ? (actor ? { name: actor.name, value: actor.skills[c.skill] } : s.bestSkill(c.skill)) : null;
      const afford = !c.cost || s.econ.coins >= c.cost;
      return `<div class="card"><div class="row"><b>${c.label}</b>
        <span class="${afford ? 'hi' : 'bad'}">${c.cost ? '花费 ' + c.cost : ''}</span></div>
        <div class="dim">${c.note}${best ? `｜检定：${best.name} ${SKILL_LABEL[c.skill          ]} ${best.value}${card.challengeFallback ? `｜D100 掷出 ≤ ${chance} 成功` : ` → 成功率 ${chance}%`}` : ''}</div>
        <button data-act="${card.challengeFallback ? 'eventroll' : 'event'}" data-v="${i}" ${afford ? '' : 'disabled'}>${card.challengeFallback ? `决定这样做（目标 ${chance}）` : '选择'}</button></div>`;
    }).join('');
    const custom = aiConfigured() && !card.challengeFallback ? `<div class="card" style="border-left-color:#7A4BE0"><b>✦ 自定义处理（AI 推演）</b>
      <div class="dim" style="margin:5px 0 8px">描述店主要采取的行动。AI 会生成成功与失败结果，由游戏检定并在安全范围内结算真实数值。</div>
      <textarea data-event-custom maxlength="300" rows="3" placeholder="例如：让店主先安抚客人，再请最冷静的员工检查异常来源" style="width:100%;box-sizing:border-box"></textarea>
      <div class="row" style="margin-top:8px;justify-content:flex-end"><button data-act="eventcustom">使用 AI 推演</button></div></div>` : '';
    const sourceBadge = card.challengeFallback ? '<span class="hi">◆ 客人挑战 · 补救检定</span>' : card.aiGenerated ? '<span class="hi">✦ AI 当日事件</span>' : card.worldEvent ? `<span class="hi">◆ ${card.chainId ? `世界长期委托：${htmlText(card.chainName)} ${Number(card.chainStage) + 1}/3` : '世界专属营业事故'} · ${htmlText(card.factionName || '当地势力')}</span>` : card.chainId ? `<span class="hi">◆ 长期事件链：${htmlText(card.chainName)} ${Number(card.chainStage) + 1}/3</span>` : '';
    this.showModal(`<h3>⚡ ${card.title}</h3>${sourceBadge}<div style="max-width:520px;margin-top:5px">${card.text}</div>${choices}${custom}
      <div class="dim">暂停中仍可拖动镜头查看酒馆。</div>`, true, false, { variant: card.chainId ? 'important' : 'plain' });
  }

  async runDiceEvent(index) {
    const sim = this.g.sim;
    const card = sim.pendingEvent;
    const choice = card?.choices[index];
    if (!card?.challengeFallback || !choice) return;
    const chance = sim.choiceChance(choice, card);
    this.showModal(`<h3>🎲 ${htmlText(card.title)}</h3>
      <div class="card" style="text-align:center"><div class="dim">${htmlText(choice.label)} · D100 目标 ≤ ${chance}</div>
      <div data-dice-value style="font-size:64px;font-weight:800;line-height:1.35;margin:12px">--</div><div class="hi">投骰中……</div></div>`);
    const startedModal = this.modal;
    const die = startedModal?.querySelector('[data-dice-value]');
    await new Promise((resolve) => {
      let ticks = 0;
      const timer = window.setInterval(() => {
        if (die) die.textContent = String(1 + Math.floor(Math.random() * 100)).padStart(2, '0');
        if (++ticks >= 12 || this.modal !== startedModal) { window.clearInterval(timer); resolve(); }
      }, 65);
    });
    if (this.modal !== startedModal || sim.pendingEvent !== card) return;
    const narrative = sim.resolveEvent(index);
    this.g.save();
    const result = sim.lastEventResolution;
    const effectParts = [];
    if (result.effects.coins) effectParts.push(`界币 ${result.effects.coins > 0 ? '+' : ''}${result.effects.coins}`);
    if (result.effects.guestAffinity) effectParts.push(`客人好感 ${result.effects.guestAffinity > 0 ? '+' : ''}${result.effects.guestAffinity}`);
    if (result.effects.service) effectParts.push(result.effects.service);
    this.showModal(`<h3>${result.success ? '✅ 挑战成功' : '❌ 挑战失败'}</h3>
      <div class="card" style="text-align:center"><div class="dim">D100 目标 ≤ ${result.chance}</div>
      <div style="font-size:64px;font-weight:800;line-height:1.35;margin:8px;color:${result.success ? '#58b96b' : '#d65b62'}">${result.roll}</div>
      <b>${htmlText(result.actor)}使用${SKILL_LABEL[result.skill]}：${result.success ? '通过' : '未通过'}</b></div>
      <div style="max-width:560px;white-space:pre-wrap;line-height:1.7;margin-top:10px">${htmlText(narrative)}</div>
      <div class="card" style="margin-top:10px"><b>实际影响</b><div>${htmlText(effectParts.join(' · ') || '无额外数值变化')}</div></div>
      <div class="row" style="margin-top:10px"><button data-act="closemodal">继续营业</button></div>`);
  }

  eventAIContext                 = null;
  eventCustomContext             = null;

  async requestDynamicBusinessEvent(force = false) {
    const sim = this.g.sim;
    if (!sim.dayActive || !aiConfigured()) return false;
    if (this.dynamicAIStatus?.state === 'loading' && !force) return false;
    this.dynamicAIController?.abort();
    const controller = new AbortController();
    this.dynamicAIController = controller;
    this.dynamicAIStatus = { state: 'loading', text: 'AI 正在读取今日经营并创建收尾事件…' };
    sim.toast('✦ 已向 AI 发布本日经营事件创作任务');
    this.render(true);
    try {
      const plan = await requestGameAI('dynamic_event', sim.dynamicEventFacts(), { signal: controller.signal });
      if (controller.signal.aborted || this.dynamicAIController !== controller || !sim.dayActive) return false;
      if (!sim.queueAIDynamicEvent(plan)) throw new Error('事件结构未通过游戏校验');
      this.dynamicAIStatus = { state: 'ready', text: `AI 事件《${plan.title}》已就绪` };
      sim.toast(`✦ AI 经营事件《${plan.title}》已进入现场`);
      this.render(true);
      return true;
    } catch (err) {
      if (controller.signal.aborted || err?.name === 'AbortError') {
        this.dynamicAIStatus = { state: 'cancelled', text: '已取消本日 AI 经营事件' };
        this.render(true); return false;
      }
      this.dynamicAIStatus = { state: 'error', text: `AI 事件失败：${err?.message || '未知错误'}；已降级为预制事件` };
      if (!sim.pendingEvent && !sim.queuedDynamicEvent) sim.triggerEvent();
      sim.toast('AI 经营事件生成失败，已自动使用预制事件；可在顶栏重试');
      this.render(true);
      return false;
    } finally {
      if (this.dynamicAIController === controller) this.dynamicAIController = null;
    }
  }

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

  playerAIFacts(playerText = '')       {
    const owner = this.g.sim.staff.find((person) => person.isOwner);
    const profile = loadPlayerProfile(this.g.currentSlot);
    return {
      identity: {
        name: owner?.name || '店主', sex: owner?.sex || '未知', age: owner?.age || null, race: owner?.race || '未知',
        role: profile.role,
        relationToVenue: '多元便携旅店的店主、所有者与经营者；不是来消费、点餐或住店的客人。',
      },
      background: profile.background || '玩家尚未填写额外背景设定。',
      line: String(playerText || '').trim().slice(0, 240),
    };
  }

  staffAIFacts(st       , playerText        )         {
    const sim = this.g.sim;
    const owner = sim.staff.find((person) => person.isOwner);
    const host = sim.currentWorld();
    return {
      world: { venue: '多元便携旅店', currentHost: host.name, genre: host.genre, summary: host.identity.summary, environmentRule: host.environmentRule, todayRule: sim.currentWorldRule(), festival: sim.currentWorldFestival(), etiquette: host.culture.etiquette },
      day: sim.econ.day,
      player: this.playerAIFacts(playerText),
      employee: {
        name: st.name, sex: st.sex, age: st.age, race: st.race, job: JOB_LABEL[st.job],
        traits: st.traits.map((id) => { const trait = TRAITS.find((item) => item.id === id); return trait ? { name: trait.name, note: trait.note } : { name: id }; }),
        skills: Object.fromEntries(SKILL_KEYS.map((key) => [SKILL_LABEL[key], st.skills[key]])),
        affinity: { value: Math.round(st.aff), level: sim.affLevel(st.aff).name },
        state: { task: st.task?.label || st.note || '待命', stamina: Math.round(st.needs.stamina), morale: Math.round(st.needs.morale), stress: Math.round(st.needs.stress) },
        background: st.background || null,
      },
      relationship: '员工与雇主/店主之间的店内交流，不是服务员接待顾客。',
      relationshipSummary: st.relationshipSummary || '尚无长期关系摘要。',
      recentConversation: (st.aiChatLog || []).slice(0, 6).reverse(),
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
    this.showModal(`<div class="row portrait-head">${portraitFrame(st.app, 'detail', st.name)}
        <div style="flex:1"><h3 style="margin:0">和 ${htmlText(st.name)} 聊聊</h3><div class="dim">${htmlText(st.race)}·${JOB_LABEL[st.job]}｜${this.g.sim.affLevel(st.aff).name} ${Math.round(st.aff)}</div></div></div>
      <div style="max-width:680px;max-height:260px;overflow:auto;margin-top:8px">
        ${history.length ? history.map((item) => `<div class="card"><div><b>${htmlText(item.playerName || '店主')}：</b>${htmlText(item.player)}</div><div style="margin-top:4px"><b>${htmlText(st.name)}：</b>${htmlText(item.reply)}</div></div>`).join('') : '<div class="dim">还没有 AI 对话记录。说点什么吧。</div>'}
      </div>
      ${error ? `<div class="bad" style="margin-top:7px">${htmlText(error)}</div>` : ''}
      <textarea id="aiplayerline" maxlength="120" rows="3" placeholder="输入店主想说的话……" style="width:100%;box-sizing:border-box;margin-top:8px"></textarea>
      <div class="row" style="margin-top:8px"><span class="dim">本次会话可连续发送；结束聊天后统一结算一次互动。</span>
        <span>${error ? '<button data-act="aichatretry">重试</button><button data-act="aichatlocal">使用本地回复</button>' : ''}<button data-act="aicancelchat" style="display:none">取消生成</button><button data-act="aichatsend" data-v="${st.id}">发送</button><button data-act="detail" data-v="${st.id}">结束聊天</button></span></div>`, true, true);
  }

  async sendAIStaffChat(id        )       {
    const st = this.g.sim.staff.find((person) => person.id === id);
    const input = this.modal?.querySelector('#aiplayerline')                    ;
    const line = input?.value.trim() || '';
    if (!st || !line) { if (input) input.focus(); return; }
    const startedModal = this.modal;
    const send = this.modal?.querySelector('[data-act="aichatsend"]')                     ;
    if (send) { send.disabled = true; send.textContent = '等待回复…'; }
    const cancel = this.modal?.querySelector('[data-act="aicancelchat"]'); if (cancel) cancel.style.display = '';
    const controller = new AbortController(); this.chatAIController?.abort(); this.chatAIController = controller;
    this.pendingAIChat = { kind: 'staff', id, line };
    try {
      const result = await requestGameAI('staff_chat', this.staffAIFacts(st, line), { signal: controller.signal });
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
      if (st.aiChatLog.length > 20) st.aiChatLog.pop();
      this.g.save();
      this.openAIStaffChat(id);
    } catch (err) {
      if (this.modal === startedModal) this.openAIStaffChat(id, controller.signal.aborted ? '已取消生成；可重试或改用本地回复。' : `AI 回复失败：${err?.message || '未知错误'}`);
    } finally {
      if (this.chatAIController === controller) this.chatAIController = null;
    }
  }

  guestAffinityFacts(guest       , group       )       {
    const value = Math.max(-100, Math.min(100, Math.round((guest?.aff || 0) + (group?.praised || 0) * 3 - (group?.mocked || 0) * 5)));
    const level = value >= 60 ? '非常亲近' : value >= 25 ? '友好' : value >= 5 ? '略有好感' : value <= -35 ? '敌视' : value <= -10 ? '不满' : '初次认识';
    return { value, level };
  }

  guestAIFacts(guest       , playerText        )       {
    const sim = this.g.sim;
    const group = sim.groupOfGuest(guest.id);
    const want = group ? wantById(group.want) : null;
    const affinity = this.guestAffinityFacts(guest, group);
    const host = sim.currentWorld(); const origin = sim.worldById(guest.originWorldId || group?.originWorldId);
    return {
      world: { venue: '多元便携旅店', currentHost: host.name, currentSummary: host.identity.summary, localRule: sim.currentWorldRule(), guestOrigin: origin.name, originSummary: origin.identity.summary, originEtiquette: origin.culture.etiquette },
      day: sim.econ.day,
      player: this.playerAIFacts(playerText),
      guest: {
        name: guest.name, race: guest.race, role: '当前旅店内的客人', affinity,
        visit: { purpose: want?.name || '到店休息与消费', partySize: group?.size || 1, state: group?.state || '店内活动中' },
        experience: {
          patience: group ? Math.round((group.patience / Math.max(1, group.maxPatience)) * 100) : 50,
          praised: group?.praised || 0, mocked: group?.mocked || 0, mood: Math.round((guest.mood || 1) * 100),
        },
      },
      relationship: '客人与旅店店主之间的交流；玩家负责经营和接待，不是另一位顾客。',
      relationshipSummary: guest.relationshipSummary || '尚无长期关系摘要。',
      recentConversation: (guest.aiChatLog || []).slice(0, 6).reverse(),
    };
  }

  openAIGuestChat(id        , error = '')       {
    const guest = this.g.sim.guests.find((person) => person.id === id);
    const group = guest ? this.g.sim.groupOfGuest(id) : null;
    if (!guest || !group || !aiConfigured()) return;
    if (!this.aiGuestChatSession || this.aiGuestChatSession.id !== id) {
      this.finishAIStaffChatSession();
      this.finishAIGuestChatSession();
      if (group.intCd > 0) { this.openInteract('guest', id, '（客人刚聊过，想先安静一会儿）'); return; }
      this.aiGuestChatSession = { id, exchanges: 0, lastReply: '' };
    }
    const history = (guest.aiChatLog || []).slice(0, 12).reverse();
    const affinity = this.guestAffinityFacts(guest, group);
    this.showModal(`<div class="row portrait-head">${portraitFrame(guest.app, 'detail', guest.name)}
        <div style="flex:1"><h3 style="margin:0">和 ${htmlText(guest.name)} 聊聊</h3><div class="dim">${htmlText(guest.race)}·${guest.regularId ? '常客' : '住店客'}｜${htmlText(affinity.level)} ${affinity.value}</div></div></div>
      ${guest.relationshipSummary ? `<div class="card"><b>长久记忆</b><div class="dim">${htmlText(guest.relationshipSummary)}</div></div>` : ''}
      <div style="max-width:680px;max-height:300px;overflow:auto;margin-top:8px">
        ${history.length ? history.map((item) => `<div class="card"><div><b>${htmlText(item.playerName || '店主')}：</b>${htmlText(item.player)}</div><div style="margin-top:4px"><b>${htmlText(guest.name)}：</b>${htmlText(item.reply)}</div></div>`).join('') : '<div class="dim">还没有对话记录。你是这里的店主，可以询问入住体验，也可以随意闲聊。</div>'}
      </div>
      ${error ? `<div class="bad" style="margin-top:7px">${htmlText(error)}</div>` : ''}
      <textarea id="aiguestline" maxlength="160" rows="3" placeholder="输入店主想对客人说的话……" style="width:100%;box-sizing:border-box;margin-top:8px"></textarea>
      <div class="row" style="margin-top:8px"><span class="dim">本次窗口内可连续交谈；退出后才结束本轮互动。</span>
        <span>${error ? '<button data-act="aichatretry">重试</button><button data-act="aichatlocal">使用本地回复</button>' : ''}<button data-act="aicancelchat" style="display:none">取消生成</button><button data-act="aiguestchatsend" data-v="${guest.id}">发送</button><button data-act="interactback" data-v="${guest.id}">结束聊天</button></span></div>`, true, true);
  }

  async sendAIGuestChat(id        )       {
    const guest = this.g.sim.guests.find((person) => person.id === id);
    const input = this.modal?.querySelector('#aiguestline')                    ;
    const line = input?.value.trim() || '';
    if (!guest || !line) { if (input) input.focus(); return; }
    const startedModal = this.modal;
    const send = this.modal?.querySelector('[data-act="aiguestchatsend"]')                     ;
    if (send) { send.disabled = true; send.textContent = '等待回复…'; }
    const cancel = this.modal?.querySelector('[data-act="aicancelchat"]'); if (cancel) cancel.style.display = '';
    const controller = new AbortController(); this.chatAIController?.abort(); this.chatAIController = controller;
    this.pendingAIChat = { kind: 'guest', id, line };
    try {
      const result = await requestGameAI('guest_chat', this.guestAIFacts(guest, line), { signal: controller.signal });
      if (this.modal !== startedModal) return;
      const reply = String(result.reply || '').trim().slice(0, 180);
      if (!reply) throw new Error('客人现在无法回应');
      guest.bubble = { text: reply, t: 3.2 };
      this.g.sim.sounds.push(result.emotion === 'serious' ? 'angry' : 'happy');
      if (this.aiGuestChatSession?.id === guest.id) {
        this.aiGuestChatSession.exchanges++;
        this.aiGuestChatSession.lastReply = reply;
      }
      const owner = this.g.sim.staff.find((person) => person.isOwner);
      guest.aiChatLog = guest.aiChatLog || [];
      guest.aiChatLog.unshift({ day: this.g.sim.econ.day, playerName: owner?.name || '店主', player: line.slice(0, 160), reply, emotion: result.emotion });
      if (guest.aiChatLog.length > 20) guest.aiChatLog.pop();
      this.openAIGuestChat(id);
    } catch (err) {
      if (this.modal === startedModal) this.openAIGuestChat(id, controller.signal.aborted ? '已取消生成；可重试或改用本地回复。' : `AI 回复失败：${err?.message || '未知错误'}`);
    } finally {
      if (this.chatAIController === controller) this.chatAIController = null;
    }
  }

  retryAIChat() {
    const pending = this.pendingAIChat;
    if (!pending) return;
    if (pending.kind === 'staff') this.openAIStaffChat(pending.id); else this.openAIGuestChat(pending.id);
    const input = this.modal?.querySelector(pending.kind === 'staff' ? '#aiplayerline' : '#aiguestline');
    if (input) input.value = pending.line;
    if (pending.kind === 'staff') this.sendAIStaffChat(pending.id); else this.sendAIGuestChat(pending.id);
  }

  useLocalChatFallback() {
    const pending = this.pendingAIChat;
    if (!pending) return;
    const sim = this.g.sim;
    const owner = sim.staff.find((person) => person.isOwner);
    if (pending.kind === 'staff') {
      const person = sim.staff.find((item) => item.id === pending.id); if (!person) return;
      const reply = person.needs?.stress > 65 ? '我听见了。今天有些忙，等手上的事缓下来，我们再慢慢说。' : person.aff >= 50 ? '当然记得。你愿意这样和我说，我会认真放在心上。' : '嗯，我明白你的意思了。之后在店里也请多关照。';
      sim.showAIChatReply(person.id, reply);
      person.aiChatLog = person.aiChatLog || [];
      person.aiChatLog.unshift({ day: sim.econ.day, playerName: owner?.name || '店主', player: pending.line, reply, emotion: 'neutral', local: true });
      if (this.aiStaffChatSession?.id === person.id) { this.aiStaffChatSession.exchanges++; this.aiStaffChatSession.lastReply = reply; }
      this.g.save(); this.openAIStaffChat(person.id);
    } else {
      const person = sim.guests.find((item) => item.id === pending.id); if (!person) return;
      const aff = this.guestAffinityFacts(person, sim.groupOfGuest(person.id));
      const reply = aff.value >= 25 ? '店主亲自来问，我很高兴。这里的招待很有温度，下次有机会我还会回来。' : '谢谢店主关心。我会把这次旅途和店里的见闻记下来。';
      person.bubble = { text: reply, t: 3.2 }; person.aiChatLog = person.aiChatLog || [];
      person.aiChatLog.unshift({ day: sim.econ.day, playerName: owner?.name || '店主', player: pending.line, reply, emotion: 'neutral', local: true });
      if (this.aiGuestChatSession?.id === person.id) { this.aiGuestChatSession.exchanges++; this.aiGuestChatSession.lastReply = reply; }
      this.g.save(); this.openAIGuestChat(person.id);
    }
  }

  openAIBackground(id        , error = '')       {
    const person = this.personById(id);
    if (!person) return;
    const bg = person.background;
    this.showModal(`<div class="row portrait-head">${portraitFrame(person.app, 'detail', person.name)}<div style="flex:1"><h3 style="margin:0">${htmlText(person.name)}的人物背景</h3><div class="dim">${person.race}·${person.sex}·${person.age}岁</div><div class="hi">出生世界：${htmlText(person.originWorldName || '未记录')}</div></div></div>
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
      world: person.originWorldName
        ? `角色出生并成长于“${person.originWorldName}”世界${person.homeRegion ? `的${person.homeRegion}` : ''}，当前正在应聘或供职于跨位面酒馆《多元便携旅店》。背景必须保留这个出生世界。`
        : '角色来自万界之一，正在应聘或供职于跨位面酒馆《多元便携旅店》。',
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

  openStaffTrainingPlan(id, skill) {
    const sim = this.g.sim;
    const staff = sim.staff.find((person) => person.id === id);
    const plan = sim.trainingPlan(id, skill);
    if (!staff || !plan || sim.dayActive || staff.lastTrainingDay === sim.econ.day) return;
    this.showModal(`<h3>${htmlText(plan.world.icon)} ${htmlText(plan.course)} · ${htmlText(plan.world.name)}</h3>
      <div class="card"><div><b>${htmlText(plan.venue)}</b> · ${htmlText(plan.region)}</div>
        <div style="white-space:pre-wrap;line-height:1.7;margin-top:6px">${htmlText(plan.intro)}</div>
        <div class="dim" style="margin-top:6px">风土提示：${htmlText(plan.world.etiquette)}</div></div>
      <div style="margin:9px 0;line-height:1.65">${htmlText(plan.characterNote)}</div>
      ${plan.choices.map((choice) => `<div class="card"><div class="row"><b>${htmlText(choice.label)}</b><span class="hi">总成长 ${choice.total}</span></div>
        <div>${htmlText(choice.approach)}</div><div class="dim" style="margin-top:5px">收益：${htmlText(choice.gainText)}</div>
        <button data-act="trainingchoice" data-id="${staff.id}" data-s="${skill}" data-v="${choice.id}">选择这条路线 · ${plan.cost} 币</button></div>`).join('')}
      <div class="row"><button data-act="detail" data-v="${staff.id}">返回员工详情</button></div>`);
  }

  localTrainingResult(result) {
    const choice = result.choice;
    this.showModal(`<h3>${htmlText(result.world.icon)} ${htmlText(result.staffName)}的进修归来</h3>
      <div class="card"><b>${htmlText(result.world.name)} · ${htmlText(result.venue)}</b>
        <div style="white-space:pre-wrap;line-height:1.75;margin-top:7px">${htmlText(choice.resultText)}</div></div>
      <div class="card"><b>${htmlText(result.staffName)}</b><div>“${htmlText(choice.reflection)}”</div>
        <div class="hi" style="margin-top:6px">${htmlText(choice.gainText)} · 总成长 ${choice.total} · 支出 ${result.cost} 界币</div></div>
      <div class="row" style="margin-top:10px"><button data-act="detail" data-v="${result.staffId}">返回员工详情</button><button data-act="closemodal">关闭</button></div>`);
  }

  async runStaffTraining(id, skill, choiceId) {
    const sim = this.g.sim;
    const staff = sim.staff.find((person) => person.id === id);
    if (!staff || !SKILL_KEYS.includes(skill)) return;
    if (!this.g.trainStaff(id, skill, choiceId)) { this.detailTab = 'growth'; this.openStaffDetail(id); return; }
    this.detailTab = 'growth';
    const result = sim.lastTrainingResult;
    if (!result) { this.openStaffDetail(id); return; }
    if (!aiConfigured()) { this.localTrainingResult(result); return; }
    this.showModal(`<h3>📚 ${htmlText(staff.name)}外出进修</h3><div class="card"><b>${htmlText(result.world.name)} · ${htmlText(result.course)}</b>
      <div class="dim">${htmlText(result.choice.gainText)} · 总成长 ${result.choice.total} · 支出 ${result.cost} 界币</div></div>
      <div class="hi" style="margin-top:10px">AI 正在生成本次打烊期间的进修经历……</div>`);
    const startedModal = this.modal;
    try {
      const result = await requestGameAI('training_story', {
        day: sim.econ.day, venue: '位于万界交汇处的多元旅店', destinationWorld: result.world,
        employee: { name: staff.name, race: staff.race, age: staff.age, job: JOB_LABEL[staff.job], traits: staff.traits, background: staff.background || null },
        course: result.course, selectedRoute: { label: result.choice.label, approach: result.choice.approach, gains: result.choice.gains },
        localScenario: { region: result.region, venue: result.venue, intro: result.intro, mentor: result.mentor },
        before: result.before, after: result.after, cost: result.cost,
      });
      if (this.modal !== startedModal) return;
      this.showModal(`<h3>📚 ${htmlText(result.title)}</h3>
        <div style="max-width:620px;white-space:pre-wrap;line-height:1.75">${htmlText(result.narrative)}</div>
        <div class="card" style="margin-top:10px"><b>${htmlText(staff.name)}</b><div>“${htmlText(result.reflection)}”</div>
        <div class="dim">${htmlText(sim.lastTrainingResult.choice.gainText)} · 总成长 ${sim.lastTrainingResult.choice.total} · 支出 ${sim.lastTrainingResult.cost} 界币</div></div>
        <div class="row" style="margin-top:10px"><button data-act="detail" data-v="${staff.id}">返回员工详情</button><button data-act="closemodal">关闭</button></div>`);
    } catch (err) {
      if (this.modal !== startedModal) return;
      this.localTrainingResult(result);
      const warning = this.modal?.querySelector('.card');
      if (warning) warning.insertAdjacentHTML('beforeend', `<div class="dim" style="margin-top:7px">AI 演绎暂不可用，已显示本地世界剧情：${htmlText(err?.message || '未知错误')}</div>`);
    }
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
    const playerProfile = st.isOwner ? loadPlayerProfile(this.g.currentSlot) : null;
    const near = !!own && !st.isOwner && Math.hypot(own.x - st.x, own.y - st.y) < 2.2;
    const tabs = [['info', '资料'], ['skill', '技能'], ['growth', '成长'], ['rel', '关系']]                      ;
    let body = '';
    if (this.detailTab === 'info') {
      body = `<div class="row" style="flex-wrap:wrap">
          <span class="dim">种族</span><span>${st.race}</span>
          <span class="dim">性别</span><span>${st.sex}</span>
          <span class="dim">年龄</span><span>${st.age}</span>
          <span class="dim">身高/体重</span><span>${st.ht}cm / ${st.wt}kg</span></div>
        ${st.isOwner ? '' : `<div class="row"><span class="dim">出生世界</span><span class="hi">${htmlText(st.originWorldName || '未记录')}</span>${st.homeRegion ? `<span class="dim">故乡</span><span>${htmlText(st.homeRegion)}</span>` : ''}</div>`}
        ${st.isOwner || !st.worldSpecialty ? '' : `<div class="card" style="margin-top:7px;border-left-color:#58A947"><b>世界专长 · ${htmlText(st.worldSpecialty.name)}</b><div class="dim">${htmlText(st.worldSpecialty.note)}</div></div>`}
        <div class="row" style="justify-content:flex-start;flex-wrap:wrap"><span class="dim">性格</span>${st.traits.map((t) => this.traitTag(t, st.id)).join('')}</div>
        <div class="row"><span class="dim">岗位</span><span>${JOB_LABEL[st.job]}</span><span class="dim">负责</span><span>${room ? ROOM_LABEL[room.kind] : '全店'}</span><span class="dim">薪资</span><span class="${st.isOwner ? 'dim' : 'hi'}">${st.isOwner ? '店主不领取工资' : `日薪 ${st.wage}`}</span></div>
        <div class="row"><span class="dim">卧室</span><span>${st.isOwner ? '<span class="dim">店主守店</span>' : (() => { const br = sim.bedroomOf(st.id); return br ? `休息室 #${br.id}` : '<span class="bad">无（打地铺）</span>'; })()}</span></div>
        <div class="row"><span class="dim">体力</span>${bar(st.needs.stamina, 100, '#8DDB4A')}<span class="dim">士气</span>${bar(st.needs.morale, 100, '#39D7D2')}</div>
        <div class="row"><span class="dim">压力</span>${bar(st.needs.stress, 100, '#FF6B5A')}<span class="dim">饥饿</span>${bar(st.needs.hunger, 100, '#F3B84B')}</div>
        <div class="dim">${st.task ? '正在：' + st.task.label : st.note || '待命中'}</div>
        ${st.isOwner ? `<div class="card" style="margin-top:7px;border-left-color:#7A4BE0"><div class="row"><b>店主身份与背景</b><button data-act="ownerprofile">修改设定</button></div><div><span class="dim">身份定位：</span>${htmlText(playerProfile.role)}</div><div class="dim" style="margin-top:5px;white-space:pre-wrap">${playerProfile.background ? htmlText(playerProfile.background) : '尚未填写背景设定。'}</div></div>` : st.background ? `<div class="card" style="margin-top:7px"><b>人物背景</b>${st.background.role ? `<div><span class="dim">身份定位：</span>${htmlText(st.background.role)}</div>` : ''}<div class="dim">${htmlText(st.background.background)}</div><button data-act="viewbg" data-v="${st.id}">查看完整背景</button></div>` : aiConfigured() ? `<button data-act="aibg" data-v="${st.id}" style="margin-top:7px">AI 生成员工背景</button>` : ''}`;
    } else if (this.detailTab === 'skill') {
      body = SKILL_KEYS.map((k) => `<div class="row"><span class="dim" style="width:52px">${SKILL_LABEL[k]}</span>${bar(st.skills[k], 100, '#F3B84B')}<span style="width:56px">${st.skills[k]}<span class="dim">+${Math.floor(st.exp[k] || 0)}</span></span></div>`).join('')
        + `<div class="dim">干活会攒经验，熟练度越高上菜/翻台/清洁越快。好感加成：当前 +${Math.round(st.aff / 4)}% 动作速度。</div>`;
    } else if (this.detailTab === 'growth') {
      const trained = st.lastTrainingDay === sim.econ.day;
      body = `<div class="card"><div class="row"><b>外出进修</b><span class="${trained ? 'bad' : 'dim'}">${sim.dayActive ? '营业中不可外出' : trained ? '本次打烊已进修' : '本次打烊可选择一次'}</span></div>
        <div class="dim">同一名员工每次打烊期间只能选择一门课程；将根据员工性格和已接通世界生成研修事件。三条路线的成长分配不同，但总成长量相同。</div>
        <div class="row" style="flex-wrap:wrap;margin-top:7px">${SKILL_KEYS.map((skill) => { const cost = Math.round(90 + st.skills[skill] * 2.2); return `<button data-act="stafftrain" data-id="${st.id}" data-v="${skill}" ${sim.dayActive || trained || st.skills[skill] >= 100 ? 'disabled' : ''} title="${TRAINING_PROGRAMS[skill]}：能力 +3">${TRAINING_PROGRAMS[skill]}<br><span class="dim">${SKILL_LABEL[skill]} ${st.skills[skill]} → ${Math.min(100, st.skills[skill] + 3)} · ${cost} 币</span></button>`; }).join('')}</div></div>
        <div class="card"><b>个人装备</b><div class="row" style="flex-wrap:wrap;margin-top:7px">${STAFF_EQUIPMENT.map((item) => `<button data-act="staffequip" data-id="${st.id}" data-v="${item.id}" ${sim.dayActive || st.equipment?.includes(item.id) ? 'disabled' : ''} title="${SKILL_LABEL[item.skill]} +${item.bonus}">${st.equipment?.includes(item.id) ? '✓ ' : ''}${item.name} · ${item.cost} 币<br><span class="dim">${SKILL_LABEL[item.skill]} +${item.bonus}</span></button>`).join('')}</div></div>
        <div class="card"><b>职业技能</b><div class="row" style="flex-wrap:wrap;margin-top:7px">${STAFF_PERKS.map((perk) => `<button data-act="staffperk" data-id="${st.id}" data-v="${perk.id}" ${sim.dayActive || st.perks?.includes(perk.id) ? 'disabled' : ''} title="${perk.note}；要求 ${perk.need}">${st.perks?.includes(perk.id) ? '✓ ' : ''}${perk.name} · ${perk.cost} 币<br><span class="dim">${perk.note}</span></button>`).join('')}</div></div>`;
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
    this.showModal(`<div class="row portrait-head">${portraitFrame(st.app, 'detail', st.name)}
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
      if (st.aff >= 25) acts.push(['care', '关心近况']);
      if (st.aff >= 45) acts.push(['dreams', '谈谈理想']);
      if (st.aff >= 65) acts.push(['secret', '交换秘密']);
      if (sameRoom && nightInteractionAction(sim, 'staff', own, st) === 'romance') acts.push(['romance', '邀请共度春宵']);
      this.showModal(`<div class="row portrait-head">${portraitFrame(st.app, 'detail', st.name)}
          <div style="flex:1"><h3 style="margin:0">${st.name}</h3>
            <div class="dim">${st.race}·${JOB_LABEL[st.job]}｜<span style="color:${lv.color}">${lv.name} ${Math.round(st.aff)}</span></div>
            <div class="dim">${st.task ? '正在：' + st.task.label : '待命中'}｜压力 ${Math.round(st.needs.stress)}｜体力 ${Math.round(st.needs.stamina)}</div></div></div>
        <div class="dim" style="margin-top:6px">${near ? '就在你身边，说点什么？' : `太远了（${d.toFixed(1)} 格）：走到 2.8 格内才能搭话。`}${st.affCd > 0 ? `｜深入互动冷却 ${Math.ceil(st.affCd)} 秒` : ''}</div>
        ${this.interactMsg ? `<div class="hi" style="margin-top:8px">${this.interactMsg}</div>` : ''}
        <div class="row" style="margin-top:10px;flex-wrap:wrap">
          ${acts.map(([a, n]) => `<button data-act="iact" data-v="${a}" data-id="${st.id}" data-k="staff" ${near && (!['chat2', 'praise', 'care', 'dreams', 'secret'].includes(a) || st.affCd <= 0) ? '' : 'disabled'}>${n}</button>`).join('')}
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
    const regular = gu.regularId ? sim.regulars.find((profile) => profile.id === gu.regularId) : null;
    const origin = this.g.sim.worldById(gu.originWorldId || gr.originWorldId);
    const known = sim.econ.worldKnowledge?.[origin.id]?.level || 1;
    const acts                     = [...(aiConfigured() ? [['gchat', '聊两句']] : []), ['journey', '询问旅途'], ['gpraise', '称赞'], ['treat', `请一杯 -${cost}`], ['gmock', '贬低']];
    if (regular?.visits >= 2) acts.push(['revisit', '聊起上次来访']);
    if (regular?.offer && !gr.offerAccepted) acts.push(['commission', '接受专属委托']);
    if (sameRoom && nightInteractionAction(sim, 'guest', own, gu, gr) === 'raid') acts.push(['raid', '夜袭']);
    this.showModal(`<div class="row portrait-head">${portraitFrame(gu.app, 'detail', gu.name)}
        <div style="flex:1"><h3 style="margin:0">${gu.name}</h3>
          <div class="dim">${gu.race}·${gr.size}人同行｜需求：${w.name}${regular ? `｜常客·第 ${regular.visits} 次来访·好感 ${Math.round(regular.aff)}` : ''}</div>
          <div class="hi">${origin.icon} ${origin.name} · ${htmlText(gu.homeRegion || gr.homeRegion || '')}</div>
          <div class="dim">${htmlText(gu.culturalIdentity || `${gu.homeRegion || gr.homeRegion || ''}的${gu.travelOccupation || gr.travelOccupation || '旅人'}`)}｜${htmlText(gu.culturalStratum || gr.culturalStratum || '跨界旅人')}</div>
          <div class="dim">此行：${htmlText(gu.travelPurpose || gr.travelPurpose || '跨界旅行')}</div>
          ${known >= 4 ? `<div class="dim">礼仪：${htmlText(origin.culture.etiquette)}</div>` : ''}
          <div class="row"><span class="dim">耐心</span>${bar(gr.patience, gr.maxPatience, pct > 50 ? '#8DDB4A' : pct > 25 ? '#F3B84B' : '#FF6B5A')}<span>${pct}%</span></div></div></div>
      <div class="dim" style="margin-top:6px">${near ? '客人正看着你，要搭话吗？' : `太远了（${d.toFixed(1)} 格）：走到 2.8 格内才能搭话。`}${gr.intCd > 0 ? `｜刚聊过，${Math.ceil(gr.intCd)} 秒后才会再理你` : ''}</div>
      ${this.interactMsg ? `<div class="hi" style="margin-top:8px">${this.interactMsg}</div>` : ''}
      <div class="row" style="margin-top:10px;flex-wrap:wrap">
        ${acts.map(([a, n]) => `<button data-act="iact" data-v="${a}" data-id="${gu.id}" data-k="guest" ${near && (a !== 'gchat' || gr.intCd <= 0) ? '' : 'disabled'}>${n}</button>`).join('')}
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
      else if (['care', 'dreams', 'secret'].includes(action)) msg = sim.staffBondInteraction(id, action);
      this.openInteract('staff', id, msg);
      return;
    }
    const gr = sim.groupOfGuest(id);
    if (!gr) { this.closeModal(); return; }
    if (action === 'raid') { window.clearInterval(this.interactTimer); this.openNightPrompt('raid', 'guest', id); return; }
    if (action === 'gchat') { window.clearInterval(this.interactTimer); this.openAIGuestChat(id); return; }
    if (action === 'gpraise') msg = sim.praiseGuest(gr.id);
    else if (action === 'gmock') msg = sim.mockGuest(gr.id);
    else if (action === 'treat') msg = sim.treatGuest(gr.id);
    else if (['journey', 'revisit', 'commission'].includes(action)) msg = sim.guestBondInteraction(gr.id, id, action);
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
    if (scene === 'raid' && !group?.overnight) { sim.toast('只有已经入睡的住店客可以夜袭'); return; }
    if (scene === 'romance' && (target.age < 18 || owner.age < 18 || target.aff < 80)) { sim.toast('双方必须成年，且员工好感达到至交后才能发出邀请'); return; }
    this.nightStoryContext = { scene, kind, id, targetName: target.name, turns: [], result: null, lastAction: '' };
    const title = scene === 'raid' ? '夜袭' : `邀请共度春宵 · ${target.name}`;
    const note = '这是一项私密邀请，而不是命令。只有对方明确接受，剧情才会继续；亲密内容会含蓄带过。';
    this.showModal(`<h3>🌙 ${htmlText(title)}</h3>${scene === 'raid' ? '' : `<div>${htmlText(note)}</div>
      <div class="card" style="margin-top:9px"><b>剧情边界</b><div class="dim">所有角色均为成年人；尊重拒绝和边界；不改变经营数值；不描写露骨色情内容。</div></div>`}
      <div class="row" style="margin-top:10px"><button data-act="nightlocal">使用本地简短演出</button>${aiConfigured() ? '<button data-act="nightai">使用 AI 推演剧情</button>' : '<button data-act="settings">设置 AI 后推演</button>'}<button data-act="nightexit">取消</button></div>`);
  }

  startNightScene(useAI         )       {
    const ctx = this.nightStoryContext;
    const target = this.nightTarget(ctx);
    if (!ctx || !target) { this.closeModal(); return; }
    if (useAI) {
      const action = ctx.scene === 'raid' ? '店主发起夜袭。' : `店主私下询问${target.name}是否愿意共度一个亲密而安静的夜晚，并明确表示拒绝也完全没关系。`;
      this.continueNightStory(action);
      return;
    }
    const narrative = ctx.scene === 'raid'
      ? `敲门声惊醒了${target.name}。店主说明来意后，对方裹紧被子，带着戒备确认门锁与房间状况。短暂的查房没有发现异常，店主道歉并退出客房，把安静还给了住店客。`
      : `店主把邀请说出口，也把拒绝的余地完整留给了${target.name}。对方沉默片刻，确认这不是工作命令后才给出自己的回答。两人约定尊重彼此的边界；灯火渐暗，镜头停在门外，只留下低声交谈与温暖的夜色。`;
    this.showModal(`<h3>🌙 ${htmlText(ctx.scene === 'raid' ? '夜袭' : '灯火之后')}</h3><div style="max-width:720px;white-space:pre-wrap;line-height:1.8">${htmlText(narrative)}</div><div class="row" style="margin-top:10px"><button data-act="nightexit">结束剧情</button></div>`);
  }

  nightStoryFacts(ctx       , action        )       {
    const sim = this.g.sim;
    const owner = sim.staff.find((person) => person.isOwner);
    const target = this.nightTarget(ctx);
    const group = ctx.kind === 'guest' ? sim.groupOfGuest(ctx.id) : null;
    const player = this.playerAIFacts(action);
    const traits = (person       ) => (person?.traits || []).map((id) => (TRAITS.find((item) => item.id === id) || { name: id }).name);
    return {
      scene: ctx.scene,
      ...(ctx.scene === 'raid' ? {} : { sceneMeaning: '成年人之间可拒绝的私密邀请；亲密内容淡出处理' }),
      location: ctx.kind === 'guest' ? '住店客正在休息的客房' : `${target?.name || '员工'}的员工休息室附近`,
      day: sim.econ.day,
      owner: { ...player.identity, background: player.background, adult: (owner?.age || 0) >= 18, traits: traits(owner) },
      target: ctx.kind === 'staff'
        ? { type: '员工', name: target?.name, adult: (target?.age || 0) >= 18, age: target?.age, sex: target?.sex, race: target?.race, affinity: target?.aff, affinityLevel: sim.affLevel(target?.aff || 0).name, traits: traits(target), background: target?.background || null, recentConversation: (target?.aiChatLog || []).slice(0, 12).reverse() }
        : { type: '住店客', name: target?.name, adult: true, race: target?.race, sleeping: !!group?.overnight, partySize: group?.size || 1, affinity: this.guestAffinityFacts(target, group), recentConversation: (target?.aiChatLog || []).slice(0, 12).reverse() },
      history: ctx.turns.slice(-8).map((turn) => ({ playerAction: turn.player, summary: turn.summary })),
      playerAction: String(action).slice(0, 240),
      immutable: '本剧情不改变任何经营数值、角色属性或既有事实。',
    };
  }

  renderNightStory(state = {})       {
    const ctx = this.nightStoryContext;
    if (!ctx) return null;
    const result = state.result || ctx.result;
    const history = ctx.turns.length > 1 ? `<details class="card" style="margin-top:8px"><summary aria-expanded="false">前情摘要（${ctx.turns.length - 1} 段）</summary>${ctx.turns.slice(0, -1).map((turn) => `<div class="dim" style="margin-top:5px">${htmlText(turn.summary)}</div>`).join('')}</details>` : '';
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
          adSpec                                                            = { tier: 'flyer', race: -1, sex: '', bias: '', birthWorldId: WORLD_PROFILES[0].id, customWorldName: '' };

  // ---------- 新菜研发 ----------
          rd = {
    name: '', ing: { grain: 1, veg: 1, meat: 0, spice: 0, ether: 0 }                          ,
    chefId: 0, flavors: []            , fun: []            , drink: false, description: '', msg: '', aiBusy: false,
  };

  /** 重新渲染面板前把菜名输入框的值捞回来（重渲染会重建 DOM） */
  syncRdName()       {
    const inp = document.getElementById('rdname')                           ;
    if (inp) this.rd.name = inp.value;
    const description = document.getElementById('rddescription');
    if (description) this.rd.description = description.value;
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
        ${aiConfigured() ? `<button data-act="aidishname" ${rd.aiBusy ? 'disabled' : ''}>${rd.aiBusy ? '构思中…' : 'AI 随机取名'}</button>` : ''}</div>
      <div class="row" style="align-items:flex-start"><span class="dim" style="width:56px">说明</span>
        <textarea id="rddescription" maxlength="140" rows="3" style="flex:1;box-sizing:border-box" placeholder="可自行填写菜单上的风味、来历或卖点">${htmlText(rd.description || '')}</textarea>
        ${aiConfigured() ? `<button data-act="aidishconcept" ${rd.aiBusy || !rd.name.trim() ? 'disabled' : ''}>根据菜名构思</button>` : ''}</div>
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

  async generateAIDishName(preserveName = false)       {
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
      providedName: preserveName ? rd.name.trim() : '',
      taskIntent: preserveName ? '保留玩家菜名，只构思与配方相符的菜单说明' : '根据配方随机构思菜名和说明',
    };
    rd.aiBusy = true;
    this.openResearch();
    const startedModal = this.modal;
    try {
      const result = await requestGameAI('dish_name', facts);
      if (!preserveName) rd.name = result.name;
      rd.description = result.description;
      rd.msg = '';
    } catch (err) {
      rd.msg = `AI 构思失败：${err?.message || '未知错误'}`;
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
  openTargetRecruit() {
    const sim = this.g.sim;
    if (sim.stars() < 4) { sim.toast('定向招募需要旅店达到四星'); return; }
    if (sim.staff.length >= sim.maxStaff()) { sim.toast('先准备一间空的员工休息室'); return; }
    const app = randomAppearance(new Rng(Math.floor(Math.random() * 1e9)), undefined, false);
    this.openCreator(app, '新员工', (appearance, name, sex, options) => {
      const special = specialEmployeeRecruit(name);
      if (special) ({ appearance, name, sex, options } = special);
      if (this.g.targetedRecruit(appearance, name, sex, options)) this.render(true);
    }, false, '女', { employeeRecruit: true, age: 24, traits: ['diligent', 'cheerful'], skillPreset: 'balanced' });
  }

  openAdPanel(slot        , reset = false, status = '', isError = false)       {
    const s = this.g.sim;
    this.adSlot = slot;
    if (reset) {
      const cur = s.ads[slot] && s.ads[slot].spec;
      const currentFixedWorld = WORLD_PROFILES.some((world) => world.id === s.econ.currentWorldId) ? s.econ.currentWorldId : WORLD_PROFILES[0].id;
      this.adSpec = cur ? { ...cur } : { tier: 'flyer', race: -1, sex: '', bias: '', birthWorldId: currentFixedWorld, customWorldName: '' };
    }
    const spec = this.adSpec;
    if (!WORLD_PROFILES.some((world) => world.id === spec.birthWorldId) && spec.birthWorldId !== 'ai_custom') spec.birthWorldId = WORLD_PROFILES[0].id;
    const cost = s.adCost(spec);
    const t = s.adTier(spec.tier);
    const afford = s.econ.coins >= cost;
    const customBirth = spec.birthWorldId === 'ai_custom';
    const worldOptions = WORLD_PROFILES.map((world) => `<option value="${world.id}" ${spec.birthWorldId === world.id ? 'selected' : ''}>${htmlText(world.icon)} ${htmlText(world.name)}</option>`).join('');
    this.showModal(`<h3>发布招募广告 · 广告位 ${slot + 1}</h3>
      <div class="dim">先指定出生世界：所有应聘者都会来自该世界。价位决定数值区间与日薪；发布后收到 3–5 位符合要求的候选者。</div>
      ${status ? `<div class="${isError ? 'bad' : 'hi'}" style="margin-top:7px">${htmlText(status)}</div>` : ''}
      <div class="row" style="margin-top:8px"><span class="dim" style="width:56px">出生世界</span>
        <select data-act="adworld" style="flex:1">${worldOptions}${aiConfigured() ? `<option value="ai_custom" ${customBirth ? 'selected' : ''}>✦ AI 自定义世界名称</option>` : ''}</select></div>
      ${customBirth && aiConfigured() ? `<label style="display:block;margin-top:6px"><span class="dim">任意世界名称</span><input data-act="adworldname" maxlength="80" value="${htmlText(spec.customWorldName || '')}" placeholder="如：《海贼王》、中土世界、原创世界名" style="width:100%"></label><div class="dim">发布前 AI 会根据该世界一次生成整批应聘者的身份、经历与求职动机；生成失败不会扣费。</div>` : ''}
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
        <button data-act="adpost" data-v="${slot}" ${afford ? '' : 'disabled'}>${customBirth ? 'AI 生成并发布' : '发布'}（-${cost}）</button>
        <button data-act="closemodal">算了</button>
      </div>`);
  }

  async postRecruitmentAd(slot) {
    const sim = this.g.sim;
    const customInput = this.modal?.querySelector('[data-act="adworldname"]');
    if (customInput) this.adSpec.customWorldName = customInput.value;
    const spec = { ...this.adSpec, customWorldName: String(this.adSpec.customWorldName || '').trim().slice(0, 80) };
    if (spec.birthWorldId !== 'ai_custom') {
      if (sim.postAd(slot, spec)) { this.closeModal(); this.g.save(); this.render(true); }
      else this.openAdPanel(slot);
      return;
    }
    if (!aiConfigured()) { this.openAdPanel(slot, false, '请先在设置中接入 AI 并选择模型。', true); return; }
    if (!spec.customWorldName) { this.openAdPanel(slot, false, '请输入应聘者的出生世界名称。', true); return; }
    if (sim.econ.coins < sim.adCost(spec)) { this.openAdPanel(slot, false, `界币不足：这条广告要 ${sim.adCost(spec)}`, true); return; }
    const candidates = sim.rollCands(spec);
    const controller = new AbortController();
    this.adAIController?.abort(); this.adAIController = controller;
    const waitingModal = this.showModal(`<h3>✦ 正在从 ${htmlText(spec.customWorldName)} 招募</h3><div class="hi">AI 正在为 ${candidates.length} 位应聘者生成符合出生世界的人物设定……</div><div class="dim" style="margin-top:7px">广告费会在生成成功后扣除。</div><div class="row" style="margin-top:10px"><button data-act="adcancelai">取消生成</button></div>`);
    try {
      const result = await requestGameAI('recruitment_candidates', {
        birthWorldName: spec.customWorldName,
        advertisement: { tier: sim.adTier(spec.tier).name, sex: spec.sex || '不限', race: spec.race >= 0 ? RACE_NAMES[spec.race] : '不限', skillBias: spec.bias ? SKILL_LABEL[spec.bias] : '不限' },
        raceOptions: RACE_NAMES.map((name, id) => ({ id, name })),
        candidates: candidates.map((person, index) => ({
          index, sex: person.sex, age: person.age, lockedRaceId: spec.race >= 0 ? spec.race : null,
          traits: person.traits.map((id) => TRAITS.find((trait) => trait.id === id)?.name || id),
          skills: Object.fromEntries(SKILL_KEYS.map((key) => [SKILL_LABEL[key], person.skills[key]])), wage: person.wage,
        })),
      }, { signal: controller.signal });
      for (const profile of result.candidates) {
        const person = candidates[profile.index];
        if (!person) continue;
        const appearanceRng = new Rng(Math.floor(Math.random() * 1e9));
        person.app = randomAppearance(appearanceRng, profile.raceId, true);
        person.raceIdx = profile.raceId; person.race = RACE_NAMES[profile.raceId];
        person.age = Math.min(person.age, AGE_MAX[profile.raceId] || 100);
        person.ht = Math.round([148, 168, 192][person.app.ht] + appearanceRng.range(-6, 6));
        person.wt = Math.round([46, 62, 88][person.app.bd] + appearanceRng.range(-5, 8));
        person.name = profile.name;
        person.originWorldId = '';
        person.originWorldName = spec.customWorldName;
        person.background = { role: profile.role, background: profile.background, aspiration: profile.aspiration, quirk: profile.quirk, designNote: profile.designNote };
      }
      if (this.modal !== waitingModal) return;
      if (sim.postAd(slot, spec, candidates)) { this.closeModal(); this.g.save(); this.render(true); }
      else this.openAdPanel(slot);
    } catch (error) {
      if (this.modal === waitingModal) this.openAdPanel(slot, false, controller.signal.aborted ? '已取消 AI 招募，尚未扣费。' : `AI 生成人物设定失败：${error?.message || '未知错误'}。尚未扣费。`, true);
    } finally {
      if (this.adAIController === controller) this.adAIController = null;
    }
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
      </div>`, true, false, { variant: 'danger' });
  }

  openSaveManager()       {
    const slots = this.g.saveSlots();
    const canSave = canPersistSim(this.g.sim);
    const rows = slots.map((slot) => `<div class="card" style="margin-top:7px;border-left-color:${slot.slot === this.g.currentSlot ? '#7FB069' : '#B0895E'}">
      <div class="row"><b>档位 ${slot.slot}${slot.slot === this.g.currentSlot ? ' · 当前' : ''}</b><span class="${slot.valid ? 'hi' : 'dim'}">${slot.valid ? `第 ${slot.day} 天 · ${'★'.repeat(slot.stars) || '无星'}` : '空档位'}</span></div>
      <div class="dim">${slot.valid ? `${htmlText(slot.ownerName)} · ${slot.coins} 界币${slot.savedAt ? ` · ${new Date(slot.savedAt).toLocaleString()}` : ''}` : '可以把当前旅店保存到这里。'}</div>
      <div class="row" style="margin-top:6px;flex-wrap:wrap"><button data-act="saveslot" data-v="${slot.slot}" ${canSave ? '' : 'disabled'}>${slot.valid ? '覆盖保存' : '保存到此档位'}</button>${slot.valid ? `<button data-act="loadslot" data-v="${slot.slot}">读取</button><button data-act="exportsave" data-v="${slot.slot}">导出 JSON</button>` : ''}<button data-act="importpick" data-v="${slot.slot}">导入 JSON</button>${slot.hasBackup ? `<button data-act="restoresave" data-v="${slot.slot}">恢复备份</button>` : ''}<input type="file" accept="application/json,.json" data-save-import data-v="${slot.slot}" style="display:none"></div>
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

  openOwnerProfileEditor()       {
    const owner = this.g.sim.staff.find((person) => person.isOwner);
    if (!owner) return;
    const profile = loadPlayerProfile(this.g.currentSlot);
    this.showModal(`<h3>店主身份与背景</h3>
      <div class="dim">${htmlText(owner.name)}｜${htmlText(owner.sex)}｜${htmlText(owner.race)}｜${owner.age} 岁｜${owner.traits.map((id) => (TRAITS.find((item) => item.id === id) || { name: id }).name).join('、')}</div>
      <div class="dim" style="margin-top:5px">这里的设定会作为员工、客人与店主互动时的身份依据，并按档位独立保存。</div>
      <label style="display:block;margin-top:10px"><span class="dim">身份定位</span><input data-player-role maxlength="100" value="${htmlText(profile.role)}" style="width:100%;box-sizing:border-box;margin-top:4px"></label>
      <label style="display:block;margin-top:8px"><span class="dim">背景设定</span><textarea class="prompt-editor" data-player-background maxlength="2400" placeholder="填写店主的出身、经历、经营动机、待人方式或其他希望角色记住的设定。">${htmlText(profile.background)}</textarea></label>
      <div class="row" style="margin-top:10px"><button data-act="ownersave">保存并返回店主详情</button><button data-act="ownerprompts">保存并前往 AI 完善</button><button data-act="detail" data-v="${owner.id}">取消</button></div>`);
  }

  saveOwnerProfile()       {
    const owner = this.g.sim.staff.find((person) => person.isOwner);
    if (!owner) return;
    this.syncPlayerProfileForm();
    this.g.sim.toast('店主身份与背景已保存');
    this.detailTab = 'info';
    this.openStaffDetail(owner.id);
  }

  openPromptSettings(status = '', isError = false, activeTab = 'general') {
    const tasks = loadPromptTasks();
    const profile = loadPlayerProfile(this.g.currentSlot);
    const owner = this.g.sim.staff.find((person) => person.isOwner);
    const cards = Object.entries(PROMPT_TASKS).filter(([key]) => !key.startsWith('night_') && !key.startsWith('world_')).map(([key, meta]) => `<section class="prompt-card">
      <div class="row"><b>${htmlText(meta.label)}</b><span class="dim">最多 2000 字</span></div>
      ${meta.description ? `<div class="dim">${htmlText(meta.description)}</div>` : ''}
      <textarea class="prompt-editor" data-prompt-key="${key}" maxlength="2000" spellcheck="false">${htmlText(tasks[key])}</textarea>
    </section>`).join('');
    const nightPane = (key, tab, intro) => {
      const modules = parseNightPromptModules(tasks[key], PROMPT_TASKS[key].defaultText);
      const fields = NIGHT_PROMPT_MODULES.map(({ id, label }) => `<label class="prompt-module"><b>${htmlText(label)}</b><textarea data-night-task="${key}" data-night-module="${id}" maxlength="1600" spellcheck="false">${htmlText(modules[id])}</textarea></label>`).join('');
      return `<div class="prompt-pane ${activeTab === tab ? 'on' : ''}" data-prompt-pane="${tab}"><div class="dim">${htmlText(intro)} JSON 输出结构与解析由游戏固定。</div><div class="prompt-module-grid">${fields}</div></div>`;
    };
    const activeWorldStage = Object.prototype.hasOwnProperty.call(WORLD_PROMPT_STAGES, this.worldPromptActiveStage) ? this.worldPromptActiveStage : 'world_concept';
    const worldStageTabs = Object.entries(WORLD_PROMPT_STAGES).map(([stage, meta]) => `<button data-act="promptworldstage" data-v="${stage}" class="${activeWorldStage === stage ? 'on' : ''}">${htmlText(meta.label.replace('世界生成 · ', ''))}</button>`).join('');
    const worldStages = Object.entries(WORLD_PROMPT_STAGES).map(([stage, meta]) => {
      const modules = parseWorldPromptModules(stage, tasks[stage], PROMPT_TASKS[stage].defaultText);
      const fields = meta.modules.map(([id, label]) => `<label class="prompt-module"><div class="row"><b>${htmlText(label)}</b><button type="button" data-act="promptmodreset" data-stage="${stage}" data-module="${id}">恢复此模块</button></div><textarea data-world-stage="${stage}" data-world-module="${id}" maxlength="1800" spellcheck="false">${htmlText(modules[id])}</textarea></label>`).join('');
      return `<section class="world-prompt-stage-pane ${activeWorldStage === stage ? 'on' : ''}" data-world-prompt-pane="${stage}"><h3>${htmlText(meta.label)}</h3><div class="prompt-module-grid">${fields}</div></section>`;
    }).join('');
    this.showModal(`<h3>提示词</h3>
      <div class="dim">修改 AI 的任务和叙事模块。夜间剧情除 JSON 输出外均可分模块编辑。</div>
      ${status ? `<div class="${isError ? 'bad' : 'good'}" style="margin-top:7px">${htmlText(status)}</div>` : ''}
      <div class="prompt-tabs" data-prompt-root-tabs><button data-act="prompttab" data-v="general" class="${activeTab === 'general' ? 'on' : ''}">通用</button><button data-act="prompttab" data-v="raid" class="${activeTab === 'raid' ? 'on' : ''}">夜袭</button><button data-act="prompttab" data-v="romance" class="${activeTab === 'romance' ? 'on' : ''}">共度春宵</button><button data-act="prompttab" data-v="world" class="${activeTab === 'world' ? 'on' : ''}">世界生成</button></div>
      <div class="prompt-pane ${activeTab === 'general' ? 'on' : ''}" data-prompt-pane="general"><section class="prompt-card" style="border-left-color:#7A4BE0">
        <div class="row"><b>玩家身份与背景</b><span class="dim">档位 ${this.g.currentSlot} 独立保存</span></div>
        <div class="dim">固定角色：${htmlText(owner?.name || '店主')}｜${htmlText(owner?.sex || '未知')}｜${htmlText(owner?.race || '未知')}｜旅店所有者与经营者。AI 不得把你当成来消费的客人。</div>
        <label style="display:block;margin-top:8px"><span class="dim">身份定位</span><input data-player-role maxlength="100" value="${htmlText(profile.role)}" style="width:100%;box-sizing:border-box;margin-top:4px"></label>
        <label style="display:block;margin-top:8px"><span class="dim">背景设定</span><textarea class="prompt-editor" data-player-background maxlength="2400" placeholder="可以直接写完整设定，也可以只写出身、经历、经营动机和待人方式的大概，再让 AI 完善。">${htmlText(profile.background)}</textarea></label>
        <div class="row"><span class="dim">该设定会进入员工、客人和夜间互动上下文，不会修改经营数值。</span>${aiConfigured() ? '<button data-act="aiprofilepolish">AI 完善背景</button>' : '<button data-act="settings">设置 AI 后完善</button>'}</div>
      </section>
      ${cards}</div>
      ${nightPane('night_raid', 'raid', '分别设定夜袭的八个叙事模块。')}
      ${nightPane('night_romance', 'romance', '分别设定共度春宵的八个叙事模块。')}
      <div class="prompt-pane ${activeTab === 'world' ? 'on' : ''}" data-prompt-pane="world"><div class="dim">三个阶段以独立标签呈现，可任意切换并提前填写，不要求先完成上一阶段；JSON 字段、枚举、数量和数值边界由游戏固定。</div><div class="prompt-tabs world-prompt-tabs">${worldStageTabs}</div>${worldStages}</div>
      <div class="row" style="margin-top:12px"><button data-act="promptreset" class="warn">恢复默认</button><span style="flex:1"></span><button data-act="promptsave">保存任务文本</button><button data-act="closemodal">关闭</button></div>`);
  }

  activePromptTab() {
    return this.modal?.querySelector('[data-prompt-root-tabs] button.on')?.dataset.v || 'general';
  }

  switchPromptTab(tab) {
    if (!this.modal || !['general', 'raid', 'romance', 'world'].includes(tab)) return;
    for (const button of this.modal.querySelectorAll('[data-prompt-root-tabs] button')) button.classList.toggle('on', button.dataset.v === tab);
    for (const pane of this.modal.querySelectorAll('[data-prompt-pane]')) pane.classList.toggle('on', pane.dataset.promptPane === tab);
  }

  switchWorldPromptStage(stage) {
    if (!this.modal || !Object.prototype.hasOwnProperty.call(WORLD_PROMPT_STAGES, stage)) return;
    this.worldPromptActiveStage = stage;
    for (const button of this.modal.querySelectorAll('[data-act="promptworldstage"]')) button.classList.toggle('on', button.dataset.v === stage);
    for (const pane of this.modal.querySelectorAll('[data-world-prompt-pane]')) pane.classList.toggle('on', pane.dataset.worldPromptPane === stage);
  }

  readPromptTasksForm() {
    const current = loadPromptTasks();
    if (!this.modal) return current;
    for (const input of this.modal.querySelectorAll('[data-prompt-key]')) current[input.dataset.promptKey] = input.value;
    for (const task of ['night_raid', 'night_romance']) {
      const inputs = [...this.modal.querySelectorAll(`[data-night-task="${task}"]`)];
      if (!inputs.length) continue;
      const modules = {};
      for (const input of inputs) modules[input.dataset.nightModule] = input.value;
      current[task] = composeNightPromptModules(modules);
    }
    for (const stage of Object.keys(WORLD_PROMPT_STAGES)) {
      const inputs = [...this.modal.querySelectorAll(`[data-world-stage="${stage}"]`)];
      if (!inputs.length) continue;
      const modules = {};
      for (const input of inputs) modules[input.dataset.worldModule] = input.value;
      current[stage] = composeWorldPromptModules(stage, modules);
    }
    return current;
  }

  syncPlayerProfileForm()       {
    const current = loadPlayerProfile(this.g.currentSlot);
    if (!this.modal) return current;
    return savePlayerProfile({
      role: this.modal.querySelector('[data-player-role]')?.value || current.role,
      background: this.modal.querySelector('[data-player-background]')?.value || '',
    }, this.g.currentSlot);
  }

  async polishPlayerProfile()       {
    if (!aiConfigured()) { this.openPromptSettings('请先在设置中接入 AI 并选择模型。', true); return; }
    const tasks = this.readPromptTasksForm();
    savePromptTasks(tasks);
    const draft = this.syncPlayerProfileForm();
    const owner = this.g.sim.staff.find((person) => person.isOwner);
    const button = this.modal?.querySelector('[data-act="aiprofilepolish"]')                     ;
    if (button) { button.disabled = true; button.textContent = 'AI 正在完善…'; }
    try {
      const result = await requestGameAI('player_profile', {
        fixedIdentity: { name: owner?.name || '店主', sex: owner?.sex, age: owner?.age, race: owner?.race, venueRole: '多元便携旅店的店主、所有者与经营者' },
        draft,
      });
      savePlayerProfile(result, this.g.currentSlot);
      this.openPromptSettings('玩家背景已由 AI 完善并保存。');
    } catch (err) {
      this.openPromptSettings(`AI 完善失败：${err?.message || '未知错误'}`, true);
    }
  }

  savePromptSettings() {
    const tab = this.activePromptTab();
    const current = this.readPromptTasksForm();
    savePromptTasks(current);
    this.syncPlayerProfileForm();
    this.openPromptSettings('玩家身份背景与任务模块已保存。', false, tab);
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
      <div class="dim">直控：电脑用 WASD / 方向键，手机窄屏用屏下摇杆移动店主；关闭时店主自己接派工。其他员工始终自动干活。</div>
      <h3 style="margin:14px 0 6px">画面材质</h3>
      <div class="row">
        <button data-act="materialpack" data-v="hd" class="${this.g.materialPack === 'hd' ? 'on' : ''}">高清材质</button>
        <button data-act="materialpack" data-v="classic" class="${this.g.materialPack === 'classic' ? 'on' : ''}">经典材质</button>
      </div>
      <div class="dim">同步切换房间地板、地毯、墙门、壁灯、家具与界面框体；只保存在当前浏览器，不改动游戏存档。</div>
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
      </div>`, true, false, { variant: 'danger' });
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
      world: { venue: '多元便携旅店', currentHost: sim.currentWorld().name, summary: sim.currentWorld().identity.summary, environmentRule: sim.currentWorld().environmentRule, todayRule: sim.currentWorldRule(), festival: sim.currentWorldFestival(), note: '所有数值和工作统计都是不可改写的事实。' },
      tavern: { rooms: this.g.tavern.rooms.length, furniture: this.g.tavern.furns.length, stars: sim.stars() },
      day: stat.day,
      player: this.playerAIFacts(''),
      finance: report.finance || { revenue: stat.revenue, wages: stat.wages, maintenance: stat.maintenance, restock: stat.restock, net: stat.revenue - stat.wages - stat.maintenance - stat.restock, coinsAfter: stat.coinsAfter },
      guests: report.guests || { served: stat.served, lost: stat.lost, averageScore: stat.avgScore, scoreBreakdown: stat.scoreBreakdown },
      reputation: report.reputation || { delta: stat.repDelta, after: sim.econ.rep },
      inventory: { used: mapStock(report.stockUsed), before: mapStock(report.started?.stock), after: mapStock(report.finished?.stock) },
      sales: {
        dishes: Object.values(report.dishSales || {}),
        facilities: Object.values(report.facilitySales || {}),
        lostReasons: report.lostReasons || {},
      },
      worldGuests: Object.entries(report.worldGuests || {}).map(([id, row]) => ({
        world: sim.worldById(id).name, arrivals: row.arrivals, served: row.served, lost: row.lost, revenue: row.revenue,
        averageScore: row.scoreSamples ? row.scoreTotal / row.scoreSamples : null, complaints: row.complaints || {},
      })),
      staffWork: (report.finished?.staff || []).map((row) => ({
        name: row.name, job: JOB_LABEL[row.job] || row.job, completedTotal: row.total, completedTasks: row.tasks,
        needsBefore: row.needsBefore, needsAfter: row.needsAfter,
        skillGrowth: Object.fromEntries(Object.entries(row.skillDelta || {}).map(([key, value]) => [SKILL_LABEL[key] || key, value])), leftAfterShift: row.left,
      })),
      characters: sim.staff.map((staff) => ({
        name: staff.name, role: staff.isOwner ? '店主' : JOB_LABEL[staff.job], race: staff.race,
        traits: staff.traits.map((id) => (TRAITS.find((item) => item.id === id) || { name: id }).name),
        affinityToOwner: staff.isOwner ? 100 : Math.round(staff.aff), background: staff.background || null, relationshipSummary: staff.relationshipSummary || '',
      })),
      regularGuests: sim.regulars.filter((guest) => guest.lastVisitDay >= stat.day - 1).map((guest) => ({
        name: guest.name, race: guest.race, visits: guest.visits, affinityToOwner: Math.round(guest.aff),
        relationshipSummary: guest.relationshipSummary || '', background: guest.background || null, offer: guest.offer || null,
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
    const complaintLabels = { quality: '出品', wait: '等待', service: '服务', hygiene: '卫生', comfort: '舒适', spectacle: '氛围' };
    const worldRows = Object.entries(stat.report?.worldGuests || {}).map(([id, row]) => {
      const average = row.scoreSamples ? `${(row.scoreTotal / row.scoreSamples).toFixed(2)}★` : '—';
      const complaint = Object.entries(row.complaints || {}).sort((a, b) => b[1] - a[1])[0]?.[0];
      return `<div class="row"><span><b>${s.worldById(id).icon} ${htmlText(row.name)}</b><span class="dim"> · 到店 ${row.arrivals} / 接待 ${row.served} / 流失 ${row.lost}</span></span><span>收入 ${row.revenue} · ${average}${complaint ? ` · 抱怨${complaintLabels[complaint] || complaint}` : ''}</span></div>`;
    }).join('');
    const connections = (stat.newWorldConnections || []).map((id) => s.worldById(id));
    const cert = stat.certification;
    const certPanel = cert?.requirements?.length ? `<div class="card" style="margin-top:10px;border-left-color:${cert.achieved ? '#65A85B' : '#D3A23A'}"><h3>${cert.achieved ? `★ ${cert.level} 星经营认证通过` : `★ ${cert.level} 星认证待完成`}</h3>
      ${cert.requirements.map((row) => `<div class="row"><span>${row.met ? '✓' : '○'} ${htmlText(row.label)}</span><span class="${row.met ? 'good' : 'bad'}">${htmlText(String(row.current))} / ${htmlText(String(row.target))}</span></div>`).join('')}
      <div class="dim">声望可继续累计，但不会绕过未完成的经营条件。</div></div>` : '';
    const story = state.story;
    const aiPanel = story ? `<div class="card" style="margin-top:12px;border-left-color:#7A4BE0"><h3>📖 ${htmlText(story.title)}</h3>
        <div style="white-space:pre-wrap;line-height:1.8;max-width:760px">${htmlText(story.chapter)}</div>
        ${story.afterHours.length ? `<h3 style="margin-top:12px">打烊后的灯火</h3>${story.afterHours.map((line) => `<div style="margin:4px 0"><b>${htmlText(line.speaker)}：</b>${htmlText(line.line)}</div>`).join('')}` : ''}
        <div class="dim" style="margin-top:8px">${htmlText(story.closingNote)}</div></div>`
      : state.loading ? '<div class="card hi" style="margin-top:10px"><div data-ai-progress>AI 正在读取今日经营流水…</div><div class="row" style="margin-top:7px"><span class="dim">你可以随时取消，不会影响日结数值。</span><span><button data-act="aicancelday">取消生成</button><button data-act="localday">改用本地文案</button></span></div></div>'
        : state.error ? `<div class="card"><div class="bad">AI 日结生成失败：${htmlText(state.error)}</div><div class="row"><button data-act="airetryday">重试 AI</button><button data-act="localday">使用本地文案</button></div></div>` : '';
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
      ${certPanel}
      ${connections.length ? `<div class="card" style="margin-top:10px;border-left-color:#7A4BE0"><h3>新的位面航路接通</h3><div>${connections.map((world) => `${world.icon} <b>${world.name}</b>：${htmlText(world.identity.summary)}`).join('<br>')}</div><div class="dim">新的文化偏好与经营课题会从明日起进入客流。</div></div>` : ''}
      ${stat.ownerSkillGrowth && Object.values(stat.ownerSkillGrowth).some(Boolean) ? `<div class="card owner-growth" style="margin-top:10px"><h3>✦ 店长经营历练</h3><div>亲自完成一整场营业后，店长对旅店各环节有了新的理解。</div><div class="row" style="flex-wrap:wrap;margin-top:5px">${SKILL_KEYS.map((key) => `<span><b>${SKILL_LABEL[key]}</b> <span class="good">+${stat.ownerSkillGrowth[key] || 0}</span></span>`).join('')}</div><div class="dim">能力最高为 100；本次成长已经写入店长详情。</div></div>` : ''}
      <h3 style="margin-top:10px">今日世界客群</h3>${worldRows || '<div class="dim">今日没有世界客群记录。</div>'}
      <h3 style="margin-top:10px">员工工作统计</h3>${workRows || '<div class="dim">没有可统计的员工工作。</div>'}
      ${aiPanel}
      ${stat.fiveStarReached ? '<div class="card" style="margin-top:9px"><b class="good">五星经营认证达成：位面评议会已抵达门厅</b><div class="dim">旅店已经同时通过声望与经营条件审核。</div></div>' : ''}
      <div class="row" style="margin-top:10px">${stat.fiveStarReached ? '<button data-act="finale">确认，进入五星庆典</button>' : `<button data-act="closemodal">${state.loading ? '跳过 AI，确认进入打烊模式' : '确认，进入打烊模式'}</button>`}</div>`);
  }

  async generateAISettlement()       {
    const stat = this.settlementAIStat;
    if (!stat) return;
    const startedModal = this.modal;
    const controller = new AbortController(); this.settlementAIController?.abort(); this.settlementAIController = controller;
    const steps = ['AI 正在读取今日经营流水…', '正在核对盈亏、库存与员工工作…', '正在把事件整理成叙事章节…', '正在生成打烊后的角色交流…'];
    let progressIndex = 0;
    const progressTimer = window.setInterval(() => {
      if (this.modal !== startedModal) { window.clearInterval(progressTimer); return; }
      const node = this.modal?.querySelector('[data-ai-progress]');
      if (node) node.textContent = steps[Math.min(++progressIndex, steps.length - 1)];
    }, 2200);
    try {
      const story = await requestGameAI('day_story', this.settlementFacts(stat), { signal: controller.signal });
      if (this.modal !== startedModal) return;
      const allowed = new Set(this.g.sim.staff.map((staff) => staff.name));
      story.afterHours = story.afterHours.filter((line) => allowed.has(line.speaker));
      const summaryTargets = new Map([
        ...this.g.sim.staff.map((person) => [person.name, person]),
        ...this.g.sim.regulars.map((person) => [person.name, person]),
      ]);
      for (const update of story.relationshipUpdates || []) {
        const person = summaryTargets.get(update.name);
        if (!person) continue;
        person.relationshipSummary = update.summary;
        for (const active of this.g.sim.guests.filter((guest) => guest.name === update.name)) active.relationshipSummary = update.summary;
      }
      this.g.sim.econ.aiChronicles = this.g.sim.econ.aiChronicles || [];
      this.g.sim.econ.aiChronicles.push({ day: stat.day, ...story });
      if (this.g.sim.econ.aiChronicles.length > 20) this.g.sim.econ.aiChronicles.shift();
      this.g.save();
      this.renderSettlement(stat, { story });
    } catch (err) {
      if (this.modal === startedModal) this.renderSettlement(stat, { error: controller.signal.aborted ? '已取消生成' : err?.message || '未知错误' });
    } finally {
      window.clearInterval(progressTimer);
      if (this.settlementAIController === controller) this.settlementAIController = null;
    }
  }

  localSettlementStory(stat) {
    const report = stat?.report || {};
    const net = (stat?.revenue || 0) - (stat?.wages || 0) - (stat?.maintenance || 0) - (stat?.restock || 0);
    const workers = (report.finished?.staff || []).filter((row) => row.total > 0).slice(0, 4);
    const deeds = workers.length ? workers.map((row) => `${row.name}完成了${Object.entries(row.tasks || {}).map(([name, count]) => `${name}${count}次`).join('、')}`).join('；') : '员工们守住各自岗位，让营业平稳落幕';
    return {
      title: `第${stat.day}日：门廊最后一盏灯`,
      chapter: `传送门的光在夜色里渐渐收束。今天旅店接待了${stat.served}位客人，仍有${stat.lost}组客人没能得到满意安排。${deeds}。账房最后记下收入 ${stat.revenue} 界币，扣除工资、维护与补货后，今日净收益为 ${net >= 0 ? '+' : ''}${net}，余额停在 ${Math.round(stat.coinsAfter)}。无论盈亏，这些数字都已成为旅店继续生长的一部分。`,
      afterHours: workers.slice(0, 2).map((row) => ({ speaker: row.name, line: row.total >= 3 ? '今天总算忙完了。店主，明天我们还能做得更好。' : '今天有些安静，我会为明天多做些准备。' })),
      closingNote: '本章节由本地经营记录生成；未调用 AI，所有经营数值保持不变。',
      relationshipUpdates: [],
    };
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
      <div class="row" style="margin-top:12px"><button data-act="closemodal">继续无限经营</button><button data-act="confirmnew">另开新店</button></div>`, true, false, { variant: 'important' });
  }

  // ---------- 捏脸 / 换装 ----------
  openCreator(initial            , name        , onDone                                                      , dressOnly = false, sex0 = '女', ownerOptions = {})       {
    let app = cloneApp(initial);
    const employeeRecruit = !!ownerOptions.employeeRecruit;
    const skillPresets = employeeRecruit ? TARGET_RECRUIT_SKILL_PRESETS : OWNER_SKILL_PRESETS;
    let sex = sex0;
    let age = Number.isFinite(Number(ownerOptions.age)) ? Math.round(Number(ownerOptions.age)) : 24;
    let traits = Array.isArray(ownerOptions.traits) ? ownerOptions.traits.slice(0, 2) : ['diligent', 'cheerful'];
    let ownerSkillPreset = skillPresets.some((preset) => preset.id === ownerOptions.skillPreset) ? ownerOptions.skillPreset : 'balanced';
    const initialBackground = OWNER_BACKGROUND_PRESETS.find((preset) => preset.id === ownerOptions.backgroundPreset) || OWNER_BACKGROUND_PRESETS[0];
    let backgroundPreset = employeeRecruit ? 'custom' : ownerOptions.profile?.background ? 'custom' : initialBackground.id;
    let ownerRole = ownerOptions.profile?.role || (employeeRecruit ? '多元便携旅店的待招募员工' : initialBackground.role);
    let ownerBackground = ownerOptions.profile?.background || (employeeRecruit ? '' : initialBackground.background);
    let employeeAspiration = ownerOptions.profile?.aspiration || '';
    let employeeQuirk = ownerOptions.profile?.quirk || '';
    let aiDraft = '';
    let aiDesigned = !!ownerOptions.aiDesigned;
    let aiSkills = ownerOptions.aiDesigned && ownerOptions.skills ? { ...ownerOptions.skills } : null;
    let aiDesignNote = '';
    let aiGenerating = false;
    let aiError = '';
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
    const normalizeOwnerIdentity = () => {
      const maxAge = AGE_MAX[app.race] || 100;
      age = Math.max(18, Math.min(maxAge, Math.round(Number(age) || 24)));
      traits = traits.filter((id, index, rows) => TRAITS.some((trait) => trait.id === id) && rows.indexOf(id) === index).slice(0, 2);
      for (const trait of TRAITS) {
        if (traits.length >= 2) break;
        if (!traits.includes(trait.id)) traits.push(trait.id);
      }
    };
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
      if (av) av.src = portraitURL(app);
    };
    const captureCreatorInputs = () => {
      const currentName = host.querySelector('#crname')?.value;
      if (currentName !== undefined) name = currentName;
      const currentAge = host.querySelector('#crage')?.value;
      if (currentAge !== undefined && currentAge !== '') age = Number(currentAge);
      const firstTrait = host.querySelector('#crtrait1')?.value;
      const secondTrait = host.querySelector('#crtrait2')?.value;
      if (firstTrait) traits[0] = firstTrait;
      if (secondTrait) traits[1] = secondTrait;
      const currentRole = host.querySelector('#crrole')?.value;
      if (currentRole !== undefined) ownerRole = currentRole;
      const currentBackground = host.querySelector('#crbackground')?.value;
      if (currentBackground !== undefined) ownerBackground = currentBackground;
      const currentDraft = host.querySelector('#craidraft')?.value;
      if (currentDraft !== undefined) aiDraft = currentDraft;
    };
    const rerender = (captureInputs = true)       => {
      if (captureInputs) captureCreatorInputs();
      normalizeOwnerIdentity();
      visible = visibleCats();
      if (!visible.some((c) => c.key === activeCat)) activeCat = visible[0].key;
      const availableGroups = groups.map((group) => ({ ...group, cats: group.cats.filter((key) => visible.some((cat) => cat.key === key)) })).filter((group) => group.cats.length);
      if (!availableGroups.some((group) => group.key === activeGroup)) activeGroup = availableGroups[0].key;
      const group = availableGroups.find((item) => item.key === activeGroup);
      if (!group.cats.includes(activeCat)) activeCat = group.cats[0];
      const cat = visible.find((c) => c.key === activeCat)                     ;
      const selectedSkillPreset = skillPresets.find((preset) => preset.id === ownerSkillPreset) || skillPresets[0];
      const displayedSkills = aiDesigned && aiSkills ? aiSkills : selectedSkillPreset.skills;
      host.innerHTML = `<div class="creator-head"><div><h3>${dressOnly ? '纸娃娃换装' : employeeRecruit ? '定向招募 · 员工 DIY' : '捏一个店主'}</h3><div class="dim">先选样板，再按面部、发型、身体、服装与配色逐组调整。</div></div>
        <div class="creator-history"><button data-undo title="撤销" ${historyIndex <= 0 ? 'disabled' : ''}>↶</button><button data-redo title="重做" ${historyIndex >= history.length - 1 ? 'disabled' : ''}>↷</button></div></div>
      <div class="creator-presets">${PRESETS.map((ps) => `<button data-preset="${ps.id}">${ps.name}</button>`).join('')}</div>
      <div class="creator-layout">
        <section class="creator-preview">
          <div class="creator-preview-art"><canvas class="prev" width="256" height="144"></canvas>${portraitFrame(app, 'creator', name)}</div>
          <div class="row creator-pose"><span class="dim">正面 / 背面</span><span>${['idle', 'walk', 'work'].map((p) => `<button data-pose="${p}" class="${pose === p ? 'on' : ''}">${p === 'idle' ? '待机' : p === 'walk' ? '行走' : '工作'}</button>`).join('')}</span></div>
          ${dressOnly ? '' : `<div class="creator-identity"><label><span>姓名</span><input id="crname" value="${htmlText(name)}" maxlength="20"></label><div>性别 ${['女', '男'].map((s) => `<button data-sex="${s}" class="${sex === s ? 'on' : ''}">${s}</button>`).join('')}</div></div>
          <div class="creator-personality"><label><span class="dim">年龄</span><input id="crage" type="number" min="18" max="${AGE_MAX[app.race] || 100}" value="${age}"></label>
            <label><span class="dim">性格一</span><select id="crtrait1">${TRAITS.map((trait) => `<option value="${trait.id}" ${traits[0] === trait.id ? 'selected' : ''} ${traits[1] === trait.id ? 'disabled' : ''}>${trait.name}</option>`).join('')}</select></label>
            <label><span class="dim">性格二</span><select id="crtrait2">${TRAITS.map((trait) => `<option value="${trait.id}" ${traits[1] === trait.id ? 'selected' : ''} ${traits[0] === trait.id ? 'disabled' : ''}>${trait.name}</option>`).join('')}</select></label></div>
          <div class="dim" style="margin-top:4px">${traits.map((id) => { const trait = TRAITS.find((item) => item.id === id); return trait ? `${trait.name}：${trait.note}` : id; }).join('　')}</div>
          <div style="margin-top:7px"><b>${employeeRecruit ? '岗位能力方向' : '店长基础能力'}</b><span class="dim"> · ${employeeRecruit ? '能力会决定工资与推荐岗位' : aiDesigned ? 'AI 角色设计不受平均 38 限制' : '手动预设平均值固定为 38'}</span></div>
          <div class="owner-skill-presets">${skillPresets.map((preset) => `<button data-skillpreset="${preset.id}" class="${!aiDesigned && ownerSkillPreset === preset.id ? 'on' : ''}"><b>${preset.name}</b><small>${preset.note}</small></button>`).join('')}</div>
          <div class="${aiDesigned ? 'creator-ai-skills' : 'dim'}">${aiDesigned ? '<b>✦ AI 定制能力：</b>' : ''}${SKILL_KEYS.map((key) => `${SKILL_LABEL[key]} ${displayedSkills[key]}`).join(' · ')}</div>`}
          <div class="creator-summary">${RACE_NAMES[app.race]} · ${dressOnly ? '' : `${age}岁 · ${traits.map((id) => (TRAITS.find((item) => item.id === id) || { name: id }).name).join(' / ')} · `}${HT_NAMES[app.ht]}${BD_NAMES[app.bd]}<br><span class="dim">已锁定 ${locks.size} 项，随机外观时会保留</span></div>
          <div class="creator-actions"><button data-rand="1">随机外观</button>${THEMES.map((th) => `<button data-theme="${th.id}">${th.name}</button>`).join('')}</div>
        </section>
        <section class="creator-editor">
          ${dressOnly ? '' : `<div class="creator-background"><div class="row"><b>${employeeRecruit ? '员工身份与背景' : '店主背景设定'}</b><span class="dim">会用于后续角色互动与 AI 对话</span></div>
            ${employeeRecruit ? '' : `<div class="creator-background-presets">${OWNER_BACKGROUND_PRESETS.map((preset) => `<button data-bg-preset="${preset.id}" class="${backgroundPreset === preset.id ? 'on' : ''}">${preset.name}</button>`).join('')}<button data-bg-preset="custom" class="${backgroundPreset === 'custom' ? 'on' : ''}">自定义</button></div>`}
            <label><span class="dim">身份定位</span><input id="crrole" maxlength="100" value="${htmlText(ownerRole)}"></label>
            <label><span class="dim">背景经历</span><textarea id="crbackground" maxlength="2400" placeholder="${employeeRecruit ? '写下员工的出身、经历、求职动机和待人方式……' : '写下店主的出身、经历、经营动机和待人方式……'}">${htmlText(ownerBackground)}</textarea></label>
          </div>
          ${aiConfigured() ? `<div class="creator-ai-design ${aiGenerating ? 'generating' : ''}"><div class="row"><b>✦ ${employeeRecruit ? 'AI 设计员工' : 'AI 完整角色设计'}</b><span class="hi">生成完整外貌、经历与能力</span></div>
            <div class="dim">输入一个大概概念，AI 会重新设计并回填姓名、性别、年龄、两个性格、种族、全部外貌组件、背景设定和七项能力。${employeeRecruit ? '员工仍会按能力计算正常工资与入职费。' : '不会给予跳过经营规则的权限。'}</div>
            <textarea id="craidraft" maxlength="1200" placeholder="${employeeRecruit ? '例如：从浮空港辞职的猫族调酒师，嘴硬心软，手很稳但特别怕打扫……' : '例如：沉默寡言的机械体前旅行厨师，背着旧武士刀，看起来冷淡但很会照顾人……'}">${htmlText(aiDraft)}</textarea>
            <div class="row"><span class="dim">${aiDesignNote ? htmlText(aiDesignNote) : '描述越具体，生成的人设和长短板越鲜明。'}</span><span>${aiGenerating ? '<button data-aicancelowner>取消生成</button>' : `<button data-aiowner>让 AI 设计${employeeRecruit ? '员工' : '整个角色'}</button>`}</span></div>
            ${aiGenerating ? '<div class="creator-ai-status hi">AI 正在组合人物经历、外貌与能力，请稍候…</div>' : aiError ? `<div class="creator-ai-status bad">${htmlText(aiError)}</div>` : ''}
          </div>` : ''}`}
          <div class="creator-groups">${availableGroups.map((item) => `<button data-group="${item.key}" class="${activeGroup === item.key ? 'on' : ''}">${item.label}</button>`).join('')}</div>
          <div class="creator-cats">${group.cats.map((key) => { const item = visible.find((entry) => entry.key === key); return `<button data-cat="${key}" class="${activeCat === key ? 'on' : ''}">${locks.has(key) ? '🔒 ' : ''}${item.label}</button>`; }).join('')}</div>
          <div class="creator-cat-lock"><div><b>${cat.label}</b><div class="dim">选择样式，或锁定后继续随机其他部分。</div></div><button class="creator-lock ${locks.has(cat.key) ? 'on' : ''}" data-lockbtn="${cat.key}">${locks.has(cat.key) ? '🔒 已锁定' : '🔓 锁定此项'}</button></div>
          <div class="grid creator-options">${cat.names.map((n, i) => cat.colors
        ? `<span class="sw ${cat.get() === i ? 'on' : ''}" data-opt="${i}" style="background:${cat.colors[i]}" title="${cat.label} ${i + 1}"></span>`
        : `<button data-opt="${i}" class="${cat.get() === i ? 'on' : ''}">${n}</button>`).join('')}</div>
        </section>
      </div>
      <div class="creator-footer">
        <button class="creator-done" data-done="1" ${aiGenerating ? 'disabled' : ''}>${dressOnly ? '换上这套服装' : employeeRecruit ? '确认定向招募' : '就这个店主'}</button>
        ${dressOnly ? '<button data-act="closemodal">取消</button>' : ''}
      </div>`;
      draw();
    };
    host.addEventListener('click', async (e) => {
      const t = (e.target               ).closest('[data-group],[data-cat],[data-lockbtn],[data-undo],[data-redo],[data-opt],[data-pose],[data-sex],[data-rand],[data-theme],[data-preset],[data-skillpreset],[data-bg-preset],[data-aiowner],[data-aicancelowner],[data-done]')                      ;
      if (!t) return;
      let changed = false;
      let captureBeforeRender = true;
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
        delete app.specialPortrait;
        changed = true;
      } else if (t.dataset.pose) pose = t.dataset.pose          ;
      else if (t.dataset.sex) {
        sex = t.dataset.sex;
      }
      else if (t.dataset.skillpreset) { ownerSkillPreset = t.dataset.skillpreset; aiDesigned = false; aiSkills = null; aiDesignNote = ''; }
      else if (t.dataset.bgPreset) {
        captureCreatorInputs();
        backgroundPreset = t.dataset.bgPreset;
        const selected = OWNER_BACKGROUND_PRESETS.find((preset) => preset.id === backgroundPreset);
        if (selected) { ownerRole = selected.role; ownerBackground = selected.background; }
        captureBeforeRender = false;
      }
      else if (t.hasAttribute('data-aicancelowner')) {
        this.creatorAIController?.abort();
        return;
      }
      else if (t.hasAttribute('data-aiowner')) {
        captureCreatorInputs();
        name = name.trim() || (employeeRecruit ? '新员工' : '店主'); aiDraft = aiDraft.trim();
        if (employeeRecruit && specialEmployeeRecruit(name)) {
          aiDesignNote = 'SAMB 是固定特殊角色，已按预设锁定完整设定。'; rerender(false); return;
        }
        if (!aiDraft) { aiError = '请先写一点角色概念，再让 AI 进行完整设计。'; rerender(); return; }
        const controller = new AbortController();
        this.creatorAIController?.abort(); this.creatorAIController = controller;
        aiGenerating = true; aiError = ''; rerender(false);
        try {
          const result = await requestGameAI(employeeRecruit ? 'employee_creator' : 'owner_creator', {
            concept: aiDraft,
            currentDraft: {
              name, sex, age, traitIds: traits, appearance: app, role: ownerRole, background: ownerBackground,
              skills: aiDesigned && aiSkills ? aiSkills : (skillPresets.find((preset) => preset.id === ownerSkillPreset) || skillPresets[0]).skills,
            },
            catalogs: ownerCreatorCatalogs(AGE_MAX),
            constraints: employeeRecruit
              ? { characterRole: '受店主雇用并领取正常工资的旅店员工', aiSkillRange: [1, 100], normalHiringRulesApply: true }
              : { playerRole: '多元便携旅店的店主、所有者与经营者', manualPresetAverage: 38, aiSkillRange: [1, 100], aiMayExceedManualAverage: true },
          }, { signal: controller.signal });
          if (this.modal !== m) return;
          app = cloneApp(result.appearance);
          name = result.name; sex = result.sex; age = result.age; traits = [...result.traitIds];
          ownerRole = result.role; ownerBackground = result.background; backgroundPreset = 'ai';
          if (employeeRecruit) { employeeAspiration = result.aspiration; employeeQuirk = result.quirk; }
          aiSkills = { ...result.skills }; aiDesigned = true; aiDesignNote = result.designNote;
          normalizeOwnerIdentity(); remember();
        } catch (err) {
          if (this.modal === m) aiError = controller.signal.aborted ? '已取消本次 AI 角色设计。' : `AI 角色设计失败：${err?.message || '未知错误'}`;
        } finally {
          if (this.creatorAIController === controller) this.creatorAIController = null;
          aiGenerating = false;
          if (this.modal === m) rerender(false);
        }
        return;
      }
      else if (t.dataset.preset) {
        const ps = PRESETS.find((q) => q.id === t.dataset.preset);
        if (ps) {
          const made = ps.make();
          if (dressOnly) {
            app.wear = made.wear; app.clothA = made.clothA; app.clothB = made.clothB; app.accC = made.accC;
            if (made.specialPortrait) app.specialPortrait = made.specialPortrait; else delete app.specialPortrait;
          }
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
        delete app.specialPortrait;
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
        const ageInput = host.querySelector('#crage')                           ;
        if (ageInput) age = Number(ageInput.value);
        const traitOne = host.querySelector('#crtrait1')                           ;
        const traitTwo = host.querySelector('#crtrait2')                           ;
        if (traitOne && traitTwo) traits = [traitOne.value, traitTwo.value];
        normalizeOwnerIdentity();
        this.closeModal();
        const preset = skillPresets.find((item) => item.id === ownerSkillPreset) || skillPresets[0];
        const skills = aiDesigned && aiSkills ? { ...aiSkills } : { ...preset.skills };
        onDone(app, nm, sex, {
          age, traits: [...traits], skillPreset: aiDesigned ? 'ai' : preset.id, skills, aiDesigned,
          backgroundPreset, profile: employeeRecruit && !aiDesigned && !ownerBackground.trim() ? null : {
            role: ownerRole, background: ownerBackground,
            ...(employeeRecruit ? { aspiration: employeeAspiration, quirk: employeeQuirk } : {}),
          },
        });
        return;
      }
      if (changed) remember();
      rerender(captureBeforeRender);
    });
    host.addEventListener('change', (e) => {
      const target = e.target               ;
      if (target.id === 'crage') age = Number(target.value);
      else if (target.id === 'crtrait1') traits[0] = target.value;
      else if (target.id === 'crtrait2') traits[1] = target.value;
      else return;
      rerender();
    });
    host.addEventListener('input', (e) => {
      const target = e.target;
      if (target.id === 'crname' && employeeRecruit) {
        const special = specialEmployeeRecruit(target.value);
        if (!special) return;
        app = cloneApp(special.appearance); name = special.name; sex = special.sex; age = special.options.age;
        traits = [...special.options.traits]; aiSkills = { ...special.options.skills }; aiDesigned = true;
        ownerRole = special.options.profile.role; ownerBackground = special.options.profile.background; backgroundPreset = 'samb';
        employeeAspiration = special.options.profile.aspiration; employeeQuirk = special.options.profile.quirk;
        remember(); rerender(false);
      }
      else if (target.id === 'crrole') { ownerRole = target.value; backgroundPreset = 'custom'; }
      else if (target.id === 'crbackground') { ownerBackground = target.value; backgroundPreset = 'custom'; }
      else if (target.id === 'craidraft') aiDraft = target.value;
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
