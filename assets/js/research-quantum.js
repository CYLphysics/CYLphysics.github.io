
(() => {
  const root=document.getElementById('research-quantum');
  if(!root)return;
  const canvas=root.querySelector('canvas'), ctx=canvas.getContext('2d');
  const pause=root.querySelector('button'), bg=root.querySelector('input[type=color]'), speed=root.querySelector('input[type=range]'), labels=root.querySelector('[data-action=labels]');
  const theme=root.querySelector('select');
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const state={theme:'black-hole',background:'#25303b',speed:.8,labels:false,playing:!motion.matches};
  let W=736,H=449,scale=1,ox=0,oy=0,cw=4.4,ch=7.2,cols=0,rows=0,cells=[],time=8,last=0,drawn=0,visible=true;
  let light=false,base=[37,48,59];
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const themes={
    original:{background:'#25303b',palette:['#daca9c','#77dcf6','#ff8e7f','#f8d374','#93b9ff','#eaa4e8','#f4f0d5']},
    matrix:{background:'#000000',palette:['#35e76c','#86ffae','#19d958','#b8ffb1','#4aff85','#28ed6b','#d4ffdf']},
    arctic:{background:'#071521',palette:['#8bcce9','#d1f7ff','#84b5fa','#b4eaff','#74aaff','#a5d5fc','#effcff']},
    cyberpunk:{background:'#170b26',palette:['#ea73dc','#5cf4ed','#ff76b4','#ffd08b','#9a8aff','#ff6cd6','#f9e0ff']},
    amber:{background:'#170e07',palette:['#e9a747','#ffd47e','#ff843f','#ffdf9e','#ffb358','#ec9248','#fff0c5']},
    porcelain:{background:'#eee8dc',palette:['#8da8ba','#47b2b5','#df8c82','#c19b5a','#608ec9','#b280a8','#819eaf']},
    'black-hole':{background:'#25303b',palette:['#ca9483','#ffd9c7','#aa6551','#f5bd91','#f7e5df','#e7b7b0','#fff4e9']}
  };
  const paletteKeys=['rail','cyan','red','gold','blue','pink','white'];
  let colors={},labelInk='#a4b8bf';
  function mix(rgb,a=1) { const ink=light?rgb.map(v=>Math.round(v*.43)):rgb;return `rgb(${ink.map((v,i)=>Math.round(base[i]+(v-base[i])*clamp(a,0,1))).join(',')})`; }
  function apply(saved) {
    const s={...(saved?.modelContent || saved || {})};
    if(typeof s.theme==='string' && Object.prototype.hasOwnProperty.call(themes,s.theme)) {
      state.theme=s.theme;
      state.background=themes[state.theme].background;
    }
    state.background=pageBackground();
    if(Number.isFinite(s.speed)) state.speed=clamp(s.speed,.25,2);
    if(typeof s.labels==='boolean')state.labels=s.labels;
    if(typeof s.playing==='boolean')state.playing=s.playing;
    base=state.background.match(/\w\w/g).map(x=>parseInt(x,16));
    light=base[0]*.2126+base[1]*.7152+base[2]*.0722>155;
    colors=Object.fromEntries(paletteKeys.map((key,i)=>[key,themes[state.theme].palette[i].match(/\w\w/g).map(x=>parseInt(x,16))]));
    labelInk=mix(colors.white,.78);
    root.style.setProperty('--helios-bg',state.background);
    root.style.setProperty('--helios-ink',mix(colors.white,.98));
    root.style.setProperty('--helios-muted',labelInk);
    pause.textContent=state.playing?'Pause animation':'Play animation';bg.value=state.background;speed.value=state.speed;labels.checked=state.labels;
    theme.value=state.theme;
    draw();last=0;schedule();
  }
  function save() {
    try{localStorage.setItem('cyl-research-quantum',JSON.stringify({theme:state.theme,speed:state.speed,labels:state.labels,playing:state.playing}));}catch{}
  }
  function pageBackground(){return document.documentElement.dataset.tone==='light'?'#e1dbdb':'#25303b';}
  pause.addEventListener('click',()=>{state.playing=!state.playing;apply(state);save();root.querySelector('.quantum-status').textContent=state.playing?'Animation playing':'Animation paused';});
  bg.addEventListener('input',()=>{state.background=bg.value;apply(state);});bg.addEventListener('change',save);
  theme.addEventListener('change',()=>{apply({theme:theme.value});save();});
  speed.addEventListener('input',()=>{state.speed=Number(speed.value);});speed.addEventListener('change',save);
  labels.addEventListener('change',()=>{state.labels=labels.checked;apply(state);save();});
  window.addEventListener('cyl:themechange',()=>apply(state));
  const cx=205,cy=270,r=147,a=.2;
  const rx=cx+r*Math.cos(a), upper=cy-r*Math.sin(a), lower=cy+r*Math.sin(a);
  const routes=[[[rx,upper],[375,upper],[423,lower],[965,lower]],[[rx,lower],[375,lower],[423,upper],[965,upper]]];
  function distance(x,y,p,q) {const dx=q[0]-p[0],dy=q[1]-p[1],t=clamp(((x-p[0])*dx+(y-p[1])*dy)/(dx*dx+dy*dy),0,1);return Math.hypot(x-p[0]-dx*t,y-p[1]-dy*t);}
  function railDistance(x,y) {
    let d=Math.abs(Math.atan2(y-cy,x-cx))>=a?Math.abs(Math.hypot(x-cx,y-cy)-r):1e3;
    for(const route of routes) for(let i=1;i<route.length;i++)d=Math.min(d,distance(x,y,route[i-1],route[i]));
    return d;
  }
  function hash(x,y){ const z=Math.sin(x*127.1+y*311.7)*43758.5453;return z-Math.floor(z); }
  const tracks=routes.map((route,side)=>{
    const ps=[];
    for(let i=0;i<=220;i++){const angle=side===0?a+(Math.PI*2-2*a)*i/220:-a-(Math.PI*2-2*a)*i/220;ps.push([cx+r*Math.cos(angle),cy+r*Math.sin(angle)]);}
    ps.push(...route.slice(1));
    // Return through the crossing into the other port of the storage ring.
    ps.push(route[2],[399,270],[375,side===0?lower:upper],[rx,side===0?lower:upper]);
    const lengths=[0];for(let i=1;i<ps.length;i++)lengths.push(lengths[i-1]+Math.hypot(ps[i][0]-ps[i-1][0],ps[i][1]-ps[i-1][1]));
    return {ps,lengths,total:lengths[lengths.length-1]};
  });
  function at(track,d) {d=((d%track.total)+track.total)%track.total;let lo=1,hi=track.lengths.length-1;while(lo<hi){const mid=(lo+hi)>>1;if(track.lengths[mid]<d)lo=mid+1;else hi=mid;}const k=lo,t=(d-track.lengths[k-1])/(track.lengths[k]-track.lengths[k-1]);const p=track.ps[k-1],q=track.ps[k];return [p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t];}
  function resize() {
    const rect=canvas.getBoundingClientRect();W=Math.min(1040,rect.width);H=rect.height*W/rect.width;
    if(W<1||H<1)return;
    const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);ctx.setTransform(dpr*rect.width/W,0,0,dpr*rect.height/H,0,0);
    scale=W/1040;ox=15*scale;oy=H/2-270*scale;
    cw=W<480?3.3:4.5;ch=cw*1.65;cols=Math.ceil(W/cw);rows=Math.ceil(H/ch);cells=[];
    for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
      const x=(col*cw-ox)/scale,y=(row*ch-oy)/scale,d=railDistance(x,y),rnd=hash(col,row);
      if(d<19){const edge=Math.exp(-Math.pow((d-10)/3.8,2));const center=Math.exp(-d*d/14);let power=.13+edge*.65+center*.21;const tooth=(x>410?Math.floor(x/10):Math.floor(Math.atan2(y-cy,x-cx)*r/10))%2===0;
        if(tooth&&d>4&&d<13)power+=.15;
        const glyph=d>15?'.':d>12?':':d>7?(tooth?'#':'+'):d>3?'=':'.';
        cells.push({col,row,glyph,power,color:'rail',x,y});
      }else if(d<31&&rnd>.45)cells.push({col,row,glyph:'.',power:.07*(1-(d-19)/12),color:'rail',x,y});
      else if(rnd>.996&&row>9&&row<rows-8)cells.push({col,row,glyph:rnd>.9992?'+':'.',power:.13+rnd%0.15,color:'cyan',x,y});
    }
    draw();
  }
  function glyph(x,y,c,color,power=1,glow=false) {
    const px=Math.round((ox+x*scale)/cw)*cw,py=Math.round((oy+y*scale)/ch)*ch;
    ctx.fillStyle=mix(colors[color],power);
    if(glow){ctx.shadowColor=mix(colors[color],.8);ctx.shadowBlur=light?0:7;}
    ctx.fillText(c,px,py);ctx.shadowBlur=0;
  }
  function draw() {
    ctx.fillStyle=state.background;ctx.fillRect(0,0,W,H);ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`${ch*.94}px ui-monospace,Menlo,Consolas,monospace`;
    for(const c of cells){ctx.fillStyle=mix(colors[c.color],c.power);ctx.fillText(c.glyph,c.col*cw,c.row*ch);}
    // Gate fields and crossing pulses are themselves made entirely of ASCII.
    for(const gx of [592,688])for(const gy of [upper,lower]){
      const pulse=.5+.5*Math.sin(time*2.3+gx*.04+gy*.02);
      for(let n=-3;n<=3;n++){glyph(gx-13,gy+n*9,n===0?'[':':','blue',.25+pulse*.3);glyph(gx+13,gy+n*9,n===0?']':':','blue',.25+pulse*.3);}
      if(pulse>.65){glyph(gx,gy-20,'+','blue',pulse*.8,true);glyph(gx,gy+20,'+','blue',pulse*.8,true);}
    }
    for(let side=0;side<2;side++){
      const track=tracks[side];
      for(let i=0;i<21;i++){
        const d=i*track.total/21+time*30*(side? .86:1),p=at(track,d);
        const color=p[0]<350?'cyan':p[0]<500?(side?'red':'gold'):p[0]<748?'blue':'pink';
        for(let j=3;j>0;j--){const tail=at(track,d-j*6);glyph(tail[0],tail[1],'.',color,.18+(3-j)*.12);}
        glyph(p[0],p[1],'o',color,.98,true);
      }
      for(let i=0;i<10;i++){const x=805+i*14,y=side?upper:lower;glyph(x,y,i%3===0?'@':'o','pink',.55+.3*Math.sin(time*1.4+i*.9+side),true);}
    }
    const beat=.5+.5*Math.sin(time*3);glyph(399,270,'+','white',.5+beat*.5,true);
    // A quiet suggestion of circulation around the storage ring.
    for(let k=0;k<5;k++){const theta=time*.11+k*Math.PI*2/5;glyph(cx+(r+28)*Math.cos(theta),cy+(r+28)*Math.sin(theta),'.','cyan',.22);}
    if(state.labels){
      ctx.font=`${W<480?11:12}px ui-monospace,Menlo,Consolas,monospace`;ctx.fillStyle=labelInk;
      const text=(s,x,y)=>ctx.fillText(s,ox+x*scale,oy+y*scale);
      text('RING',cx,cy-9);text('STORAGE',cx,cy+13);
      if(W>=560){text('CACHE',472,upper-44);text('QUANTUM LOGIC',642,upper-44);text('LEG STORAGE',865,upper-44);text('JUNCTION',399,lower+58);text('GATE',642,lower+58);}
      else {text('LOGIC',633,upper-54);text('STORAGE',869,upper-54);}
    }
  }
  let raf=0;
  function schedule(){if(!raf&&visible&&!document.hidden&&state.playing)raf=requestAnimationFrame(frame);}
  function frame(now){
    raf=0;if(!visible||document.hidden||!state.playing){last=0;return;}
    const dt=last?Math.min((now-last)/1000,.1):0;last=now;time+=dt*state.speed;
    if(now-drawn>=50){drawn=now;draw();}schedule();
  }
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;last=0;schedule();}).observe(canvas);
  document.addEventListener('visibilitychange',()=>{last=0;schedule();});
  motion.addEventListener('change',e=>{if(e.matches){state.playing=false;apply(state);}});
  let restored;try{restored=JSON.parse(localStorage.getItem('cyl-research-quantum')||'null');}catch{}
  if(motion.matches)restored={...(restored||{}),playing:false};
  apply(restored);resize();schedule();
})();
