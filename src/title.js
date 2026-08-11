const TITLE_CSS = `
#game-title-screen{position:fixed;inset:0;z-index:1000;overflow:hidden;background:#171321;color:#F7E9CD;font-family:FusionPixel,"Microsoft YaHei",monospace;isolation:isolate}
#game-title-screen *{box-sizing:border-box}
.title-sky{position:absolute;inset:0;background:radial-gradient(circle at 50% 42%,#664060 0 5%,#34233F 24%,#171321 65%,#0D0C14 100%)}
.title-sky:before{content:"";position:absolute;inset:0;opacity:.55;background-image:radial-gradient(circle,#FFF2B8 0 1px,transparent 1.5px),radial-gradient(circle,#86E3DE 0 1px,transparent 1.5px);background-size:83px 83px,127px 127px;background-position:17px 23px,41px 69px;animation:titleStars 5s steps(2,end) infinite}
.title-moon{position:absolute;left:12%;top:11%;width:72px;height:72px;border:8px solid #F1C86A;border-radius:50%;border-right-color:transparent;filter:drop-shadow(0 0 16px #F1C86A88);transform:rotate(-24deg)}
.title-building{position:absolute;left:50%;bottom:12%;width:min(720px,88vw);height:min(430px,54vh);transform:translateX(-50%);background:#382538;border:6px solid #1B1521;box-shadow:0 -8px 0 #533047,0 0 60px #E48D5B22}
.title-building:before{content:"";position:absolute;left:-7%;right:-7%;top:-62px;height:70px;background:#512C43;clip-path:polygon(0 100%,12% 42%,35% 42%,50% 0,65% 42%,88% 42%,100% 100%);border-bottom:8px solid #201623;filter:drop-shadow(0 -5px 0 #1B1521)}
.title-building:after{content:"";position:absolute;left:-8%;right:-8%;bottom:-70px;height:150px;background:repeating-linear-gradient(90deg,#302435 0 47px,#463044 47px 50px),repeating-linear-gradient(0deg,transparent 0 47px,#584052 47px 50px);transform:perspective(180px) rotateX(48deg);transform-origin:top;opacity:.9}
.title-window{position:absolute;top:82px;width:78px;height:96px;background:#E9B75E;border:7px solid #1C1722;box-shadow:inset 0 0 0 5px #9C563D,0 0 24px #F3B84B66;animation:titleWindow 3.4s steps(3,end) infinite}
.title-window:before,.title-window:after{content:"";position:absolute;background:#5C3540}.title-window:before{left:31px;top:0;width:5px;height:100%}.title-window:after{left:0;top:40px;width:100%;height:5px}
.title-window.w1{left:10%}.title-window.w2{right:10%;animation-delay:-1.7s}
.title-door{position:absolute;left:50%;bottom:0;width:142px;height:205px;transform:translateX(-50%);border:9px solid #211827;border-bottom:0;background:linear-gradient(90deg,#34224A,#82536E 48%,#34224A);box-shadow:0 0 16px #D35CC988,inset 0 0 28px #E6A85D99;overflow:hidden}
.title-door:before{content:"";position:absolute;left:50%;top:18px;width:74px;height:150px;transform:translateX(-50%);border-radius:50%;background:radial-gradient(ellipse,#FFF0AF 0 8%,#80E4DD 25%,#B456B0 53%,transparent 72%);filter:blur(2px);animation:titlePortal 2.1s ease-in-out infinite}
.title-door:after{content:"";position:absolute;left:50%;bottom:15px;width:8px;height:8px;background:#FFE497;box-shadow:0 0 10px #FFE497;animation:titleKnob 1.4s steps(2,end) infinite}
.title-sign{position:absolute;left:50%;top:-32px;transform:translateX(-50%);padding:8px 22px;background:#6C3C3F;border:5px solid #251923;box-shadow:inset 0 0 0 3px #C8844E;color:#FFE8A6;letter-spacing:8px;font-size:19px;white-space:nowrap}
.title-counter{position:absolute;left:0;right:0;bottom:8%;height:13%;background:linear-gradient(#402D38,#201923);border-top:6px solid #6D493F;box-shadow:0 -15px 40px #0B0910AA}
.title-lamp{position:absolute;top:0;width:4px;height:20vh;background:#201923}.title-lamp:before{content:"";position:absolute;left:50%;bottom:-23px;width:52px;height:36px;transform:translateX(-50%);background:#6B3A3B;clip-path:polygon(20% 0,80% 0,100% 100%,0 100%);border-bottom:7px solid #2B1C25}.title-lamp:after{content:"";position:absolute;left:50%;bottom:-48px;width:18px;height:18px;transform:translateX(-50%);background:#FFD86B;box-shadow:0 0 22px 9px #F3B84B88;animation:titleLamp 2s steps(3,end) infinite}.title-lamp.l1{left:7%}.title-lamp.l2{right:7%;animation-delay:-1s}
.title-content{position:relative;z-index:4;display:flex;min-height:100%;align-items:center;justify-content:center;flex-direction:column;padding:28px 20px 32px;text-align:center;background:linear-gradient(90deg,#110E18BB 0,transparent 22%,transparent 78%,#110E18BB 100%)}
.title-logo{position:relative;margin-top:-6vh;padding:18px 34px 15px;background:#2C2031EE;border:5px solid #B96A52;box-shadow:0 0 0 4px #211724,0 8px 0 #160F19,0 16px 35px #0C0910CC;animation:titleFloat 3.2s ease-in-out infinite}
.title-logo:before,.title-logo:after{content:"✦";position:absolute;top:50%;color:#66D8D3;font-size:18px;transform:translateY(-50%);animation:titleSpark 1.8s steps(3,end) infinite}.title-logo:before{left:9px}.title-logo:after{right:9px;animation-delay:-.9s}
.title-logo h1{margin:0;color:#FFE7A1;font-size:clamp(35px,6vw,72px);line-height:1.05;letter-spacing:.12em;text-shadow:4px 4px 0 #873E50,-2px -2px 0 #FFF3C0,0 0 20px #F3B84B88}
.title-logo .en{margin-top:8px;color:#74D8D4;font-size:clamp(9px,1.4vw,14px);letter-spacing:.38em}
.title-tagline{margin:22px 0 18px;padding:7px 14px;background:#201823CC;color:#E7D8C1;font-size:clamp(13px,1.8vw,17px);letter-spacing:.12em;text-shadow:1px 2px #201923}
.title-menu{display:flex;flex-direction:column;gap:10px;width:min(330px,82vw)}
.title-button{position:relative;overflow:hidden;min-height:50px;padding:10px 20px;border:4px solid #2A1B26;background:#6E3C46;color:#FFF1C4;font:inherit;font-size:18px;letter-spacing:.18em;box-shadow:inset 0 0 0 3px #C77955,0 5px 0 #20151E;cursor:pointer;transition:transform .12s,filter .12s,background .12s}
.title-button:before{content:"";position:absolute;inset:3px auto 3px -35%;width:30%;background:#FFF3C044;transform:skewX(-18deg);transition:left .28s}
.title-button:hover:not(:disabled),.title-button:focus-visible{transform:translateY(-2px);filter:brightness(1.15);outline:3px solid #71D8D3;outline-offset:2px}.title-button:hover:before{left:115%}.title-button:active:not(:disabled){transform:translateY(4px);box-shadow:inset 0 0 0 3px #C77955,0 1px 0 #20151E}
.title-button.primary{background:#8A4F4E;box-shadow:inset 0 0 0 3px #E0A15B,0 5px 0 #20151E}.title-button:disabled{cursor:not-allowed;filter:grayscale(.75) brightness(.7);color:#B8A9A5}
.title-status{min-height:20px;color:#E9C97C;font-size:13px;text-shadow:1px 1px #201923}.title-author{position:absolute;bottom:18px;left:50%;transform:translateX(-50%);color:#D5C4B1;font-size:14px;letter-spacing:.16em;text-shadow:2px 2px #1A111B;white-space:nowrap}.title-author b{color:#FFE39A}
.title-ember{position:absolute;z-index:3;bottom:-20px;width:4px;height:4px;background:#FFD56B;box-shadow:0 0 8px #F3A34B;animation:titleEmber var(--d) linear infinite;animation-delay:var(--delay);left:var(--x)}
#game-title-screen.leaving .title-door:before{animation:titleEnter .58s ease-in forwards}#game-title-screen.leaving .title-content{animation:titleFade .58s ease-in forwards}#game-title-screen.leaving .title-building{animation:titleBuilding .58s ease-in forwards}
@keyframes titleStars{50%{opacity:.82}}@keyframes titleWindow{50%{filter:brightness(1.17)}}@keyframes titlePortal{50%{transform:translateX(-50%) scale(.88);filter:blur(4px) hue-rotate(25deg)}}@keyframes titleKnob{50%{opacity:.35}}@keyframes titleLamp{50%{filter:brightness(1.25);transform:translateX(-50%) scale(.9)}}@keyframes titleFloat{50%{transform:translateY(-5px)}}@keyframes titleSpark{50%{opacity:.35;transform:translateY(-50%) scale(.75)}}@keyframes titleEmber{0%{transform:translate(0,0);opacity:0}12%{opacity:1}100%{transform:translate(35px,-78vh);opacity:0}}@keyframes titleEnter{to{transform:translateX(-50%) scale(12);opacity:0}}@keyframes titleFade{to{opacity:0;transform:scale(1.04)}}@keyframes titleBuilding{to{filter:brightness(1.8);transform:translateX(-50%) scale(1.03)}}
@media(max-width:650px){.title-building{bottom:14%;height:47vh}.title-window{width:58px;height:75px}.title-door{width:110px;height:170px}.title-logo{padding:15px 25px 12px}.title-logo h1{letter-spacing:.06em}.title-tagline{margin:16px 0 14px}.title-button{min-height:46px;font-size:16px}.title-moon{width:48px;height:48px}.title-lamp{display:none}}
@media(prefers-reduced-motion:reduce){#game-title-screen *{animation-duration:.001ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important}.title-button{transition:none}}
`;

export function validGameSave(raw) {
  if (typeof raw !== 'string' || !raw.trim()) return false;
  try {
    const data = JSON.parse(raw);
    return !!(data && typeof data === 'object'
      && data.tavern && Array.isArray(data.tavern.rooms)
      && data.sim && data.sim.econ && Array.isArray(data.sim.staff));
  } catch (err) { return false; }
}

export class TitleScreen {
  root = null;
  ready = false;
  hasSave = false;
  onChoose = null;
  onInteract = null;
  confirmTimer = 0;

  constructor(host = document.body) {
    if (!document.getElementById('game-title-style')) {
      const style = document.createElement('style');
      style.id = 'game-title-style';
      style.textContent = TITLE_CSS;
      document.head.appendChild(style);
    }
    const embers = Array.from({ length: 16 }, (_, i) => `<i class="title-ember" style="--x:${5 + (i * 37) % 92}%;--d:${4.5 + (i % 5) * 1.1}s;--delay:${-(i % 7) * .8}s"></i>`).join('');
    const root = document.createElement('section');
    root.id = 'game-title-screen';
    root.setAttribute('aria-label', '多元便携旅店标题页面');
    root.innerHTML = `<div class="title-sky"></div><div class="title-moon"></div>
      <div class="title-lamp l1"></div><div class="title-lamp l2"></div>
      <div class="title-building"><div class="title-sign">旅店</div><div class="title-window w1"></div><div class="title-window w2"></div><div class="title-door"></div></div>
      <div class="title-counter"></div>${embers}
      <main class="title-content"><div class="title-logo"><h1>多元便携旅店</h1><div class="en">MULTIVERSE PORTABLE INN</div></div>
        <div class="title-tagline">让每一次营业，都成为独一无二的故事</div>
        <div class="title-menu"><button class="title-button" data-title-action="new" disabled>开始新游戏</button><button class="title-button" data-title-action="continue" disabled>继续游戏</button><div class="title-status" role="status">正在点亮旅店灯火…</div></div>
        <div class="title-author">作者：<b>Poaries</b></div></main>`;
    root.addEventListener('click', (event) => this.handleClick(event));
    root.addEventListener('pointermove', (event) => {
      if (!this.ready || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const x = (event.clientX / innerWidth - .5) * 8;
      const y = (event.clientY / innerHeight - .5) * 5;
      const logo = root.querySelector('.title-logo');
      if (logo) logo.style.marginLeft = `${x}px`;
      const building = root.querySelector('.title-building');
      if (building) building.style.marginLeft = `${-x * .45}px`;
      root.style.setProperty('--pointer-y', `${y}px`);
    });
    host.appendChild(root);
    this.root = root;
  }

  activate({ hasSave, onChoose, onInteract = this.onInteract }) {
    this.ready = true;
    this.hasSave = !!hasSave;
    this.onChoose = onChoose;
    this.onInteract = onInteract;
    const fresh = this.root?.querySelector('[data-title-action="new"]');
    const resume = this.root?.querySelector('[data-title-action="continue"]');
    if (fresh) fresh.disabled = false;
    if (resume) resume.disabled = !this.hasSave;
    if (resume && this.hasSave) resume.classList.add('primary');
    else if (fresh) fresh.classList.add('primary');
    this.status(this.hasSave ? '检测到旅店存档，可以继续上次营业。' : '尚无存档，请从新旅店开始。');
    setTimeout(() => (this.hasSave ? resume : fresh)?.focus(), 80);
  }

  status(message) {
    const node = this.root?.querySelector('.title-status');
    if (node) node.textContent = message;
  }

  async handleClick(event) {
    const button = event.target.closest('[data-title-action]');
    if (!button || button.disabled || !this.ready || this.root?.classList.contains('leaving')) return;
    this.onInteract?.();
    const action = button.dataset.titleAction;
    if (action === 'new' && this.hasSave && button.dataset.confirm !== 'yes') {
      button.dataset.confirm = 'yes';
      button.textContent = '再次点击，确认新游戏';
      this.status('开始新游戏会覆盖当前进度。');
      clearTimeout(this.confirmTimer);
      this.confirmTimer = setTimeout(() => {
        if (!button.isConnected) return;
        delete button.dataset.confirm;
        button.textContent = '开始新游戏';
        this.status('已取消覆盖，仍可继续现有存档。');
      }, 4500);
      return;
    }
    clearTimeout(this.confirmTimer);
    this.ready = false;
    for (const item of this.root.querySelectorAll('button')) item.disabled = true;
    this.root.classList.add('leaving');
    this.status(action === 'continue' ? '正在推开熟悉的门扉…' : '正在为新旅店交付钥匙…');
    await new Promise((resolve) => setTimeout(resolve, 520));
    let ok = true;
    try { ok = (await this.onChoose?.(action)) !== false; } catch (err) { ok = false; }
    if (ok) this.destroy();
    else {
      this.root.classList.remove('leaving');
      this.activate({ hasSave: false, onChoose: this.onChoose, onInteract: this.onInteract });
      this.status('存档无法读取，请开始新游戏。');
    }
  }

  destroy() {
    clearTimeout(this.confirmTimer);
    this.root?.remove();
    this.root = null;
  }
}
