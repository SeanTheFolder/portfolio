'use strict';
// js/main.js — All runtime logic. Requires theme.js, utils.js, data.js loaded first.

const prefersReduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
/* toggleTheme is defined in js/theme.js */
function go(name){document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));document.querySelectorAll('.nav-links button').forEach(a=>a.removeAttribute('aria-current'));document.querySelectorAll('.mob-nav button').forEach(a=>a.removeAttribute('aria-current'));const page=document.getElementById('page-'+name);page.classList.add('active');page.focus();const nl=document.getElementById('nav-'+name);if(nl)nl.setAttribute('aria-current','page');const ml=document.getElementById('mob-'+name);if(ml)ml.setAttribute('aria-current','page');window.scrollTo({top:0,behavior:'smooth'});if(name==='expertise')setTimeout(initExpertise,80);setTimeout(setupReveal,120);}
function goContact(){go('home');requestAnimationFrame(()=>{requestAnimationFrame(()=>{const el=document.getElementById('contact');if(el)el.scrollIntoView({behavior:'smooth',block:'start'});});});}
/* CANVAS */
const cvs=document.getElementById('hero-canvas'),cx=cvs.getContext('2d');let W,H,pts=[],mouseX=-9999,mouseY=-9999;
function rsz(){W=cvs.width=cvs.offsetWidth;H=cvs.height=cvs.offsetHeight;}
function mkPt(a){return{x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.4*(a?.3:1),vy:(Math.random()-.5)*.4*(a?.3:1),r:a?3.5:Math.random()*1.8+.8};}
function initCvs(){rsz();pts=[];for(let i=0;i<76;i++)pts.push(mkPt(false));for(let i=0;i<4;i++)pts.push(mkPt(true));}
document.addEventListener('mousemove',e=>{mouseX=e.clientX;mouseY=e.clientY;});
function drawCvs(){if(prefersReduced)return;cx.clearRect(0,0,W,H);const dark=document.documentElement.getAttribute('data-theme')==='dark',rgb=dark?'192,50,79':'139,26,47',pO=dark?.65:.5,cM=dark?.28:.2,rect=cvs.getBoundingClientRect(),mx=mouseX-rect.left,my=mouseY-rect.top;
pts.forEach(p=>{const dx=mx-p.x,dy=my-p.y,d=Math.sqrt(dx*dx+dy*dy);if(d<180&&d>1){const f=.05*(1-d/180);p.vx+=dx/d*f;p.vy+=dy/d*f;}const m=p.r>3?0.6:1.2;p.vx=Math.max(-m,Math.min(m,p.vx));p.vy=Math.max(-m,Math.min(m,p.vy));p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>W)p.vx*=-1;if(p.y<0||p.y>H)p.vy*=-1;cx.beginPath();cx.arc(p.x,p.y,p.r,0,Math.PI*2);cx.fillStyle=`rgba(${rgb},${pO})`;cx.fill();});
for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++){const dx=pts[i].x-pts[j].x,dy=pts[i].y-pts[j].y,d=Math.sqrt(dx*dx+dy*dy);if(d<120){cx.beginPath();cx.moveTo(pts[i].x,pts[i].y);cx.lineTo(pts[j].x,pts[j].y);cx.strokeStyle=`rgba(${rgb},${cM*(1-d/120)})`;cx.lineWidth=.7;cx.stroke();}}
requestAnimationFrame(drawCvs);}
window.addEventListener('resize',rsz);initCvs();if(!prefersReduced)drawCvs();
/* CARD */
const hcard=document.getElementById('h-card');
if(hcard){document.addEventListener('mousemove',e=>{const r=hcard.getBoundingClientRect();if(!r.width)return;const dx=Math.max(-10,Math.min(10,(e.clientX-(r.left+r.width/2))/r.width*13)),dy=Math.max(-8,Math.min(8,(e.clientY-(r.top+r.height/2))/r.height*10));hcard.style.transform=`perspective(1000px) rotateY(${dx}deg) rotateX(${-dy}deg)`;});hcard.addEventListener('mouseleave',()=>{hcard.style.transform='perspective(1000px) rotateY(0) rotateX(0)';});}
const tenureEl=document.getElementById('tenure-yrs');if(tenureEl){tenureEl.textContent=(new Date().getFullYear()-2014)+' yrs';}
window.addEventListener('scroll',()=>{const y=window.scrollY,hl=document.getElementById('h-left');if(hl)hl.style.transform=`translateY(${y*.06}px)`;if(hcard)hcard.style.transform=`perspective(1000px) translateY(${y*.035}px)`;});
/* REVEAL */
function setupReveal(){const obs=new IntersectionObserver(en=>{en.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target);}});},{threshold:.08});document.querySelectorAll('.reveal:not(.visible)').forEach(el=>obs.observe(el));}
setupReveal();
/* COUNTERS */
function springEase(t){return 1-Math.pow(1-t,3)*(1-Math.sin(t*Math.PI*.8));}
function runCounters(){document.querySelectorAll('.counter:not([data-done])').forEach(el=>{el.dataset.done=1;const tgt=+el.dataset.t,suffix=el.dataset.suffix||'+',dur=2000;let s=null;const step=ts=>{if(!s)s=ts;const raw=Math.min((ts-s)/dur,1),p=springEase(raw);el.textContent=Math.round(p*tgt)+(raw>=1?suffix:'');if(raw<1)requestAnimationFrame(step);};requestAnimationFrame(step);});}
const cobs=new IntersectionObserver(en=>{en.forEach(e=>{if(e.isIntersecting){runCounters();cobs.disconnect();}});},{threshold:.2});const sc=document.querySelector('.stats-col');if(sc)cobs.observe(sc);
/* IMPACT OBSERVER */
const iobs=new IntersectionObserver(en=>{en.forEach(e=>{if(e.isIntersecting){runCounters();iobs.disconnect();}});},{threshold:.2});const ig=document.querySelector('.impact-sec');if(ig)iobs.observe(ig);
/* RADAR */
let rdrChart=null;
function rdrColors(){const dark=document.documentElement.getAttribute('data-theme')==='dark';return{acc:dark?'rgba(192,50,79,1)':'rgba(139,26,47,1)',fill:dark?'rgba(192,50,79,.18)':'rgba(139,26,47,.12)',grid:dark?'rgba(61,32,40,1)':'rgba(232,208,212,1)',txt:dark?'#c4a0a8':'#6b4550'};}
function buildRLI(){const wrap=document.getElementById('rli-wrap');if(!wrap)return;wrap.innerHTML=rdrLabels.map((l,i)=>`<div class="rli"><div class="rli-dot" aria-hidden="true"></div><div class="rli-text"><div class="rli-name">${l}</div><div class="rli-bg" role="progressbar" aria-valuenow="${rdrScores[i]}" aria-valuemin="0" aria-valuemax="100" aria-label="${l}"><div class="rli-bar" data-w="${rdrScores[i]}"></div></div></div><div class="rli-pct">${rdrScores[i]}%</div></div>`).join('');setTimeout(()=>document.querySelectorAll('.rli-bar').forEach(b=>b.style.width=b.dataset.w+'%'),120);}
function initRadar(){const el=document.getElementById('radarChart');if(!el||rdrChart||window.innerWidth<=479)return;const c=rdrColors();rdrChart=new Chart(el,{type:'radar',data:{labels:rdrLabels,datasets:[{data:rdrScores,backgroundColor:c.fill,borderColor:c.acc,borderWidth:2,pointBackgroundColor:c.acc,pointRadius:4}]},options:{responsive:true,maintainAspectRatio:true,scales:{r:{min:60,max:100,ticks:{display:false},grid:{color:c.grid},angleLines:{color:c.grid},pointLabels:{color:c.txt,font:{size:9.5,weight:'600',family:'DM Sans'}}}},plugins:{legend:{display:false}}}});}
function updateRadarTheme(){if(!rdrChart)return;const c=rdrColors();rdrChart.data.datasets[0].backgroundColor=c.fill;rdrChart.data.datasets[0].borderColor=c.acc;rdrChart.data.datasets[0].pointBackgroundColor=c.acc;rdrChart.options.scales.r.grid.color=c.grid;rdrChart.options.scales.r.angleLines.color=c.grid;rdrChart.options.scales.r.pointLabels.color=c.txt;rdrChart.update();}
/* SKILLS */
function buildSkills(){const g=document.getElementById('skills-grid');if(!g||g.innerHTML.trim())return;g.innerHTML=skillData.map(d=>`<div class="skill-cat reveal"><div class="skill-cat-title">${d.title}</div>${d.skills.map(s=>`<div class="skill-item"><div class="skill-hdr"><span class="skill-name">${s.n}</span><span class="skill-pct">${s.p}%</span></div><div class="skill-bg" role="progressbar" aria-valuenow="${s.p}" aria-valuemin="0" aria-valuemax="100" aria-label="${s.n}"><div class="skill-bar" data-w="${s.p}"></div></div></div>`).join('')}</div>`).join('');setTimeout(()=>document.querySelectorAll('.skill-bar').forEach(b=>b.style.width=b.dataset.w+'%'),200);}
function initExpertise(){buildRLI();buildSkills();setTimeout(initRadar,150);setupReveal();}
/* FILTER */
function filterImpl(cat){document.querySelectorAll('.fbtn').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.cat===cat)));document.querySelectorAll('.impl-card').forEach(c=>{const show=cat==='all'||c.dataset.cat===cat;c.style.display=show?'':'none';if(show){c.classList.remove('visible');setTimeout(()=>c.classList.add('visible'),60);}});}
/* FORM */
function submitForm(){const n=document.getElementById('cf-name'),e=document.getElementById('cf-email'),m=document.getElementById('cf-msg');let ok=true;[n,e,m].forEach(f=>{f.classList.remove('err');const er=f.parentElement.querySelector('.fg-error');if(er)er.classList.remove('show');});if(!n.value.trim()){n.classList.add('err');document.getElementById('err-name').classList.add('show');ok=false;}if(!e.value.trim()||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.value)){e.classList.add('err');document.getElementById('err-email').classList.add('show');ok=false;}if(!m.value.trim()){m.classList.add('err');document.getElementById('err-msg').classList.add('show');ok=false;}if(!ok)return;const form=document.getElementById('contact-form'),suc=document.getElementById('form-ok');form.style.display='none';suc.classList.add('show');setTimeout(()=>{suc.classList.remove('show');form.style.display='block';n.value='';e.value='';m.value='';},4000);}
/* SESSION STORAGE NAV — handles inbound links from projects.html */
document.addEventListener('DOMContentLoaded',()=>{
  const navTarget=sessionStorage.getItem('navTo');
  if(navTarget){sessionStorage.removeItem('navTo');go(navTarget);return;}
  const scrollTarget=sessionStorage.getItem('scrollTo');
  if(scrollTarget){sessionStorage.removeItem('scrollTo');requestAnimationFrame(()=>{const el=document.getElementById(scrollTarget);if(el)el.scrollIntoView({behavior:'smooth',block:'start'});});}
});
