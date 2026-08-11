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
.title-slots{display:none;gap:7px;padding:9px;background:#1A131ECC;border:3px solid #5D3B43;max-height:235px;overflow:auto}.title-slots.on{display:flex;flex-direction:column}.title-slot{min-height:42px;font-size:14px;text-align:left;letter-spacing:.05em}.title-slot small{display:block;color:#E0C796;font-size:11px;margin-top:3px}
.title-button{position:relative;overflow:hidden;min-height:50px;padding:10px 20px;border:4px solid #2A1B26;background:#6E3C46;color:#FFF1C4;font:inherit;font-size:18px;letter-spacing:.18em;box-shadow:inset 0 0 0 3px #C77955,0 5px 0 #20151E;cursor:pointer;transition:transform .12s,filter .12s,background .12s}
.title-button:before{content:"";position:absolute;inset:3px auto 3px -35%;width:30%;background:#FFF3C044;transform:skewX(-18deg);transition:left .28s}
.title-button:hover:not(:disabled),.title-button:focus-visible{transform:translateY(-2px);filter:brightness(1.15);outline:3px solid #71D8D3;outline-offset:2px}.title-button:hover:before{left:115%}.title-button:active:not(:disabled){transform:translateY(4px);box-shadow:inset 0 0 0 3px #C77955,0 1px 0 #20151E}
.title-button.primary{background:#8A4F4E;box-shadow:inset 0 0 0 3px #E0A15B,0 5px 0 #20151E}.title-button:disabled{cursor:not-allowed;filter:grayscale(.75) brightness(.7);color:#B8A9A5}
.title-status{min-height:20px;color:#E9C97C;font-size:13px;text-shadow:1px 1px #201923}.title-author{position:absolute;bottom:18px;left:50%;transform:translateX(-50%);color:#D5C4B1;font-size:14px;letter-spacing:.16em;text-shadow:2px 2px #1A111B;white-space:nowrap}.title-author b{color:#FFE39A}
.title-ember{position:absolute;z-index:3;bottom:-20px;width:4px;height:4px;background:#FFD56B;box-shadow:0 0 8px #F3A34B;animation:titleEmber var(--d) linear infinite;animation-delay:var(--delay);left:var(--x)}
#game-title-screen.leaving .title-door:before{animation:titleEnter .58s ease-in forwards}#game-title-screen.leaving .title-content{animation:titleFade .58s ease-in forwards}#game-title-screen.leaving .title-building{animation:titleBuilding .58s ease-in forwards}
@keyframes titleStars{50%{opacity:.82}}@keyframes titleWindow{50%{filter:brightness(1.17)}}@keyframes titlePortal{50%{transform:translateX(-50%) scale(.88);filter:blur(4px) hue-rotate(25deg)}}@keyframes titleKnob{50%{opacity:.35}}@keyframes titleLamp{50%{filter:brightness(1.25);transform:translateX(-50%) scale(.9)}}@keyframes titleFloat{50%{transform:translateY(-5px)}}@keyframes titleSpark{50%{opacity:.35;transform:translateY(-50%) scale(.75)}}@keyframes titleEmber{0%{transform:translate(0,0);opacity:0}12%{opacity:1}100%{transform:translate(35px,-78vh);opacity:0}}@keyframes titleEnter{to{transform:translateX(-50%) scale(12);opacity:0}}@keyframes titleFade{to{opacity:0;transform:scale(1.04)}}@keyframes titleBuilding{to{filter:brightness(1.8);transform:translateX(-50%) scale(1.03)}}
/* Premium title visual pass: layered lacquer, aged brass, glass and soft volumetric light. */
#game-title-screen{--ink:#0b0811;--wine:#3e1f35;--plum:#6c3654;--brass:#d39a4d;--gold:#ffe7a3;--cyan:#7ce0db;background:#090711;overflow:clip}
.title-sky{background:
  radial-gradient(ellipse at 50% 54%,#8b50604d 0 10%,transparent 38%),
  radial-gradient(circle at 50% 18%,#49305e 0,#23172f 35%,#100d18 68%,#08070d 100%)}
.title-sky:before{opacity:.62;background-image:
  radial-gradient(circle,#fff2c9 0 1px,transparent 1.35px),
  radial-gradient(circle,#88ddd9 0 1px,transparent 1.4px),
  radial-gradient(circle,#d99ab8 0 1px,transparent 1.3px);
  background-size:79px 79px,131px 131px,173px 173px;background-position:17px 23px,47px 71px,96px 11px;
  filter:drop-shadow(0 0 3px #fff1b7);animation:titleStars 5s steps(3,end) infinite,titleSkyDrift 34s linear infinite}
.title-sky:after{content:"";position:absolute;inset:-15%;background:
  radial-gradient(ellipse at 50% 62%,#e6a25717 0 8%,transparent 36%),
  linear-gradient(112deg,transparent 20%,#8c5cd00c 39%,#78e0d70d 48%,transparent 63%);
  filter:blur(18px);mix-blend-mode:screen;animation:titleAurora 9s ease-in-out infinite alternate}
.title-moon{left:10%;top:9%;width:78px;height:78px;border-width:7px;border-color:#f6d478;border-right-color:transparent;
  box-shadow:inset 4px 0 4px #fff6c3,0 0 0 1px #9c643b,0 0 25px #f4c86c99,0 0 75px #d8a85c38;
  filter:none;animation:titleMoonBreathe 5.5s ease-in-out infinite}
.title-moon:before{content:"";position:absolute;inset:-28px;border-radius:50%;background:radial-gradient(circle,#f9d88625,transparent 66%);filter:blur(6px)}
.title-moon:after{content:"";position:absolute;right:-28px;top:14px;width:3px;height:3px;background:#fff5c4;box-shadow:0 0 8px 2px #ffe9a7,19px 25px 0 #9be1dc,-12px 48px 0 #fff1ba;animation:titleSparkle 2.8s steps(2,end) infinite}
.title-building{bottom:12%;width:min(780px,86vw);height:min(438px,56vh);border:1px solid #8c5d55;
  background:
    linear-gradient(90deg,transparent 0 7%,#fff5db0a 7% 7.4%,transparent 7.4% 92.6%,#fff5db0a 92.6% 93%,transparent 93%),
    repeating-linear-gradient(0deg,#392638 0 3px,#342233 3px 31px,#422a3d 31px 33px),
    linear-gradient(90deg,#2b1c2d,#4b2e42 50%,#2b1c2d);
  box-shadow:0 -9px 0 #1a111d,0 -12px 0 #774550,0 0 0 5px #140f18,0 28px 75px #050308dd,0 -4px 75px #e9a45d1f,inset 0 1px 0 #d79d8066,inset 0 0 70px #130d17cc}
.title-building:before{left:-6%;right:-6%;top:-76px;height:84px;
  background:
    linear-gradient(180deg,#9e6057 0 3px,#3d2235 4px 38%,#5e3046 39% 72%,#251522 73%),
    repeating-linear-gradient(90deg,transparent 0 30px,#d38e7255 30px 32px);
  clip-path:polygon(0 100%,8% 58%,34% 58%,50% 0,66% 58%,92% 58%,100% 100%);
  border-bottom:0;filter:drop-shadow(0 -3px 0 #ba755c) drop-shadow(0 8px 0 #110c15) drop-shadow(0 15px 22px #08050baa)}
.title-building:after{left:-12%;right:-12%;bottom:-112px;height:185px;opacity:.86;
  background:
    linear-gradient(90deg,transparent,#d5946b12 50%,transparent),
    repeating-linear-gradient(90deg,#241a2b 0 52px,#4b3043 52px 54px),
    repeating-linear-gradient(0deg,transparent 0 48px,#74504e 48px 50px);
  transform:perspective(210px) rotateX(51deg);box-shadow:inset 0 24px 45px #05040aaa}
.title-sign{top:-43px;padding:8px 30px 9px;border:1px solid #efbd73;background:
  linear-gradient(100deg,transparent 0 35%,#fff5d12e 48%,transparent 61%),
  repeating-linear-gradient(0deg,#5f303b 0 2px,#683743 2px 8px);
  box-shadow:0 0 0 4px #24131e,0 0 0 6px #a65f4d,inset 0 0 0 2px #e2a15d,inset 0 0 20px #28111acc,0 9px 22px #09050baa;
  color:#ffe2a0;text-shadow:0 1px #fff3c4,2px 3px #3b1724,0 0 12px #ffc87388;letter-spacing:.48em}
.title-window{top:84px;width:88px;height:108px;border:1px solid #bb7960;background:
  linear-gradient(115deg,#fff7cbb8 0 7%,transparent 7% 28%,#fff4ba33 28% 33%,transparent 33%),
  linear-gradient(180deg,#ffdd7d,#eaa45d 58%,#9e5460);
  box-shadow:0 0 0 6px #1b111b,0 0 0 9px #73434a,inset 0 0 0 5px #b46750,inset 0 -22px 28px #b8546c88,0 0 32px #ffba5d66,0 0 70px #ffb55a1f;
  animation:titleWindow 4.2s ease-in-out infinite}
.title-window:before,.title-window:after{background:linear-gradient(90deg,#6d3d43,#c07855,#6d3d43);box-shadow:0 0 1px #1a1018}
.title-window:before{left:calc(50% - 2px);width:4px}.title-window:after{top:46%;height:4px;background:linear-gradient(#6d3d43,#c07855,#6d3d43)}
.title-window.w1{left:9%}.title-window.w2{right:9%}
.title-door{width:154px;height:218px;border:1px solid #b47869;border-bottom:0;border-radius:76px 76px 0 0;
  background:
    linear-gradient(90deg,#1f172a 0 6%,#67405e 7% 12%,#32213c 13% 46%,#74485f 49%,#32213c 53% 88%,#67405e 89% 94%,#1f172a 95%),
    repeating-linear-gradient(0deg,#3b2843 0 8px,#2b1d35 8px 10px);
  box-shadow:0 0 0 7px #17101b,0 0 0 10px #794854,0 0 0 11px #d48a67,inset 0 0 28px #e6a85d70,0 0 25px #d35cc96b,0 0 70px #a65cc53d;overflow:visible}
.title-door:before{left:50%;top:21px;width:104px;height:174px;border-radius:52% 52% 12% 12%;
  background:
    radial-gradient(ellipse at 55% 42%,#fffbd4 0 3%,#95ede7 13%,#8766c7 31%,#d66ba9 49%,#35224f 68%,transparent 71%),
    conic-gradient(from 30deg,#85ebe0,#d77ab1,#f7cf79,#7770d4,#85ebe0);
  box-shadow:inset 0 0 17px #fffbd8,0 0 12px #8ee8e2,0 0 34px #c35cc6aa;filter:blur(.7px) saturate(1.12);animation:titlePortal 3.1s ease-in-out infinite}
.title-door:after{right:21px;left:auto;bottom:91px;width:7px;height:7px;border-radius:50%;background:#fff0a5;box-shadow:0 0 0 2px #6d423b,0 0 12px 3px #ffe59b;animation:titleKnob 1.8s ease-in-out infinite}
.title-counter{bottom:0;height:17%;border-top:1px solid #c38362;background:
  linear-gradient(180deg,#8a574855 0 2px,transparent 3px),
  repeating-linear-gradient(90deg,#281b29 0 72px,#563646 72px 74px,#2c1d2d 74px 145px),
  linear-gradient(#412b38,#17111c);
  box-shadow:0 -6px 0 #21131d,0 -8px 0 #8d594b,0 -22px 70px #050309dd,inset 0 12px 35px #b66c4a16}
.title-counter:before{content:"";position:absolute;left:0;right:0;top:-70px;height:78px;background:linear-gradient(180deg,transparent,#e7a2670c 55%,#ffc67c1c);filter:blur(10px);pointer-events:none}
.title-counter:after{content:"";position:absolute;inset:8px 0 auto;height:1px;background:linear-gradient(90deg,transparent,#e2a87888 30%,#fff0c7aa 50%,#e2a87888 70%,transparent)}
.title-lamp{width:3px;height:17vh;background:linear-gradient(90deg,#0f0b12,#6f4750,#0f0b12);box-shadow:0 0 4px #09060b}.title-lamp.l1{left:7.5%}.title-lamp.l2{right:7.5%}
.title-lamp:before{bottom:-27px;width:58px;height:41px;background:linear-gradient(90deg,#3c202b,#825044 50%,#3c202b);border-bottom:2px solid #d28c5b;filter:drop-shadow(0 5px 4px #08050a)}
.title-lamp:after{bottom:-55px;width:15px;height:18px;border-radius:45%;background:#fff1a8;box-shadow:0 0 8px 3px #ffe58d,0 0 27px 12px #f3b84b77,0 20px 80px 32px #f0ac5233;animation:titleLamp 3.2s ease-in-out infinite}
.title-content{justify-content:flex-start;padding:clamp(68px,11vh,118px) 20px 32px;background:
  radial-gradient(ellipse at 50% 45%,transparent 0 26%,#0a07102e 58%,#06040aaa 100%),
  linear-gradient(90deg,#08060dcc 0,transparent 18%,transparent 82%,#08060dcc 100%)}
.title-content:before{content:"";position:absolute;z-index:-1;left:50%;top:13%;width:min(820px,92vw);height:58%;transform:translateX(-50%);background:radial-gradient(ellipse,#e99a6123,transparent 66%);filter:blur(18px);pointer-events:none}
.title-logo{margin:0;width:min(640px,86vw);padding:20px 38px 17px;border:1px solid #f1bf78;background:
  linear-gradient(112deg,transparent 0 30%,#fff7d51c 43%,#fff7d53b 49%,transparent 61%),
  repeating-linear-gradient(0deg,#2e1d30f2 0 3px,#352238f2 3px 10px);
  box-shadow:0 0 0 4px #1a101b,0 0 0 7px #875044,0 0 0 8px #e6a168,0 10px 0 #130c15,0 22px 45px #060309dd,inset 0 1px 0 #fff2c866,inset 0 0 38px #110b16;
  animation:titleFloat 4.2s ease-in-out infinite,titleSignGlow 6s ease-in-out infinite}
.title-logo:before,.title-logo:after{top:50%;color:#8de4dd;font-size:17px;text-shadow:0 0 9px #76e4de;animation:titleSpark 2.4s steps(3,end) infinite}.title-logo:before{left:14px}.title-logo:after{right:14px}
.title-logo h1{background:linear-gradient(180deg,#fff8ca 0,#ffe79a 35%,#e8ad5e 76%,#fff0ad 100%);-webkit-background-clip:text;background-clip:text;color:transparent;
  font-size:clamp(38px,5.5vw,70px);letter-spacing:.11em;text-shadow:0 3px 0 #7c3448,0 6px 0 #2a1522,0 0 20px #f6c96a66;filter:drop-shadow(0 1px 0 #fff9d0)}
.title-logo .en{margin-top:9px;color:#8ce3de;font-size:clamp(9px,1.2vw,13px);letter-spacing:.44em;text-shadow:0 0 10px #64dcd5aa}
.title-tagline{margin:18px 0 15px;padding:8px 22px;border:1px solid #8d605b;background:linear-gradient(90deg,transparent,#1a121cdd 12% 88%,transparent);color:#eee0c8;letter-spacing:.14em;box-shadow:inset 0 1px #fff2d316;text-shadow:0 2px 2px #120b14,0 0 12px #eaa15d33}
.title-menu{gap:11px;width:min(356px,84vw)}
.title-button{min-height:52px;border:1px solid #e0a266;background:
  linear-gradient(110deg,transparent 0 34%,#fff1c51c 45%,transparent 58%),
  linear-gradient(180deg,#794452,#522c3c 48%,#3d2231 52%,#5b3141 100%);
  box-shadow:0 0 0 4px #1a111a,0 0 0 5px #7e4c47,0 6px 0 #100a11,0 11px 22px #08050aaa,inset 0 1px 0 #ffe7b766,inset 0 -8px 15px #210f1b66;
  color:#fff0c5;text-shadow:0 2px #29121d,0 0 10px #ffd47b44;transition:transform .18s ease,filter .18s ease,box-shadow .18s ease,letter-spacing .18s ease}
.title-button:before{inset:1px auto 1px -38%;width:25%;background:linear-gradient(90deg,transparent,#fff4d54d,transparent);transform:skewX(-20deg);transition:left .45s ease}
.title-menu>.title-button:not(.title-slot):after{content:"◆";position:absolute;left:17px;top:50%;transform:translateY(-50%) scale(.72);color:#d9a15c;text-shadow:0 0 8px #ffd681;transition:transform .18s,color .18s}
.title-button:hover:not(:disabled),.title-button:focus-visible{transform:translateY(-3px);filter:brightness(1.12) saturate(1.08);letter-spacing:.21em;outline:1px solid #8be2dc;outline-offset:5px;box-shadow:0 0 0 4px #1a111a,0 0 0 5px #d39561,0 9px 0 #100a11,0 16px 30px #08050acc,inset 0 1px 0 #fff4c9aa,inset 0 -8px 15px #210f1b66}
.title-button:hover:not(:disabled):after{transform:translateY(-50%) scale(.9) rotate(45deg);color:#9be4dc}.title-button:active:not(:disabled){transform:translateY(4px);box-shadow:0 0 0 4px #1a111a,0 0 0 5px #7e4c47,0 1px 0 #100a11,inset 0 1px 0 #ffe7b766}
.title-button.primary{background:
  linear-gradient(110deg,transparent 0 34%,#fff5d52c 45%,transparent 58%),
  linear-gradient(180deg,#a35e57,#744044 48%,#572d38 52%,#7a4145 100%);
  box-shadow:0 0 0 4px #1a111a,0 0 0 5px #c57958,0 6px 0 #100a11,0 11px 25px #08050aaa,inset 0 1px 0 #fff1bb99,inset 0 -8px 15px #2b111b66}
.title-button:disabled{border-color:#68504d;background:linear-gradient(#49383d,#30262d);box-shadow:0 0 0 4px #171118,0 4px 0 #0d090e;color:#9e9189;filter:saturate(.4) brightness(.72)}
.title-slots{border:1px solid #9d6958;background:#160f19e8;box-shadow:0 0 0 4px #120c14,0 12px 30px #060409cc,inset 0 0 30px #5e344344}.title-slot{box-shadow:0 0 0 3px #170f17,0 4px 0 #0e090f,inset 0 1px #fff1c333}.title-slot small{color:#d7bc8e}
.slot-mode .title-menu>[data-title-action="newmenu"],.slot-mode .title-menu>[data-title-action="continuemenu"]{display:none}.slot-mode .title-slots{max-height:min(330px,46vh)}.title-back{min-height:40px;font-size:14px;text-align:center}.title-back:after{display:none}
.title-status{margin-top:3px;color:#e8c982;text-shadow:0 2px #160e16,0 0 9px #efa95455}.title-author{bottom:19px;padding:7px 18px;border-top:1px solid #7c544c;color:#cabcae;background:linear-gradient(90deg,transparent,#130e17cc,transparent);text-shadow:0 2px #120b13}.title-author b{color:#ffe3a0;text-shadow:0 0 10px #f0b75e77}
.title-ember{width:3px;height:3px;border-radius:50%;background:#ffe593;box-shadow:0 0 6px 2px #efa84e;animation:titleEmber var(--d) cubic-bezier(.2,.5,.4,1) infinite;animation-delay:var(--delay)}
@keyframes titleSkyDrift{to{background-position:96px 23px,-84px 71px,269px 11px}}@keyframes titleAurora{to{transform:translate3d(3%,-2%,0) scale(1.08);opacity:.72}}@keyframes titleMoonBreathe{50%{box-shadow:inset 4px 0 4px #fff6c3,0 0 0 1px #9c643b,0 0 34px #f4c86cbb,0 0 90px #d8a85c4c}}@keyframes titleSparkle{50%{opacity:.38;transform:scale(.75)}}@keyframes titleSignGlow{50%{filter:brightness(1.055)}}
@media(max-width:650px){.title-content{padding-top:8vh}.title-building{bottom:14%;width:94vw;height:48vh}.title-building:before{top:-54px;height:62px}.title-window{top:72px;width:58px;height:76px}.title-window.w1{left:7%}.title-window.w2{right:7%}.title-door{width:112px;height:174px}.title-door:before{width:76px;height:137px}.title-logo{width:91vw;padding:16px 25px 14px}.title-logo h1{letter-spacing:.055em}.title-tagline{margin:15px 0 13px;padding:7px 12px;font-size:12px}.title-button{min-height:46px;font-size:16px}.title-moon{width:50px;height:50px}.title-lamp{display:none}.title-author{bottom:11px;font-size:12px}}
@media(max-height:620px){.title-content{padding-top:34px}.title-logo{padding-top:13px;padding-bottom:11px}.title-logo h1{font-size:clamp(34px,7vh,55px)}.title-tagline{margin:12px 0 10px}.title-button{min-height:43px}.title-building{height:52vh}.title-author{bottom:8px}}
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
  slots = [];
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
        <div class="title-menu"><button class="title-button" data-title-action="newmenu" disabled>开始新游戏</button><button class="title-button" data-title-action="continuemenu" disabled>继续游戏</button><div class="title-slots" data-title-slots></div><div class="title-status" role="status">正在点亮旅店灯火…</div></div>
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

  activate({ hasSave, slots = this.slots, onChoose, onInteract = this.onInteract }) {
    this.ready = true;
    this.hasSave = !!hasSave;
    this.slots = Array.isArray(slots) ? slots : [];
    this.onChoose = onChoose;
    this.onInteract = onInteract;
    const fresh = this.root?.querySelector('[data-title-action="newmenu"]');
    const resume = this.root?.querySelector('[data-title-action="continuemenu"]');
    if (fresh) fresh.disabled = false;
    if (resume) resume.disabled = !this.hasSave;
    if (resume && this.hasSave) resume.classList.add('primary');
    else if (fresh) fresh.classList.add('primary');
    this.status(this.hasSave ? '检测到旅店存档，可以继续上次营业。' : '尚无存档，请从新旅店开始。');
    setTimeout(() => (this.hasSave ? resume : fresh)?.focus({ preventScroll: true }), 80);
  }

  status(message) {
    const node = this.root?.querySelector('.title-status');
    if (node) node.textContent = message;
  }

  renderSlotMenu(mode) {
    const host = this.root?.querySelector('[data-title-slots]');
    if (!host) return;
    const rows = this.slots.filter((slot) => mode === 'new' || slot.valid);
    host.innerHTML = rows.map((slot) => {
      const action = mode === 'new' ? 'new' : 'continue';
      const title = mode === 'new'
        ? (slot.valid ? `档位 ${slot.slot} · 覆盖现有进度` : `档位 ${slot.slot} · 开设新旅店`)
        : `档位 ${slot.slot} · 继续游戏`;
      const detail = slot.valid ? `${slot.ownerName} · 第 ${slot.day} 天 · ${'★'.repeat(slot.stars || 0) || '无星'} · ${slot.coins} 界币` : '空档位';
      return `<button class="title-button title-slot" data-title-action="${action}" data-slot="${slot.slot}">${title}<small>${detail}</small></button>`;
    }).join('') + '<button class="title-button title-back" data-title-action="back">← 返回主菜单</button>';
    this.root.classList.add('slot-mode');
    host.classList.add('on');
    this.status(mode === 'new' ? '选择新游戏要使用的档位。已有档位需要再次确认覆盖。' : '选择要继续的旅店档位。');
    this.root.scrollTop = 0;
    requestAnimationFrame(() => { if (this.root) this.root.scrollTop = 0; });
    setTimeout(() => {
      if (!this.root) return;
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      this.root.scrollTop = 0;
    }, 0);
  }

  async handleClick(event) {
    const button = event.target.closest('[data-title-action]');
    if (!button || button.disabled || !this.ready || this.root?.classList.contains('leaving')) return;
    this.onInteract?.();
    const action = button.dataset.titleAction;
    if (action === 'back') {
      const host = this.root.querySelector('[data-title-slots]');
      this.root.classList.remove('slot-mode');
      host?.classList.remove('on');
      if (host) host.innerHTML = '';
      this.root.scrollTop = 0;
      this.status(this.hasSave ? '检测到旅店存档，可以继续上次营业。' : '尚无存档，请从新旅店开始。');
      const target = this.root.querySelector(this.hasSave ? '[data-title-action="continuemenu"]' : '[data-title-action="newmenu"]');
      target?.focus({ preventScroll: true });
      return;
    }
    if (action === 'newmenu' || action === 'continuemenu') {
      this.renderSlotMenu(action === 'newmenu' ? 'new' : 'continue');
      return;
    }
    const slot = Math.max(1, Math.min(3, parseInt(button.dataset.slot || '1', 10)));
    const slotHasSave = !!this.slots.find((item) => item.slot === slot)?.valid;
    if (action === 'new' && slotHasSave && button.dataset.confirm !== 'yes') {
      button.dataset.confirm = 'yes';
      button.dataset.originalHtml = button.innerHTML;
      button.textContent = '再次点击，确认新游戏';
      this.status(`开始新游戏会覆盖档位 ${slot} 的当前进度。`);
      clearTimeout(this.confirmTimer);
      this.confirmTimer = setTimeout(() => {
        if (!button.isConnected) return;
        delete button.dataset.confirm;
        button.innerHTML = button.dataset.originalHtml || `档位 ${slot} · 覆盖现有进度`;
        delete button.dataset.originalHtml;
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
    try { ok = (await this.onChoose?.(action, slot)) !== false; } catch (err) { ok = false; }
    if (ok) this.destroy();
    else {
      this.root.classList.remove('leaving');
      this.slots = this.slots.map((item) => item.slot === slot ? { ...item, valid: false } : item);
      this.activate({ hasSave: this.slots.some((item) => item.valid), slots: this.slots, onChoose: this.onChoose, onInteract: this.onInteract });
      this.status('存档无法读取，请开始新游戏。');
    }
  }

  destroy() {
    clearTimeout(this.confirmTimer);
    this.root?.remove();
    this.root = null;
  }
}
