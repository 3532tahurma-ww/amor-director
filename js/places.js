/*
 * Amor Director - Mekanlar (sahne arka planları)
 * Sahne 480x360 birim; zemin çizgisi y=300 civarı.
 */
window.Director = window.Director || {};

Director.Places = (() => {
  const W = 480, H = 360;

  // Sabit tohumlu rastgele: her çizimde aynı yıldız/pencere düzeni
  const rng = seed => () => (seed = (seed * 9301 + 49297) % 233280) / 233280;

  const grid = (x, y, w, h, cols, rows, fill) => {
    let o = '';
    const cw = w / cols, rh = h / rows;
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      o += `<rect x="${(x + i * cw + cw * 0.25).toFixed(1)}" y="${(y + j * rh + rh * 0.22).toFixed(1)}" width="${(cw * 0.5).toFixed(1)}" height="${(rh * 0.56).toFixed(1)}" rx="1.5" fill="${typeof fill === 'function' ? fill() : fill}"/>`;
    }
    return o;
  };

  const buildings = (list, bottom, winFill) => list.map(([x, top, w, c]) =>
    `<rect x="${x}" y="${top}" width="${w}" height="${bottom - top}" fill="${c}"/>` +
    grid(x + 6, top + 10, w - 12, bottom - top - 20, Math.max(1, Math.floor((w - 12) / 20)), Math.max(1, Math.floor((bottom - top - 20) / 24)), winFill)
  ).join('');

  const stars = (() => {
    const r = rng(7);
    let o = '';
    for (let i = 0; i < 60; i++) {
      o += `<circle cx="${(r() * W).toFixed(1)}" cy="${(r() * 190).toFixed(1)}" r="${(r() * 1.3 + 0.4).toFixed(1)}" fill="#fff" opacity="${(r() * 0.6 + 0.4).toFixed(2)}"/>`;
    }
    return o;
  })();

  const LIST = [
    {
      id: 'bos', name: 'Boş',
      draw: () => `<rect width="${W}" height="${H}" fill="#f4f2fb"/>
        <rect y="300" width="${W}" height="60" fill="#e6e1f5"/>
        <path d="M0 300H${W}" stroke="#d3cbee" stroke-width="2"/>`
    },
    {
      id: 'oda', name: 'Oda',
      draw: () => `<rect width="${W}" height="${H}" fill="#d6e4f5"/>
        <rect y="292" width="${W}" height="68" fill="#c8956a"/>
        <path d="M0 316H${W}M0 340H${W}" stroke="#b5835a" stroke-width="1.5"/>
        <rect y="286" width="${W}" height="8" fill="#fff3e6"/>
        <rect x="56" y="70" width="120" height="104" rx="4" fill="#fff"/>
        <rect x="63" y="77" width="106" height="90" fill="#bfe3ff"/>
        <path d="M116 77V167M63 122H169" stroke="#fff" stroke-width="5"/>
        <rect x="44" y="62" width="18" height="124" rx="6" fill="#ff8fb8"/>
        <rect x="170" y="62" width="18" height="124" rx="6" fill="#ff8fb8"/>
        <rect x="262" y="92" width="70" height="52" rx="3" fill="#7b5cff"/>
        <rect x="268" y="98" width="58" height="40" fill="#efeaff"/>
        <path d="M272 134l14-18 10 12 8-8 18 14z" fill="#a66bff"/>
        <rect x="384" y="150" width="66" height="138" rx="3" fill="#b27b52"/>
        <rect x="392" y="160" width="50" height="52" rx="2" fill="#a26c45"/>
        <rect x="392" y="222" width="50" height="56" rx="2" fill="#a26c45"/>
        <circle cx="438" cy="222" r="3.5" fill="#ffd36b"/>
        <rect x="218" y="262" width="24" height="26" rx="4" fill="#e07a4f"/>
        <ellipse cx="222" cy="250" rx="8" ry="16" fill="#5bbf6a" transform="rotate(-20 222 250)"/>
        <ellipse cx="238" cy="250" rx="8" ry="16" fill="#4caf5a" transform="rotate(20 238 250)"/>`
    },
    {
      id: 'yatak', name: 'Yatak odası',
      draw: () => `<rect width="${W}" height="${H}" fill="#ece3f8"/>
        <rect y="292" width="${W}" height="68" fill="#b8865c"/>
        <path d="M0 316H${W}M0 340H${W}" stroke="#a5754d" stroke-width="1.5"/>
        <rect y="286" width="${W}" height="8" fill="#fff"/>
        <ellipse cx="300" cy="328" rx="130" ry="18" fill="#d9c6f2"/>
        <rect x="24" y="110" width="96" height="178" rx="4" fill="#c99a6b"/>
        <path d="M72 116V282" stroke="#b5835a" stroke-width="2"/>
        <circle cx="66" cy="200" r="3" fill="#ffd36b"/><circle cx="78" cy="200" r="3" fill="#ffd36b"/>
        <rect x="160" y="60" width="96" height="84" rx="4" fill="#fff"/>
        <rect x="166" y="66" width="84" height="72" fill="#2d2466"/>
        <circle cx="228" cy="88" r="9" fill="#fff5c8"/>
        <circle cx="184" cy="80" r="1.3" fill="#fff"/><circle cx="200" cy="110" r="1.3" fill="#fff"/><circle cx="238" cy="122" r="1.3" fill="#fff"/>
        <path d="M208 66V138M166 102H250" stroke="#fff" stroke-width="4"/>
        <rect x="236" y="246" width="44" height="44" rx="3" fill="#a26c45"/>
        <path d="M240 268H276" stroke="#8a5a3b" stroke-width="2"/>
        <rect x="252" y="230" width="12" height="16" fill="#8a5a3b"/>
        <path d="M244 230L272 230L266 212L250 212Z" fill="#ffd36b"/>
        <rect x="292" y="196" width="14" height="96" rx="4" fill="#8a5a3b"/>
        <rect x="292" y="252" width="182" height="30" rx="4" fill="#a26c45"/>
        <rect x="298" y="236" width="174" height="20" rx="8" fill="#fff"/>
        <rect x="360" y="232" width="114" height="26" rx="8" fill="#ff8fb8"/>
        <path d="M368 245H468" stroke="#ff6fa3" stroke-width="2"/>
        <ellipse cx="330" cy="232" rx="20" ry="8" fill="#fff" stroke="#e6e1f5" stroke-width="1.5"/>
        <rect x="300" y="282" width="8" height="10" fill="#6e4a35"/><rect x="462" y="282" width="8" height="10" fill="#6e4a35"/>`
    },
    {
      id: 'salon', name: 'Salon',
      draw: () => `<rect width="${W}" height="${H}" fill="#e3efe6"/>
        <rect y="292" width="${W}" height="68" fill="#c8956a"/>
        <path d="M0 316H${W}M0 340H${W}" stroke="#b5835a" stroke-width="1.5"/>
        <rect y="286" width="${W}" height="8" fill="#fff"/>
        <ellipse cx="240" cy="326" rx="150" ry="20" fill="#e9b872"/>
        <rect x="30" y="56" width="110" height="130" rx="4" fill="#fff"/>
        <rect x="37" y="63" width="96" height="116" fill="#cdeeff"/>
        <path d="M85 63V179" stroke="#fff" stroke-width="5"/>
        <rect x="190" y="90" width="44" height="56" rx="3" fill="#ff8fb8"/><rect x="195" y="95" width="34" height="46" fill="#ffe4ef"/>
        <rect x="246" y="100" width="60" height="44" rx="3" fill="#2fd6a0"/><rect x="251" y="105" width="50" height="34" fill="#e2fbf2"/>
        <circle cx="228" cy="121" r="7" fill="#ffd36b"/>
        <rect x="150" y="206" width="190" height="52" rx="14" fill="#7b5cff"/>
        <rect x="150" y="254" width="190" height="24" rx="8" fill="#8d71ff"/>
        <rect x="138" y="232" width="26" height="50" rx="10" fill="#6a4be8"/>
        <rect x="326" y="232" width="26" height="50" rx="10" fill="#6a4be8"/>
        <path d="M245 210V256" stroke="#6a4be8" stroke-width="2"/>
        <rect x="150" y="282" width="6" height="10" fill="#4a3a6a"/><rect x="334" y="282" width="6" height="10" fill="#4a3a6a"/>
        <rect x="176" y="222" width="30" height="24" rx="8" fill="#ffd36b" transform="rotate(-8 191 234)"/>
        <rect x="398" y="128" width="5" height="160" fill="#44445a"/>
        <path d="M384 128H418L410 100H392Z" fill="#fff3a8"/>
        <rect x="388" y="286" width="26" height="6" rx="2" fill="#44445a"/>`
    },
    {
      id: 'mutfak', name: 'Mutfak',
      draw: () => `<rect width="${W}" height="${H}" fill="#f2f7fb"/>
        <rect y="140" width="370" height="70" fill="#fff"/>
        <path d="M0 158H370M0 176H370M0 194H370M24 140V210M60 140V210M96 140V210M132 140V210M168 140V210M204 140V210M240 140V210M276 140V210M312 140V210M348 140V210" stroke="#dfe7ef" stroke-width="1.5"/>
        <rect y="292" width="${W}" height="68" fill="#d9d4cc"/>
        <path d="M0 316H${W}M0 340H${W}M60 292V360M140 292V360M220 292V360M300 292V360M380 292V360" stroke="#c6c0b6" stroke-width="1.5"/>
        <rect x="0" y="30" width="150" height="78" rx="3" fill="#6fa8dc"/>
        <path d="M75 34V104" stroke="#5b93c6" stroke-width="2"/>
        <rect x="190" y="40" width="110" height="80" rx="4" fill="#fff" stroke="#dfe7ef" stroke-width="3"/>
        <rect x="196" y="46" width="98" height="68" fill="#cdeeff"/>
        <path d="M245 46V114" stroke="#fff" stroke-width="4"/>
        <rect x="0" y="216" width="370" height="76" fill="#6fa8dc"/>
        <rect x="-4" y="206" width="378" height="12" rx="3" fill="#e8e8ee"/>
        <path d="M74 220V288M148 220V288M222 220V288M296 220V288" stroke="#5b93c6" stroke-width="2"/>
        <path d="M62 240V256M86 240V256M210 240V256M234 240V256" stroke="#e8e8ee" stroke-width="3" stroke-linecap="round"/>
        <rect x="150" y="218" width="70" height="70" rx="3" fill="#4a4a58"/>
        <rect x="158" y="232" width="54" height="34" rx="3" fill="#2a2a33"/>
        <rect x="160" y="190" width="40" height="16" rx="3" fill="#9a9aab"/>
        <rect x="156" y="186" width="48" height="5" rx="2" fill="#7a7a8a"/>
        <rect x="380" y="100" width="88" height="192" rx="8" fill="#e9edf2" stroke="#d3d9e1" stroke-width="2"/>
        <path d="M380 168H468" stroke="#d3d9e1" stroke-width="2"/>
        <rect x="390" y="130" width="5" height="26" rx="2" fill="#9a9aab"/><rect x="390" y="180" width="5" height="40" rx="2" fill="#9a9aab"/>
        <circle cx="300" cy="196" r="9" fill="#ff8fb8"/><rect x="292" y="194" width="16" height="12" rx="3" fill="#ff8fb8"/>`
    },
    {
      id: 'banyo', name: 'Banyo',
      draw: () => `<rect width="${W}" height="${H}" fill="#dff3f6"/>
        <path d="M0 40H${W}M0 80H${W}M0 120H${W}M0 160H${W}M0 200H${W}M0 240H${W}M0 280H${W}M40 0V292M80 0V292M120 0V292M160 0V292M200 0V292M240 0V292M280 0V292M320 0V292M360 0V292M400 0V292M440 0V292" stroke="#cbe9ee" stroke-width="1.5"/>
        <rect y="292" width="${W}" height="68" fill="#9fcdd6"/>
        ${grid(0, 292, W, 68, 12, 2, '#b4dbe2')}
        <path d="M34 40H200" stroke="#9a9aab" stroke-width="3" stroke-linecap="round"/>
        <path d="M40 42Q50 140 44 220L80 220Q74 140 72 42Z" fill="#ff8fb8"/>
        <path d="M40 42Q56 70 52 220" stroke="#ff6fa3" stroke-width="1.5" fill="none"/>
        <rect x="24" y="226" width="186" height="62" rx="22" fill="#fff" stroke="#d6e2e6" stroke-width="2"/>
        <rect x="24" y="222" width="186" height="10" rx="5" fill="#f3f7f9"/>
        <path d="M180 222V196Q180 188 172 188H160" stroke="#9a9aab" stroke-width="4" fill="none" stroke-linecap="round"/>        <rect x="320" y="80" width="80" height="96" rx="38" fill="#cdeeff" stroke="#fff" stroke-width="6"/>
        <rect x="316" y="214" width="88" height="78" rx="4" fill="#fff" stroke="#d6e2e6" stroke-width="2"/>
        <rect x="310" y="204" width="100" height="14" rx="6" fill="#f3f7f9" stroke="#d6e2e6" stroke-width="2"/>
        <path d="M360 204V190H372" stroke="#9a9aab" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="M360 226V282" stroke="#d6e2e6" stroke-width="2"/>
        <rect x="430" y="120" width="34" height="5" rx="2" fill="#9a9aab"/>
        <rect x="434" y="124" width="26" height="64" rx="4" fill="#2fd6a0"/>`
    },
    {
      id: 'ofis', name: 'Ofis',
      draw: () => `<rect width="${W}" height="${H}" fill="#eef0f5"/>
        <rect y="292" width="${W}" height="68" fill="#8d8f9c"/>
        <rect y="286" width="${W}" height="8" fill="#fff"/>
        <rect x="20" y="70" width="100" height="218" rx="3" fill="#a26c45"/>
        <path d="M24 120H116M24 170H116M24 220H116" stroke="#8a5a3b" stroke-width="5"/>
        ${[[28, 82, '#7b5cff'], [40, 88, '#ff5d9e'], [52, 80, '#2fd6a0'], [64, 90, '#ffb84d'], [30, 134, '#4f7cff'], [42, 128, '#ff4d4d'], [86, 134, '#7b5cff'], [30, 184, '#2fd6a0'], [44, 180, '#ffb84d'], [56, 186, '#4f7cff']]
          .map(([x, y, c]) => `<rect x="${x}" y="${y}" width="10" height="${(x + y) % 2 ? 34 : 30}" fill="${c}"/>`).join('')}
        <rect x="170" y="50" width="140" height="100" rx="4" fill="#fff"/>
        <rect x="176" y="56" width="128" height="88" fill="#cdeeff"/>
        <path d="M176 66H304M176 78H304M176 90H304M176 102H304M176 114H304M176 126H304" stroke="#f4f6fa" stroke-width="5"/>
        <rect x="190" y="240" width="200" height="9" rx="3" fill="#5d5f6e"/>
        <rect x="200" y="249" width="7" height="43" fill="#5d5f6e"/><rect x="374" y="249" width="7" height="43" fill="#5d5f6e"/>
        <rect x="270" y="190" width="66" height="44" rx="4" fill="#2a2a33"/>
        <rect x="274" y="194" width="58" height="36" rx="2" fill="#7b5cff"/>
        <rect x="298" y="232" width="10" height="9" fill="#2a2a33"/>
        <rect x="216" y="232" width="18" height="8" rx="2" fill="#fff"/>
        <rect x="430" y="264" width="26" height="26" rx="4" fill="#e07a4f"/>
        <ellipse cx="436" cy="250" rx="8" ry="18" fill="#5bbf6a" transform="rotate(-18 436 250)"/>
        <ellipse cx="452" cy="250" rx="8" ry="18" fill="#4caf5a" transform="rotate(18 452 250)"/>`
    },
    {
      id: 'park', name: 'Park',
      draw: () => `<rect width="${W}" height="${H}" fill="#cdeeff"/>
        <circle cx="410" cy="60" r="26" fill="#ffd95a"/>
        <g fill="#fff"><ellipse cx="110" cy="60" rx="34" ry="13"/><ellipse cx="132" cy="50" rx="22" ry="14"/><ellipse cx="270" cy="86" rx="28" ry="10"/><ellipse cx="288" cy="80" rx="16" ry="10"/></g>
        <ellipse cx="120" cy="292" rx="230" ry="64" fill="#a8dc8e"/>
        <ellipse cx="400" cy="296" rx="210" ry="52" fill="#9bd47f"/>
        <rect y="284" width="${W}" height="76" fill="#86c96c"/>
        <path d="M200 360Q235 318 290 286H322Q290 320 300 360Z" fill="#eadcb4"/>
        <rect x="66" y="180" width="16" height="112" rx="4" fill="#8a5a3b"/>
        <g fill="#4caf5a"><circle cx="74" cy="168" r="40"/><circle cx="44" cy="196" r="26"/><circle cx="106" cy="194" r="28"/></g>
        <rect x="350" y="236" width="96" height="8" rx="3" fill="#b07445"/>
        <rect x="350" y="250" width="96" height="8" rx="3" fill="#b07445"/>
        <rect x="346" y="262" width="104" height="8" rx="3" fill="#c4834f"/>
        <rect x="356" y="270" width="6" height="24" fill="#5d4a3a"/><rect x="434" y="270" width="6" height="24" fill="#5d4a3a"/>
        <g fill="#ff8fb8"><circle cx="150" cy="318" r="4"/><circle cx="168" cy="330" r="4"/><circle cx="410" cy="326" r="4"/></g>
        <g fill="#ffd95a"><circle cx="134" cy="334" r="4"/><circle cx="430" cy="314" r="4"/></g>`
    },
    {
      id: 'sokak', name: 'Sokak',
      draw: () => `<rect width="${W}" height="${H}" fill="#d6e6ff"/>
        ${buildings([[0, 120, 92, '#b9a8e8'], [92, 80, 80, '#9f8fd6'], [172, 140, 100, '#c7b9f0'], [272, 60, 90, '#a493dd'], [362, 110, 118, '#bcaee9']], 282, '#fff7c9')}
        <rect y="278" width="${W}" height="42" fill="#d9d9e2"/>
        <path d="M60 278V320M150 278V320M240 278V320M330 278V320M420 278V320" stroke="#c6c6d2" stroke-width="2"/>
        <rect y="316" width="${W}" height="5" fill="#b8b8c6"/>
        <rect y="321" width="${W}" height="39" fill="#5a5a68"/>
        <path d="M0 341H${W}" stroke="#fff" stroke-width="3" stroke-dasharray="22 18"/>
        <rect x="418" y="150" width="5" height="140" fill="#44445a"/>
        <rect x="406" y="140" width="30" height="10" rx="4" fill="#44445a"/>
        <circle cx="421" cy="154" r="6" fill="#fff3a8"/>`
    },
    {
      id: 'kafe', name: 'Kafe',
      draw: () => `<rect width="${W}" height="${H}" fill="#3f5f52"/>
        <rect y="200" width="${W}" height="92" fill="#8a5a3b"/>
        <rect y="196" width="${W}" height="6" fill="#5d3b26"/>
        <rect y="292" width="${W}" height="68" fill="#6e4a35"/>
        <path d="M0 316H${W}M0 340H${W}" stroke="#5f3f2c" stroke-width="1.5"/>
        <rect x="40" y="50" width="112" height="82" rx="4" fill="#2a2a33" stroke="#c9a77a" stroke-width="4"/>
        <path d="M54 70h60M54 86h46M54 102h70M54 118h38" stroke="#efe9ff" stroke-width="3" stroke-linecap="round" opacity=".85"/>
        <path d="M200 0V60M290 0V44" stroke="#3a2a22" stroke-width="2"/>
        <path d="M184 76a16 16 0 0 1 32 0z" fill="#ffb84d"/><circle cx="200" cy="78" r="5" fill="#fff3a8"/>
        <path d="M274 60a16 16 0 0 1 32 0z" fill="#ffb84d"/><circle cx="290" cy="62" r="5" fill="#fff3a8"/>
        <rect x="320" y="222" width="160" height="70" fill="#8a5a3b"/>
        <rect x="312" y="212" width="168" height="12" rx="3" fill="#5d3b26"/>
        <rect x="402" y="170" width="44" height="42" rx="4" fill="#4a4a58"/>
        <rect x="410" y="182" width="28" height="10" rx="2" fill="#9a9aab"/>
        <rect x="352" y="196" width="14" height="16" rx="3" fill="#fff"/>
        <rect x="150" y="248" width="90" height="8" rx="3" fill="#5d3b26"/>
        <rect x="191" y="256" width="8" height="38" fill="#5d3b26"/>
        <rect x="175" y="290" width="40" height="5" rx="2" fill="#5d3b26"/>
        <rect x="180" y="238" width="12" height="10" rx="2" fill="#fff"/>`
    },
    {
      id: 'plaj', name: 'Plaj',
      draw: () => `<rect width="${W}" height="${H}" fill="#bfe9ff"/>
        <circle cx="400" cy="70" r="30" fill="#ffd95a"/>
        <g fill="#fff"><ellipse cx="120" cy="70" rx="30" ry="11"/><ellipse cx="140" cy="62" rx="18" ry="11"/></g>
        <rect y="188" width="${W}" height="80" fill="#4fc3e8"/>
        <path d="M30 210q12-6 24 0M150 226q12-6 24 0M300 206q12-6 24 0M380 236q12-6 24 0" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".8"/>
        <path d="M0 262Q120 246 240 258T${W} 254V${H}H0Z" fill="#f0cc5a"/>
        <path d="M40 290q14-4 28 0M210 312q14-4 28 0M380 296q14-4 28 0M120 338q14-4 28 0M330 344q14-4 28 0" stroke="#dcb444" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M96 300L118 168" stroke="#7a5a3a" stroke-width="4" stroke-linecap="round"/>
        <path d="M58 182Q112 120 176 176Q150 166 140 176Q128 160 116 172Q102 158 90 174Q76 166 58 182Z" fill="#ff5d9e"/>
        <rect x="300" y="300" width="110" height="20" rx="4" fill="#7b5cff" transform="skewX(-20)"/>
        <circle cx="200" cy="320" r="7" fill="#fff"/><circle cx="200" cy="320" r="7" fill="none" stroke="#ff8fb8" stroke-width="3" stroke-dasharray="5 4"/>`
    },
    {
      id: 'gece', name: 'Gece',
      draw: () => {
        const r = rng(3);
        return `<rect width="${W}" height="${H}" fill="#1d1846"/>
        ${stars}
        <circle cx="392" cy="72" r="24" fill="#fff5c8"/><circle cx="402" cy="64" r="22" fill="#1d1846"/>
        ${buildings([[0, 170, 70, '#2c2560'], [70, 130, 60, '#332b6e'], [130, 190, 90, '#2c2560'], [220, 150, 70, '#352d72'], [290, 200, 80, '#2c2560'], [370, 140, 110, '#332b6e']], 292, () => r() > 0.55 ? '#ffd76b' : '#3d3578')}
        <rect y="290" width="${W}" height="70" fill="#17132f"/>
        <circle cx="250" cy="200" r="40" fill="#ffd76b" opacity=".12"/>
        <rect x="248" y="200" width="4" height="92" fill="#0f0c22"/>
        <circle cx="250" cy="198" r="7" fill="#ffe9a0"/>`;
      }
    }
  ];

  const find = id => LIST.find(p => p.id === id) || LIST[0];

  return { LIST, draw: id => find(id).draw(), name: id => find(id).name };
})();
