'use strict';

const canvas = document.getElementById('hrCanvas');
const ctx = canvas.getContext('2d');
const viewport = document.getElementById('viewport');
const sidePanel = document.getElementById('sidePanel');
const panelBackdrop = document.getElementById('panelBackdrop');
const cursorHud = document.getElementById('cursorHud');
const infoCard = document.getElementById('infoCard');
const loadingOverlay = document.getElementById('loadingOverlay');

const ui = {
  menu: document.getElementById('menuButton'),
  closePanel: document.getElementById('closePanelButton'),
  closeCard: document.getElementById('closeCardButton'),
  fit: document.getElementById('fitButton'),
  reset: document.getElementById('resetButton'),
  zoomIn: document.getElementById('zoomInButton'),
  zoomOut: document.getElementById('zoomOutButton'),
  zoomValue: document.getElementById('zoomValue'),
  theme: document.getElementById('themeButton'),
  density: document.getElementById('densityButton'),
  searchInput: document.getElementById('searchInput'),
  search: document.getElementById('searchButton'),
  csv: document.getElementById('csvInput'),
  status: document.getElementById('dataStatus'),
  toggles: {
    stars: document.getElementById('starsToggle'),
    synthetic: document.getElementById('syntheticToggle'),
    regions: document.getElementById('regionsToggle'),
    labels: document.getElementById('labelsToggle'),
    grid: document.getElementById('gridToggle'),
    animation: document.getElementById('animationToggle')
  },
  cardKicker: document.getElementById('cardKicker'),
  cardTitle: document.getElementById('cardTitle'),
  cardSubtitle: document.getElementById('cardSubtitle'),
  cardMetrics: document.getElementById('cardMetrics'),
  cardDescription: document.getElementById('cardDescription'),
  cardNotes: document.getElementById('cardNotes')
};

const chart = {
  width: 1900,
  height: 1280,
  minTemp: 2500,
  maxTemp: 40000,
  minLum: 1e-4,
  maxLum: 1e6,
  plot: { x: 170, y: 90, w: 1638, h: 1040 }
};

const state = {
  stars: [],
  synthetic: [],
  scale: 1,
  fitScale: 1,
  tx: 0,
  ty: 0,
  dragging: false,
  dragStart: null,
  selected: null,
  hovered: null,
  density: false,
  frame: 0,
  layers: { stars: true, synthetic: true, regions: true, labels: true, grid: true, animation: true }
};

const spectralBands = [
  ['O', 30000, 40000, '#8fb8ff'], ['B', 10000, 30000, '#a9cfff'], ['A', 7500, 10000, '#d8eaff'],
  ['F', 6000, 7500, '#fff4d4'], ['G', 5200, 6000, '#ffe89c'], ['K', 3700, 5200, '#ffbd73'], ['M', 2500, 3700, '#ff7c58']
];

const regions = [
  zone('main-sequence', 'Secuencia principal', 'Fusión estable de hidrógeno en el núcleo', '#fff0a3', [[33000,220000],[22000,42000],[11000,420],[7500,24],[5800,1.1],[4400,.08],[3000,.00045],[2650,.00012],[3300,.004],[5000,.23],[7000,5.5],[12000,210],[26000,65000],[38000,560000]], 'La secuencia principal es la diagonal dominante del diagrama HR. En ella las estrellas generan energía mediante fusión de hidrógeno. Las estrellas calientes y masivas aparecen arriba a la izquierda; las enanas rojas, frías y poco luminosas, aparecen abajo a la derecha.', [['Temperatura','≈ 2.700–40.000 K'],['Luminosidad','≈ 10⁻⁴–10⁶ L☉'],['Ejemplos','Sol, Vega, Sirio A'],['Estado','Etapa más larga']]),
  zone('red-giants', 'Gigantes rojas y naranjas', 'Estrellas evolucionadas de gran radio', '#ff9f5a', [[5600,18],[5000,35],[4300,95],[3600,650],[3100,2400],[3300,7600],[4200,3200],[5200,520],[6000,120]], 'Las gigantes han abandonado la secuencia principal. Su superficie puede ser fría, pero su radio crece tanto que la luminosidad aumenta de manera notable.', [['Temperatura','≈ 3.000–5.500 K'],['Luminosidad','≈ 20–10.000 L☉'],['Ejemplos','Arcturus, Aldebarán'],['Clave física','Radio muy grande']]),
  zone('supergiants', 'Supergigantes', 'Extremo superior de luminosidad estelar', '#ff6b6b', [[36000,900000],[25000,460000],[13000,190000],[8000,160000],[4800,230000],[3200,90000],[3600,24000],[6200,38000],[16000,74000],[33000,280000]], 'Las supergigantes ocupan la parte alta del diagrama. Pueden ser azules, blancas, amarillas o rojas, pero comparten una luminosidad intrínseca enorme.', [['Temperatura','≈ 3.000–35.000 K'],['Luminosidad','≈ 10⁴–10⁶ L☉'],['Ejemplos','Rigel, Deneb, Betelgeuse'],['Evolución','Alta masa']]),
  zone('white-dwarfs', 'Enanas blancas', 'Remanentes estelares compactos', '#a8d8ff', [[38000,.25],[25000,.08],[15000,.012],[9000,.0015],[6200,.00025],[5200,.00012],[7600,.0005],[14000,.003],[30000,.06]], 'Las enanas blancas son muy calientes al nacer, pero tienen radios planetarios. Por eso aparecen abajo a la izquierda: temperatura alta, luminosidad baja.', [['Temperatura','≈ 5.000–40.000 K'],['Luminosidad','≈ 10⁻⁴–1 L☉'],['Ejemplos','Sirio B, Procyon B'],['Naturaleza','Remanente compacto']]),
  zone('instability-strip', 'Franja de inestabilidad', 'Zona asociada a variables pulsantes', '#c7a1ff', [[8200,.45],[7200,1.2],[6500,20],[5900,900],[5200,18000],[4600,52000],[5100,80000],[6100,3500],[7000,80],[9000,2.2]], 'La franja de inestabilidad agrupa regiones donde ciertas estrellas pueden pulsar. Es importante para variables como Cefeidas y RR Lyrae.', [['Temperatura','≈ 4.600–9.000 K'],['Interés','Variables pulsantes'],['Ejemplos','Cefeidas, RR Lyrae'],['Uso','Distancias cósmicas']])
];

init();

async function init() {
  resize();
  makeSynthetic();
  bind();
  await loadStars();
  fit();
  loadingOverlay.classList.add('hidden');
  requestAnimationFrame(loop);
}

function zone(id, name, subtitle, color, points, description, metrics) { return { id, name, subtitle, color, points, description, metrics }; }

async function loadStars() {
  try {
    const res = await fetch('data/stars.sample.json', { cache: 'no-store' });
    const data = await res.json();
    state.stars = data.map(normalizeStar).filter(Boolean);
    ui.status.textContent = `Muestra cargada: ${state.stars.length} estrellas pedagógicas.`;
  } catch (error) {
    state.stars = [{ name:'Sol', designation:'G2V', class:'main-sequence', teff:5772, luminosity:1, radius:1, color:'#fff3b0', source:'Reserva interna', notes:'Referencia solar.' }].map(normalizeStar);
    ui.status.textContent = 'No se pudo cargar el JSON; usando muestra interna mínima.';
  }
  draw();
}

function bind() {
  addEventListener('resize', () => { resize(); fit(false); });
  ui.menu.onclick = openPanel; ui.closePanel.onclick = closePanel; panelBackdrop.onclick = closePanel;
  ui.closeCard.onclick = () => hideCard(); ui.fit.onclick = () => fit(); ui.reset.onclick = () => { hideCard(); state.selected = null; fit(); };
  ui.zoomIn.onclick = () => zoomAt(canvas.clientWidth/2, canvas.clientHeight/2, 1.18);
  ui.zoomOut.onclick = () => zoomAt(canvas.clientWidth/2, canvas.clientHeight/2, 1/1.18);
  ui.theme.onclick = () => { document.body.classList.toggle('dark'); ui.theme.textContent = document.body.classList.contains('dark') ? 'Modo claro' : 'Modo oscuro'; draw(); };
  ui.density.onclick = () => { state.density = !state.density; ui.density.textContent = state.density ? 'Puntos' : 'Densidad'; draw(); };
  Object.entries(ui.toggles).forEach(([key, input]) => input.onchange = () => { state.layers[key] = input.checked; draw(); });
  ui.search.onclick = runSearch; ui.searchInput.onkeydown = e => { if (e.key === 'Enter') runSearch(); };
  ui.csv.onchange = importCsv;
  viewport.onpointerdown = e => { state.dragging = true; state.dragStart = { x:e.clientX, y:e.clientY, tx:state.tx, ty:state.ty }; viewport.classList.add('dragging'); };
  addEventListener('pointermove', e => { if (!state.dragging) return; state.tx = state.dragStart.tx + e.clientX - state.dragStart.x; state.ty = state.dragStart.ty + e.clientY - state.dragStart.y; draw(); });
  addEventListener('pointerup', () => { state.dragging = false; state.dragStart = null; viewport.classList.remove('dragging'); });
  viewport.onwheel = e => { e.preventDefault(); zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * .0012)); };
  viewport.onclick = clickCanvas; viewport.onmousemove = hoverCanvas; viewport.onmouseleave = () => { state.hovered = null; cursorHud.classList.remove('visible'); draw(); };
}

function openPanel() { sidePanel.classList.add('open'); panelBackdrop.classList.add('open'); sidePanel.setAttribute('aria-hidden', 'false'); }
function closePanel() { sidePanel.classList.remove('open'); panelBackdrop.classList.remove('open'); sidePanel.setAttribute('aria-hidden', 'true'); }

function resize() {
  const dpr = Math.min(devicePixelRatio || 1, 2.5), r = canvas.getBoundingClientRect();
  canvas.width = Math.round(r.width*dpr); canvas.height = Math.round(r.height*dpr); ctx.setTransform(dpr,0,0,dpr,0,0);
}

function fit() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  state.fitScale = Math.max(.28, Math.min((w-80)/chart.width, (h-130)/chart.height));
  state.scale = state.fitScale; state.tx = (w-chart.width*state.scale)/2; state.ty = (h-chart.height*state.scale)/2 + 24;
  updateZoom(); draw();
}

function zoomAt(cx, cy, factor) {
  const rect = canvas.getBoundingClientRect(), x = cx-rect.left, y = cy-rect.top;
  const wx = (x-state.tx)/state.scale, wy = (y-state.ty)/state.scale;
  state.scale = clamp(state.scale*factor, state.fitScale*.55, state.fitScale*8);
  state.tx = x - wx*state.scale; state.ty = y - wy*state.scale; updateZoom(); draw();
}
function updateZoom() { ui.zoomValue.textContent = `${Math.round(state.scale/state.fitScale*100)}%`; }

function loop() { if (state.layers.animation) { state.frame++; draw(); } requestAnimationFrame(loop); }

function draw() {
  const w = canvas.clientWidth, h = canvas.clientHeight; ctx.clearRect(0,0,w,h);
  ctx.save(); ctx.translate(state.tx, state.ty); ctx.scale(state.scale, state.scale);
  panel(); bands(); if (state.layers.grid) grid(); if (state.layers.regions) drawRegions(); if (state.layers.synthetic) state.density ? density() : synthetic(); if (state.layers.stars) sampleStars(); if (state.layers.labels) labels(); ctx.restore();
}

function panel() {
  rounded(38,38,chart.width-76,chart.height-76,34); ctx.fillStyle = css('--panel-solid'); ctx.fill(); ctx.strokeStyle = css('--line'); ctx.lineWidth = 1/state.scale; ctx.stroke();
  const p = chart.plot, g = ctx.createLinearGradient(p.x,p.y,p.x+p.w,p.y); g.addColorStop(0,'rgba(137,176,255,.20)'); g.addColorStop(.5,'rgba(255,235,150,.14)'); g.addColorStop(1,'rgba(255,112,78,.20)'); rounded(p.x,p.y,p.w,p.h,24); ctx.fillStyle = g; ctx.fill();
}
function bands() { const p = chart.plot; for (const [lab,min,max,col] of spectralBands) { const x1=tempX(max), x2=tempX(min); ctx.fillStyle = alpha(col,.10); ctx.fillRect(x1,p.y,x2-x1,p.h); ctx.fillStyle=alpha(css('--ink'),.55); ctx.font='900 28px system-ui'; ctx.textAlign='center'; ctx.fillText(lab,(x1+x2)/2,p.y+p.h+48); } }
function grid() { const p = chart.plot; ctx.strokeStyle=alpha(css('--ink'),.12); ctx.fillStyle=alpha(css('--ink'),.66); ctx.lineWidth=1/state.scale; ctx.font='800 18px system-ui'; ctx.textBaseline='middle'; [40000,30000,20000,10000,7500,6000,5200,3700,3000,2500].forEach(t=>{const x=tempX(t); line(x,p.y,x,p.y+p.h); ctx.textAlign='center'; ctx.fillText(`${Math.round(t/1000)}k`,x,p.y+p.h+24);}); [1e6,1e5,1e4,1e3,100,10,1,.1,.01,.001,.0001].forEach(l=>{const y=lumY(l); line(p.x,y,p.x+p.w,y); ctx.textAlign='right'; ctx.fillText(l>=1000?`10^${Math.round(Math.log10(l))}`:String(l).replace('0.','.'),p.x-18,y);}); ctx.fillStyle=css('--ink'); ctx.font='900 24px system-ui'; ctx.textAlign='center'; ctx.fillText('Temperatura efectiva superficial, K  ⟵ más fría',p.x+p.w/2,chart.height-62); ctx.save(); ctx.translate(78,p.y+p.h/2); ctx.rotate(-Math.PI/2); ctx.fillText('Luminosidad relativa al Sol, L☉',0,0); ctx.restore(); }
function drawRegions() { regions.forEach(r=>{ const pts=r.points.map(([t,l])=>[tempX(t),lumY(l)]); ctx.beginPath(); pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y)); ctx.closePath(); const hot=state.hovered===r||state.selected===r; ctx.fillStyle=alpha(r.color,hot?.25:.14); ctx.strokeStyle=alpha(r.color,hot?.9:.45); ctx.lineWidth=(hot?3:2)/state.scale; ctx.fill(); ctx.stroke(); }); }
function synthetic() { state.synthetic.forEach(s=>dot(tempX(s.teff),lumY(s.luminosity),s.r/state.scale,alpha(s.color,s.a*(.75+.25*Math.sin(state.frame*.025+s.seed))))); }
function density() { ctx.globalCompositeOperation=document.body.classList.contains('dark')?'screen':'multiply'; state.synthetic.forEach(s=>{const x=tempX(s.teff),y=lumY(s.luminosity),r=16/state.scale,g=ctx.createRadialGradient(x,y,0,x,y,r); g.addColorStop(0,alpha(s.color,.05)); g.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();}); ctx.globalCompositeOperation='source-over'; }
function sampleStars() { state.stars.forEach(s=>drawStar(s)); }
function drawStar(s) { const x=tempX(s.teff), y=lumY(s.luminosity), hot=state.hovered===s||state.selected===s, r=(hot?8:s.marker)/state.scale; const g=ctx.createRadialGradient(x,y,0,x,y,r*7); g.addColorStop(0,alpha(s.color,hot?.48:.25)); g.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r*7,0,Math.PI*2); ctx.fill(); dot(x,y,r,s.color); ctx.strokeStyle=document.body.classList.contains('dark')?'rgba(255,255,255,.85)':'rgba(20,20,20,.65)'; ctx.lineWidth=(hot?2.5:1.3)/state.scale; ctx.stroke(); if(hot||state.scale>state.fitScale*1.9){ctx.font=`900 ${Math.max(13,16/state.scale)}px system-ui`; ctx.fillStyle=css('--ink'); ctx.strokeStyle=css('--panel-solid'); ctx.lineWidth=4/state.scale; ctx.textAlign='left'; ctx.strokeText(s.name,x+r+8/state.scale,y); ctx.fillText(s.name,x+r+8/state.scale,y);} }
function labels() { [['Secuencia principal',7600,8,-22,'#b99600'],['Gigantes',4300,900,-8,'#ff9f5a'],['Supergigantes',8600,140000,0,'#ff6b6b'],['Enanas blancas',18000,.006,-15,'#73bfff'],['Franja de inestabilidad',6200,1200,-71,'#a985ff']].forEach(([txt,t,l,a,c])=>{ctx.save(); ctx.translate(tempX(t),lumY(l)); ctx.rotate(a*Math.PI/180); ctx.font='900 27px system-ui'; ctx.textAlign='center'; ctx.strokeStyle=css('--panel-solid'); ctx.lineWidth=8/state.scale; ctx.fillStyle=c; ctx.globalAlpha=.75; ctx.strokeText(txt,0,0); ctx.fillText(txt,0,0); ctx.restore();}); }

function clickCanvas(e){ if(state.dragStart && Math.abs(e.clientX-state.dragStart.x)+Math.abs(e.clientY-state.dragStart.y)>5) return; const p=screen(e); const s=nearestStar(p,15/state.scale); if(s){state.selected=s; cardStar(s); draw(); return;} const r=regionAt(p); if(r){state.selected=r; cardRegion(r); draw();} }
function hoverCanvas(e){ const p=screen(e), s=nearestStar(p,13/state.scale), r=s?null:regionAt(p); state.hovered=s||r; if(state.hovered){cursorHud.textContent=s?`${s.name} · ${fmtTemp(s.teff)} · ${fmtLum(s.luminosity)}`:r.name; cursorHud.classList.add('visible');} else cursorHud.classList.remove('visible'); draw(); }
function screen(e){ const r=canvas.getBoundingClientRect(); return {x:(e.clientX-r.left-state.tx)/state.scale,y:(e.clientY-r.top-state.ty)/state.scale}; }
function nearestStar(p,th){ let best=null,bd=1e9; state.stars.forEach(s=>{const d=Math.hypot(p.x-tempX(s.teff),p.y-lumY(s.luminosity)); if(d<th&&d<bd){best=s;bd=d;}}); return best; }
function regionAt(p){ for(let i=regions.length-1;i>=0;i--){const poly=regions[i].points.map(([t,l])=>[tempX(t),lumY(l)]); if(inPoly(p,poly)) return regions[i];} return null; }
function inPoly(p,poly){let inside=false; for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [xi,yi]=poly[i], [xj,yj]=poly[j]; if(((yi>p.y)!==(yj>p.y)) && p.x < (xj-xi)*(p.y-yi)/((yj-yi)||1e-9)+xi) inside=!inside;} return inside; }

function cardRegion(r){ card('Zona seleccionada',r.name,r.subtitle,r.metrics,r.description,[`La región está dibujada de forma pedagógica; no es una frontera observacional exacta.`, `En próximas versiones se podrá sustituir por densidades de Gaia DR3.`]); }
function cardStar(s){ card(labelClass(s.class),s.name,`${s.designation||'Tipo espectral no indicado'} · ${fmtTemp(s.teff)} · ${fmtLum(s.luminosity)}`,[['Temperatura',fmtTemp(s.teff)],['Luminosidad',fmtLum(s.luminosity)],['Radio',s.radius?`${num(s.radius)} R☉`:'—'],['Clase',labelClass(s.class)]],s.notes||'Estrella de la muestra actual.',[`Fuente: ${s.source||'Dataset local'}.`,`Coordenadas HR: temperatura logarítmica invertida y luminosidad logarítmica.`]); }
function card(k,t,sub,metrics,desc,notes){ ui.cardKicker.textContent=k; ui.cardTitle.textContent=t; ui.cardSubtitle.textContent=sub; ui.cardMetrics.innerHTML=metrics.map(([a,b])=>`<div class="metric"><strong>${esc(a)}</strong><span>${esc(b)}</span></div>`).join(''); ui.cardDescription.textContent=desc; ui.cardNotes.innerHTML=notes.map(n=>`<div class="note-pill">${esc(n)}</div>`).join(''); infoCard.classList.add('open'); }
function hideCard(){ infoCard.classList.remove('open'); }
function runSearch(){ const q=norm(ui.searchInput.value); if(!q) return; const s=state.stars.find(x=>norm(`${x.name} ${x.designation} ${x.class} ${labelClass(x.class)}`).includes(q)); if(s){focus(s.teff,s.luminosity); state.selected=s; cardStar(s); closePanel(); return;} const r=regions.find(x=>norm(`${x.name} ${x.subtitle}`).includes(q)); if(r){const c=center(r); focus(c.t,c.l,1.5); state.selected=r; cardRegion(r); closePanel();} else ui.status.textContent=`No se encontró “${ui.searchInput.value}”. Prueba con Sol, Vega, gigante o enana blanca.`; }
function focus(t,l,z=2.3){ state.scale=clamp(state.fitScale*z,state.fitScale,state.fitScale*8); state.tx=canvas.clientWidth/2-tempX(t)*state.scale; state.ty=canvas.clientHeight/2-lumY(l)*state.scale; updateZoom(); draw(); }
function center(r){ const n=r.points.length, a=r.points.reduce((p,[t,l])=>[p[0]+Math.log10(t),p[1]+Math.log10(l)],[0,0]); return {t:10**(a[0]/n),l:10**(a[1]/n)}; }

async function importCsv(e){ const f=e.target.files?.[0]; if(!f) return; try{const rows=parseCsv(await f.text()), stars=rows.map(x=>normalizeStar(x,true)).filter(Boolean); if(!stars.length) throw Error('faltan temperatura y luminosidad.'); state.stars=stars; ui.status.textContent=`CSV importado: ${stars.length} estrellas.`; draw();}catch(err){ui.status.textContent=`Error al importar CSV: ${err.message}`;} }
function parseCsv(text){ const lines=text.replace(/^\uFEFF/,'').split(/\r?\n/).filter(Boolean), sep=(lines[0].match(/;/g)||[]).length>(lines[0].match(/,/g)||[]).length?';':','; const head=split(lines[0],sep).map(h=>norm(h).replace(/[^a-z0-9]+/g,'_')); return lines.slice(1).map(l=>Object.fromEntries(split(l,sep).map((v,i)=>[head[i],v]))); }
function split(line,sep){ const out=[]; let cur='',q=false; for(let i=0;i<line.length;i++){const ch=line[i]; if(ch==='"'){q=!q;} else if(ch===sep&&!q){out.push(cur.trim());cur='';} else cur+=ch;} out.push(cur.trim()); return out; }
function normalizeStar(raw, imported=false){ const g=(...ks)=>ks.map(k=>raw[k]).find(v=>v!==undefined&&String(v).trim()!=='')||''; const teff=+String(g('teff','temperature','temperature_k','effective_temperature','st_teff','teff_gspphot')).replace(',','.'); const lum=+String(g('luminosity','lum','lum_val','stellar_luminosity','st_lum')).replace(',','.'); if(!teff||!lum) return null; const name=String(g('name','star_name','source_id','designation')||'Estrella sin nombre'); return {name, designation:String(g('designation','spectral_type','spectral','sp_type')||''), class: imported?classify(teff,lum):String(g('class','type')||classify(teff,lum)), teff, luminosity:lum, radius:opt(g('radius','st_rad','radius_solar')), color:String(g('color')||colorTemp(teff)), source:String(g('source')||(imported?'CSV importado':'Muestra pedagógica inicial')), notes:String(g('notes','description')||''), marker:clamp(4.2+Math.log10(lum+.0002)*.75,3.4,8.5)}; }
function classify(t,l){ if(l<.3&&t>7000)return'white-dwarf'; if(l>1e4)return'supergiant'; if(l>20&&t<6000)return'giant'; return'main-sequence'; }
function labelClass(c){ return ({'main-sequence':'Secuencia principal',giant:'Gigante',supergiant:'Supergigante','white-dwarf':'Enana blanca'}[c]||c||'Estrella'); }
function makeSynthetic(){ const rng=mulberry(73731), add=(t,l)=>state.synthetic.push({teff:t,luminosity:l,r:1.2+rng()*1.9,a:.12+rng()*.12,color:colorTemp(t),seed:rng()*9}); for(let i=0;i<1450;i++){const u=rng(),lt=lerp(Math.log10(2850),Math.log10(36000),u),ll=7.2*(lt-Math.log10(5772))+randn(rng)*.22; add(10**lt,10**ll);} for(let i=0;i<310;i++)add(10**lerp(Math.log10(3100),Math.log10(5400),rng()),10**(lerp(Math.log10(25),Math.log10(6000),rng())+randn(rng)*.18)); for(let i=0;i<210;i++)add(10**lerp(Math.log10(6200),Math.log10(38000),rng()),10**(lerp(Math.log10(.00018),Math.log10(.16),rng())+randn(rng)*.12)); }

function tempX(t){ const p=chart.plot, a=Math.log10(chart.minTemp), b=Math.log10(chart.maxTemp), v=(Math.log10(clamp(t,chart.minTemp,chart.maxTemp))-a)/(b-a); return p.x+(1-v)*p.w; }
function lumY(l){ const p=chart.plot, a=Math.log10(chart.minLum), b=Math.log10(chart.maxLum), v=(Math.log10(clamp(l,chart.minLum,chart.maxLum))-a)/(b-a); return p.y+(1-v)*p.h; }
function dot(x,y,r,c){ctx.fillStyle=c; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();}
function line(x1,y1,x2,y2){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
function rounded(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
function css(n){return getComputedStyle(document.body).getPropertyValue(n).trim();}
function alpha(hex,a){ const m=String(hex).match(/\d+/g); const c=hex[0]==='#'?[parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)]:m?.slice(0,3)||[255,255,255]; return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }
function colorTemp(t){ const stops=[[2500,'#ff6b4a'],[3700,'#ff9b5f'],[5200,'#ffd08a'],[6000,'#fff1a8'],[7500,'#f5f8ff'],[10000,'#d8e9ff'],[40000,'#82adff']]; for(let i=1;i<stops.length;i++) if(t<=stops[i][0]) return mix(stops[i-1][1],stops[i][1],(t-stops[i-1][0])/(stops[i][0]-stops[i-1][0])); return stops.at(-1)[1]; }
function mix(a,b,u){ const h=x=>[parseInt(x.slice(1,3),16),parseInt(x.slice(3,5),16),parseInt(x.slice(5,7),16)], A=h(a),B=h(b); return '#'+A.map((v,i)=>Math.round(lerp(v,B[i],u)).toString(16).padStart(2,'0')).join('');}
function fmtTemp(t){return `${Math.round(t).toLocaleString('es-ES')} K`;} function fmtLum(l){return l>=1?`${num(l)} L☉`:`${l.toExponential(l<.01?2:3).replace('.',',')} L☉`;}
function num(n){return Number(n).toLocaleString('es-ES',{maximumFractionDigits: n<1?4:n<10?2:n<100?1:0});} function opt(v){const n=+String(v).replace(',','.'); return Number.isFinite(n)&&v!==''?n:null;}
function norm(s){return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');} function esc(s){return String(s).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));} function lerp(a,b,u){return a+(b-a)*u;} function mulberry(s){return()=>{let t=s+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};} function randn(r){let u=0,v=0;while(!u)u=r();while(!v)v=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}
