
(() => {
'use strict';
const root=document.getElementById('orbital-gardens-preview');
const canvas=root.querySelector('canvas'),display=canvas.getContext('2d',{alpha:false});
const button=root.querySelector('[data-action="play"]'),status=root.querySelector('[role=status]');
const lightingButtons=[...root.querySelectorAll('[data-lighting]')];
const starSelect=root.querySelector('[data-stars]'),starSlider=root.querySelector('[data-star-speed]'),starValue=root.querySelector('[data-star-speed-value]');
let starMode='drift',starSpeed=3,starTravel=0,fps=20,clicks=true,outerBackground='#050b16';
const W=800,H=460,TAU=Math.PI*2;
// A deliberately limited art palette; interface controls inherit the surrounding theme.
const C={void:'#050b16',deep:'#091322',hull:'#111e30',panel:'#182a42',edge:'#304963',steel:'#527185',rim:'#7fa5b7',ice:'#c6e3e9',white:'#f7edd5',gold:'#ffd389',amber:'#e6a061',rose:'#e79496',red:'#ac596c',cyan:'#78d4e3',blue:'#488ba8',water:'#286e8c',navy:'#21364f',purple:'#8e85ae'};
let lighting='sunset',inPark=false,emissive=false;
const colorCache={day:new Map(),sunset:new Map(),night:new Map()};
function shade(hex){
 if(!inPark)return hex;
 const cache=colorCache[lighting],key=hex+(emissive?'!':'');if(cache.has(key))return cache.get(key);
 const r=parseInt(hex.slice(1,3),16),gg=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
 const lamp=emissive||hex===C.gold||hex==='#ffe6b1'||hex==='#ffe0ad';let rgb;
 if(lighting==='day')rgb=lamp?[r*.97,gg*.94,b*.91]:[r*.87,gg*.87,b*.88];
 else if(lighting==='sunset')rgb=lamp?[r*.98,gg*.83,b*.73]:[r*.61+gg*.16+12,gg*.47+r*.06+9,b*.48+r*.12+17];
 else rgb=lamp?[r*.93,gg*.76,b*.66]:[r*.17+b*.06+4,gg*.21+r*.025+6,b*.30+r*.04+12];
 const value='#'+rgb.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');cache.set(key,value);return value;
}
let wheelDirection=1,wheelPhase=0,coasterPhase=.18,carouselPhase=0;
let coasterBoostUntil=0,carouselBoostUntil=0,interactions=0,beacons=[],shuttles=[];
let seed=982451653;
function rnd(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
const scene=document.createElement('canvas');scene.width=W;scene.height=H;
let g=scene.getContext('2d',{alpha:false});g.imageSmoothingEnabled=false;
function rect(x,y,w,h,c,a=1){if(w<=0||h<=0)return;g.globalAlpha=a;g.fillStyle=shade(c);g.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h));g.globalAlpha=1;}
function line(x0,y0,x1,y1,c,width=1,a=1){x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);let dx=Math.abs(x1-x0),sx=x0<x1?1:-1,dy=-Math.abs(y1-y0),sy=y0<y1?1:-1,err=dx+dy;for(let n=0;n<2000;n++){rect(x0-width/2,y0-width/2,width,width,c,a);if(x0===x1&&y0===y1)break;let e=2*err;if(e>=dy){err+=dy;x0+=sx;}if(e<=dx){err+=dx;y0+=sy;}}}
function poly(points,c,a=1){let lo=Math.ceil(Math.min(...points.map(p=>p[1]))),hi=Math.floor(Math.max(...points.map(p=>p[1])));for(let y=lo;y<=hi;y++){const hits=[];for(let i=0,j=points.length-1;i<points.length;j=i++){const p=points[i],q=points[j];if((p[1]<=y&&q[1]>y)||(q[1]<=y&&p[1]>y))hits.push(p[0]+(y-p[1])/(q[1]-p[1])*(q[0]-p[0]));}hits.sort((a,b)=>a-b);for(let i=0;i+1<hits.length;i+=2)rect(Math.ceil(hits[i]),y,Math.floor(hits[i+1])-Math.ceil(hits[i])+1,1,c,a);}}
function edge(points,c,w=1,a=1){for(let i=1;i<points.length;i++)line(...points[i-1],...points[i],c,w,a);}
function ellipse(x,y,rx,ry,c,a=1){for(let yy=-Math.floor(ry);yy<=ry;yy++){let w=rx*Math.sqrt(Math.max(0,1-yy*yy/(ry*ry)));rect(x-w,y+yy,w*2+1,1,c,a);}}
function ring(x,y,rx,ry,c,w=1,a=1){const n=Math.ceil(Math.max(rx,ry)*5);let p;for(let i=0;i<=n;i++){const q=[x+Math.cos(i/n*TAU)*rx,y+Math.sin(i/n*TAU)*ry];if(p)line(...p,...q,c,w,a);p=q;}}
function glow(x,y,c,p=1){const old=emissive;emissive=true;rect(x-7,y-7,15,15,c,.018*p);rect(x-4,y-4,9,9,c,.045*p);rect(x-2,y-2,5,5,c,.14*p);rect(x,y,1,1,c,Math.min(1,p));emissive=old;}
const font={A:['010','101','111','101','101'],B:['110','101','110','101','110'],C:['011','100','100','100','011'],D:['110','101','101','101','110'],E:['111','100','110','100','111'],F:['111','100','110','100','100'],G:['011','100','101','101','011'],H:['101','101','111','101','101'],I:['111','010','010','010','111'],J:['001','001','001','101','010'],K:['101','101','110','101','101'],L:['100','100','100','100','111'],M:['101','111','111','101','101'],N:['101','111','111','111','101'],O:['010','101','101','101','010'],P:['110','101','110','100','100'],Q:['010','101','101','111','011'],R:['110','101','110','101','101'],S:['011','100','010','001','110'],T:['111','010','010','010','010'],U:['101','101','101','101','111'],V:['101','101','101','101','010'],W:['101','101','111','111','101'],X:['101','101','010','101','101'],Y:['101','101','010','010','010'],Z:['111','001','010','100','111'],'0':['111','101','101','101','111'],'1':['010','110','010','010','111'],'2':['110','001','010','100','111'],'7':['111','001','010','010','010'],'/':['001','001','010','100','100'],'-':['000','000','111','000','000'],'.':['000','000','000','000','010']};
function text(s,x,y,c,scale=1){for(const letter of s){const f=font[letter];if(f)for(let r=0;r<5;r++)for(let col=0;col<3;col++)if(f[r][col]==='1')rect(x+col*scale,y+r*scale,scale,scale,c);x+=4*scale;}}
const aperture=[[254,151],[301,105],[733,60],[751,370],[302,386],[250,333]];
const frameShape=[[235,140],[290,90],[744,43],[770,384],[293,406],[228,342]];
const track=[];
for(let i=0;i<=400;i++){const u=i/400;track.push([280+431*u,229-61*Math.sin(u*TAU*1.55)+19*Math.sin(u*TAU*3.2),u]);}
const people=Array.from({length:26},()=>({u:rnd(),v:rnd(),speed:.008+rnd()*.012,phase:rnd()*TAU,shirt:[C.rose,C.gold,C.cyan,C.purple,C.ice][Math.floor(rnd()*5)],dir:rnd()<.5?-1:1,size:.75+rnd()*.35}));
const stars=Array.from({length:100},()=>({x:rnd()*W,y:rnd()*H,p:rnd()*TAU,size:rnd()>.9?2:1}));
// Independent seed keeps the park layout unchanged when adding space particles.
for(let i=0;i<120;i++){const hash=n=>((Math.imul(n+17,2654435761)>>>0)%65536)/65536;stars.push({x:hash(i*5)*W,y:hash(i*5+1)*H,p:hash(i*5+2)*TAU,size:1});}
for(const p of people){p.x=292+p.u*426;p.y=315+p.v*48+(p.x-460)*.024;p.walk=p.phase;p.target=null;}
const windows=Array.from({length:18},(_,i)=>({x:298+i*23,y:405-i*.9,phase:rnd()*TAU}));
function sky(){
 rect(0,0,W,H,C.void);
 for(let y=0;y<H;y+=8)rect(0,y,W,8,y<140?'#070c1a':y<310?'#080f1e':'#070e19');
 // Preserve the original scenery seed without baking stationary stars into it.
 for(let i=0;i<450;i++){rnd();rnd();rnd();}
}
function planet(){
 ellipse(87,68,34,34,'#111c31');ellipse(79,64,28,32,'#182941');
 for(let y=43;y<88;y+=6){const r=Math.sqrt(Math.max(0,32*32-(y-64)**2));line(79-r,y,79+r,y+3,'#21344b',2,.5);}
 ring(84,72,54,10,'#344357',1,.45);poly([[70,37],[108,40],[119,66],[111,93],[91,99],[97,70]],'#0c1527');
}
function shellBack(){
 poly([[37,146],[94,83],[207,77],[268,95],[743,34],[775,45],[795,386],[759,420],[282,440],[197,399],[77,365],[39,294]],C.deep);
 poly([[48,157],[102,101],[200,93],[269,112],[283,392],[205,388],[91,348],[51,283]],C.hull);
 poly([[201,98],[278,118],[284,388],[216,414],[170,363],[175,171]],'#132237');
 poly([[290,87],[743,34],[774,47],[744,58],[301,111]],'#21344e');
 edge([[291,87],[740,35],[773,46]],'#42546a',2);
 poly([[59,152],[106,104],[156,101],[145,168],[94,197],[55,192]],'#24324a');
 poly([[72,139],[106,106],[155,104],[141,137],[91,166]],'#45516a');
 poly([[88,123],[108,108],[148,108],[138,117],[106,126]],'#777e92');
 poly([[60,181],[103,154],[138,147],[131,192],[86,219],[57,210]],'#15243b');
 edge([[60,181],[101,154],[137,148]],'#5e6e86',2);
 for(let i=0;i<7;i++){const x=69+i*9,y=181-i*4;poly([[x,y],[x+4,y-2],[x+4,y+20],[x,y+24]],i%2?'#58637c':'#2f405a');}
 poly([[105,99],[110,76],[119,67],[142,74],[146,104]],'#4a5874');
 poly([[115,79],[122,73],[135,78],[137,94],[115,99]],'#101b30');
 rect(123,79,8,9,'#90a6ba');
 edge([[153,119],[194,95],[212,97]],'#445c73',2);line(170,101,170,78,'#6b7a91',2);line(151,83,193,75,'#53667d',2);
 for(let i=0;i<32;i++){let x=75+rnd()*139,y=171+rnd()*180,w=7+rnd()*25,h=5+rnd()*25;poly([[x,y],[x+w,y-4],[x+w,y+h],[x,y+h+4]],i%3?'#15263c':'#1c3049');line(x,y,x+w,y-4,'#2c4058',1,.65);if(i%4===0)line(x+3,y+4,x+3,y+h,'#416078',1,.4);}
 // Ribbed service spine and recessed machinery.
 poly([[198,137],[224,128],[239,337],[213,360],[198,298]],'#0b1424');
 for(let i=0;i<12;i++)poly([[201,153+i*15],[224,145+i*15],[227,154+i*15],[203,163+i*15]],'#273b53');
 poly([[92,238],[157,225],[159,278],[96,294]],'#0c1727');
 for(let i=0;i<10;i++)line(100+i*5,242-i,101+i*5,279-i,'#2d4057',2);
 rect(84,302,34,3,C.gold);rect(87,306,27,1,C.amber,.45);text('DECK 07',99,331,C.steel);
 line(52,281,84,303,'#35485f',2);line(79,348,189,385,'#30445c',2);
 poly(frameShape,'#274764');
 poly([[242,143],[295,95],[738,49],[759,377],[296,396],[236,336]],'#41647d');
 poly([[248,147],[299,101],[734,56],[754,373],[300,391],[244,334]],'#82b0c2');
 poly(aperture,'#5199b8');
}
function insideClip(){g.beginPath();g.moveTo(...aperture[0]);for(const p of aperture.slice(1))g.lineTo(...p);g.closePath();g.clip();}
function cloud(x,y,s){ellipse(x,y,25*s,5*s,'#b9dce8',.38);ellipse(x-9*s,y-3*s,11*s,6*s,'#cae8ec',.5);ellipse(x+7*s,y-5*s,15*s,7*s,'#c9e6e9',.45);rect(x-20*s,y+1*s,42*s,2*s,'#deeceb',.3);}
function interiorBack(){
 for(let y=50;y<390;y+=8){let c=y<110?'#6eb8d5':y<158?'#87c8df':y<210?'#7dbbd4':y<265?'#5a9fbd':'#387c9d';rect(230,y,540,8,c);}
 // Artificial cloud ceiling and high glass panels.
 for(const q of [[345,143,1.2],[475,123,1.3],[613,91,1.8],[694,139,1],[405,187,1.1]])cloud(...q);
 for(let i=0;i<8;i++){let x=305+i*62;line(x,80,x-18,245,'#b9e8ef',1,.25);line(x+3,81,x-15,245,C.ice,1,.12);}
 line(271,165,741,108,'#d6edf0',2,.45);line(270,170,742,113,'#487f9e',1,.4);
 poly([[264,202],[291,168],[306,163],[313,199],[331,211],[323,245],[270,257]],'#a9d4df');
 poly([[272,205],[296,173],[303,175],[304,210],[320,224],[314,246],[275,249]],'#d2e2e6');
 poly([[274,209],[299,180],[300,214],[312,231],[281,238]],'#edd5d7');
 // Far buildings and elevated walkways.
 for(let i=0;i<12;i++){let x=290+i*37,y=251-((i*19)%31),h=14+(i%4)*9;poly([[x,y],[x+18,y-5],[x+18,y+h],[x,y+h+4]],i%2?'#4289a9':'#4e97b2');rect(x+5,y+5,2,3,C.ice,.55);rect(x+11,y+3,2,3,C.ice,.55);}
 line(297,260,720,236,'#285e81',6);line(298,257,721,233,'#9cd4df',2);
 // Floor: cold reflective terraces, low walls and winding promenades.
 poly([[247,285],[734,264],[759,374],[300,385],[246,331]],'#83b9c9');
 poly([[249,300],[734,282],[749,333],[297,345]],'#b9dae0');
 poly([[271,330],[745,318],[756,373],[301,380]],'#a6ced9');
 poly([[270,299],[390,306],[498,317],[637,319],[741,353],[750,366],[635,336],[491,333],[381,320],[263,311]],'#d9e8e6');
 poly([[318,377],[362,344],[404,324],[412,325],[376,350],[341,378]],'#d5e5e3');
 for(let y=309;y<382;y+=13)line(265,y,748,y-15,'#77aabb',1,.45);
 for(let x=294;x<755;x+=38)line(x,283,x+(x-510)*.22,385,'#80b6c8',1,.45);
 // Reflective ground flecks, deterministic and quiet.
 for(let i=0;i<280;i++){let x=270+rnd()*476,y=290+rnd()*91;rect(x,y,2+rnd()*6,1,i%3?'#d7e9e8':'#5f9eaf',.25);}
 // Track pillars in the distance, with metal lattice braces.
 for(let i=12;i<390;i+=28){let p=track[i],bottom=286+(p[0]-280)*.035;line(p[0],p[1]+4,p[0]+3,bottom,'#4d7490',3);line(p[0]+5,p[1]+4,p[0]+8,bottom,'#a7cbd0',1);for(let y=p[1]+16;y<bottom;y+=15)line(p[0]-2,y,p[0]+7,y+7,'#779eae',1);}
 // Coaster's two rails and individual sleepers.
 edge(track.map(p=>[p[0],p[1]+4]),'#a24e6b',3);edge(track.map(p=>[p[0],p[1]-1]),'#e5a1aa',2);
 for(let i=0;i<track.length;i+=6){let p=track[i];line(p[0],p[1]-2,p[0]+1,p[1]+5,'#f0bbc0',1);}
 // Small observation tower.
 line(518,197,518,282,'#436d89',9);line(515,196,515,282,'#96c9cf',2);
 poly([[501,191],[516,175],[531,190],[526,197],[505,197]],'#a7d6df');ellipse(516,192,18,5,'#d9e2df');rect(508,190,17,3,C.gold);line(516,177,516,165,'#bdcbd8',2);
 // Wheel support foundations.
 ellipse(651,315,61,10,'#669ba9');poly([[620,312],[651,205],[683,309],[673,309],[651,230],[630,314]],'#2d516f');edge([[620,312],[650,206],[681,308]],'#7ca7b9',3);
 poly([[610,318],[627,315],[636,322],[618,325]],'#d1dfdf');poly([[676,316],[694,313],[701,320],[685,324]],'#c2d8dc');
 // A pair of slim, structural ship columns, framing the playground.
 poly([[566,168],[573,161],[578,164],[585,303],[573,308]],'#2c5f7f');line(570,171,578,299,'#78afc1',2);
}
function tree(x,y,s=1){ellipse(x+2,y+2,12*s,4*s,'#507f89',.5);rect(x-1*s,y-18*s,3*s,20*s,'#547676');for(let i=0;i<4;i++){const yy=y-36*s+i*7*s,r=(7+i*2)*s;poly([[x,yy-10*s],[x-r,yy+6*s],[x+r,yy+6*s]],i%2?'#3c7c7e':'#4b8d89');line(x-r,yy+6*s,x+2*s,yy+3*s,'#9bc8bd',s);}}
function kiosk(x,y,s=1){ellipse(x,y+14*s,19*s,5*s,'#4c8799',.4);poly([[x-13*s,y-4*s],[x+14*s,y-5*s],[x+14*s,y+12*s],[x-13*s,y+13*s]],'#d9c5bc');rect(x-9*s,y-1*s,18*s,8*s,'#43778c');rect(x-7*s,y,14*s,3*s,C.gold,.8);poly([[x-18*s,y-5*s],[x-9*s,y-15*s],[x+10*s,y-15*s],[x+18*s,y-6*s]],C.rose);for(let i=-12;i<15;i+=8)line(x+i*s,y-5*s,x+(i+3)*s,y-14*s,C.ice,3*s);}
function gardenFurniture(){
 for(const p of [[302,284,.7],[331,284,.6],[361,291,.75],[538,292,.8],[704,288,.9],[589,319,1],[715,346,1.15],[287,315,.7]])tree(...p);
 kiosk(339,307,.7);kiosk(554,316,.75);kiosk(710,361,.7);
 for(const [x,y] of [[306,335],[389,347],[510,359],[650,350]]){line(x,y,x,y-19,'#638995',1);rect(x-3,y-21,7,3,'#d9e9df');glow(x,y-20,C.gold,.65);ellipse(x,y+1,10,2,'#def0e5',.25);}
 for(const [x,y] of [[372,327],[550,347],[688,334]]){poly([[x,y],[x+17,y-1],[x+20,y+3],[x+3,y+4]],'#ba9185');line(x+4,y+4,x+4,y+8,'#45697f',1);line(x+17,y+3,x+17,y+7,'#45697f',1);}
}
function wheel(t){
 const x=652,y=204,r=83;
 ring(x+2,y,r,r,'#49758c',3);ring(x,y,r,r,'#efc994',2);ring(x,y,r-4,r-4,'#af8b7d',1);
 for(let i=0;i<12;i++){
  const a=wheelPhase+i*TAU/12,px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;
  line(x,y,px,py,'#e4b68e',1);
  if(i%2===0)line(x+3,y,px+3,py,'#b89a8c',1);
  const b=a+TAU/12;line(px,py,x+Math.cos(b)*r,y+Math.sin(b)*r,'#f4d5a5',2);
  // Gondolas stay level as the wheel turns.
  line(px,py,px,py+5,'#47526b',1);poly([[px-5,py+5],[px+5,py+5],[px+4,py+14],[px-4,py+14]],i%3===0?'#c6717a':i%3===1?'#e6a46e':'#599aaf');
  rect(px-4,py+6,8,4,'#c0e5e6');rect(px-1,py+7,2,3,'#59687c');line(px-5,py+5,px+5,py+5,C.gold,1);glow(px,py,C.gold,.8);
 }
 ellipse(x,y,5,5,C.gold);ellipse(x,y,2,2,C.ice);
}
function train(t){
 const u=coasterPhase%1;
 for(let n=5;n>=0;n--){const z=(u-n*.014+1)%1,i=Math.floor(z*(track.length-2)),p=track[i],q=track[i+1],a=Math.atan2(q[1]-p[1],q[0]-p[0]);
  const point=(x,y)=>[p[0]+x*Math.cos(a)-y*Math.sin(a),p[1]+x*Math.sin(a)+y*Math.cos(a)];
  poly([point(-5,-3),point(5,-3),point(5,-8),point(-5,-8)],n===0?'#edbd7d':'#bf6478');edge([point(-5,-9),point(5,-9)],'#ffe1a3',2);
  for(let j=-2;j<=2;j+=4){const h=point(j,-11);rect(h[0],h[1],2,3,'#3c435d');const w=point(j,0);rect(w[0],w[1],2,2,'#364b66');}
  if(n===0){let h=point(6,-6);glow(...h,C.gold);}
 }
}
function carousel(t){
 const x=445,y=304;
 ellipse(x+4,y+10,66,13,'#6394a0',.7);
 ellipse(x,y+7,65,12,'#887a86');ellipse(x,y+4,62,11,'#b499a1');ellipse(x,y+1,59,10,C.ice);ellipse(x,y-1,55,9,'#ba7d88');
 // Reflections in the polished deck.
 for(let i=-45;i<45;i+=9)rect(x+i,y+15,3,4+(i%7),C.gold,.22);
 function horse(a,front){const px=x+Math.cos(a)*45,py=y-18+Math.sin(a)*9,bob=Math.sin(t*2+a*3)*3;line(px,py-23,px,py+10,C.gold,1);if((Math.sin(a)>=0)!==front)return;rect(px-4,py+bob,8,3,C.white);rect(px+3,py-3+bob,3,5,C.white);rect(px+5,py-4+bob,2,2,C.rose);line(px-2,py+3+bob,px-3,py+6+bob,C.white,1);line(px+3,py+3+bob,px+4,py+6+bob,C.white,1);rect(px-1,py-2+bob,3,3,C.red);rect(px,py-6+bob,2,3,C.navy);}
 for(let i=0;i<9;i++)horse(i*TAU/9+carouselPhase,false);
 rect(x-11,y-42,22,36,'#c5979a');rect(x-8,y-41,16,34,'#f1cba3');for(let i=-7;i<=7;i+=7){rect(x+i,y-36,3,22,'#ffe6b1');rect(x+i,y-12,3,4,'#ac7687');}
 for(let i=0;i<9;i++)horse(i*TAU/9+carouselPhase,true);
 // Alternating fabric roof wedges.
 for(let i=0;i<16;i++){const a=i*TAU/16+carouselPhase*.125,b=(i+1)*TAU/16+carouselPhase*.125;poly([[x,y-72],[x+Math.cos(a)*58,y-43+Math.sin(a)*11],[x+Math.cos(b)*58,y-43+Math.sin(b)*11]],i%2?'#e9dbca':'#ca8794');}
 ring(x,y-43,59,11,'#ffe0ad',2);
 for(let i=0;i<24;i++){const a=i*TAU/24,px=x+Math.cos(a)*58,py=y-42+Math.sin(a)*11;rect(px-1,py,3,5,i%2?'#e7b486':'#b16f85');glow(px,py+3,C.gold,.8+.2*Math.sin(t*2+i));}
 // Crown and lit spire.
 rect(x-3,y-91,6,20,'#c9b5b3');rect(x-1,y-90,2,19,C.gold);poly([[x-9,y-86],[x,y-100],[x+9,y-86]],'#e7b6b5');ellipse(x,y-85,10,3,C.gold);line(x,y-99,x,y-108,C.white,1);poly([[x+1,y-108],[x+11,y-105+Math.sin(t*2)*1.5],[x+1,y-102]],C.rose);glow(x,y-99,C.gold);
}
function person(p,t){const x=p.x,y=p.y,s=p.size*(.8+(y-315)/90),step=Math.sin(p.walk),swing=step*1.5;
 ellipse(x+2,y+2,3*s,1.2*s,'#527e91',.55);rect(x-s,y-10*s,2*s,2*s,'#f0c8b0');rect(x-1.5*s,y-8*s,3*s,4*s,p.shirt);line(x-s,y-4*s,x-1.2*s+swing,y,C.navy,s);line(x+s,y-4*s,x+1.2*s-swing,y,C.navy,s);line(x-2*s,y-7*s,x-2*s-swing*.5,y-4*s,p.shirt,s);
}
function advance(dt){
 if(starMode!=='still')starTravel+=dt*starSpeed*(starMode==='warp'?280:18);
 wheelPhase+=dt*.12*wheelDirection;
 coasterPhase=(coasterPhase+dt*.027*(time<coasterBoostUntil?2.8:1))%1;
 carouselPhase+=dt*.6*(time<carouselBoostUntil?2.5:1);
 for(const p of people){
  if(p.target&&time>p.target.until)p.target=null;
  if(p.target){const dx=p.target.x-p.x,dy=p.target.y-p.y,d=Math.hypot(dx,dy),distance=Math.min(d,dt*23);if(d>.5){p.x+=dx/d*distance;p.y+=dy/d*distance;p.walk+=distance*.45;}}
  else {const distance=dt*p.speed*426;p.x+=distance*p.dir;p.walk+=distance*.55;if(p.x>718){p.x=718;p.dir=-1;}if(p.x<292){p.x=292;p.dir=1;}}
 }
 beacons=beacons.filter(b=>time-b.born<4);
 shuttles=shuttles.filter(s=>time-s.born<12);
}
function signal(x,y){beacons.push({x,y,born:time});if(beacons.length>8)beacons.shift();}
function signals(){for(const b of beacons){const age=time-b.born,a=Math.max(0,1-age/4);emissive=true;ring(b.x,b.y,5+age*7,2+age*2,C.gold,1,a*.65);glow(b.x,b.y,C.gold,a);emissive=false;}}
function gather(x=500,y=350){
 x=Math.max(303,Math.min(706,x));y=Math.max(330,Math.min(364,y));
 const nearest=people.slice().sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y)).slice(0,8);
 nearest.forEach((p,i)=>{const a=i*TAU/8;p.target={x:x+Math.cos(a)*10,y:y+Math.sin(a)*5,until:time+12};});signal(x,y);
}
function nightLights(){
 if(lighting==='day')return;emissive=true;const power=lighting==='night'?1:.55;
 for(const [x,y,rx,ry] of [[445,316,72,15],[652,316,52,10],[306,335,11,3],[389,347,14,4],[510,359,14,4],[650,350,14,4]]){
  ellipse(x,y,rx,ry,C.gold,.035*power);ellipse(x,y,rx*.6,ry*.65,C.gold,.045*power);
 }
 for(let i=0;i<16;i++){const a=i*TAU/16+wheelPhase;glow(652+Math.cos(a)*83,204+Math.sin(a)*83,C.gold,.8);}
 emissive=false;
}

function balloon(t){const x=369+Math.sin(t*.25)*3,y=263+Math.sin(t*.7)*2;line(x,y+4,x+2,y+18,'#b9dadc',1);ellipse(x,y,4,6,C.rose);rect(x-2,y-3,1,2,C.white);}
function shellFront(t){
 // Heavy hull lip sits in front of the interior, giving a real cutaway depth.
 poly([[250,333],[302,386],[751,370],[770,384],[293,406],[228,342]],'#182e46');
 edge([[250,333],[302,386],[751,370]],'#bddce2',2);
 edge([[242,340],[299,397],[758,380]],'#56859c',2);
 edge([[293,406],[759,387]],'#0b1629',3);
 poly([[302,407],[759,388],[750,409],[298,431]],'#101f33');
 for(let i=0;i<15;i++){let x=310+i*29,y=409-i*1.2;line(x,y,x+5,y+16,'#263c54',2);rect(x+9,y+4,8,4,'#243e55');}
 for(const p of windows){let a=.55+.25*Math.sin(t*.5+p.phase);rect(p.x,p.y,3,3,C.ice,a);}
 // Rounded side buttress and outer skin on the right.
 poly([[733,60],[744,43],[770,384],[751,370]],'#102039');edge([[733,60],[751,370]],'#9ac8d7',2);line(743,56,763,374,'#314d68',3);
 poly([[228,342],[239,340],[256,356],[260,384],[236,376],[224,359]],'#22384e');
 // Hull status marks and readable miniature signage integrated into the ship.
 text('ORBITAL GARDENS',348,405,'#728da0');text('07',704,390,C.gold);
 for(let i=0;i<5;i++)rect(185+i*3,313,1,4,i===Math.floor(t)%5?C.gold:'#526578');
 glow(91,304,C.gold,.9);glow(744,65,C.cyan,.65);glow(298,394,C.cyan,.7);
}
function shuttle(t,x=64+(t*4.6)%120,y=397+Math.sin(t*.24)*5){
 ellipse(x+5,y+7,25,3,'#0d213a',.35);
 poly([[x-19,y+2],[x-4,y-4],[x+10,y-4],[x+26,y+1],[x+8,y+5],[x-8,y+5]],'#718ba6');
 poly([[x-6,y-5],[x+2,y-13],[x+6,y-4]],'#a9b7c9');poly([[x-11,y],[x+12,y-1],[x+19,y+2],[x-11,y+2]],'#ccd7df');rect(x-2,y-4,6,3,'#4d9cbb');
 rect(x-20,y+2,4,2,C.cyan);rect(x-25,y+2,5,1,C.blue,.7);rect(x-30-Math.sin(t*18)*2,y+2,5,1,C.blue,.3);
}
// Cache complex stationary geometry; animate only the rides, visitors and lighting.
function layer(draw){const c=document.createElement('canvas');c.width=W;c.height=H;const previous=g;g=c.getContext('2d');g.imageSmoothingEnabled=false;draw();g=previous;return c;}
const background=layer(sky),spaceForeground=layer(()=>{planet();shellBack();});
const parks={},parkSeed=seed;
function parkLayer(){
 if(!parks[lighting]){const oldSeed=seed;seed=parkSeed;inPark=true;parks[lighting]=layer(()=>{g.save();insideClip();interiorBack();gardenFurniture();g.restore();});inPark=false;seed=oldSeed;}
 return parks[lighting];
}
let time=0,last=0,drawn=0,raf=0,visible=true,frames=0;
function starfield(){
 const wrap=(v,n)=>((v%n)+n)%n;
 for(const s of stars){
  const depth=.25+.75*(s.p/TAU),travel=starTravel*depth;
  const x=wrap(s.x-travel+120,W+240)-120,y=wrap(s.y+travel*.10,H);
  const alpha=.25+depth*.38;
  if(starMode==='warp'){
   const length=(14+depth*48)*Math.sqrt(starSpeed);
   // Short segmented tails stay crisp and never join opposite screen edges.
   for(let j=3;j>=0;j--){const a=j/4,b=(j+1)/4;line(x+length*a,y-length*a*.10,x+length*b,y-length*b*.10,C.ice,1,alpha*(1-a)*.65);}
  }
  rect(x,y,s.size,s.size,C.ice,alpha);
 }
}
const reduced=matchMedia('(prefers-reduced-motion: reduce)');let playing=!reduced.matches;
function draw(){
 g=scene.getContext('2d');g.clearRect(0,0,W,H);g.fillStyle=outerBackground;g.fillRect(0,0,W,H);
 // Draw space first, so stars and trails are occluded by the planet and hull.
 starfield();g.drawImage(spaceForeground,0,0);
 g.drawImage(parkLayer(),0,0);
 g.save();insideClip();inPark=true;nightLights();wheel(time);train(time);carousel(time);
 for(const p of people.slice().sort((a,b)=>a.y-b.y))person(p,time);
 balloon(time);signals();inPark=false;g.restore();shellFront(time);shuttle(time);


 // A 640-pixel raster gives the image its crisp, tangible pixel scale at desktop sizes.
 display.imageSmoothingEnabled=false;display.fillStyle=outerBackground;display.fillRect(0,0,canvas.width,canvas.height);
 const scale=Math.min(canvas.width/W,canvas.height/H),ox=(canvas.width-W*scale)/2,oy=(canvas.height-H*scale)/2;
 // Continue the moving starfield through the letterbox area on tall displays.
 for(const s of stars){const d=.25+.75*s.p/TAU,x=((s.x/W*canvas.width-starTravel*d*scale)%(canvas.width+120)+canvas.width+120)%(canvas.width+120)-60,y=((s.y/H*canvas.height+starTravel*d*.1*scale)%canvas.height+canvas.height)%canvas.height;
 display.fillStyle='#7a93a8';display.fillRect(x,y,starMode==='warp'?(14+d*48)*Math.sqrt(starSpeed)*scale:1,1);}
 display.drawImage(scene,ox,oy,W*scale,H*scale);
 const oldG=g;g=display;display.save();display.translate(ox,oy);display.scale(scale,scale);
 for(const ship of shuttles){const age=time-ship.born;shuttle(time,ship.x-age*32,ship.y+Math.sin(age*.65)*4);}
 display.restore();g=oldG;
 canvas.dataset.frames=String(++frames);canvas.dataset.time=time.toFixed(3);canvas.dataset.lighting=lighting;canvas.dataset.interactions=String(interactions);canvas.dataset.wheelDirection=String(wheelDirection);canvas.dataset.shuttles=String(shuttles.length);canvas.dataset.visitorTargets=String(people.filter(p=>p.target).length);canvas.dataset.coasterBoost=String(time<coasterBoostUntil);canvas.dataset.carouselBoost=String(time<carouselBoostUntil);
 canvas.dataset.starMode=starMode;canvas.dataset.starSpeed=String(starSpeed);canvas.dataset.starTravel=starTravel.toFixed(3);
}
function resize(){const r=canvas.getBoundingClientRect();canvas.width=Math.min(1280,Math.max(320,Math.round(r.width)));canvas.height=Math.max(1,Math.round(canvas.width*r.height/Math.max(1,r.width)));draw();}
new ResizeObserver(resize).observe(canvas);
function schedule(){if(!raf&&playing&&visible&&!document.hidden)raf=requestAnimationFrame(tick);}
function tick(now){raf=0;if(!playing||!visible||document.hidden){last=0;return;}if(!last)last=now;const dt=Math.min(.08,(now-last)/1000);time+=dt;advance(dt);last=now;if(now-drawn>=1000/fps){drawn=now;draw();}schedule();}
function syncStars(){starSelect.value=starMode;starSlider.value=String(starSpeed);starSlider.disabled=starMode==='still';starValue.textContent=starSpeed.toFixed(2)+'×';}
function sync(){for(const b of lightingButtons)b.setAttribute('aria-pressed',String(b.dataset.lighting===lighting));button.textContent=playing?'Pause animation':'Play animation';button.setAttribute('aria-pressed',String(!playing));syncStars();last=0;draw();schedule();}
function save(){window.openai?.setWidgetState?.({modelContent:{scene:'orbital-gardens',playing,lighting,wheelDirection,starMode,starSpeed},privateContent:null})?.catch(()=>{});}
function restore(state,initial=false){
 const previousLighting=lighting;
 const s=state?.modelContent;
 if(s?.scene==='orbital-gardens'){
  if(typeof s.playing==='boolean')playing=reduced.matches?false:s.playing;
  if(['day','sunset','night'].includes(s.lighting))lighting=s.lighting;
  if(s.wheelDirection===1||s.wheelDirection===-1)wheelDirection=s.wheelDirection;
  if(['still','drift','warp'].includes(s.starMode))starMode=s.starMode;
  if(typeof s.starSpeed==='number'&&Number.isFinite(s.starSpeed))starSpeed=Math.round(Math.max(.25,Math.min(3,s.starSpeed))*4)/4;
 }
 if(initial||lighting!==previousLighting)status.textContent=lighting[0].toUpperCase()+lighting.slice(1)+' · Park open';sync();
}
function interact(action,x,y){
 let message='';
 if(action==='wheel'){wheelDirection*=-1;signal(652,204);message='Ferris wheel reversed';}
 else if(action==='coaster'){coasterBoostUntil=time+7;const p=track[Math.floor(coasterPhase*(track.length-1))];signal(p[0],p[1]);message='Coaster boosted for 7 seconds';}
 else if(action==='carousel'){carouselBoostUntil=time+7;signal(445,274);message='Carousel spinning faster for 7 seconds';}
 else if(action==='visitors'){gather(x,y);message='Visitors are coming over';}
 else if(action==='shuttle'){
  if(!Number.isFinite(x)||!Number.isFinite(y)||!(y<58||y>430||x<35)){x=175;y=412;}
  shuttles.push({x,y,born:time});if(shuttles.length>8)shuttles.shift();message='Shuttle launched';
 }else return;
 interactions++;status.textContent=message+(playing?'':' · Press Play to animate');draw();save();
}
function contains(x,y,points){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
let press=null;
canvas.addEventListener('pointerdown',e=>{if(clicks&&e.isPrimary!==false&&e.button===0)press={x:e.clientX,y:e.clientY,id:e.pointerId};});
canvas.addEventListener('pointercancel',()=>{press=null;});
canvas.addEventListener('pointerup',e=>{
 const start=press;press=null;if(!start||start.id!==e.pointerId||Math.hypot(e.clientX-start.x,e.clientY-start.y)>10)return;
 const r=canvas.getBoundingClientRect();hit((e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height);
});
function hit(nx,ny){
 const r=canvas.getBoundingClientRect(),scale=Math.min(r.width/W,r.height/H);
 const x=(nx*r.width-(r.width-W*scale)/2)/scale,y=(ny*r.height-(r.height-H*scale)/2)/scale;
 if(!contains(x,y,aperture)){interact('shuttle',x,y);return;}
 if(Math.hypot(x-652,y-204)<94){interact('wheel');return;}
 if(Math.abs(x-445)<68&&y>202&&y<316){interact('carousel');return;}
 if(track.some(p=>Math.hypot(x-p[0],y-p[1])<17)){interact('coaster');return;}
 interact('visitors',x,y);
}
for(const b of root.querySelectorAll('[data-interact]'))b.addEventListener('click',()=>interact(b.dataset.interact));
for(const b of lightingButtons)b.addEventListener('click',()=>{lighting=b.dataset.lighting;sync();status.textContent=b.textContent+' lighting';save();});
starSelect.addEventListener('change',()=>{starMode=starSelect.value;syncStars();draw();status.textContent={still:'Stars stationary',drift:'Cruising through space',warp:'Warp trails engaged'}[starMode];save();});
starSlider.addEventListener('input',()=>{starSpeed=Number(starSlider.value);syncStars();draw();});
starSlider.addEventListener('change',save);
button.addEventListener('click',()=>{playing=!playing;sync();status.textContent=playing?'Animation playing':'Animation paused';save();});
new IntersectionObserver(e=>{visible=e[0].isIntersecting;last=0;schedule();}).observe(canvas);
document.addEventListener('visibilitychange',()=>{last=0;schedule();});
reduced.addEventListener('change',e=>{if(e.matches){playing=false;sync();}});
window.addEventListener('openai:set_globals',e=>{if(e.detail?.globals?.widgetState)restore(e.detail.globals.widgetState);});

window.ASCIIWallpaper={
 configure(s){
  if(['day','sunset','night'].includes(s.parkLighting))lighting=s.parkLighting;
  if(['still','drift','warp'].includes(s.starMode))starMode=s.starMode;
  if(Number.isFinite(s.starSpeed))starSpeed=Math.max(.25,Math.min(3,s.starSpeed));
  if(Number.isFinite(s.parkStarSpeed))starSpeed=Math.max(.25,Math.min(3,s.parkStarSpeed/100));
  if(/^#[0-9a-f]{6}$/i.test(s.background||''))outerBackground=s.background;
  if(typeof s.paused==='boolean')playing=!s.paused;
  clicks=s.desktopClicks!==false;fps=s.fps===30?30:20;sync();
 },
 launch(x=.18,y=.32){hit(x,y);},
 action(name){interact(name);},
 state(){return {scene:'orbital-gardens',playing,lighting,starMode,starSpeed,wheelDirection,time,frames,interactions,shuttles:shuttles.length};}
};
restore(null,true);resize();
})();
