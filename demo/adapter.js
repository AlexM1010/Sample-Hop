/* Browser shell only. The desktop viewer supplies all sample and music tools. */
(() => {
  const style = document.createElement('style');
  style.textContent = `header{padding:10px 12px}
    #q{min-width:180px} #welcome{display:none!important}
    @media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}`;
  document.head.append(style);
  const allowed = new Set(['search', 'layout', 'colour', 'random', 'basket', 'project', 'kit', 'list', 'fit']);
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== parent || event.data?.type !== 'samplehop-demo') return;
    const {action, value} = event.data;
    if (!allowed.has(action)) return;
    const click = id => document.getElementById(id)?.click();
    if (action === 'search') {
      const q = document.getElementById('q');
      q.value = String(value || '').slice(0, 160);
      q.dispatchEvent(new Event('input', {bubbles:true}));
    } else if (action === 'colour') {
      document.querySelector('[data-col="' + (value === 'kind' ? 'kind' : 'cluster') + '"]')?.click();
    } else if (action === 'kit') {
      window.dispatchEvent(new Event('samplehop-kit'));
    } else if (action === 'list') {
      document.querySelector('[data-view="list"]')?.click();
    } else {
      click({layout:'tphys',random:'trand',basket:'tbask',project:'tproj',fit:'pref_fit'}[action]);
    }
  });
  const ready = setInterval(() => {
    if (!document.getElementById('ph_tabs') && !document.getElementById('lv_body')) return;
    clearInterval(ready);
    parent.postMessage({type:'samplehop-ready'}, location.origin);
  }, 200);
  setTimeout(() => clearInterval(ready), 30000);
})();
