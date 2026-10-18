/*
 * Amor Director - Kareye bağlı metinler (konuşma / düşünce balonu, altyazı)
 *
 * frame.texts: [{ id, kind: 'speech' | 'think' | 'caption', fig (konuşan figür id), text, dx, dy }]
 *   Balon, konuşanın başının üstüne (dx, dy kaydırmasıyla) yerleşir; altyazılar alt kenarda üst üste dizilir.
 */
window.Director = window.Director || {};

Director.Texts = (() => {
  const W = Director.Places.W, H = Director.Places.H, LH = 15, CHAR = 6.9;
  const KINDS = [['speech', 'Konuşma'], ['think', 'Düşünce'], ['caption', 'Altyazı']];
  const FONT = `font-family="-apple-system, 'Segoe UI', Roboto, Arial, sans-serif" font-size="13"`;
  const INK = '#1d1d28';

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const n1 = v => Math.round(v * 10) / 10;

  // Satırlara böl (kelime kelime, çok uzun kelimeyi keser)
  function wrap(text, max) {
    const out = [];
    String(text).split('\n').forEach(par => {
      let line = '';
      par.split(/\s+/).forEach(w => {
        if (!w) return;
        if (line && (line + ' ' + w).length > max) { out.push(line); line = w; }
        else line = line ? line + ' ' + w : w;
        while (line.length > max) { out.push(line.slice(0, max)); line = line.slice(max); }
      });
      out.push(line);
    });
    while (out.length > 1 && !out[out.length - 1]) out.pop();
    return out;
  }

  const lines = (ls, cx, y0, fill, weight) => ls.map((l, i) =>
    `<text x="${n1(cx)}" y="${n1(y0 + LH * (i + 1) - 3)}" text-anchor="middle" fill="${fill}"${weight ? ` font-weight="${weight}"` : ''}>${esc(l)}</text>`).join('');

  // anchorOf(figId) -> konuşanın baş üstü noktası ya da null
  function svg(frame, anchorOf) {
    const list = (frame.texts || []).filter(t => t.text && t.text.trim());
    let o = '', capY = H - 8;

    list.filter(t => t.kind === 'caption').reverse().forEach(t => {
      const ls = wrap(t.text.trim(), 76), h = ls.length * LH + 10, y = capY - h;
      o += `<g data-txt="${t.id}" class="txt" ${FONT}><rect x="12" y="${n1(y)}" width="${W - 24}" height="${h}" rx="8" fill="#140f24" fill-opacity=".74"/>` +
        lines(ls, W / 2, y + 5, '#fff', 600) + '</g>';
      capY = y - 4;
    });

    list.filter(t => t.kind !== 'caption').forEach(t => {
      const a = anchorOf(t.fig);
      const ls = wrap(t.text.trim(), 22);
      const w = Math.max(40, Math.max(...ls.map(l => l.length)) * CHAR + 20), h = ls.length * LH + 12;
      const base = a || { x: W / 2, y: 110 };
      const cx = clamp(base.x + (t.dx || 0), w / 2 + 4, W - w / 2 - 4);
      const bottom = clamp(base.y + (t.dy == null ? -16 : t.dy), h + 4, H - 4);
      const x = cx - w / 2, y = bottom - h;
      const tail = a && a.y - 4 > bottom + 4; // baş balonun altındaysa kuyruk çiz
      const tx = a ? clamp(a.x, x + 14, x + w - 14) : cx;
      let g = '';
      if (t.kind === 'think') {
        if (tail) {
          [[0.35, 4.2], [0.72, 2.6]].forEach(([k, r]) => {
            g += `<circle cx="${n1(tx + (a.x - tx) * k)}" cy="${n1(bottom + (a.y - 4 - bottom) * k)}" r="${r}" fill="#fff" stroke="${INK}" stroke-width="1.4"/>`;
          });
        }
        g += `<rect x="${n1(x)}" y="${n1(y)}" width="${n1(w)}" height="${h}" rx="${Math.min(h / 2, 18)}" fill="#fff" stroke="${INK}" stroke-width="1.5"/>`;
      } else {
        g += `<rect x="${n1(x)}" y="${n1(y)}" width="${n1(w)}" height="${h}" rx="10" fill="#fff" stroke="${INK}" stroke-width="1.5"/>`;
        if (tail) {
          g += `<path d="M${n1(tx - 6)} ${n1(bottom)}L${n1(a.x)} ${n1(a.y - 4)}L${n1(tx + 6)} ${n1(bottom)}" fill="#fff" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>` +
            `<path d="M${n1(tx - 5)} ${n1(bottom)}H${n1(tx + 5)}" stroke="#fff" stroke-width="2.6"/>`;
        }
      }
      o += `<g data-txt="${t.id}" class="txt" ${FONT}>${g}${lines(ls, cx, y + 6, INK)}</g>`;
    });
    return o;
  }

  return { KINDS, svg };
})();
