(() => {
  const BASE = window.PAGES_BASE || '/';
  const KEY = 'lsb:favorites';
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } };
  const write = (v) => localStorage.setItem(KEY, JSON.stringify(v));
  const favs = read();
  const counter = document.getElementById('fav-count');
  const paintCounter = () => { if (counter) counter.textContent = favs.length ? '(' + favs.length + ')' : ''; };
  const paintFavs = () => {
    document.querySelectorAll('.fav-btn').forEach((b) => {
      const on = favs.includes(b.dataset.slug);
      b.setAttribute('aria-pressed', String(on));
      if (b.classList.contains('fav-btn') && b.textContent.trim().startsWith('☆')) b.textContent = (on ? '★' : '☆') + ' Aggiungi ai preferiti';
    });
  };
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.fav-btn');
    if (!b) return;
    const slug = b.dataset.slug;
    const i = favs.indexOf(slug);
    if (i >= 0) favs.splice(i, 1); else favs.push(slug);
    write(favs); paintCounter(); paintFavs();
    if (location.pathname.includes('/preferiti')) renderFavorites();
  });
  paintCounter(); paintFavs();

  let data = null;
  const load = async () => {
    if (data) return data;
    const res = await fetch(BASE + 'data/boats.json');
    data = await res.json();
    const cat = document.getElementById('f-cat');
    if (cat) {
      [...new Set(data.map((b) => b.categoryLabel))].sort().forEach((c) => {
        const o = document.createElement('option'); o.value = c; o.textContent = c; cat.appendChild(o);
      });
    }
    return data;
  };
  const card = (b) => {
    const len = b.lengthM ? (b.lengthM / 100).toLocaleString('it-IT') + ' m' : '';
    const img = b.images[0] ? BASE + b.images[0].url.replace(/^\//, '') : '';
    const meta = [b.year, len, b.cabins ? b.cabins + ' cab.' : null].filter(Boolean).join(' · ');
    const p = b.price === null ? 'Su richiesta' : new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(b.price);
    return '<article class="boat-card"><a class="card-link" href="' + BASE + 'barche/' + b.slug + '/"></a>' +
      '<div class="card-image">' + (img ? '<img src="' + img + '" alt="' + b.title + '" loading="lazy">' : '') + '</div>' +
      '<div class="card-body"><p class="mono meta">' + b.brand + ' · ' + b.categoryLabel + '</p><h3>' + b.title + '</h3>' +
      '<p class="mono small">' + meta + '</p><div class="card-foot"><strong class="mono price">' + p + '</strong>' +
      '<button type="button" class="fav-btn" data-slug="' + b.slug + '" aria-label="Salva nei preferiti">☆</button></div></div></article>';
  };
  const render = async () => {
    const grid = document.getElementById('boat-grid');
    if (!grid) return;
    const all = await load();
    const q = (document.getElementById('f-q')?.value || '').toLowerCase();
    const cat = document.getElementById('f-cat')?.value || '';
    const max = Number(document.getElementById('f-price')?.value || 0);
    const sort = document.getElementById('f-sort')?.value || 'recent';
    let list = all.filter((b) => {
      if (q && !(b.title + ' ' + b.brand + ' ' + b.model).toLowerCase().includes(q)) return false;
      if (cat && b.categoryLabel !== cat) return false;
      if (max && (b.price === null || b.price > max)) return false;
      return true;
    });
    if (sort === 'priceAsc') list = list.slice().sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    if (sort === 'priceDesc') list = list.slice().sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
    grid.innerHTML = list.map(card).join('');
    const count = document.getElementById('result-count');
    if (count) count.textContent = list.length + ' imbarcazioni';
    const empty = document.getElementById('empty');
    if (empty) empty.hidden = list.length > 0;
    paintCounter(); paintFavs();
  };
  ['f-q','f-cat','f-price','f-sort'].forEach((id) => document.getElementById(id)?.addEventListener('input', render));
  if (document.getElementById('boat-grid')) render();

  const renderFavorites = async () => {
    const grid = document.getElementById('fav-grid');
    if (!grid) return;
    const all = await load();
    const list = all.filter((b) => favs.includes(b.slug));
    grid.innerHTML = list.map(card).join('');
    const empty = document.getElementById('fav-empty');
    if (empty) empty.hidden = list.length > 0;
    paintFavs();
  };
  if (document.getElementById('fav-grid')) renderFavorites();

  const lb = document.querySelector('.lightbox');
  if (lb) {
    document.querySelectorAll('.thumb').forEach((t) => t.addEventListener('click', () => {
      lb.querySelector('img').src = t.dataset.full;
      lb.hidden = false;
    }));
    lb.addEventListener('click', () => { lb.hidden = true; });
  }
})();
