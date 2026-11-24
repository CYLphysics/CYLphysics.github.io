/* Same-origin scene adapter: keep wallpaper renderers separate from the site layout. */
(() => {
  'use strict';
  const root = document.querySelector('.page-scene');
  if (!root) return;
  const frame = root.querySelector('iframe');
  const pause = root.querySelector('[data-action="pause"]');
  const status = root.querySelector('.scene-status');
  const controls = [...root.querySelectorAll('[data-setting]')];
  const universe=root.querySelector('[data-setting="universePreset"]');
  const color=root.querySelector('[data-setting="parkBackground"]');
  const hex=root.querySelector('[data-universe-hex]');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const key = 'cyl-page-scene-' + root.dataset.scene;
  let playing = !motion.matches, visible = true;
  function restore() {
    try {
      const saved = JSON.parse(localStorage.getItem(key) || 'null');
      if (!saved || typeof saved !== 'object') return;
      for (const control of controls) {
        const value = saved[control.dataset.setting];
        if (control.type === 'checkbox' && typeof value === 'boolean') control.checked = value;
        else if (control.type === 'color' && /^#[0-9a-f]{6}$/i.test(value || '')) control.value = value;
        else if (control.type === 'range' && Number.isFinite(value)) control.value = String(Math.max(+control.min, Math.min(+control.max, value)));
        else if (control.tagName === 'SELECT' && [...control.options].some(o => o.value === value)) control.value = value;
      }
      if (!motion.matches && typeof saved.playing === 'boolean') playing = saved.playing;
    } catch {}
  }
  function preferences() {
    return Object.fromEntries(controls.map(c => [c.dataset.setting, c.type === 'checkbox' ? c.checked : c.type === 'range' ? +c.value : c.value]));
  }
  function apply() {
    const speed=root.querySelector('[data-setting="starSpeed"]'),mode=root.querySelector('[data-setting="starMode"]');
    if(speed){root.querySelector('[data-star-speed-value]').textContent=Number(speed.value).toFixed(2)+'×';speed.disabled=mode.value==='still';}
    const size=root.querySelector('[data-setting="parkScale"]');
    if(size)root.querySelector('[data-park-scale-value]').textContent=size.value+'%';
    pause.textContent = playing ? 'Pause animation' : 'Play animation';
    let background = document.documentElement.dataset.tone === 'light' ? '#e1dbdb' : '#25303b';
    if(universe){
      if(universe.value==='page')color.value=background;
      else if(/^#[0-9a-f]{6}$/i.test(universe.value))color.value=universe.value;
      background=color.value;hex.value=background;hex.setCustomValidity('');
    }
    frame.contentWindow?.ASCIIWallpaper?.configure({
      ...preferences(), sharkKind: 'mixed', background, detail: 176, fps: 20,
      paused: !playing || !visible || document.hidden, desktopClicks: true
    });
  }
  function save() {
    try { localStorage.setItem(key, JSON.stringify({...preferences(), playing})); } catch {}
  }
  pause.addEventListener('click', () => {
    playing = !playing; apply(); save();
    status.textContent = playing ? 'Animation playing' : 'Animation paused';
  });
  root.querySelector('[data-action="feed"]')?.addEventListener('click', () => {
    frame.contentWindow?.ASCIIWallpaper?.launch(.3 + Math.random() * .4, .3 + Math.random() * .4);
    status.textContent = 'Food dropped into the pond';
  });
  for(const button of root.querySelectorAll('[data-park-action]'))button.addEventListener('click',()=>{
    frame.contentWindow?.ASCIIWallpaper?.action(button.dataset.parkAction);status.textContent=button.textContent;
  });
  for (const control of controls) control.addEventListener('input', () => {
    if(control===color)universe.value='custom';apply();save();
  });
  hex?.addEventListener('input',()=>{
    hex.setCustomValidity('');
    const value=hex.value.trim().replace(/^#/,'');
    if(/^[0-9a-f]{6}$/i.test(value)){color.value='#'+value.toLowerCase();universe.value='custom';apply();save();}
  });
  hex?.addEventListener('change',()=>{
    const value=hex.value.trim().replace(/^#/,'');
    if(!/^[0-9a-f]{6}$/i.test(value)){hex.setCustomValidity('Enter six hexadecimal digits, for example #25303b.');hex.reportValidity();return;}
    color.value='#'+value.toLowerCase();universe.value='custom';apply();save();
  });
  frame.addEventListener('load', apply);
  window.addEventListener('cyl:themechange', apply);
  window.addEventListener('pageshow', apply);
  document.addEventListener('visibilitychange', apply);
  motion.addEventListener('change', e => { if (e.matches) { playing = false; apply(); } });
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; apply(); }).observe(frame);
  restore(); apply();
})();
