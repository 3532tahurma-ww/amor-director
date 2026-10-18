/*
 * Amor Director - Basit insan figürü (iskelet + çizim)
 *
 * Figür kalça noktasından (0,0) kurulur. Açılar derece, + saat yönü:
 *   body      tüm beden (kalça etrafında)      torso  gövde (kalçaya göre)
 *   head      baş (gövdeye göre)
 *   *Shoulder üst kol (0 = gövde boyunca aşağı)  *Elbow ön kol (üst kola göre)
 *   *Hip      uyluk (0 = aşağı)                 *Knee  baldır (uyluğa göre)
 * r = figürün sağı, l = solu. Yan görünümde figür sağa bakar (flip ile sola),
 * yakın taraf r'dir; öne = eksi açı, diz artı bükülür.
 *
 * Görünüş (tüm karelerde ortak): hair (saç modeli), outfit (kıyafet),
 * shape: { build (yapı, 1 = normal), hip (kalça 1-5), bust (göğüs 1-5) }
 */
window.Director = window.Director || {};

Director.Figure = (() => {
  const L = { torso: 46, neck: 4, headR: 12, uArm: 27, fArm: 25, thigh: 38, shin: 37 };
  const LEG = L.thigh + L.shin + 4; // kalçadan ayak tabanına
  const KEYS = ['body', 'torso', 'head', 'rShoulder', 'rElbow', 'lShoulder', 'lElbow', 'rHip', 'rKnee', 'lHip', 'lKnee'];

  const base = o => { const p = {}; KEYS.forEach(k => { p[k] = 0; }); return Object.assign(p, o); };

  const POSES = [
    { id: 'stand', name: 'Ayakta', pose: base({ rShoulder: 8, rElbow: -4, lShoulder: -8, lElbow: 4 }) },
    { id: 'walk', name: 'Yürüme', pose: base({ rShoulder: 28, rElbow: -18, lShoulder: -28, lElbow: -25, rHip: -22, rKnee: 8, lHip: 18, lKnee: 22 }) },
    { id: 'run', name: 'Koşma', pose: base({ torso: 14, head: -8, rShoulder: 55, rElbow: -85, lShoulder: -60, lElbow: -80, rHip: -60, rKnee: 55, lHip: 30, lKnee: 80 }) },
    { id: 'sit', name: 'Oturma', pose: base({ rShoulder: -25, rElbow: -45, lShoulder: -20, lElbow: -50, rHip: -88, rKnee: 88, lHip: -84, lKnee: 84 }) },
    { id: 'kneel', name: 'Diz çökme', pose: base({ rShoulder: 10, rElbow: -10, lShoulder: -10, lElbow: -10, rHip: -90, rKnee: 90, lKnee: 90 }) },
    { id: 'wave', name: 'El sallama', pose: base({ rShoulder: 8, rElbow: -4, lShoulder: -145, lElbow: -35 }) },
    { id: 'cheer', name: 'Sevinç', pose: base({ rShoulder: 155, rElbow: 15, lShoulder: -155, lElbow: -15 }) },
    { id: 'point', name: 'İşaret', pose: base({ rShoulder: 8, rElbow: -4, lShoulder: -95, lElbow: -5 }) },
    { id: 'think', name: 'Düşünme', pose: base({ head: 8, rShoulder: -25, rElbow: -140, lShoulder: 25, lElbow: 95 }) },
    { id: 'hug', name: 'Kucaklama', pose: base({ rShoulder: -80, rElbow: -30, lShoulder: -85, lElbow: -25 }) },
    { id: 'lie', name: 'Uzanma', pose: base({ body: -90, rShoulder: 6, lShoulder: -6 }) }
  ];

  const COLORS = {
    m: { skin: '#f1c7a5', hair: '#3b2a20', top: '#4f7cff', bottom: '#2f3550', shoe: '#2a2a33' },
    f: { skin: '#f8d9c0', hair: '#6b3b22', top: '#ff5d9e', bottom: '#7b5cff', shoe: '#2a2a33' }
  };

  // Seçenekler: [id, ad, (beden tipinde) şekil]
  const LOOKS = {
    hair: {
      m: [['short', 'Kısa'], ['curly', 'Kıvırcık'], ['bob', 'Uzun'], ['bald', 'Kel']],
      f: [['long', 'Uzun'], ['bob', 'Küt'], ['ponytail', 'At kuyruğu'], ['bun', 'Topuz'], ['curly', 'Kıvırcık'], ['short', 'Kısa']]
    },
    top: {
      m: [['tshirt', 'Tişört'], ['longsleeve', 'Uzun kollu'], ['tank', 'Atlet'], ['jacket', 'Ceket'], ['none', 'Üstsüz']],
      f: [['tshirt', 'Tişört'], ['longsleeve', 'Uzun kollu'], ['tank', 'Askılı'], ['crop', 'Crop'], ['jacket', 'Ceket'],
        ['bikini', 'Bikini üstü'], ['swimsuit', 'Mayo']]
    },
    outfit: {
      m: [['pants', 'Pantolon'], ['shorts', 'Şort'], ['trunks', 'Mayo şort']],
      f: [['skirt', 'Etek'], ['mini', 'Mini etek'], ['longskirt', 'Uzun etek'], ['dress', 'Elbise'], ['pants', 'Pantolon'],
        ['shorts', 'Şort'], ['bikini', 'Bikini altı']]
    },
    body: {
      m: [['thin', 'İnce', { build: 0.85 }], ['normal', 'Normal', { build: 1 }], ['athletic', 'Atletik', { build: 1.12 }], ['big', 'İri', { build: 1.28 }]],
      f: [['thin', 'İnce', { build: 0.85, hip: 2, bust: 2 }], ['normal', 'Normal', { build: 1, hip: 3, bust: 3 }],
        ['hourglass', 'Kum saati', { build: 1, hip: 4, bust: 4 }], ['pear', 'Armut', { build: 1, hip: 5, bust: 2 }],
        ['curvy', 'Dolgun', { build: 1.2, hip: 5, bust: 5 }]]
    }
  };

  // Ek uzuv bağlantı noktaları: [nokta, ad, uzvun 0° yönü olarak alınan kemik]
  const ATTACH = [
    ['top', 'Baş üstü', 'head'], ['head', 'Baş', 'head'], ['chest', 'Boyun', 'torso'], ['sh', 'Göğüs', 'torso'],
    ['mid', 'Bel', 'torso'], ['hip', 'Kalça', 'leg'],
    ['rSh', 'Sağ omuz', 'rU'], ['lSh', 'Sol omuz', 'lU'], ['rElbow', 'Sağ dirsek', 'rF'], ['lElbow', 'Sol dirsek', 'lF'],
    ['rHand', 'Sağ el', 'rF'], ['lHand', 'Sol el', 'lF'], ['rHp', 'Sağ kalça', 'rT'], ['lHp', 'Sol kalça', 'lT'],
    ['rKnee', 'Sağ diz', 'rS'], ['lKnee', 'Sol diz', 'lS'], ['rFoot', 'Sağ ayak', 'rS'], ['lFoot', 'Sol ayak', 'lS']
  ];

  function look(f) {
    const fem = f.gender === 'f', s = f.shape || {};
    return {
      hair: f.hair || (fem ? 'long' : 'short'), outfit: f.outfit || (fem ? 'skirt' : 'pants'), top: f.top || 'tshirt',
      build: s.build || 1, hip: s.hip || 3, bust: s.bust || 3
    };
  }

  const rad = a => a * Math.PI / 180;
  const at = (o, a, l) => ({ x: o.x + Math.cos(rad(a)) * l, y: o.y + Math.sin(rad(a)) * l });
  const n1 = v => Math.round(v * 10) / 10;
  const xy = p => n1(p.x) + ' ' + n1(p.y);
  const norm = a => ((a + 180) % 360 + 360) % 360 - 180;
  const shade = (hex, k) => '#' + [1, 3, 5].map(i =>
    Math.round(parseInt(hex.slice(i, i + 2), 16) * k).toString(16).padStart(2, '0')).join('');

  // Eklem noktaları (P) ve kemik yönleri (d, mutlak açı)
  function solve(f) {
    const p = base(f.pose), lk = look(f), fem = f.gender === 'f';
    const spread = f.view === 'front' ? 1 : f.view === 'back' ? -1 : 0;
    const P = { hip: { x: 0, y: 0 } }, d = {};
    d.pelvis = -90 + p.body;
    d.torso = d.pelvis + p.torso;
    d.head = d.torso + p.head;
    d.arm = d.torso + 180;
    d.leg = d.pelvis + 180;
    P.chest = at(P.hip, d.torso, L.torso);
    P.sh = at(P.hip, d.torso, L.torso - 8);
    P.head = at(P.chest, d.head, L.neck + L.headR);
    P.top = at(P.chest, d.head, L.neck + 2 * L.headR);
    ['r', 'l'].forEach(s => {
      const k = (s === 'r' ? -1 : 1) * spread;
      P[s + 'Sh'] = at(P.sh, d.torso + 90, k * (fem ? 9 : 11) * lk.build);
      d[s + 'U'] = d.arm + p[s + 'Shoulder'];
      P[s + 'Elbow'] = at(P[s + 'Sh'], d[s + 'U'], L.uArm);
      d[s + 'F'] = d[s + 'U'] + p[s + 'Elbow'];
      P[s + 'Hand'] = at(P[s + 'Elbow'], d[s + 'F'], L.fArm);
      P[s + 'Hp'] = at(P.hip, d.pelvis + 90, k * (fem ? 4.6 + lk.hip * 0.7 : 6) * lk.build);
      d[s + 'T'] = d.leg + p[s + 'Hip'];
      P[s + 'Knee'] = at(P[s + 'Hp'], d[s + 'T'], L.thigh);
      d[s + 'S'] = d[s + 'T'] + p[s + 'Knee'];
      P[s + 'Foot'] = at(P[s + 'Knee'], d[s + 'S'], L.shin);
    });
    P.mid = at(P.hip, d.torso, 22);

    // Ek uzuvlar: P['L.<id>.<i>'] i. parçanın ucu; açı anahtarı pose['x.<id>.<i>'] (bir öncekine göre)
    (f.limbs || []).forEach(l => {
      const ref = l.at.startsWith('L:') && f.limbs.find(x => x.id === l.at.slice(2));
      const end = ref && `L.${ref.id}.${ref.segs - 1}`;
      let o, dir;
      if (end && P[end]) { o = P[end]; dir = d[end]; }
      else { const a = ATTACH.find(x => x[0] === l.at) || ATTACH[5]; o = P[a[0]]; dir = d[a[2]]; }
      P[`L.${l.id}.s`] = o;
      d[`L.${l.id}.a`] = dir;
      for (let i = 0; i < l.segs; i++) {
        dir += p[`x.${l.id}.${i}`] || 0;
        if (l.soft && f.sway) dir += f.sway * 0.5 * Math.sin(rad(dir)); // esnek uzuv: uç geriden gelir
        o = at(o, dir, l.len);
        P[`L.${l.id}.${i}`] = o;
        d[`L.${l.id}.${i}`] = dir;
      }
    });
    return { P, d };
  }

  const path = (pts, col, w) => `<path d="M${pts.map(xy).join('L')}" fill="none" stroke="${col}" stroke-width="${n1(w)}" stroke-linecap="round" stroke-linejoin="round"/>`;

  function hull(pts) {
    pts = pts.slice().sort((a, b) => a.x - b.x || a.y - b.y);
    const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    const half = list => {
      const h = [];
      list.forEach(p => {
        while (h.length > 1 && cross(h[h.length - 2], h[h.length - 1], p) <= 0) h.pop();
        h.push(p);
      });
      h.pop();
      return h;
    };
    return half(pts).concat(half(pts.slice().reverse()));
  }

  const poly = (pts, col) => `<path d="M${hull(pts).map(xy).join('L')}Z" fill="${col}" stroke="${col}" stroke-width="3" stroke-linejoin="round"/>`;

  // Baş (yerel: merkez 0,0, yukarı = -y, yüz +x yönüne). back: gövdenin arkasında kalan saç
  function head(f, C, lk) {
    const r = L.headR, s = C.skin, h = C.hair, st = lk.hair, fem = f.gender === 'f';
    const c = (x, y, R, fill) => `<circle cx="${x}" cy="${y}" r="${R}" fill="${fill}"/>`;
    const knot = (x, y, R) => `<circle cx="${x}" cy="${y}" r="${R}" fill="${h}" stroke="${shade(h, 0.8)}" stroke-width="1"/>`;
    const rect = (x, y, w, hh, rx) => `<rect x="${x}" y="${y}" width="${w}" height="${hh}" rx="${rx}" fill="${h}"/>`;
    const tail = dd => `<path d="${dd}" fill="none" stroke="${h}" stroke-width="7" stroke-linecap="round"/>`;
    const curls = (cx, cy, R, a0, a1, n) => {
      let o = '';
      for (let i = 0; i < n; i++) {
        const p = at({ x: cx, y: cy }, a0 + (a1 - a0) * i / (n - 1), R);
        o += c(n1(p.x), n1(p.y), 5, h);
      }
      return o;
    };
    const long = st === 'long', bob = st === 'bob' || (st === 'curly' && fem);
    const eye = '#2a2230', lip = '#c0607a';
    // Yaylanma: sarkan saç, hareketin tersine sallanır (oynatırken f.sway derece)
    const sway = n1(f.sway || 0);
    const swing = (str, px, py) => sway && str ? `<g transform="rotate(${sway} ${px} ${py})">${str}</g>` : str;

    if (f.view === 'back') {
      let o = c(0, 0, r, s);
      if (long) o += swing(rect(-14, -4, 28, 33, 9), 0, -6);
      if (bob) o += swing(rect(-14.5, -4, 29, 19, 8), 0, -6);
      if (st === 'curly') o += curls(0, -1, 11, 30, -210, 9);
      if (st !== 'bald') o += c(0, -1.5, r, h);
      if (st === 'ponytail') o += swing(tail('M0 -3Q-3 9 0 22'), 0, -3) + c(0, -3, 3, shade(h, 0.7));
      if (st === 'bun') o += knot(0, -9, 6.5);
      return { back: '', front: o };
    }

    if (f.view === 'side') {
      let b = '', o = '';
      if (long) b += rect(-15, -5, 17, 34, 8);
      if (bob) b += rect(-15, -5, 18, 20, 7);
      if (st === 'ponytail') b += tail('M-10 -7Q-21 0 -17 19');
      if (st === 'bun') b += knot(-11, -10, 6.5);
      if (st === 'curly') o += curls(-2, -1.5, 11, -60, -240, 7);
      if (st !== 'bald') o += c(-2.5, -2.5, r + 0.8, h);
      o += c(1, 0.5, r, s) + `<path d="M12.4 -.5L15.4 3.2L12.2 4Z" fill="${s}"/>`;
      // Başın yanını örten saç: alın çizgisi, favori, ense
      if (st !== 'bald') o += `<path d="M8.6 -8.9Q3 -7 1.5 -3Q.5 1 .8 ${long || bob ? 9 : 5}Q-5 ${long || bob ? 11 : 8} -12.3 5.7A12.8 12.8 0 1 1 8.6 -8.9Z" fill="${h}"/>`;
      if (!long && !bob) o += c(-0.5, 1.5, 2.6, shade(s, 0.88));
      if (st === 'ponytail') o += c(-10, -7, 3, shade(h, 0.7));
      o += c(6.5, -1, 1.5, eye) + `<path d="M8.5 7l3.2-.4" stroke="${lip}" stroke-width="1.4" stroke-linecap="round"/>`;
      return { back: swing(b, -7, -6), front: o };
    }

    let b = '', o = '';
    if (long) b += rect(-15, -5, 30, 34, 10);
    if (bob) b += rect(-15.5, -5, 31, 20, 8);
    if (st === 'bun') b += knot(0, -14, 6.5);
    if (st === 'bald') o += c(-12, 2, 2.6, shade(s, 0.9)) + c(12, 2, 2.6, shade(s, 0.9));
    if (st === 'curly') o += curls(0, -1, 11.5, -190, 10, 9);
    if (st !== 'bald') o += c(0, -2.5, r + 1.2, h);
    o += c(0, 0.6, r, s) + c(-4.2, 0.5, 1.5, eye) + c(4.2, 0.5, 1.5, eye) +
      (fem ? `<circle cx="-6.8" cy="4.2" r="2" fill="#ff8fb0" opacity=".45"/><circle cx="6.8" cy="4.2" r="2" fill="#ff8fb0" opacity=".45"/>` : '') +
      `<path d="M-3 5.5Q0 7.8 3 5.5" fill="none" stroke="${lip}" stroke-width="1.4" stroke-linecap="round"/>`;
    return { back: swing(b, 0, -6), front: o };
  }

  const transform = f => `translate(${n1(f.x)} ${n1(f.y)}) scale(${f.flip ? -f.scale : f.scale} ${f.scale})`;

  // layer: -1 tüm figürlerin arkası, 0 figürün kendi sırası, 1 tüm figürlerin önü; verilmezse hepsi
  function svg(f, layer) {
    const { P, d } = solve(f), lk = look(f), fem = f.gender === 'f';
    const side = f.view === 'side', back = f.view === 'back';
    const C = Object.assign({}, COLORS[f.gender], f.colors);
    const col = (k, far) => far ? shade(C[k], 0.8) : C[k];
    const b = lk.build, bw = Math.pow(b, 0.7);
    const along = (t, off) => at(at(P.hip, d.torso, t), d.torso + 90, off);   // gövde ekseninde
    const alongP = (t, off) => at(at(P.hip, d.pelvis, t), d.pelvis + 90, off); // kalça ekseninde
    const legW = (fem ? 7.5 : 8.5) * bw;

    const top = lk.top, swim = top === 'swimsuit';
    const sleeve = { tshirt: 'short', crop: 'short', longsleeve: 'long', jacket: 'long' }[top] || 'none';
    const btm = swim || lk.outfit === 'bikini' ? 'briefs' : lk.outfit; // mayoda alt giyim yok sayılır
    const bare = btm === 'briefs' || btm === 'trunks';                    // yalınayak

    const arm = (s, far) =>
      path([P[s + 'Elbow'], P[s + 'Hand']], col(sleeve === 'long' ? 'top' : 'skin', far), 7 * bw) +
      `<circle cx="${n1(P[s + 'Hand'].x)}" cy="${n1(P[s + 'Hand'].y)}" r="${n1(4.3 * Math.sqrt(bw))}" fill="${col('skin', far)}"/>` +
      path([P[s + 'Sh'], P[s + 'Elbow']], col(sleeve === 'none' ? 'skin' : 'top', far), (sleeve === 'none' ? 7.5 : 8.5) * bw);

    const leg = (s, far) => {
      const hp = P[s + 'Hp'], kn = P[s + 'Knee'], ft = P[s + 'Foot'];
      const toe = at(ft, side ? d[s + 'S'] - 90 : d[s + 'S'], side ? 6 : 1);
      let o = btm === 'pants' ? path([hp, kn, ft], col('bottom', far), legW + 1.5) : path([hp, kn, ft], col('skin', far), legW);
      const cover = { shorts: 0.6, trunks: 0.42 }[btm];
      if (cover) o += path([hp, at(hp, d[s + 'T'], L.thigh * cover)], col('bottom', far), legW + 2);
      return o + path([ft, toe], col(bare ? 'skin' : 'shoe', far), bare ? 6 : 7);
    };

    // Bel-kalça parçası: pantolon/şort üstü, etek, elbise ya da mayo/bikini altı
    // only ('r' | 'l'): başka katmana alınan bacakla giden, yalnızca o bacağı örten yarı
    const lower = only => {
      const o = btm, pts = [];
      // Yalnızca kalça ekseni: gövde eğilince köşe çıkmasın, gövde kapsülü birleşimi örter
      if (side) {
        const bk = (fem ? 3 + lk.hip * 1.6 : 7.5) * b, fr = 7 * b, rr = 6.5 * b, rf = 6 * b;
        const back = alongP(2, -(bk - rr)), front = alongP(2, fr - rf);
        for (let a = 0; a < 360; a += 30) pts.push(at(back, a, rr), at(front, a, rf)); // yuvarlak kalça
        pts.push(alongP(-2, fr));
      } else {
        const ww = (fem ? 6.5 : 9) * b, hw = (fem ? 7 + lk.hip * 1.4 : 8) * b;
        [-1, 1].forEach(k => {
          if (!only) pts.push(alongP(o === 'briefs' ? 7 : 11, k * ww));
          pts.push(alongP(5, k * hw), alongP(-2, k * hw * 0.92));
        });
      }
      // Etek ucu yaylanmada kalça etrafında hafifçe döner
      const flare = !['pants', 'shorts', 'trunks', 'briefs'].includes(o) && f.sway ? rad(f.sway * 0.35) : 0;
      const rot = q => flare ? { x: q.x * Math.cos(flare) - q.y * Math.sin(flare), y: q.x * Math.sin(flare) + q.y * Math.cos(flare) } : q;
      const add = (from, dir, len, w) => (only ? [only] : ['r', 'l']).forEach(s => {
        const p = at(P[s + from], d[s + dir], len);
        pts.push(rot(at(p, d[s + dir] + 90, w)), rot(at(p, d[s + dir] + 90, -w)));
      });
      if (o === 'pants' || o === 'shorts' || o === 'trunks') add('Hp', 'T', L.thigh * 0.3, legW / 2 + 1.5);
      else if (o === 'briefs') add('Hp', 'T', L.thigh * 0.12, legW / 2 + 1);
      else if (o === 'longskirt') { add('Hp', 'T', L.thigh, 8.5 * b); add('Knee', 'S', L.shin * 0.55, 9 * b); }
      else if (o === 'mini') add('Hp', 'T', L.thigh * 0.38, (7 + lk.hip * 0.3) * b);
      else add('Hp', 'T', L.thigh * 0.62, (7.5 + lk.hip * 0.3) * b);
      return poly(pts, C[o === 'dress' || swim ? 'top' : 'bottom']);
    };

    // Kadın gövdesi: lo..hi yüksekliği arası (kalçadan uzaklık); omuz-bel-kalça hatlı
    const femTorso = (lo, hi, c) => {
      const H = [12, 18, L.torso - 18, L.torso - 8, L.torso - 3];
      const sw = 9 * b, ww = 6.5 * b;
      const Wd = side ? [7, 7, 7, 7, 5].map(v => v * b) : [ww + 0.5, ww, sw - 1, sw, sw - 4];
      const wAt = h => {
        for (let i = 1; i < H.length; i++) {
          if (h <= H[i]) return Wd[i - 1] + (Wd[i] - Wd[i - 1]) * Math.max(0, (h - H[i - 1]) / (H[i] - H[i - 1]));
        }
        return Wd[Wd.length - 1];
      };
      const pts = [];
      [lo, ...H.filter(h => h > lo && h < hi), hi].forEach(h => [-1, 1].forEach(k => pts.push(along(h, k * wAt(h)))));
      return poly(pts, c);
    };

    const br = (2.2 + lk.bust * 1.05) * Math.sqrt(b), bx = (2.8 + lk.bust * 0.45) * b;
    const bustAt = side ? [along(L.torso - 17, 7 * b - br * 0.3)] : [-1, 1].map(k => along(L.torso - 17, k * bx));
    const straps = () => back
      ? [-1, 1].map(k => path([along(L.torso - 17, k * 5 * b), along(L.torso - 3, k * 4 * b)], C.top, 1.8)).join('') +
        (top === 'bikini' ? path([along(L.torso - 17, -8.5 * b), along(L.torso - 17, 8.5 * b)], C.top, 4) : '')
      : bustAt.map((p, i) => path([p, along(L.torso - 3, side ? 0 : (i ? 1 : -1) * 5 * b)], C.top, 1.6)).join('');

    let torso = '';
    if (fem) {
      const lo = side ? 4 : 12, hi = L.torso - 3;
      if (top === 'crop' || top === 'bikini' || swim) torso = femTorso(lo, hi, C.skin);
      if (top === 'crop') torso += femTorso(26, hi, C.top);
      else if (swim) torso += femTorso(side ? 4 : 6, L.torso - 13, C.top) + straps();
      else if (top === 'bikini') torso += straps();
      else torso = femTorso(lo, hi, C.top);
    } else {
      torso = path([along(side ? 4 : 8, 0), P.sh], top === 'none' ? C.skin : C.top, (side ? 15 : 22) * b);
    }
    const jacket = top !== 'jacket' || f.view !== 'front' ? '' : path([along(fem ? 14 : 9, 0), along(L.torso - 5, 0)], '#ffffff', 5 * b);

    let bust = '';
    if (fem && !back) {
      bust = bustAt.map(p =>
        `<circle cx="${n1(p.x)}" cy="${n1(p.y)}" r="${n1(br)}" fill="${C.top}"/>` +
        `<path d="M${xy(at(p, d.torso + 125, br * 0.92))}A${n1(br * 0.92)} ${n1(br * 0.92)} 0 0 1 ${xy(at(p, d.torso + 235, br * 0.92))}" fill="none" stroke="${shade(C.top, 0.82)}" stroke-width="1" stroke-linecap="round"/>`
      ).join('');
    }

    const neck = path([P.sh, P.head], C.skin, 6 * Math.sqrt(bw));
    const H = head(f, C, lk);
    const hg = s => s ? `<g transform="translate(${xy(P.head)}) rotate(${n1(d.head + 90)})">${s}</g>` : '';

    const limbs = front => (f.limbs || []).filter(l => !!l.front === front).map(l => {
      const pts = [P[`L.${l.id}.s`]];
      for (let i = 0; i < l.segs; i++) pts.push(P[`L.${l.id}.${i}`]);
      return ['L.' + l.id, path(pts, l.color || C.skin, l.w)];
    });

    // [parça anahtarı, çizim] çizim sırasıyla; anahtarı olan parça başka katmana alınabilir
    const lay = k => (k && f.parts && f.parts[k]) || 0;
    // Öne alınan bacak eteği de üstüne alır; arkaya giden bacakta etek bedende kalır
    const legPart = (s, far) => leg(s, far) + (lay(s + 'Leg') === 1 ? lower(s) : '');
    const items = limbs(false).concat(side
      ? [['head', hg(H.back)], ['lArm', arm('l', 1)], ['lLeg', legPart('l', 1)], ['rLeg', legPart('r')],
        ['', lower() + neck + torso + bust], ['head', hg(H.front)], ['rArm', arm('r')]]
      : [['head', hg(H.back)], ['rLeg', legPart('r')], ['lLeg', legPart('l')], ['', lower() + neck + torso + bust + jacket],
        ['head', hg(H.front)], ['rArm', arm('r')], ['lArm', arm('l')]], limbs(true));
    const out = items.filter(([k]) => layer === undefined || lay(k) === layer).map(i => i[1]).join('');
    return out ? `<g data-fig="${f.id}" transform="${transform(f)}">${out}</g>` : '';
  }

  // Katmana alınabilen parçalar (ek uzuvlar ayrıca)
  const PARTS = [['rArm', 'Sağ kol'], ['lArm', 'Sol kol'], ['rLeg', 'Sağ bacak'], ['lLeg', 'Sol bacak'], ['head', 'Baş']];

  // Tutamaç adı -> [konum noktası, kemik başı, üst kemik yönü, poz anahtarı]
  const HANDLES = {
    torso: ['chest', 'hip', 'pelvis', 'torso'],
    head: ['top', 'chest', 'torso', 'head']
  };
  ['r', 'l'].forEach(s => Object.assign(HANDLES, {
    [s + 'Elbow']: [s + 'Elbow', s + 'Sh', 'arm', s + 'Shoulder'],
    [s + 'Hand']: [s + 'Hand', s + 'Elbow', s + 'U', s + 'Elbow'],
    [s + 'Knee']: [s + 'Knee', s + 'Hp', 'leg', s + 'Hip'],
    [s + 'Foot']: [s + 'Foot', s + 'Knee', s + 'T', s + 'Knee']
  }));

  function handles(f) {
    const { P } = solve(f), k = 1 / f.scale, far = f.view === 'side' ? 'l' : '-';
    const dot = (name, p, cls) => `<g data-h="${name}" class="h ${cls}">` +
      `<circle cx="${n1(p.x)}" cy="${n1(p.y)}" r="${n1(12 * k)}" fill="transparent"/>` +
      `<circle cx="${n1(p.x)}" cy="${n1(p.y)}" r="${n1(4.5 * k)}" stroke-width="${n1(2 * k)}"/></g>`;
    const names = Object.keys(HANDLES).sort((a, b) => (b[0] === far) - (a[0] === far));
    const extra = (f.limbs || []).map(l => Array.from({ length: l.segs }, (_, i) => dot(`L.${l.id}.${i}`, P[`L.${l.id}.${i}`], 'x')).join('')).join('');
    return `<g data-fig="${f.id}" transform="${transform(f)}">` +
      names.map(n => dot(n, P[HANDLES[n][0]], n[0] === far ? 'far' : '')).join('') +
      extra + dot('root', P.hip, 'root') + '</g>';
  }

  const handleDef = h => {
    if (HANDLES[h]) return HANDLES[h];
    const [, id, i] = h.split('.');
    return [h, +i ? `L.${id}.${i - 1}` : `L.${id}.s`, +i ? `L.${id}.${i - 1}` : `L.${id}.a`, `x.${id}.${i}`];
  };

  // Tutamacı yerel noktaya (lp) doğru çevirir
  function aim(f, h, lp) {
    const H = handleDef(h);
    if (!H) return;
    const { P, d } = solve(f), o = P[H[1]];
    f.pose[H[3]] = Math.round(norm(Math.atan2(lp.y - o.y, lp.x - o.x) * 180 / Math.PI - d[H[2]]));
  }

  // Bir eklemin sahnedeki konumu (konuşma balonu, yaylanma hızı için)
  function anchor(f, key) {
    const p = solve(f).P[key || 'top'];
    return { x: f.x + (f.flip ? -1 : 1) * p.x * f.scale, y: f.y + p.y * f.scale };
  }

  // Figürün en alt noktasının kalçaya uzaklığı (sahne biriminde)
  function bottom(f) {
    const { P } = solve(f);
    return (Math.max(...Object.values(P).map(p => p.y)) + 4) * f.scale;
  }

  function create(gender, x, ground, name) {
    const f = {
      id: Director.Store.uid(), gender, name, view: 'front', flip: false,
      x, y: ground - LEG, scale: 1,
      colors: Object.assign({}, COLORS[gender]),
      pose: Object.assign({}, POSES[0].pose)
    };
    const lk = look(f);
    return Object.assign(f, { hair: lk.hair, top: lk.top, outfit: lk.outfit, shape: { build: 1, hip: 3, bust: 3 }, limbs: [] });
  }

  // İki kare arasındaki ara hal (t: 0..1)
  function interp(a, b, t) {
    if (!b) return a;
    const o = Object.assign({}, a, {
      x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, scale: a.scale + (b.scale - a.scale) * t,
      view: t < 0.5 ? a.view : b.view, flip: t < 0.5 ? a.flip : b.flip, z: t < 0.5 ? a.z : b.z,
      parts: t < 0.5 ? a.parts : b.parts, pose: {}
    });
    new Set(KEYS.concat(Object.keys(a.pose), Object.keys(b.pose))).forEach(k => {
      const x = a.pose[k] || 0, y = b.pose[k] || 0;
      o.pose[k] = x + norm(y - x) * t;
    });
    return o;
  }

  return { POSES, COLORS, LOOKS, ATTACH, PARTS, LEG, look, create, svg, handles, aim, anchor, bottom, interp };
})();
