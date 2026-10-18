/*
 * Amor Director - Uygulama (ana sayfa + sahne düzenleyici)
 * Hash yönlendirme: #/home, #/scene/<id>
 *
 * Düzenleyici: figüre dokun = seç / sürükle = taşı, eklem noktasını sürükle = o kemiği döndür.
 * Kareler: her kare figürlerin o anki hali; oynatınca kareler arası yumuşak geçiş yapılır.
 * Konum, poz, görünüm ve boyut kareye özel; ad ve renkler tüm karelerde ortak.
 */
window.Director = window.Director || {};

(() => {
  const { Store, Figure, Places, Texts } = Director;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const view = $('#view');
  const W = 480, H = 360, GROUND = 300;
  const PALETTE = {
    skin: ['#f8d9c0', '#f1c7a5', '#d9a47c', '#b07850', '#7a4a2e'],
    hair: ['#1f1a17', '#3b2a20', '#6b3b22', '#b5651d', '#e8c26a', '#c9c9d4', '#ff5d9e', '#7b5cff'],
    top: ['#4f7cff', '#ff5d9e', '#7b5cff', '#2fd6a0', '#ffb84d', '#ff4d4d', '#ffffff', '#2a2a33'],
    bottom: ['#2f3550', '#7b5cff', '#ff5d9e', '#4a6fa5', '#8a5a3b', '#c9c9d4', '#2fd6a0', '#2a2a33']
  };
  const COLOR_NAMES = { skin: 'Ten', hair: 'Saç', top: 'Üst', bottom: 'Alt' };
  // Kare geçişleri: [id, ad, eğri (0..1 -> ilerleme)]
  const bounce = t => {
    const n = 7.5625, d = 2.75;
    if (t < 1 / d) return n * t * t;
    if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
    if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
    return n * (t -= 2.625 / d) * t + 0.984375;
  };
  const EASES = [
    ['smooth', 'Yumuşak', t => t * t * (3 - 2 * t)],
    ['linear', 'Doğrusal', t => t],
    ['jump', 'Zıplama', t => t],
    ['bounce', 'Sekme', bounce],
    ['back', 'Esneme', t => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2)],
    ['step', 'Ani', () => 0]
  ];
  const JUMP = 40; // zıplama yüksekliği (ölçek 1'de)
  const ICON = {
    back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    undo: '<svg viewBox="0 0 24 24"><path d="M9 14L4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    play: '<svg viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>',
    stop: '<svg viewBox="0 0 24 24"><rect x="6.5" y="6.5" width="11" height="11" rx="2" fill="currentColor"/></svg>'
  };

  let ed = null; // açık düzenleyicinin durumu

  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    $('#toasts').appendChild(t);
    setTimeout(() => t.remove(), 2200);
  }

  const svgBox = inner => `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;

  const order = figs => figs.slice().sort((a, b) => (a.z || 0) - (b.z || 0) || a.y - b.y); // önce katman, sonra derinlik

  // prev: önceki kare (silüet olarak soluk çizilir)
  function stageInner(sc, frame, sel, prev) {
    const figs = order(frame.figs), s = figs.find(f => f.id === sel);
    const anchorOf = id => { const f = frame.figs.find(x => x.id === id); return f ? Figure.anchor(f, 'top') : null; };
    return Places.draw(sc.place) +
      (prev ? `<g class="onion" opacity=".3" pointer-events="none">${order(prev.figs).map(f => Figure.svg(f)).join('')}</g>` : '') +
      [-1, 0, 1].map(layer => figs.map(f => Figure.svg(f, layer)).join('')).join('') + // parça katmanları
      Texts.svg(frame, anchorOf) + (s ? Figure.handles(s) : '');
  }

  function nextName(sc, g) {
    const label = g === 'f' ? 'Kadın' : 'Erkek', names = sc.frames[0].figs.map(f => f.name);
    let i = 1;
    while (names.includes(label + ' ' + i)) i++;
    return label + ' ' + i;
  }

  /* ---------- Ana sayfa ---------- */

  function home() {
    ed = null;
    const scenes = Store.state.scenes.slice().sort((a, b) => b.updated - a.updated);
    view.innerHTML = `
      <header class="top"><div class="brand">am<span>o</span>r <small>director</small></div></header>
      <section class="home">
        <button class="new-scene" id="newScene">+ Yeni sahne</button>
        <div class="row file-row">
          <label class="btn">İçe aktar (JSON)<input type="file" id="importFile" accept=".json,application/json" hidden></label>
          <button class="btn" id="exportAll" ${scenes.length ? '' : 'disabled'}>Tümünü dışa aktar</button>
        </div>
        <div class="grid">${scenes.map(sc => `
          <a class="card" href="#/scene/${sc.id}">
            ${svgBox(stageInner(sc, sc.frames[0]))}
            <div class="meta"><b>${esc(sc.title)}</b><small>${sc.frames.length} kare · ${Places.name(sc.place)}</small>${sc.notes && sc.notes.trim() ? `<p class="note">${esc(sc.notes.trim())}</p>` : ''}</div>
            <button class="del" data-del="${sc.id}" aria-label="Sil">×</button>
          </a>`).join('') || '<p class="empty">Henüz sahne yok. İlk sahneni oluştur.</p>'}
        </div>
      </section>`;
    $('#newScene').onclick = newScene;
    $('#exportAll').onclick = () => exportScenes(Store.state.scenes, 'amor-director-sahneler');
    $('#importFile').onchange = e => { if (e.target.files[0]) importScenes(e.target.files[0]); };
    view.querySelectorAll('[data-del]').forEach(b => b.onclick = e => {
      e.preventDefault();
      const sc = Store.state.scenes.find(s => s.id === b.dataset.del);
      if (!confirm(`"${sc.title}" silinsin mi?`)) return;
      Store.state.scenes = Store.state.scenes.filter(s => s !== sc);
      Store.save();
      home();
    });
  }

  /* ---------- JSON dışa / içe aktarma ---------- */

  function exportScenes(scenes, name) {
    const data = JSON.stringify({ app: 'amor-director', version: 1, exported: new Date().toISOString(), scenes }, null, 1);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    a.download = (name || 'sahne').replace(/[\\/:*?"<>|]+/g, '').trim() + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // Kabul edilenler: { scenes: [...] }, sahne dizisi ya da tek sahne
  function importScenes(file) {
    file.text().then(txt => {
      const data = JSON.parse(txt);
      const list = (Array.isArray(data) ? data : data.scenes || [data])
        .filter(s => s && Array.isArray(s.frames) && s.frames.length);
      if (!list.length) throw new Error('empty');
      list.forEach(s => {
        if (!s.id || Store.state.scenes.some(x => x.id === s.id)) s.id = Store.uid();
        s.title = s.title || 'Sahne';
        s.place = s.place || 'oda';
        s.speed = s.speed || 1000;
        s.created = s.created || Date.now();
        s.updated = Date.now();
        s.frames.forEach(fr => { fr.figs = Array.isArray(fr.figs) ? fr.figs : []; });
        Store.state.scenes.push(s);
      });
      toast(Store.save() ? `${list.length} sahne içe aktarıldı` : 'Depolama dolu, kaydedilemedi');
      home();
    }).catch(() => toast('Geçersiz JSON dosyası'));
  }

  function newScene() {
    const sc = {
      id: Store.uid(), title: 'Sahne ' + (Store.state.scenes.length + 1), place: 'oda', speed: 1000,
      created: Date.now(), updated: Date.now(), frames: [{ figs: [] }]
    };
    sc.frames[0].figs.push(Figure.create('m', 180, GROUND, 'Erkek 1'));
    sc.frames[0].figs.push(Figure.create('f', 300, GROUND, 'Kadın 1'));
    Store.state.scenes.push(sc);
    Store.save();
    location.hash = '#/scene/' + sc.id;
  }

  /* ---------- Düzenleyici ---------- */

  const cur = () => ed.sc.frames[ed.fi];
  const frameDur = fr => fr.dur || ed.sc.speed || 1000;
  const selFig = () => cur().figs.find(f => f.id === ed.sel);
  const allFrames = (id, fn) => ed.sc.frames.forEach(fr => fr.figs.forEach(f => { if (f.id === id) fn(f); }));

  function snapshot() {
    ed.hist.push(JSON.stringify({ frames: ed.sc.frames, place: ed.sc.place }));
    if (ed.hist.length > 60) ed.hist.shift();
  }

  function commit() {
    ed.sc.updated = Date.now();
    if (!Store.save()) toast('Depolama dolu, kaydedilemedi');
  }

  function undo() {
    if (!ed.hist.length) return toast('Geri alınacak bir şey yok');
    const s = JSON.parse(ed.hist.pop());
    ed.sc.frames = s.frames;
    ed.sc.place = s.place;
    ed.fi = Math.min(ed.fi, ed.sc.frames.length - 1);
    if (!selFig()) ed.sel = null;
    commit();
    renderAll();
  }

  function openEditor(sc) {
    ed = { sc, fi: 0, sel: null, tab: 'fig', hist: [], drag: null, playing: false, sliding: false };
    view.innerHTML = `
      <div class="editor">
        <header class="ed-top">
          <a class="icon-btn" href="#/home" aria-label="Geri">${ICON.back}</a>
          <input class="title" id="title" value="${esc(sc.title)}" maxlength="40">
          <button class="icon-btn" id="undo" aria-label="Geri al">${ICON.undo}</button>
          <button class="icon-btn primary" id="play" aria-label="Oynat">${ICON.play}</button>
        </header>
        <div class="ed-main">
          <div class="ed-left">
            <div class="stage-wrap"><svg id="stage" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"></svg></div>
            <div class="frames-bar">
              <b id="frLabel"></b>
              <label class="dur" title="Bu kareden sonrakine geçiş süresi (son karede bekleme)">Süre <input type="number" id="frDur" min="0.05" max="60" step="0.05"> sn</label>
              <label class="dur" title="Bu kareden sonrakine geçiş şekli">Geçiş <select id="frEase">${EASES.map(([id, name]) => `<option value="${id}">${name}</option>`).join('')}</select></label>
              <button class="btn" id="onion" title="Önceki kareyi soluk göster">Silüet</button>
              <button class="btn" id="addFrame">+ Kare</button>
              <button class="btn danger" id="delFrame">Kareyi sil</button>
            </div>
            <div class="frames" id="frames"></div>
          </div>
          <div class="panel" id="panel"></div>
        </div>
      </div>`;

    $('#title').onchange = e => { sc.title = e.target.value.trim() || 'Sahne'; commit(); };
    $('#undo').onclick = undo;
    $('#play').onclick = play;
    $('#frEase').onchange = e => {
      snapshot();
      cur().ease = e.target.value;
      commit();
    };
    $('#onion').onclick = () => {
      Store.state.onion = !Store.state.onion;
      Store.save();
      renderStage();
      renderFrames();
    };
    $('#addFrame').onclick = () => {
      snapshot();
      const copy = JSON.parse(JSON.stringify(cur()));
      delete copy.texts; // konuşmalar yeni karede baştan yazılır
      sc.frames.splice(ed.fi + 1, 0, copy);
      ed.fi++;
      commit();
      renderAll();
    };
    $('#delFrame').onclick = () => {
      if (sc.frames.length < 2) return;
      snapshot();
      sc.frames.splice(ed.fi, 1);
      ed.fi = Math.min(ed.fi, sc.frames.length - 1);
      commit();
      renderAll();
    };
    $('#frDur').onchange = e => {
      const v = parseFloat(String(e.target.value).replace(',', '.'));
      if (!(v > 0)) return renderFrames();
      snapshot();
      cur().dur = Math.round(Math.min(60, Math.max(0.05, v)) * 1000);
      commit();
      renderFrames();
    };
    $('#frames').onclick = e => {
      const b = e.target.closest('[data-fi]');
      if (!b) return;
      stop();
      ed.fi = +b.dataset.fi;
      renderAll();
    };
    bindStage();
    bindPanel();
    renderAll();
  }

  function renderStage() {
    const prev = Store.state.onion && ed.fi > 0 ? ed.sc.frames[ed.fi - 1] : null;
    $('#stage').innerHTML = stageInner(ed.sc, cur(), ed.sel, prev);
  }

  function renderFrames() {
    const sc = ed.sc;
    $('#frLabel').textContent = `Kare ${ed.fi + 1}/${sc.frames.length}`;
    $('#delFrame').disabled = sc.frames.length < 2;
    if (document.activeElement !== $('#frDur')) $('#frDur').value = frameDur(cur()) / 1000;
    $('#frEase').value = cur().ease || 'smooth';
    $('#onion').classList.toggle('on', !!Store.state.onion);
    $('#frames').innerHTML = sc.frames.map((fr, i) =>
      `<button class="fr ${i === ed.fi ? 'on' : ''}" data-fi="${i}">${svgBox(stageInner(sc, fr))}<span>${i + 1}</span><em>${frameDur(fr) / 1000} sn</em></button>`).join('');
    const on = $('#frames .on');
    if (on) on.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  const slider = (key, label, val, min, max, unit) =>
    `<label class="slider"><span>${label}</span><input type="range" data-sl="${key}" min="${min}" max="${max}" value="${val}"><output>${val}${unit}</output></label>`;

  const figChips = () => {
    const figs = cur().figs;
    return figs.length ? `<div class="chips mb">${figs.map(x =>
      `<button class="chip ${x.id === ed.sel ? 'on' : ''}" data-act="select" data-id="${x.id}">${esc(x.name)}</button>`).join('')}</div>` : '';
  };

  const choices = (act, list, val) => `<div class="chips mb">${list.map(([id, name]) =>
    `<button class="chip ${id === val ? 'on' : ''}" data-act="${act}" data-id="${id}">${name}</button>`).join('')}</div>`;

  function figPanel() {
    const f = selFig();
    let h = `<div class="row"><button class="btn primary" data-act="add" data-g="m">+ Erkek</button><button class="btn primary" data-act="add" data-g="f">+ Kadın</button></div>`;
    h += figChips();
    if (!f) return h + '<p class="hint">Bir figüre dokunarak seç. Eklem noktalarını sürükleyerek uzuvları hareket ettir, mor noktayla figürü taşı.</p>';

    h += `<div class="lbl">Görünüm</div><div class="row"><div class="seg">${[['front', 'Ön'], ['side', 'Yan'], ['back', 'Arka']].map(([v, n]) =>
      `<button data-act="view" data-v="${v}" class="${f.view === v ? 'on' : ''}">${n}</button>`).join('')}</div>
      <button class="btn" data-act="flip">⇋ Çevir</button></div>`;
    h += `<div class="lbl">Poz</div><div class="chips mb">${Figure.POSES.map(p =>
      `<button class="chip" data-act="pose" data-id="${p.id}">${p.name}</button>`).join('')}</div>`;
    h += slider('scale', 'Boyut', Math.round(f.scale * 100), 50, 160, '%') +
      slider('body', 'Döndür', Math.round(f.pose.body || 0), -180, 180, '°');
    h += `<div class="lbl">Katman (bu kare)</div><div class="row">
      <button class="btn" data-act="zback">Arkaya gönder</button><button class="btn" data-act="zfront">Öne getir</button>
      <button class="btn" data-act="zauto" ${f.z ? '' : 'disabled'}>Otomatik</button></div>`;
    const parts = Figure.PARTS.concat((f.limbs || []).map(l => ['L.' + l.id, l.name]));
    h += `<div class="lbl">Parça katmanı (bu kare)</div>${parts.map(([k, name]) => {
      const v = (f.parts || {})[k] || 0;
      return `<div class="part-row"><span>${esc(name)}</span><div class="seg">${[[-1, 'Arkada'], [0, 'Normal'], [1, 'Önde']].map(([n, label]) =>
        `<button data-act="part" data-k="${k}" data-v="${n}" class="${v === n ? 'on' : ''}">${label}</button>`).join('')}</div></div>`;
    }).join('')}<p class="hint">"Önde": tüm figürlerin önüne çizilir (ör. omza atılan kol). "Arkada": tüm figürlerin arkasına (ör. sırtın arkasından dolanan kol).</p>`;
    h += '<div class="row mt"><button class="btn" data-act="dup">Kopyala</button><button class="btn danger" data-act="del">Figürü sil</button></div>';
    return h;
  }

  function lookPanel() {
    const f = selFig();
    if (!f) return figChips() + '<p class="hint">Görünüşünü değiştirmek için bir figür seç.</p>';
    const lk = Figure.look(f), L = Figure.LOOKS, g = f.gender;
    const body = L.body[g].find(([, , s]) => Object.keys(s).every(k => s[k] === lk[k]));
    let h = figChips();
    h += '<div class="lbl">Saç modeli</div>' + choices('hair', L.hair[g], lk.hair);
    h += '<div class="lbl">Üst giyim</div>' + choices('top', L.top[g], lk.top);
    h += '<div class="lbl">Alt giyim</div>' + (lk.top === 'swimsuit' ? '<p class="hint">Mayo tek parça; alt giyim kullanılmaz.</p>' : choices('outfit', L.outfit[g], lk.outfit));
    h += '<div class="lbl">Beden tipi</div>' + choices('bodytype', L.body[g], body && body[0]);
    h += slider('build', 'Yapı', Math.round(lk.build * 100), 80, 130, '%');
    if (g === 'f') h += slider('hip', 'Kalça', lk.hip, 1, 5, '') + slider('bust', 'Göğüs', lk.bust, 1, 5, '');
    h += '<div class="lbl">Renkler</div>' + Object.keys(COLOR_NAMES).map(k =>
      `<div class="swatches"><span class="name">${COLOR_NAMES[k]}</span>${PALETTE[k].map(c =>
        `<button class="sw ${f.colors[k] === c ? 'on' : ''}" style="background:${c}" data-act="color" data-k="${k}" data-c="${c}" aria-label="${c}"></button>`).join('')}</div>`).join('');
    h += `<div class="lbl">Ad</div><input class="field" id="figName" value="${esc(f.name)}" maxlength="20">`;
    return h + limbPanel(f);
  }

  // Ek uzuvlar: bağlantı noktası, uzunluk, kalınlık, parça sayısı, renk ve katman
  function limbPanel(f) {
    const limbs = f.limbs || [], l = limbs.find(x => x.id === ed.limb);
    let h = `<div class="lbl mt">Ek uzuvlar</div><div class="chips mb">${limbs.map(x =>
      `<button class="chip ${x === l ? 'on' : ''}" data-act="limbsel" data-id="${x.id}">${esc(x.name)}</button>`).join('')}
      <button class="chip add" data-act="limbadd">+ Uzuv ekle</button></div>`;
    if (!l) return h + (limbs.length ? '<p class="hint">Düzenlemek için bir uzuv seç.</p>' : '<p class="hint">Kuyruk, kanat, boynuz, anten, fazladan kol... Bağlandığı noktayı ve uzunluğunu sen belirle; ucundaki pembe noktayı sürükleyerek çevir.</p>');
    const opts = Figure.ATTACH.map(([id, name]) => [id, name])
      .concat(limbs.filter(x => x !== l).map(x => ['L:' + x.id, x.name + ' ucu']));
    const colors = [...new Set([f.colors.skin, f.colors.hair, f.colors.top, f.colors.bottom].concat(PALETTE.top))];
    h += `<label class="slider"><span>Bağlantı</span><select class="field" id="limbAt">${opts.map(([id, name]) =>
      `<option value="${id}" ${l.at === id ? 'selected' : ''}>${esc(name)}</option>`).join('')}</select></label>`;
    h += slider('llen', 'Uzunluk', l.len, 4, 90, '') + slider('lw', 'Kalınlık', l.w, 2, 24, '');
    h += `<div class="row"><span class="mini">Parça</span><div class="seg">${[1, 2, 3, 4].map(n =>
      `<button data-act="limbsegs" data-n="${n}" class="${l.segs === n ? 'on' : ''}">${n}</button>`).join('')}</div>
      <div class="seg">${[[0, 'Arkada'], [1, 'Önde']].map(([v, n]) =>
      `<button data-act="limbfront" data-v="${v}" class="${!!l.front === !!v ? 'on' : ''}">${n}</button>`).join('')}</div>
      <div class="seg">${[[0, 'Sert'], [1, 'Esnek']].map(([v, n]) =>
      `<button data-act="limbsoft" data-v="${v}" class="${!!l.soft === !!v ? 'on' : ''}">${n}</button>`).join('')}</div></div>`;
    h += `<div class="swatches"><span class="name">Renk</span>${colors.map(c =>
      `<button class="sw ${l.color === c ? 'on' : ''}" style="background:${c}" data-act="limbcolor" data-c="${c}" aria-label="${c}"></button>`).join('')}</div>`;
    h += `<div class="row"><input class="field" id="limbName" value="${esc(l.name)}" maxlength="20"><button class="btn danger" data-act="limbdel">Uzvu sil</button></div>`;
    return h;
  }

  function textPanel() {
    const fr = cur(), texts = fr.texts || [], figs = fr.figs, prev = sc => sc && (sc.texts || []).length;
    let h = `<div class="row">
      <button class="btn primary" data-act="txtadd" data-k="speech">+ Konuşma</button>
      <button class="btn" data-act="txtadd" data-k="think">+ Düşünce</button>
      <button class="btn" data-act="txtadd" data-k="caption">+ Altyazı</button></div>`;
    if (!texts.length && prev(ed.sc.frames[ed.fi - 1])) h += '<div class="row"><button class="btn" data-act="txtcopy">Önceki karenin metinlerini kopyala</button></div>';
    h += texts.map(t => `<div class="txt-item">
      <div class="row"><div class="seg">${Texts.KINDS.map(([k, n]) =>
        `<button data-act="txtkind" data-id="${t.id}" data-k="${k}" class="${t.kind === k ? 'on' : ''}">${n}</button>`).join('')}</div>
        <button class="btn danger" data-act="txtdel" data-id="${t.id}">Sil</button></div>
      ${t.kind === 'caption' ? '' : `<label class="slider"><span>Konuşan</span><select class="field" data-tsel="${t.id}">${figs.map(f =>
        `<option value="${f.id}" ${t.fig === f.id ? 'selected' : ''}>${esc(f.name)}</option>`).join('')}<option value="" ${figs.some(f => f.id === t.fig) ? '' : 'selected'}>Kimse (serbest)</option></select></label>`}
      <textarea class="field txt-area" data-tin="${t.id}" rows="2" placeholder="Metni yaz...">${esc(t.text)}</textarea></div>`).join('');
    return h + '<p class="hint">Metinler yalnızca bu karede görünür. Balonları sahnede sürükleyerek yerleştirebilirsin.</p>';
  }

  function scenePanel() {
    const sc = ed.sc;
    return `<div class="lbl">Mekan</div><div class="places">${Places.LIST.map(p =>
      `<button class="place ${sc.place === p.id ? 'on' : ''}" data-act="place" data-id="${p.id}">${svgBox(p.draw())}<span>${p.name}</span></button>`).join('')}</div>
      <div class="lbl mt">Varsayılan kare süresi</div>
      <div class="row"><label class="dur"><input type="number" id="sceneDur" min="0.05" max="60" step="0.05" value="${(sc.speed || 1000) / 1000}"> sn</label>
      <button class="btn" data-act="durall">Tüm karelere uygula</button></div>
      <p class="hint">Süresi ayrıca girilmemiş kareler bunu kullanır. Tek bir karenin süresini kare şeridinin üstünden değiştirebilirsin.</p>
      <div class="lbl mt">Fizik</div>
      <div class="row"><div class="seg">${[[1, 'Yaylanma açık'], [0, 'Kapalı']].map(([v, n]) =>
      `<button data-act="physics" data-v="${v}" class="${(sc.physics !== false) === !!v ? 'on' : ''}">${n}</button>`).join('')}</div></div>
      <p class="hint">Oynatırken saç, etek ve "esnek" işaretli uzuvlar hareketin arkasından sallanır.</p>
      <div class="lbl mt">Dosya</div>
      <div class="row"><button class="btn" data-act="export">Sahneyi JSON olarak indir</button></div>`;
  }

  function renderPanel() {
    $('#panel').innerHTML = `<div class="tabs">
        <button data-tab="fig" class="${ed.tab === 'fig' ? 'on' : ''}">Figür</button>
        <button data-tab="look" class="${ed.tab === 'look' ? 'on' : ''}">Görünüş</button>
        <button data-tab="text" class="${ed.tab === 'text' ? 'on' : ''}">Metin</button>
        <button data-tab="place" class="${ed.tab === 'place' ? 'on' : ''}">Sahne</button>
        <button data-tab="notes" class="${ed.tab === 'notes' ? 'on' : ''}">Notlar</button>
      </div>` + (ed.tab === 'fig' ? figPanel() : ed.tab === 'look' ? lookPanel() : ed.tab === 'text' ? textPanel() : ed.tab === 'place' ? scenePanel()
      : `<div class="lbl">Sahne notları</div><textarea class="field notes" id="notes" placeholder="Sahneyle ilgili notlar, diyaloglar, fikirler...">${esc(ed.sc.notes || '')}</textarea>`);
  }

  function renderAll() {
    renderStage();
    renderFrames();
    renderPanel();
  }

  function bindPanel() {
    const panel = $('#panel');

    panel.addEventListener('click', e => {
      const t = e.target.closest('[data-tab]');
      if (t) { ed.tab = t.dataset.tab; return renderPanel(); }
      const b = e.target.closest('[data-act]');
      if (!b) return;
      const sc = ed.sc, f = selFig(), act = b.dataset.act;
      stop();

      if (act === 'select') { ed.sel = b.dataset.id; renderStage(); return renderPanel(); }
      if (act === 'limbsel') { ed.limb = b.dataset.id; return renderPanel(); }
      if (act === 'export') return exportScenes([sc], sc.title);

      snapshot();
      const limbs = fn => allFrames(f.id, x => { const l = (x.limbs || []).find(y => y.id === ed.limb); if (l) fn(l, x); });
      if (act === 'add') {
        const n = cur().figs.length;
        const fig = Figure.create(b.dataset.g, 120 + (n * 70) % 260, GROUND, nextName(sc, b.dataset.g));
        sc.frames.forEach(fr => fr.figs.push(JSON.parse(JSON.stringify(fig))));
        ed.sel = fig.id;
      } else if (act === 'place') {
        sc.place = b.dataset.id;
      } else if (act === 'durall') {
        sc.frames.forEach(fr => { delete fr.dur; });
      } else if (act === 'physics') {
        sc.physics = b.dataset.v === '1';
      } else if (act === 'txtadd') {
        const fr = cur(), k = b.dataset.k;
        const speaker = k === 'caption' ? '' : (f || fr.figs[0] || {}).id || '';
        fr.texts = (fr.texts || []).concat({ id: Store.uid(), kind: k, fig: speaker, text: '', dx: 0, dy: -16 });
        ed.focusText = fr.texts[fr.texts.length - 1].id;
      } else if (act === 'txtkind') {
        cur().texts.find(t => t.id === b.dataset.id).kind = b.dataset.k;
      } else if (act === 'txtdel') {
        cur().texts = cur().texts.filter(t => t.id !== b.dataset.id);
      } else if (act === 'txtcopy') {
        cur().texts = JSON.parse(JSON.stringify(sc.frames[ed.fi - 1].texts || [])).map(t => Object.assign(t, { id: Store.uid() }));
      } else if (!f) {
        ed.hist.pop();
        return;
      } else if (act === 'view') {
        f.view = b.dataset.v;
      } else if (act === 'flip') {
        f.flip = !f.flip;
      } else if (act === 'pose') {
        const b0 = Figure.bottom(f), keep = {};
        Object.keys(f.pose).forEach(k => { if (k.startsWith('x.')) keep[k] = f.pose[k]; }); // ek uzuv açıları kalsın
        f.pose = Object.assign(keep, Figure.POSES.find(p => p.id === b.dataset.id).pose);
        f.y += b0 - Figure.bottom(f); // ayaklar / en alt nokta yerde kalsın
      } else if (act === 'color') {
        allFrames(f.id, x => { x.colors[b.dataset.k] = b.dataset.c; });
      } else if (act === 'hair' || act === 'outfit' || act === 'top') {
        allFrames(f.id, x => { x[act] = b.dataset.id; });
      } else if (act === 'zfront' || act === 'zback') {
        const others = cur().figs.filter(x => x !== f).map(x => x.z || 0);
        f.z = act === 'zfront' ? Math.max(0, ...others) + 1 : Math.min(0, ...others) - 1;
      } else if (act === 'zauto') {
        delete f.z;
      } else if (act === 'part') {
        const parts = Object.assign({}, f.parts, { [b.dataset.k]: +b.dataset.v });
        Object.keys(parts).forEach(k => { if (!parts[k]) delete parts[k]; });
        if (Object.keys(parts).length) f.parts = parts;
        else delete f.parts;
      } else if (act === 'limbadd') {
        const l = { id: Store.uid(), name: 'Uzuv ' + ((f.limbs || []).length + 1), at: 'hip', len: 30, w: 6, segs: 2, color: f.colors.skin, front: false };
        allFrames(f.id, x => { x.limbs = (x.limbs || []).concat(Object.assign({}, l)); });
        ed.limb = l.id;
      } else if (act === 'limbsegs') {
        limbs(l => { l.segs = +b.dataset.n; });
      } else if (act === 'limbfront') {
        limbs(l => { l.front = b.dataset.v === '1'; });
      } else if (act === 'limbsoft') {
        limbs(l => { l.soft = b.dataset.v === '1'; });
      } else if (act === 'limbcolor') {
        limbs(l => { l.color = b.dataset.c; });
      } else if (act === 'limbdel') {
        const id = ed.limb;
        allFrames(f.id, x => {
          x.limbs = (x.limbs || []).filter(l => l.id !== id).map(l => l.at === 'L:' + id ? Object.assign({}, l, { at: 'hip' }) : l);
          Object.keys(x.pose).forEach(k => { if (k.startsWith(`x.${id}.`)) delete x.pose[k]; });
        });
        ed.limb = null;
      } else if (act === 'bodytype') {
        const s = Figure.LOOKS.body[f.gender].find(x => x[0] === b.dataset.id)[2];
        allFrames(f.id, x => { x.shape = Object.assign({}, x.shape, s); });
      } else if (act === 'dup') {
        const id = Store.uid(), name = nextName(sc, f.gender);
        sc.frames.forEach(fr => {
          const src = fr.figs.find(x => x.id === f.id);
          if (src) fr.figs.push(Object.assign(JSON.parse(JSON.stringify(src)), { id, name, x: Math.min(W - 20, src.x + 40) }));
        });
        ed.sel = id;
      } else if (act === 'del') {
        sc.frames.forEach(fr => { fr.figs = fr.figs.filter(x => x.id !== f.id); });
        ed.sel = null;
      }
      commit();
      renderAll();
      if (ed.focusText) {
        const ta = panel.querySelector(`[data-tin="${ed.focusText}"]`);
        ed.focusText = null;
        if (ta) ta.focus();
      }
    });

    panel.addEventListener('input', e => {
      if (e.target.id === 'notes') {
        ed.sc.notes = e.target.value;
        return commit();
      }
      if (e.target.dataset.tin) {
        cur().texts.find(t => t.id === e.target.dataset.tin).text = e.target.value;
        commit();
        return renderStage();
      }
      const f = selFig();
      if (!f) return;
      if (e.target.id === 'figName') {
        const name = e.target.value.trim() || f.name;
        return allFrames(f.id, x => { x.name = name; });
      }
      if (e.target.id === 'limbName') {
        const name = e.target.value.trim() || 'Uzuv';
        return allFrames(f.id, x => (x.limbs || []).forEach(l => { if (l.id === ed.limb) l.name = name; }));
      }
      const key = e.target.dataset.sl;
      if (!key) return;
      if (!ed.sliding) { snapshot(); ed.sliding = true; }
      const v = +e.target.value;
      if (key === 'llen' || key === 'lw') {
        allFrames(f.id, x => (x.limbs || []).forEach(l => { if (l.id === ed.limb) l[key === 'llen' ? 'len' : 'w'] = v; }));
        e.target.nextElementSibling.textContent = v;
      } else if (key === 'scale') {
        const b0 = Figure.bottom(f);
        f.scale = v / 100;
        f.y += b0 - Figure.bottom(f);
        e.target.nextElementSibling.textContent = v + '%';
      } else if (key === 'body') {
        f.pose.body = v;
        e.target.nextElementSibling.textContent = v + '°';
      } else {
        const val = key === 'build' ? v / 100 : v;
        allFrames(f.id, x => { x.shape = Object.assign({}, x.shape, { [key]: val }); });
        e.target.nextElementSibling.textContent = v + (key === 'build' ? '%' : '');
      }
      renderStage();
    });

    panel.addEventListener('change', e => {
      if (e.target.id === 'figName' || e.target.id === 'limbName') { commit(); return renderPanel(); }
      if (e.target.dataset.tin) return renderFrames();
      if (e.target.dataset.tsel) {
        snapshot();
        cur().texts.find(t => t.id === e.target.dataset.tsel).fig = e.target.value;
        commit();
        return renderAll();
      }
      if (e.target.id === 'limbAt') {
        const f = selFig();
        snapshot();
        allFrames(f.id, x => (x.limbs || []).forEach(l => { if (l.id === ed.limb) l.at = e.target.value; }));
        commit();
        return renderAll();
      }
      if (e.target.id === 'sceneDur') {
        const v = parseFloat(String(e.target.value).replace(',', '.'));
        if (v > 0) { ed.sc.speed = Math.round(Math.min(60, Math.max(0.05, v)) * 1000); commit(); }
        renderFrames();
        return renderPanel();
      }
      if (!e.target.dataset.sl) return;
      ed.sliding = false;
      commit();
      renderFrames();
      if (ed.tab === 'look') renderPanel(); // beden tipi seçimi güncellensin
    });
  }

  /* ---------- Sahnede sürükleme ---------- */

  function bindStage() {
    const svg = $('#stage');
    const pt = e => new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM().inverse());
    const local = (f, p) => ({ x: (p.x - f.x) / (f.flip ? -f.scale : f.scale), y: (p.y - f.y) / f.scale });

    svg.addEventListener('pointerdown', e => {
      if (ed.playing) return;
      const tb = e.target.closest('[data-txt]');
      if (tb) {
        const t = cur().texts.find(x => x.id === tb.dataset.txt), p = pt(e);
        if (ed.tab !== 'text') { ed.tab = 'text'; renderPanel(); }
        if (t.kind === 'caption') return;
        snapshot();
        ed.drag = { text: t, px: p.x, py: p.y, dx: t.dx || 0, dy: t.dy == null ? -16 : t.dy, moved: false };
        svg.setPointerCapture(e.pointerId);
        return e.preventDefault();
      }
      const g = e.target.closest('[data-fig]'), h = e.target.closest('[data-h]');
      if (!g) {
        if (ed.sel) { ed.sel = null; renderStage(); renderPanel(); }
        return;
      }
      const f = cur().figs.find(x => x.id === g.dataset.fig);
      const limb = h && h.dataset.h.startsWith('L.') && h.dataset.h.split('.')[1];
      if (ed.sel !== f.id || (limb && ed.limb !== limb)) {
        ed.sel = f.id;
        if (limb) ed.limb = limb;
        renderPanel();
      }
      const p = pt(e);
      snapshot();
      ed.drag = { f, h: h && h.dataset.h !== 'root' ? h.dataset.h : null, dx: p.x - f.x, dy: p.y - f.y, moved: false };
      svg.setPointerCapture(e.pointerId);
      renderStage();
      e.preventDefault();
    });

    svg.addEventListener('pointermove', e => {
      const d = ed && ed.drag;
      if (!d) return;
      const p = pt(e), f = d.f;
      if (d.text) {
        d.text.dx = Math.round(d.dx + p.x - d.px);
        d.text.dy = Math.round(d.dy + p.y - d.py);
      } else if (d.h) Figure.aim(f, d.h, local(f, p));
      else {
        f.x = Math.max(0, Math.min(W, p.x - d.dx));
        f.y = Math.max(20, Math.min(H + 40, p.y - d.dy));
      }
      d.moved = true;
      renderStage();
    });

    const end = () => {
      const d = ed && ed.drag;
      if (!d) return;
      ed.drag = null;
      if (!d.moved) { ed.hist.pop(); return; }
      commit();
      renderFrames();
    };
    svg.addEventListener('pointerup', end);
    svg.addEventListener('pointercancel', end);
  }

  /* ---------- Oynatma ---------- */

  // Kareler arasında figür değişti mi (zıplama yalnızca hareket edenlere uygulanır)
  const moved = (a, b) => a.x !== b.x || a.y !== b.y || a.view !== b.view ||
    Object.keys(Object.assign({}, a.pose, b.pose)).some(k => (a.pose[k] || 0) !== (b.pose[k] || 0));

  // Yaylanma: başın yatay hızı hedef açıyı belirler, sönümlü yay o açıya doğru salınır
  function spring(springs, f, dt) {
    const a = Figure.anchor(f, 'head');
    const s = springs[f.id] || (springs[f.id] = { s: 0, v: 0, x: null });
    if (s.x !== null && dt > 0) {
      const vx = (a.x - s.x) / dt * (f.flip ? -1 : 1);
      const target = Math.max(-35, Math.min(35, vx * 0.12));
      s.v += (90 * (target - s.s) - 7 * s.v) * dt;
      s.s += s.v * dt;
    }
    s.x = a.x;
    f.sway = s.s;
  }

  function play() {
    if (ed.playing) return stop();
    const sc = ed.sc, n = sc.frames.length;
    if (n < 2) return toast('Oynatmak için en az 2 kare ekle');
    ed.playing = true;
    $('#play').innerHTML = ICON.stop;
    // Her kare kendi süresi kadar sonrakine geçer; son karenin süresi döngü öncesi bekleme
    const durs = sc.frames.map(frameDur), cycle = durs.reduce((a, v) => a + v, 0);
    const springs = {};
    let t0 = null, last = null, lastI = 0;
    const tick = now => {
      if (!ed || !ed.playing) return;
      if (t0 === null) t0 = last = now; // rAF zamanı performance.now()'dan önce olabilir
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      let t = (now - t0) % cycle, i = 0;
      while (i < n - 1 && t >= durs[i]) t -= durs[i++];
      const A = sc.frames[i];
      let figs;
      if (i < n - 1) {
        const B = sc.frames[i + 1], kind = A.ease || 'smooth', u = t / durs[i];
        const k = (EASES.find(e => e[0] === kind) || EASES[0])[2](u);
        figs = A.figs.map(f => {
          const g = B.figs.find(x => x.id === f.id), o = g ? Figure.interp(f, g, k) : Object.assign({}, f);
          if (kind === 'jump' && g && moved(f, g)) o.y -= 4 * JUMP * f.scale * u * (1 - u);
          return o;
        });
      } else {
        figs = A.figs.map(f => Object.assign({}, f));
      }
      if (sc.physics !== false) {
        if (i < lastI) Object.keys(springs).forEach(id => { springs[id].x = null; }); // döngü başa sardı: sıçrama olmasın
        figs.forEach(f => spring(springs, f, dt));
      }
      lastI = i;
      $('#stage').innerHTML = stageInner(sc, { figs, texts: A.texts });
      ed.raf = requestAnimationFrame(tick);
    };
    ed.raf = requestAnimationFrame(tick);
  }

  function stop() {
    if (!ed || !ed.playing) return;
    ed.playing = false;
    cancelAnimationFrame(ed.raf);
    $('#play').innerHTML = ICON.play;
    renderStage();
  }

  /* ---------- Yönlendirme ---------- */

  function route() {
    stop();
    const m = location.hash.match(/^#\/scene\/(.+)$/);
    const sc = m && Store.state.scenes.find(s => s.id === m[1]);
    if (sc) openEditor(sc);
    else home();
    window.scrollTo(0, 0);
  }

  window.addEventListener('hashchange', route);
  document.addEventListener('keydown', e => {
    if (ed && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
      e.preventDefault();
      undo();
    }
  });
  route();

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
