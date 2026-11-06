// Shared settings and contrast rules for every offline wallpaper scene.
window.SceneSettings={
 background(value,light=false){return typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value)?value.toLowerCase():(light?'#e1dbdb':'#25303b');},
 isLight(hex){const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722>.179;},
 normalize(s){const n=(v,d,a,b)=>Number.isFinite(v)?Math.max(a,Math.min(b,v)):d;
 const background=this.background(s.background,s.light);
 return {...s,background,light:this.isLight(background),detail:[128,176,240].includes(s.detail)?s.detail:176,style:s.style==='ascii'?'ascii':'tiles',fps:s.fps===30?30:20,
 positionX:n(s.positionX,50,0,100),positionY:n(s.positionY,50,0,100),angle:n(s.angle,0,-180,180),vividness:n(s.vividness,55,0,100),stars:s.stars!==false,galaxies:s.galaxies!==false,paused:!!s.paused,desktopClicks:s.desktopClicks!==false,
 sharkKind:['mixed','classic','hammerhead','zebra','tiger','greathammer','mako','thresher','nurse'].includes(s.sharkKind)?s.sharkKind:'mixed',sharkCount:Math.round(n(s.sharkCount,3,1,4)),fishCount:Math.round(n(s.fishCount,85,30,160)),sharkPalette:['original','glass','silver'].includes(s.sharkPalette)?s.sharkPalette:'original',
 koiCount:Math.round(n(s.koiCount,5,1,7)),koiPalette:['original','golden','orange'].includes(s.koiPalette)?s.koiPalette:(s.golden===false?'original':s.golden===true?'golden':'orange'),grid:!!s.grid,framing:s.framing==='fill'?'fill':'fit'};
 },
 grid(ctx,width,height,columns,light){ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.strokeStyle=light?'rgba(30,40,50,.09)':'rgba(230,240,250,.07)';ctx.lineWidth=1;ctx.beginPath();const w=width/columns,h=w*1.4;for(let x=.5;x<width;x+=w){ctx.moveTo(x,0);ctx.lineTo(x,height);}for(let y=.5;y<height;y+=h){ctx.moveTo(0,y);ctx.lineTo(width,y);}ctx.stroke();ctx.restore();}
};
