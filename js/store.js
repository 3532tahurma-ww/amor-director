/*
 * Amor Director - Kalıcı veri (localStorage)
 * Sunucu yok: her şey kullanıcının tarayıcısında saklanır.
 *
 * scenes: [{ id, title, notes, place, speed (kare süresi ms), created, updated,
 *            physics (yaylanma, varsayılan açık),
 *            frames: [{ figs: [figür], dur?, ease?, texts?: [metin] }] }]
 *   dur: sonraki kareye geçiş süresi (ms), ease: geçiş türü, texts: bkz. texts.js
 * onion: önceki kare silüeti açık mı
 * figür:  { id, gender: 'm' | 'f', name, view: 'front' | 'side' | 'back', flip,
 *           x, y (kalça noktası), scale, colors: { skin, hair, top, bottom, shoe }, pose: { açılar } }
 *   Aynı figür her karede aynı id ile bulunur; oynatırken kareler arası geçiş yapılır.
 */
window.Director = window.Director || {};

Director.Store = (() => {
  const KEY = 'amor-director:v1';
  const defaults = () => ({ scenes: [] });

  const read = k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  let state = Object.assign(defaults(), read(KEY));

  // Kota dolarsa false döner
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); return true; }
    catch (e) { return false; }
  }

  return { get state() { return state; }, save, uid };
})();
