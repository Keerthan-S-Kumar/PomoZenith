const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const load=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))||d}catch(e){return d}},save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
function toast(t){const e=$("#toast");e.textContent=t;e.classList.add("on");clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove("on"),2400)}

/* ---------- Timer ---------- */
const MODES={focus:[25,"Time to focus"],short:[5,"Take a breather"],long:[15,"Long break — stretch!"]},C=2*Math.PI*125;
let mode="focus",total=1500,left=1500,running=false,endAt=0,iv=null,cycle=0,tasks=load("or-t",[]),active=load("or-a",null),stats=load("or-s",{});
const pr=$("#pr");pr.style.strokeDasharray=C;
const p2=n=>String(n).padStart(2,"0"),DUR=load("or-d",{focus:25,short:5,long:15});
function draw(){const m=Math.floor(left/60),s=left%60,el=1-left/total;
 $("#tm").textContent=p2(m)+":"+p2(s);pr.style.strokeDashoffset=C*(1-el);
 $("#dg").setAttribute("transform",`rotate(${el*360} 150 150)`);$("#lb").textContent=running?MODES[mode][1]:(left<total?"Paused":"Ready — "+MODES[mode][1].toLowerCase());
 $("#go").textContent=running?"Pause":(left<total?"Resume":"Start");$("#clock").classList.toggle("run",running);
 document.title=running?`${p2(m)}:${p2(s)} · PomoZenith`:"PomoZenith — Focus Studio"}
function halt(){clearInterval(iv);running=false}
function renderDots(){const n=(cycle>0&&cycle%4===0&&mode==="long")?4:cycle%4;$("#dots").innerHTML=[0,1,2,3].map(i=>`<i class="${i<n?"f":""}"></i>`).join("")}
function setMode(m){halt();mode=m;total=left=DUR[m]*60;$("#dv").textContent=DUR[m]+" min";$$(".tab").forEach(t=>t.classList.toggle("on",t.dataset.m===m));renderDots();draw()}
function start(){if(running)return;ensureAudio();running=true;endAt=Date.now()+left*1000;iv=setInterval(()=>{left=Math.max(0,Math.ceil((endAt-Date.now())/1000));draw();if(!left)finish()},250);draw()}
function pause(){left=Math.max(0,Math.ceil((endAt-Date.now())/1000));halt();draw()}
function finish(){halt();chime();confetti();
 if(mode==="focus"){record();cycle++;const t=tasks.find(x=>x.id===active);if(t){t.p++;save("or-t",tasks);renderTasks()}toast("Session complete! Great work 🎉");setMode(cycle%4===0?"long":"short")}
 else{toast("Break over — back to it 🚀");setMode("focus")}}
$("#go").onclick=()=>running?pause():start();
$("#rs").onclick=()=>setMode(mode);
$("#tabs").onclick=e=>{if(e.target.dataset.m)setMode(e.target.dataset.m)};
addEventListener("keydown",e=>{if(e.code==="Space"&&!/INPUT|BUTTON/.test(document.activeElement.tagName)){e.preventDefault();running?pause():start()}});

/* ---------- Stats ---------- */
const key=d=>d.toISOString().slice(0,10);
function record(){const k=key(new Date()),s=stats[k]||{s:0,m:0};s.s++;s.m+=DUR.focus;stats[k]=s;save("or-s",stats);renderStats()}
function renderStats(){const days=[...Array(7)].map((_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);return d}),mx=Math.max(60,...days.map(d=>(stats[key(d)]||{m:0}).m)),t=stats[key(new Date())]||{s:0,m:0};
 $("#s1").textContent=t.s;$("#s2").textContent=t.m;
 $("#bars").innerHTML=days.map(d=>{const m=(stats[key(d)]||{m:0}).m;return`<div title="${m} min"><i style="height:${m/mx*100}%"></i>${d.toLocaleDateString("en",{weekday:"narrow"})}</div>`}).join("")}

/* ---------- Tasks ---------- */
function renderTasks(){$("#tl").innerHTML=tasks.length?tasks.map(t=>`<div class="tk ${t.id===active?"act":""} ${t.d?"dn":""}" data-id="${t.id}"><input type="checkbox" data-c="${t.id}" ${t.d?"checked":""} aria-label="Done"><span>${esc(t.t)}</span><small>🍅 ${t.p}</small><button data-x="${t.id}" aria-label="Delete">✕</button></div>`).join(""):'<div class="emp">No tasks yet — add one and select it to track sessions.</div>'}
$("#tf").onsubmit=e=>{e.preventDefault();const v=$("#ti").value.trim();if(!v)return;const t={id:Date.now(),t:v,d:false,p:0};tasks.push(t);if(!active)active=t.id;save("or-t",tasks);save("or-a",active);$("#ti").value="";renderTasks()};
$("#tl").onclick=e=>{const c=e.target.dataset.c,x=e.target.dataset.x,r=e.target.closest(".tk");
 if(c){const t=tasks.find(t=>t.id==c);t.d=e.target.checked}else if(x){tasks=tasks.filter(t=>t.id!=x);if(active==x)active=null}else if(r){active=+r.dataset.id}
 save("or-t",tasks);save("or-a",active);renderTasks()};

/* ---------- Ambient audio (generated with Web Audio) ---------- */
let AC,master,vol=.5,nodes={};
function ensureAudio(){if(!AC){AC=new(window.AudioContext||window.webkitAudioContext)();master=AC.createGain();master.gain.value=vol;master.connect(AC.destination)}if(AC.state==="suspended")AC.resume()}
function sound(k,on){ensureAudio();
 if(!on){const n=nodes[k];if(n){n.s.stop();n.l&&n.l.stop();delete nodes[k]}order=order.filter(x=>x!==k);setScene();return}
 const b=AC.createBuffer(1,AC.sampleRate*2,AC.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
 const s=AC.createBufferSource();s.buffer=b;s.loop=true;const f=AC.createBiquadFilter(),g=AC.createGain(),v=AC.createGain();let l=null;
 const lfo=(hz,amt,target)=>{l=AC.createOscillator();const lg=AC.createGain();l.frequency.value=hz;lg.gain.value=amt;l.connect(lg);lg.connect(target);l.start()};
 if(k==="rain"){f.type="highpass";f.frequency.value=1400;g.gain.value=.45}
 if(k==="waves"){f.type="lowpass";f.frequency.value=480;g.gain.value=.9;lfo(.1,.6,g.gain)}
 if(k==="wind"){f.type="bandpass";f.frequency.value=600;f.Q.value=.9;g.gain.value=.9;lfo(.18,350,f.frequency)}
 v.gain.value=$(`.sc[data-k="${k}"] input`).value/100;
 s.connect(f);f.connect(g);g.connect(v);v.connect(master);s.start();nodes[k]={s,l,v};order=order.filter(x=>x!==k).concat(k);setScene()}
$("#snd").onclick=e=>{if(e.target.tagName==="INPUT")return;const c=e.target.closest(".sc");if(!c)return;const on=!c.classList.contains("on");c.classList.toggle("on",on);sound(c.dataset.k,on)};
$("#snd").oninput=e=>{const c=e.target.closest(".sc"),n=c&&nodes[c.dataset.k];if(n)n.v.gain.value=e.target.value/100};
$("#vol").oninput=e=>{vol=e.target.value/100;if(master)master.gain.value=vol};
function chime(){if(!AC)return;[880,1175].forEach((f,i)=>{const o=AC.createOscillator(),g=AC.createGain(),t=AC.currentTime+i*.18;o.frequency.value=f;o.type="sine";g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.3,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+.6);o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+.65)})}

/* ---------- Living background: the scene follows the sound you play ---------- */
const sky=$("#sky"),sx=sky.getContext("2d"),SCN={space:["🌌","Deep space"],rain:["🌧️","Rainfall"],waves:["🌊","Ocean waves"],wind:["🍃","Windy meadow"]};
let W,H,mx=0,my=0,ink="190,200,255",fr=0,speed=.4,run=0,cur="space",prev="space",fade=1,order=[],t=0,nextBolt=400;
const rnd=(a,b)=>a+Math.random()*(b-a);
function resize(){W=sky.width=innerWidth;H=sky.height=innerHeight}resize();addEventListener("resize",resize);
function setScene(){const s=order.length?order[order.length-1]:"space";if(s===cur)return;prev=cur;cur=s;fade=0;document.documentElement.dataset.scene=s;
 if(s==="space")stars.forEach(x=>x.px=0);$$(".bgl").forEach(l=>l.classList.toggle("on",l.dataset.s===s));$("#sce").textContent=SCN[s][0];$("#scn").textContent=SCN[s][1]}
/* space */
const mkS=()=>({x:rnd(-1,1)*W,y:rnd(-1,1)*H,z:rnd(1,W),px:0,py:0}),stars=[...Array(220)].map(mkS);
function space(){stars.forEach(s=>{s.z-=speed;if(s.z<=1){Object.assign(s,mkS());s.z=W}const k=W*.5/s.z,x=W/2+s.x*k+mx*(1-s.z/W)*30,y=H/2+s.y*k+my*(1-s.z/W)*30,r=Math.max(.3,(1-s.z/W)*2.4);
 sx.strokeStyle=sx.fillStyle=`rgba(${ink},${1-s.z/W})`;if(speed>3){sx.lineWidth=r;sx.beginPath();sx.moveTo(s.px||x,s.py||y);sx.lineTo(x,y);sx.stroke()}else{sx.beginPath();sx.arc(x,y,r,0,7);sx.fill()}s.px=x;s.py=y})}
/* rain: slanted streaks, ripples on the ground, lightning */
const drops=[...Array(320)].map(()=>({x:rnd(0,1.2),y:rnd(0,1),l:rnd(12,34),v:rnd(.9,1.6)})),rip=[];
function rain(){const f=1+run*.7,w=-.18-mx*.3;sx.lineCap="round";
 drops.forEach(d=>{d.y+=d.v*f*.02;d.x+=w*.0016;if(d.y>1){d.y=-.05;d.x=rnd(0,1.2);if(Math.random()<.2&&rip.length<26)rip.push({x:rnd(0,W),y:H*rnd(.9,.99),r:2,a:.6})}
  const x=d.x*W,y=d.y*H;sx.strokeStyle=`rgba(${ink},${.25+d.v*.2})`;sx.lineWidth=d.v;sx.beginPath();sx.moveTo(x,y);sx.lineTo(x+d.l*w,y-d.l);sx.stroke()});
 rip.forEach(r=>{r.r+=.9;r.a-=.012;sx.strokeStyle=`rgba(${ink},${Math.max(0,r.a)})`;sx.lineWidth=1.2;sx.beginPath();sx.ellipse(r.x,r.y,r.r*2.4,r.r*.6,0,0,7);sx.stroke()});
 for(let i=rip.length;i--;)if(rip[i].a<=0)rip.splice(i,1)}
/* waves: glowing moon, layered ocean, rising bubbles */
const bub=[...Array(26)].map(()=>({x:rnd(0,1),y:rnd(.5,1),r:rnd(1.5,5),v:rnd(.0006,.0018)})),WC=["56,189,248","45,212,191","14,165,233","99,102,241"];
function waves(){const mg=sx.createRadialGradient(W*.78,H*.2,0,W*.78,H*.2,170);mg.addColorStop(0,"rgba(255,255,230,.9)");mg.addColorStop(.18,"rgba(255,255,230,.35)");mg.addColorStop(1,"rgba(255,255,230,0)");sx.fillStyle=mg;sx.fillRect(0,0,W,H*.6);
 for(let i=0;i<4;i++){const base=H*(.62+i*.08)-run*14,amp=14+i*7+run*10,sp=.6+i*.25;sx.beginPath();sx.moveTo(0,H+5);
  for(let x=0;x<=W+10;x+=10)sx.lineTo(x,base+Math.sin(x*.006+t*sp*.02+i*2)*amp+Math.sin(x*.013-t*.018*sp+i)*amp*.4+my*10);
  sx.lineTo(W+10,H+5);sx.closePath();const g=sx.createLinearGradient(0,base-amp,0,H);g.addColorStop(0,`rgba(${WC[i]},${.38-i*.05})`);g.addColorStop(1,`rgba(${WC[i]},.05)`);sx.fillStyle=g;sx.fill()}
 bub.forEach(b=>{b.y-=b.v;if(b.y<.5)b.y=1;sx.strokeStyle="rgba(255,255,255,.35)";sx.lineWidth=1;sx.beginPath();sx.arc(b.x*W+Math.sin(t*.03+b.x*9)*8,b.y*H,b.r,0,7);sx.stroke()})}
/* wind: gust streaks and tumbling leaves */
const LC=["52,211,153","163,230,53","245,158,11","132,204,22"],leaves=[...Array(34)].map(()=>({x:rnd(0,1),y:rnd(0,1),s:rnd(5,12),vx:rnd(.0008,.0022),ph:rnd(0,6),c:LC[Math.random()*4|0]})),gust=[...Array(22)].map(()=>({x:rnd(0,1),y:rnd(.05,.95),l:rnd(80,240),v:rnd(.002,.006)}));
function wind(){const f=1+run*.8;
 gust.forEach(g=>{g.x+=g.v*f;if(g.x>1.3){g.x=-.3;g.y=rnd(.05,.95)}const x=g.x*W,y=g.y*H;sx.strokeStyle=`rgba(${ink},.14)`;sx.lineWidth=1.3;sx.beginPath();sx.moveTo(x,y);sx.bezierCurveTo(x+g.l*.3,y-12,x+g.l*.6,y+12,x+g.l,y);sx.stroke()});
 leaves.forEach(l=>{l.x+=l.vx*f;l.y+=.0004;l.ph+=.03*f;if(l.x>1.05){l.x=-.05;l.y=rnd(0,1)}if(l.y>1.05)l.y=-.05;sx.save();sx.translate(l.x*W,l.y*H+Math.sin(l.ph)*30);sx.rotate(l.ph*.8);sx.fillStyle=`rgba(${l.c},.85)`;sx.beginPath();sx.ellipse(0,0,l.s,l.s/2.2,0,0,7);sx.fill();sx.restore()})}
const SCENES={space,rain,waves,wind};
(function loop(){t++;if(fr++%45===0){const bg=getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();ink=bg==="#05060d"?"190,200,255":"60,70,170"}
 speed+=((running?9:.5)-speed)*.04;run+=((running?1:0)-run)*.04;sx.clearRect(0,0,W,H);
 if(fade<1){fade=Math.min(1,fade+.025);sx.globalAlpha=1-fade;SCENES[prev]();sx.globalAlpha=fade;SCENES[cur]()}else SCENES[cur]();
 sx.globalAlpha=1;
 if(cur==="rain"&&--nextBolt<=0){nextBolt=rnd(420,900);const f=$("#fl");f.classList.remove("on");void f.offsetWidth;f.classList.add("on")}
 requestAnimationFrame(loop)})();

/* ---------- Confetti ---------- */
const cf=$("#cf"),cx=cf.getContext("2d");
function confetti(){cf.width=innerWidth;cf.height=innerHeight;const cs=["#00d4ff","#6c5ce7","#ff4fa3","#3ee6a8","#ffd166"],ps=[...Array(150)].map(()=>({x:innerWidth/2,y:innerHeight/2.2,vx:(Math.random()-.5)*16,vy:Math.random()*-15-3,r:Math.random()*6+3,c:cs[Math.random()*5|0],a:Math.random()*6}));let n=0;
 (function f(){cx.clearRect(0,0,cf.width,cf.height);ps.forEach(p=>{p.vy+=.35;p.x+=p.vx;p.y+=p.vy;p.a+=.2;cx.save();cx.translate(p.x,p.y);cx.rotate(p.a);cx.fillStyle=p.c;cx.fillRect(-p.r,-p.r/2,p.r*2,p.r);cx.restore()});
  if(++n<170)requestAnimationFrame(f);else cx.clearRect(0,0,cf.width,cf.height)})()}

/* ---------- Pointer effects: glow, magnetic, spotlight, 3D tilt ---------- */
addEventListener("pointermove",e=>{const g=$("#glow");g.style.left=e.clientX+"px";g.style.top=e.clientY+"px";mx=e.clientX/innerWidth-.5;my=e.clientY/innerHeight-.5;
 $$(".magnet").forEach(b=>b.style.transform="");const m=e.target.closest(".magnet");
 if(m){const r=m.getBoundingClientRect();m.style.transform=`translate(${(e.clientX-r.left-r.width/2)*.2}px,${(e.clientY-r.top-r.height/2)*.3}px)`}
 const c=e.target.closest(".card");$$(".tilt").forEach(t=>{if(t!==c)t.style.transform=""});
 if(c){const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;c.style.setProperty("--x",x*100+"%");c.style.setProperty("--y",y*100+"%");
  if(c.classList.contains("tilt"))c.style.transform=`rotateY(${(x-.5)*8}deg) rotateX(${(.5-y)*8}deg)`}});
$("#th").onclick=()=>{const r=document.documentElement,d=getComputedStyle(r).getPropertyValue("--bg").trim()==="#05060d";r.dataset.theme=d?"light":"dark";fr=0};
function adj(d){if(running)return;const st=mode==="short"?1:5,lo=mode==="short"?1:5;DUR[mode]=Math.min(60,Math.max(lo,DUR[mode]+d*st));save("or-d",DUR);setMode(mode)}
$("#dm").onclick=()=>adj(-1);$("#dp").onclick=()=>adj(1);
$("#zn").onclick=()=>document.body.classList.toggle("zen");
addEventListener("keydown",e=>{if(e.key==="Escape")document.body.classList.remove("zen")});
setMode("focus");renderTasks();renderStats();
