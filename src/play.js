/* ================= PLAY: animations, games, XP ================= */
const REDUCE = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } })();
const sleep = ms => new Promise(r => setTimeout(r, REDUCE ? 0 : ms));
const PALETTE = ['#0b7a6a', '#e0a100', '#d4553b', '#3a6fd8', '#8a4fc4', '#2a9d5b'];

/* --- XP and confetti --- */
function xpGet() { return store.get('xp', 0); }
function xpAdd(n) { store.set('xp', xpGet() + n); xpBadge(); }
function xpBadge() {
  let el = document.getElementById('xp');
  if (!el) { const rail = document.querySelector('.rail-in'); if (!rail) return; el = h('div', { id: 'xp', class: 'xp', 'aria-live': 'polite' }); rail.append(el); }
  const x = xpGet(), lvl = Math.floor(x / 50) + 1;
  el.replaceChildren(h('span', { class: 'lv' }, 'Lv ' + lvl), h('span', {}, '⚡ ' + x + ' XP'));
  el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
}
function confetti(n = 70) {
  if (REDUCE) return;
  const box = h('div', { class: 'confetti', 'aria-hidden': 'true' });
  for (let i = 0; i < n; i++) {
    const p = h('i', {}); p.style.left = Math.random() * 100 + 'vw'; p.style.background = PALETTE[i % PALETTE.length];
    p.style.animationDelay = Math.random() * 0.25 + 's'; p.style.animationDuration = 1.1 + Math.random() * 0.9 + 's';
    p.style.setProperty('--dx', (Math.random() * 160 - 80) + 'px'); p.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg');
    box.append(p);
  }
  document.body.append(box); setTimeout(() => box.remove(), 2400);
}

/* --- graph helpers --- */
function gNodes(svg, id) { return [...svg.querySelectorAll('[data-n]')].filter(e => e.dataset.n === id); }
function gEdge(svg, from, to) { return [...svg.querySelectorAll('[data-e]')].filter(e => e.dataset.e === from + '→' + to); }
function gClear(svg, ...cls) { svg.querySelectorAll('.g-node, .g-edge').forEach(e => e.classList.remove(...cls)); }
function gMark(svg, ids, cls) { ids.forEach(id => gNodes(svg, id).forEach(e => { if (e.classList.contains('g-node')) e.classList.add(cls); })); }
function token(svg, from, to, dur) {
  const path = gEdge(svg, from, to).find(e => e.tagName.toLowerCase() === 'path');
  if (!path || REDUCE) return Promise.resolve();
  path.classList.add('on');
  const len = path.getTotalLength(), dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  dot.setAttribute('r', '7'); dot.setAttribute('class', 'tok'); svg.append(dot);
  return new Promise(res => {
    const t0 = performance.now();
    const f = now => {
      const t = Math.min(1, (now - t0) / dur), e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2, p = path.getPointAtLength(e * len);
      dot.setAttribute('cx', p.x); dot.setAttribute('cy', p.y);
      if (t < 1) requestAnimationFrame(f); else { dot.remove(); path.classList.remove('on'); res(); }
    };
    requestAnimationFrame(f);
  });
}
function hideAll(svg) { svg.querySelectorAll('[data-n], [data-e]').forEach(e => { e.style.opacity = '0'; }); }
function show(els) { els.forEach(e => { if (e.style.opacity === '0') { e.style.opacity = ''; e.classList.remove('popin'); void e.getBoundingClientRect(); e.classList.add('popin'); } }); }
function speedCtl(def = 850) {
  const r = h('input', { type: 'range', min: 150, max: 1400, value: def, 'aria-label': 'Animation speed (lower is faster)' });
  return { el: h('label', { class: 'speed small muted' }, '🐢', r, '🐇'), get: () => 1550 - +r.value };
}
function chips(arr, cls) { return arr.map(t => h('span', { class: 'chip-s ' + (cls || '') }, t)); }

/* --- generic machine runner (DFA, NFA, Mealy) --- */
function faAdapter(fa) {
  return { svg: () => faGraph(fa), init: () => fa.hasEps ? F.epsClosure(fa, [fa.start]) : [fa.start],
    step(cur, a) { const set = new Set(), moves = []; for (const s of cur) for (const t of F.delta(fa, s, a)) { moves.push([s, t]); set.add(t); }
      let next = fa.states.filter(s => set.has(s)); if (fa.hasEps && next.length) next = F.epsClosure(fa, next); return { next, moves }; },
    final: cur => cur.some(s => fa.finals.includes(s)), multi: fa.states.some(s => fa.alphabet.some(a => F.delta(fa, s, a).length !== 1)) || fa.hasEps };
}
function dfaAdapter(d, L) {
  return { svg: () => dfaGraph(d, L), init: () => [d.start],
    step(cur, a) { const t = d.delta[cur[0]] && d.delta[cur[0]][a]; return t ? { next: [t], moves: [[cur[0], t]] } : { next: [], moves: [] }; },
    final: cur => cur.some(s => d.finals.includes(s)) };
}
function mealyAdapter(m) {
  return { output: true, svg: () => { const edges = []; for (const s of m.states) for (const a of m.alphabet) { const t = m.delta[s] && m.delta[s][a]; if (t) edges.push({ from: s, to: t[0], label: a + '/' + t[1] }); } return svgGraph({ nodes: m.states.map(s => ({ id: s, label: s, start: s === m.start })), edges }); },
    init: () => [m.start], step(cur, a) { const t = m.delta[cur[0]] && m.delta[cur[0]][a]; return t ? { next: [t[0]], moves: [[cur[0], t[0]]], out: t[1] } : { next: [], moves: [] }; } };
}
function runner(ad, w0, tries, note) {
  const svg = ad.svg(), sp = speedCtl();
  const inp = h('input', { type: 'text', value: w0, 'aria-label': 'Input string', class: 'w' });
  const strip = h('div', { class: 'strip', 'aria-label': 'Input tape' }), outS = h('div', { class: 'strip out' }), cap = h('div', { class: 'cap', 'aria-live': 'polite' }), lit = h('div', { class: 'lit' });
  let w = [], i = 0, cur = [], out = '', busy = false, playing = false, over = false;
  const paint = () => {
    gClear(svg, 'on', 'ok', 'no'); gMark(svg, cur, 'on');
    strip.replaceChildren(...(w.length ? w.map((c, k) => h('span', { class: k < i ? 'done' : k === i && !over ? 'cur' : '' }, c)) : [h('span', { class: 'cur' }, 'ε')]));
    if (ad.output) outS.replaceChildren(h('b', { class: 'small' }, 'output '), ...[...out].map(c => h('span', { class: 'pop' }, c)));
    lit.replaceChildren(h('span', { class: 'small muted' }, ad.multi ? 'Active states: ' : 'Current state: '), h('b', { class: 'mono' }, cur.length ? '{' + cur.join(', ') + '}' : '∅ (every path died)'));
  };
  const finish = () => {
    over = true; paint();
    if (ad.output) { cap.replaceChildren(h('span', { class: 'pill ok' }, 'done'), ' Output: ', h('b', { class: 'mono' }, out || 'ε')); return; }
    const acc = ad.final(cur); gMark(svg, cur, acc ? 'ok' : 'no');
    cap.replaceChildren(h('span', { class: 'pill ' + (acc ? 'ok' : 'no') }, acc ? 'ACCEPTED' : 'REJECTED'), ' ', acc ? 'The string ended in a final state.' : cur.length ? 'It ended in a non-final state.' : 'No path survived.');
    if (acc) svg.classList.add('flash'); setTimeout(() => svg.classList.remove('flash'), 700);
  };
  const reset = () => { playing = false; w = F.tokInput(inp.value.trim() === 'ε' ? '' : inp.value.trim()); i = 0; cur = ad.init(); out = ''; over = false; cap.replaceChildren('Press ▶ Play or Step.'); paint(); if (!w.length) finish(); };
  const step = async () => {
    if (busy || over) return; busy = true;
    const a = w[i], r = ad.step(cur, a);
    cap.replaceChildren('Reading ', h('b', { class: 'mono' }, a), ' … ');
    await Promise.all(r.moves.map(m => token(svg, m[0], m[1], sp.get())));
    cur = r.next; out += r.out || ''; i++;
    cap.replaceChildren('Read ', h('b', { class: 'mono' }, a), ': ', r.moves.length ? r.moves.map(m => m[0] + ' → ' + m[1] + (r.out ? ' (prints ' + r.out + ')' : '')).join(',  ') : 'no arrow, so this path dies');
    paint(); busy = false;
    if (i >= w.length || !cur.length) finish();
  };
  const play = async () => { if (over) reset(); playing = true; while (playing && !over) { await step(); await sleep(sp.get() / 3); } };
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') { reset(); play(); } });
  reset();
  return h('div', { class: 'runner' },
    note ? h('p', { class: 'small muted' }, note) : null,
    h('div', { class: 'row' }, inp, h('button', { class: 'btn primary', type: 'button', onclick: play }, '▶ Play'), h('button', { class: 'btn', type: 'button', onclick: step }, 'Step'), h('button', { class: 'btn', type: 'button', onclick: reset }, '↺ Reset'), sp.el),
    tries && tries.length ? h('div', { class: 'row' }, h('span', { class: 'small muted' }, 'Try:'), tries.map(t => h('button', { class: 'chipbtn', type: 'button', onclick: () => { inp.value = t; reset(); play(); } }, t || 'ε'))) : null,
    strip, ad.output ? outS : null, h('div', { class: 'mgraph' }, svg), lit, cap);
}

/* --- quick-fire: accept or reject? --- */
function quickfire(L, idx, title, d, alpha, desc) {
  const fb = fbBox(); let streak = 0, best = 0, w = '';
  const qEl = h('div', { class: 'qf-q' }), sEl = h('div', { class: 'streak' }), why = h('div', { class: 'small muted' });
  const next = () => { const n = 1 + Math.floor(Math.random() * 6); w = Array.from({ length: n }, () => alpha[Math.floor(Math.random() * alpha.length)]).join(''); qEl.replaceChildren(...chips([...w])); };
  const paintS = () => sEl.replaceChildren('🔥 streak ', h('b', {}, String(streak)), '  ·  best ' + best + '  ·  reach 8 to finish');
  const answer = yes => {
    const r = F.runDFA(d, w);
    if (r.accepted === yes) { streak++; best = Math.max(best, streak); why.textContent = '✓ ' + w + ' ran ' + r.path.join(' → ') + '.'; qEl.classList.remove('good'); void qEl.offsetWidth; qEl.classList.add('good'); if (streak === 8) fb.ok('Eight in a row. You can read this machine.'); }
    else { streak = 0; why.textContent = '✗ ' + w + ' runs ' + r.path.join(' → ') + ', which is ' + (r.accepted ? 'final' : 'not final') + '.'; qEl.classList.remove('bad'); void qEl.offsetWidth; qEl.classList.add('bad'); }
    paintS(); next();
  };
  next(); paintS();
  return practiceCard(L.id, idx, title, h('div', {}, h('p', {}, desc), dfaGraph(d)), h('div', { class: 'qf' }, sEl, qEl, h('div', { class: 'row' }, h('button', { class: 'btn big ok', type: 'button', onclick: () => answer(true) }, '✓ Accept'), h('button', { class: 'btn big no', type: 'button', onclick: () => answer(false) }, '✗ Reject')), why), fb, null);
}

/* --- animated subset construction --- */
function subsetAnim(fa) {
  const r = F.nfaToDfa(fa), L = {}; r.states.forEach((s, k) => { L[s.name] = String.fromCharCode(65 + k); });
  const nsvg = faGraph(fa), dsvg = dfaGraph(r.dfa, L), sp = speedCtl(700);
  hideAll(dsvg); const startN = r.nameOf(r.startSet);
  const cap = h('div', { class: 'cap', 'aria-live': 'polite' }), tbody = h('tbody', {}), cells = {};
  const addRow = name => { const s = r.states.find(x => x.name === name); const tr = h('tr', { class: 'popin' }, h('td', { class: 'mono-cell' }, (name === startN ? '→ ' : '') + (s.final ? '* ' : '') + L[name]), h('td', { class: 'mono-cell' }, name), fa.alphabet.map(a => { const td = h('td', { class: 'mono-cell' }, '?'); cells[name + '|' + a] = td; return td; })); tbody.append(tr); };
  let k = 0, busy = false, playing = false;
  const seen = new Set();
  const reset = () => { playing = false; k = 0; hideAll(dsvg); tbody.replaceChildren(); seen.clear(); seen.add(startN); addRow(startN); show([...gNodes(dsvg, startN)]); gClear(nsvg, 'on', 'tgt'); gMark(nsvg, r.startSet, 'on'); cap.replaceChildren('Start: the DFA start state is ', h('b', { class: 'mono' }, startN), ' = ', h('b', {}, 'A'), '. Lit states in the NFA are the set we are processing.'); };
  const step = async () => {
    if (busy || k >= r.rows.length) return; busy = true;
    const x = r.rows[k++], from = r.nameOf(x.from), to = r.nameOf(x.to);
    gClear(nsvg, 'on', 'tgt'); gMark(nsvg, x.from, 'on');
    cap.replaceChildren('Processing ', h('b', {}, L[from]), ' = ', h('b', { class: 'mono' }, from), ' on ', h('b', { class: 'mono' }, x.sym), ' …');
    const moves = []; for (const s of x.from) for (const t of F.delta(fa, s, x.sym)) moves.push([s, t]);
    await Promise.all(moves.map(m => token(nsvg, m[0], m[1], sp.get())));
    gClear(nsvg, 'on'); gMark(nsvg, x.to, 'tgt');
    const fresh = !seen.has(to); if (fresh) { seen.add(to); addRow(to); }
    cells[from + '|' + x.sym].textContent = L[to]; cells[from + '|' + x.sym].classList.add('flashcell');
    show([...gNodes(dsvg, to), ...gEdge(dsvg, from, to)]);
    cap.replaceChildren(h('b', {}, L[from]), ' on ', h('b', { class: 'mono' }, x.sym), ': ', moves.length ? moves.map(m => m[0] + '→' + m[1]).join(', ') : 'no moves', fa.hasEps ? ', plus ε-closure' : '', '  ⇒  ', h('b', { class: 'mono' }, to), ' = ', h('b', {}, L[to]), fresh ? h('span', { class: 'pill run' }, ' new state! ') : ' (already have it)');
    if (k >= r.rows.length) cap.append(h('div', {}, h('span', { class: 'pill ok' }, 'done'), ' ' + r.states.length + ' DFA states. Double circles are the sets containing ' + fa.finals.join(', ') + '.'));
    busy = false;
  };
  const play = async () => { if (k >= r.rows.length) reset(); playing = true; while (playing && k < r.rows.length) { await step(); await sleep(sp.get() / 2); } };
  reset();
  return h('div', { class: 'runner' },
    h('div', { class: 'row' }, h('button', { class: 'btn primary', type: 'button', onclick: play }, '▶ Play construction'), h('button', { class: 'btn', type: 'button', onclick: step }, 'Next step'), h('button', { class: 'btn', type: 'button', onclick: reset }, '↺ Reset'), sp.el),
    cap,
    h('div', { class: 'grid2' }, h('div', {}, h('h3', {}, 'NFA (lit = current set)'), nsvg), h('div', {}, h('h3', {}, 'DFA being built'), dsvg)),
    h('div', { class: 'scroll' }, h('table', {}, h('thead', {}, h('tr', {}, h('th', {}, 'DFA'), h('th', {}, 'NFA set'), fa.alphabet.map(a => h('th', {}, 'on ' + a)))), tbody)));
}

/* --- animated table filling --- */
function minAnim(d) {
  const m = F.minimizeDFA(d), R = m.states, cells = {};
  const gsvg = dfaGraph(d), cap = h('div', { class: 'cap', 'aria-live': 'polite' }), log = h('div', { class: 'mlog' }), result = h('div', {});
  const rows = []; for (let i = 1; i < R.length; i++) rows.push(h('tr', {}, h('th', {}, R[i]), R.slice(0, i).map(q => { const td = h('td', { class: 'pc' }, ''); cells[m.pk(R[i], q)] = td; return td; })));
  const tbl = h('table', { class: 'pairs' }, h('thead', {}, h('tr', {}, h('th', {}, ''), R.slice(0, -1).map(q => h('th', {}, q)))), h('tbody', {}, rows));
  let round = -1;
  const reset = () => { round = -1; Object.values(cells).forEach(td => { td.textContent = ''; td.className = 'pc'; }); log.replaceChildren(); result.replaceChildren(); gsvg.querySelectorAll('.g-node').forEach(c => { c.style.fill = ''; }); cap.replaceChildren('Every pair starts unmarked. Press Next round.'); };
  const next = () => {
    if (round > m.rounds) return; round++;
    if (round <= m.rounds) {
      const ps = [...m.marks.entries()].filter(([, v]) => v.round === round);
      ps.forEach(([k2]) => { const td = cells[k2]; td.textContent = '✗' + round; td.className = 'pc mk flip'; });
      log.append(h('div', { class: 'popin' }, h('b', {}, 'Round ' + round + ': '), ps.length ? ps.map(([k2, v]) => '(' + k2.replace('|', ',') + ') ' + v.reason).join(';  ') : 'nothing new, so we stop.'));
      cap.replaceChildren(round === 0 ? 'Round 0 marks every pair with one final and one non-final state.' : 'Round ' + round + ' marks a pair if some symbol sends it to an already marked pair.');
      if (!ps.length) round = m.rounds;
    } else {
      Object.entries(cells).forEach(([, td]) => { if (!td.textContent) { td.textContent = '≡'; td.className = 'pc eq flip'; } });
      m.classes.forEach((c, i) => c.forEach(s => gNodes(gsvg, s).forEach(e => { if (e.classList.contains('g-node')) e.style.fill = PALETTE[i % PALETTE.length] + '44'; })));
      cap.replaceChildren(h('span', { class: 'pill ok' }, 'done'), ' Unmarked pairs (≡) are equivalent. Same colour = same group = one state.');
      result.replaceChildren(h('p', {}, 'Groups: ', h('b', { class: 'mono' }, m.classes.map(c => '{' + c.join(',') + '}').join('  ')), '  →  ' + R.length + ' states become ' + m.min.states.length + '.'), dfaGraph(m.min));
    }
  };
  reset();
  return h('div', { class: 'runner' }, h('div', { class: 'row' }, h('button', { class: 'btn primary', type: 'button', onclick: next }, 'Next round ▶'), h('button', { class: 'btn', type: 'button', onclick: reset }, '↺ Reset')), cap,
    h('div', { class: 'grid2' }, h('div', {}, h('h3', {}, 'Pair table'), h('div', { class: 'scroll' }, tbl), log), h('div', {}, h('h3', {}, 'The DFA'), gsvg)), result);
}

/* --- animated derivation + growing parse tree --- */
function derivAnim(g, w, tries) {
  const box = h('div', { class: 'runner' }), inp = h('input', { type: 'text', value: w, 'aria-label': 'String to derive', class: 'w' });
  const area = h('div', {});
  const load = () => {
    area.replaceChildren();
    const d = F.derive(g, inp.value.trim());
    if (!d) { area.append(h('div', { class: 'cap' }, h('span', { class: 'pill no' }, 'no derivation'), ' This grammar cannot make "' + inp.value + '".')); return; }
    let ri = 0, leaf = 0; const nodes = [];
    const build = (sym, depth, showAt) => {
      const n = { sym, depth, showAt, kids: [] }; nodes.push(n);
      if (F.isNT(sym) && ri < d.rules.length) { const k = ri++, rhs = d.rules[k].rhs; n.kids = (rhs.length ? rhs : ['ε']).map(t => build(t, depth + 1, k + 1)); }
      if (!n.kids.length) n.x = leaf++; else n.x = (n.kids[0].x + n.kids[n.kids.length - 1].x) / 2;
      return n;
    };
    const root = build(g.start, 0, 0), maxD = Math.max(...nodes.map(n => n.depth));
    const W = Math.max(1, leaf) * 46 + 20, H = (maxD + 1) * 56 + 20, X = n => 20 + n.x * 46 + 13, Y = n => 24 + n.depth * 56;
    let svgS = '';
    for (const n of nodes) for (const c of n.kids) svgS += `<line class="t-edge" data-s="${c.showAt}" x1="${X(n)}" y1="${Y(n) + 12}" x2="${X(c)}" y2="${Y(c) - 12}"/>`;
    for (const n of nodes) svgS += `<g class="t-node ${F.isNT(n.sym) ? 'nt' : 'tm'}" data-s="${n.showAt}"><circle cx="${X(n)}" cy="${Y(n)}" r="14"/><text x="${X(n)}" y="${Y(n)}">${esc(n.sym)}</text></g>`;
    const tree = h('div', { class: 'scroll' }); tree.innerHTML = `<svg class="ptree" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Parse tree">${svgS}</svg>`;
    const form = h('div', { class: 'sform' }), hist = h('div', { class: 'hist mono' }), cap = h('div', { class: 'cap' });
    let k = 0;
    const draw = () => {
      const f = d.forms[k], p = f.findIndex(F.isNT), prev = k ? d.rules[k - 1] : null, prevP = k ? d.forms[k - 1].findIndex(F.isNT) : -1;
      form.replaceChildren(...[...f.map((t, j) => h('span', { class: 'chip-s ' + (F.isNT(t) ? 'nt' : 'tm') + (j === p ? ' next' : '') + (prev && j >= prevP && j < prevP + Math.max(1, prev.rhs.length) && prev.rhs.length ? ' pop' : '') }, t)), f.length ? null : h('span', { class: 'chip-s tm' }, 'ε')].filter(Boolean));
      hist.replaceChildren(...d.forms.slice(0, k + 1).map((ff, j) => h('div', { class: j === k ? 'now' : '' }, (j ? '⇒ ' : '   ') + (ff.length ? ff.join(g.word ? ' ' : '') : 'ε') + (j ? '      [' + d.rules[j - 1].lhs + ' → ' + (F.fmtRHS(d.rules[j - 1].rhs) || 'ε') + ']' : ''))));
      tree.querySelectorAll('[data-s]').forEach(e => { const on = +e.dataset.s <= k; if (on && e.style.opacity === '0') { e.style.opacity = ''; e.classList.add('popin'); } else if (!on) e.style.opacity = '0'; });
      cap.replaceChildren(p < 0 ? h('span', {}, h('span', { class: 'pill ok' }, 'done'), ' Only terminals left: the string is derived in ' + (d.forms.length - 1) + ' steps.') : h('span', {}, 'Leftmost variable ', h('b', { class: 'mono' }, f[p]), ' is replaced next using ', h('b', { class: 'mono' }, d.rules[k].lhs + ' → ' + (F.fmtRHS(d.rules[k].rhs) || 'ε'))));
    };
    let playing = false;
    const nextB = () => { if (k < d.forms.length - 1) { k++; draw(); } };
    const play = async () => { if (k >= d.forms.length - 1) k = 0; draw(); playing = true; while (playing && k < d.forms.length - 1) { await sleep(800); if (!playing) break; nextB(); } };
    area.append(h('div', { class: 'row' }, h('button', { class: 'btn primary', type: 'button', onclick: play }, '▶ Play'), h('button', { class: 'btn', type: 'button', onclick: nextB }, 'Replace next'), h('button', { class: 'btn', type: 'button', onclick: () => { playing = false; k = 0; draw(); } }, '↺ Reset')), form, cap, h('div', { class: 'grid2' }, h('div', {}, h('h3', {}, 'Leftmost derivation (what you write)'), hist), h('div', {}, h('h3', {}, 'Parse tree growing'), tree)));
    draw();
  };
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') load(); });
  box.append(pre(F.grammarText(g)), h('div', { class: 'row' }, inp, h('button', { class: 'btn', type: 'button', onclick: load }, 'Derive'), tries ? tries.map(t => h('button', { class: 'chipbtn', type: 'button', onclick: () => { inp.value = t; load(); } }, t)) : null), area);
  load();
  return box;
}

/* --- PDA with a live stack --- */
function pdaAnim(pda, w0, tries) {
  const box = h('div', { class: 'runner' }), inp = h('input', { type: 'text', value: w0, class: 'w', 'aria-label': 'Input string' }), area = h('div', {}), sp = speedCtl(700);
  let playing = false;
  const load = () => {
    playing = false; area.replaceChildren();
    const w = inp.value.trim(), r = F.simulatePDA(pda, w), toks = F.tokInput(w);
    if (!r.accepted) { area.append(h('div', { class: 'cap shake' }, h('span', { class: 'pill no' }, 'REJECTED'), ' No sequence of moves reads all of "' + (w || 'ε') + '" and accepts. The machine gets stuck or the counts do not match.')); return; }
    const strip = h('div', { class: 'strip' }), stack = h('div', { class: 'stack', 'aria-label': 'Stack, top first' }), stEl = h('span', { class: 'statebox' }), cap = h('div', { class: 'cap' });
    const moves = h('ol', { class: 'moves mono' }, r.path.slice(1).map(c => h('li', {}, 'δ(' + c.via.q + ', ' + c.via.a + ', ' + c.via.X + ') = (' + c.via.p + ', ' + (c.via.push.length ? c.via.push.join('') : 'ε') + ')')));
    let k = 0, prevSt = null;
    const draw = () => {
      const c = r.path[k];
      strip.replaceChildren(...(toks.length ? toks.map((t, j) => h('span', { class: j < c.i ? 'done' : j === c.i ? 'cur' : '' }, t)) : [h('span', {}, 'ε')]));
      const pr = prevSt ? prevSt.slice().reverse() : [], nw = c.st.slice().reverse(); let same = 0; while (same < pr.length && same < nw.length && pr[same] === nw[same]) same++;
      stack.replaceChildren(...c.st.map((s, j) => h('div', { class: 'plate' + (c.st.length - 1 - j >= same && prevSt ? ' new' : '') + (s === pda.Z0 ? ' z0' : '') }, s)));
      if (prevSt && pr.length > same) cap.dataset.pop = '1';
      stEl.textContent = 'state ' + c.q;
      [...moves.children].forEach((li, j) => li.classList.toggle('now', j === k - 1));
      const v = c.via;
      cap.replaceChildren(k === 0 ? 'Start with ' + pda.Z0 + ' on the stack.' : h('span', {}, 'Saw ', h('b', { class: 'mono' }, v.a === F.EPS || v.a === 'ε' ? 'ε (no input)' : v.a), ' with ', h('b', { class: 'mono' }, v.X), ' on top → ', v.push.length === 0 ? h('b', { class: 'popw' }, 'POP') : v.push.length === 1 && v.push[0] === v.X ? 'leave stack' : h('b', { class: 'pushw' }, 'PUSH ' + v.push.join('')), ', go to ' + v.p + '.'));
      if (k === r.path.length - 1) cap.append(h('div', {}, h('span', { class: 'pill ok' }, 'ACCEPTED'), ' after ' + k + ' moves.'));
      prevSt = c.st;
    };
    const nextB = () => { if (k < r.path.length - 1) { k++; draw(); } };
    const play = async () => { if (k >= r.path.length - 1) { k = 0; prevSt = null; draw(); } playing = true; while (playing && k < r.path.length - 1) { await sleep(sp.get()); if (!playing) break; nextB(); } };
    area.append(h('div', { class: 'row' }, h('button', { class: 'btn primary', type: 'button', onclick: play }, '▶ Play'), h('button', { class: 'btn', type: 'button', onclick: nextB }, 'Step'), h('button', { class: 'btn', type: 'button', onclick: () => { playing = false; k = 0; prevSt = null; draw(); } }, '↺ Reset'), sp.el),
      strip, h('div', { class: 'pdabox' }, h('div', { class: 'stackwrap' }, h('div', { class: 'small muted' }, 'stack (top)'), stack), h('div', { class: 'pdaside' }, stEl, cap, moves)));
    draw();
  };
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') load(); });
  box.append(h('div', { class: 'row' }, inp, h('button', { class: 'btn', type: 'button', onclick: load }, 'Load'), tries ? tries.map(t => h('button', { class: 'chipbtn', type: 'button', onclick: () => { inp.value = t; load(); } }, t || 'ε')) : null), area);
  load();
  return box;
}

/* --- PCP domino game --- */
function pcpGame(L, idx, title, q, tiles, mpcp) {
  const fb = fbBox(), seq = [], sol = F.solvePCP(tiles, { mpcp });
  const rowsEl = h('div', { class: 'pcprows' }), status = h('div', { class: 'cap' }), seqEl = h('div', { class: 'small mono' });
  const paint = () => {
    const T = seq.map(i => tiles[i][0]).join(''), B = seq.map(i => tiles[i][1]).join(''), n = Math.min(T.length, B.length);
    let bad = -1; for (let j = 0; j < n; j++) if (T[j] !== B[j]) { bad = j; break; }
    const row = (s, lbl) => h('div', { class: 'pr' }, h('span', { class: 'lbl' }, lbl), ...[...s].map((c, j) => h('span', { class: 'ch ' + (bad >= 0 && j >= bad ? 'x' : j < n ? 'm' : 'o') }, c)));
    rowsEl.replaceChildren(row(T, 'top'), row(B, 'bottom'));
    seqEl.textContent = seq.length ? 'Sequence: ' + seq.map(i => i + 1).join(', ') : 'Click a domino to place it.';
    if (!seq.length) status.replaceChildren(mpcp ? 'MPCP: you must start with tile 1.' : 'Pick a first tile whose top and bottom start the same way.');
    else if (bad >= 0) status.replaceChildren(h('span', { class: 'pill no' }, 'mismatch'), ' at position ' + (bad + 1) + '. Undo.');
    else if (T === B) { status.replaceChildren(h('span', { class: 'pill ok' }, 'MATCH'), ' both rows spell ', h('b', { class: 'mono' }, T)); fb.ok('You solved it with ' + seq.map(i => i + 1).join(', ') + '.'); }
    else status.replaceChildren(h('span', { class: 'pill run' }, T.length > B.length ? 'top ahead' : 'bottom ahead'), ' by ', h('b', { class: 'mono' }, (T.length > B.length ? T : B).slice(n)), '. The next tile must continue the other row with these letters.');
  };
  const add = i => { if (mpcp && !seq.length && i !== 0) { status.replaceChildren(h('span', { class: 'pill no' }, 'MPCP'), ' The first tile must be tile 1.'); return; } seq.push(i); paint(); };
  const hint = () => {
    if (!sol.found) { status.replaceChildren('There is no solution. Look: ' + (tiles.every(t => t[0].length > t[1].length) ? 'every top is longer than its bottom, so top always stays ahead.' : 'the search finds none.')); return; }
    const s = sol.seq.map(x => x - 1); if (seq.every((x, j) => s[j] === x) && seq.length < s.length) status.replaceChildren('💡 Next try tile ' + (s[seq.length] + 1) + '.'); else status.replaceChildren('💡 You are off the known path. Undo back to a match.');
  };
  paint();
  return practiceCard(L.id, idx, title, h('p', {}, q), h('div', {},
    h('div', { class: 'dominoes' }, tiles.map((t, i) => h('button', { class: 'domino', type: 'button', onclick: () => add(i), 'aria-label': 'Tile ' + (i + 1) + ': top ' + t[0] + ', bottom ' + t[1] }, h('span', { class: 'dn' }, String(i + 1)), h('span', { class: 'dt' }, t[0]), h('span', { class: 'db' }, t[1])))),
    rowsEl, seqEl, status, h('div', { class: 'row' }, h('button', { class: 'btn', type: 'button', onclick: () => { seq.pop(); paint(); } }, '↶ Undo'), h('button', { class: 'btn', type: 'button', onclick: () => { seq.length = 0; paint(); } }, 'Clear'), h('button', { class: 'btn', type: 'button', onclick: hint }, '💡 Hint'))), fb, null);
}
