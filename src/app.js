(function () {
'use strict';
const F = window.FLA, P = window.PRESETS, D = window.FLA_DATA;

/* ---------- helpers ---------- */
const $ = (s, e = document) => e.querySelector(s);
function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === 'class') e.className = v; else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat(Infinity)) { if (c == null || c === false) continue; e.append(c.nodeType ? c : document.createTextNode(String(c))); }
  return e;
}
const store = {
  get(k, d) { try { const v = localStorage.getItem('fla:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('fla:' + k, JSON.stringify(v)); } catch (e) { /* storage may be unavailable */ } }
};
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const S = { sort: 'unit', faSub: 'nfa', mmSub: 'mealy', texts: {}, sel: {} };
const selIndex = (id, def = 0) => (S.sel[id] === undefined ? def : S.sel[id]);
let timer = null;

function table(headers, rows, opts = {}) {
  const t = h('table', { class: opts.cls || '' },
    h('thead', {}, h('tr', {}, headers.map((x, i) => h('th', { class: opts.numCols && opts.numCols.includes(i) ? 'num' : '' }, x)))),
    h('tbody', {}, rows.map(r => h('tr', {}, r.map((c, i) => h('td', { class: (opts.monoCols && opts.monoCols.includes(i) ? 'mono-cell ' : '') + (opts.numCols && opts.numCols.includes(i) ? 'num' : '') }, c))))));
  return h('div', { class: 'scroll' }, t);
}
function stage(title, ...kids) { return h('div', { class: 'stage' }, h('h3', {}, title), h('div', { class: 'in' }, kids)); }
function pre(text) { return h('pre', {}, text); }
function err(e) { return h('div', { class: 'err', role: 'alert' }, e.message || String(e)); }
function presetSelect(id, list, onPick, def = 0) {
  const sel = h('select', { id }, list.map((p, i) => h('option', { value: i }, p.label)));
  sel.value = String(selIndex(id, def));
  sel.addEventListener('change', () => { S.sel[id] = +sel.value; onPick(list[+sel.value]); });
  return sel;
}
function seg(options, current, onPick) {
  return h('div', { class: 'seg', role: 'group' }, options.map(([id, label]) => h('button', { type: 'button', 'aria-pressed': String(id === current), onclick: () => onPick(id) }, label)));
}
const nm = s => (s.length ? s.join('') : 'ε');

/* ---------- graph drawing ---------- */
let gid = 0;
function svgGraph(m) {
  const id = 'ar' + (++gid), n = m.nodes.length;
  const maxLen = Math.max(2, ...m.nodes.map(x => x.label.length));
  const r = Math.min(40, Math.max(20, 10 + maxLen * 4.4));
  const Rc = n <= 1 ? 0 : Math.max(r * 3.4, (n * (2 * r + 40)) / (2 * Math.PI));
  const pad = r + 62, cx = Rc + pad, cy = Rc + pad, W = 2 * Rc + 2 * pad, H = 2 * Rc + 2 * pad;
  const pos = {};
  m.nodes.forEach((nd, i) => {
    const a = Math.PI + (i * 2 * Math.PI) / n;
    const x = cx + Rc * Math.cos(a), y = cy + Rc * Math.sin(a);
    const ux = n <= 1 ? 0 : Math.cos(a), uy = n <= 1 ? -1 : Math.sin(a);
    pos[nd.id] = { x, y, ux, uy, nd };
  });
  const groups = new Map();
  for (const e of m.edges) { const k = e.from + '\u0001' + e.to; if (!groups.has(k)) groups.set(k, { from: e.from, to: e.to, labels: [] }); const g = groups.get(k); if (!g.labels.includes(e.label)) g.labels.push(e.label); }
  let out = '';
  for (const g of groups.values()) {
    const A = pos[g.from], B = pos[g.to]; if (!A || !B) continue;
    const label = esc(g.labels.join(', ')), ek = esc(g.from + '→' + g.to);
    if (g.from === g.to) {
      const ang = Math.atan2(A.uy, A.ux) + (A.nd.start ? 0.95 : 0);
      const p = (a, d) => [A.x + d * Math.cos(a), A.y + d * Math.sin(a)];
      const p1 = p(ang - 0.5, r), p2 = p(ang + 0.5, r + 3), c1 = p(ang - 0.42, r + 46), c2 = p(ang + 0.42, r + 46), lp = p(ang, r + 40);
      out += `<path class="g-edge" data-e="${ek}" d="M${p1[0]},${p1[1]} C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}" marker-end="url(#${id})"/><text class="g-el" data-e="${ek}" x="${lp[0]}" y="${lp[1]}">${label}</text>`;
    } else {
      const rev = groups.has(g.to + '\u0001' + g.from);
      const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
      let dx = B.x - A.x, dy = B.y - A.y; const len = Math.hypot(dx, dy) || 1;
      const px = -dy / len, py = dx / len;
      const side = rev ? (m.nodes.findIndex(x => x.id === g.from) < m.nodes.findIndex(x => x.id === g.to) ? 1 : -1) : 0;
      const bend = rev ? 46 : 0;
      const C = [mx + px * bend * side, my + py * bend * side];
      const norm = (P0, P1) => { const d = Math.hypot(P1[0] - P0[0], P1[1] - P0[1]) || 1; return [(P1[0] - P0[0]) / d, (P1[1] - P0[1]) / d]; };
      const u1 = norm([A.x, A.y], C), u2 = norm([B.x, B.y], C);
      const s = [A.x + u1[0] * r, A.y + u1[1] * r], e = [B.x + u2[0] * (r + 3), B.y + u2[1] * (r + 3)];
      const q = [0.25 * s[0] + 0.5 * C[0] + 0.25 * e[0], 0.25 * s[1] + 0.5 * C[1] + 0.25 * e[1]];
      const off = rev ? 9 * side : 11;
      out += `<path class="g-edge" data-e="${ek}" d="M${s[0]},${s[1]} Q${C[0]},${C[1]} ${e[0]},${e[1]}" marker-end="url(#${id})"/><text class="g-el" data-e="${ek}" x="${q[0] + px * off}" y="${q[1] + py * off}">${label}</text>`;
    }
  }
  for (const nd of m.nodes) {
    const P0 = pos[nd.id];
    if (nd.start) {
      const a = [P0.x + P0.ux * (r + 34), P0.y + P0.uy * (r + 34)], b = [P0.x + P0.ux * (r + 3), P0.y + P0.uy * (r + 3)];
      out += `<path class="g-edge g-start" data-n="${esc(nd.id)}" d="M${a[0]},${a[1]} L${b[0]},${b[1]}" marker-end="url(#${id})"/>`;
    }
    out += `<circle class="g-node${nd.active ? ' active' : ''}" data-n="${esc(nd.id)}" cx="${P0.x}" cy="${P0.y}" r="${r}"/>`;
    if (nd.final) out += `<circle class="g-inner" data-n="${esc(nd.id)}" cx="${P0.x}" cy="${P0.y}" r="${r - 5}"/>`;
    out += `<text class="g-label${nd.active ? ' active' : ''}" data-n="${esc(nd.id)}" x="${P0.x}" y="${P0.y}" style="font-size:${maxLen > 6 ? 10 : 12}px">${esc(nd.label)}</text>`;
  }
  const svg = h('div', {});
  svg.innerHTML = `<svg class="graph" viewBox="0 0 ${W} ${H}" role="img" aria-label="State diagram"><defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="g-arrow" d="M0,0 L10,5 L0,10 z"/></marker></defs>${out}</svg>`;
  return svg.firstChild;
}
function faGraph(fa, label) {
  const edges = [];
  for (const [k, ts] of Object.entries(fa.trans)) { const [s, a] = k.split('\u0001'); ts.forEach(t => edges.push({ from: s, to: t, label: a })); }
  return svgGraph({ nodes: fa.states.map(s => ({ id: s, label: (label && label[s]) || s, start: s === fa.start, final: fa.finals.includes(s) })), edges });
}
function dfaGraph(d, label) {
  const edges = []; for (const s of d.states) for (const a of d.alphabet) if (d.delta[s] && d.delta[s][a]) edges.push({ from: s, to: d.delta[s][a], label: a });
  return svgGraph({ nodes: d.states.map(s => ({ id: s, label: (label && label[s]) || s, start: s === d.start, final: d.finals.includes(s) })), edges });
}
function dfaTable(d, label) {
  const L = s => (label && label[s]) || s;
  return table(['State', ...d.alphabet], d.states.map(s => [(s === d.start ? '→ ' : '') + (d.finals.includes(s) ? '* ' : '') + L(s), ...d.alphabet.map(a => L(d.delta[s][a]))]), { monoCols: [0, ...d.alphabet.map((_, i) => i + 1)] });
}

/* ---------- Priorities ---------- */
const TOOL = { fa: ['Automata lab', 'fa'], gram: ['Grammar lab', 'gram'], pda: ['PDA lab', 'pda'], tm: ['Turing lab', 'tm'], undec: ['Undecidability', 'undec'], plan: ['Study plan', 'plan'] };
function viewPriority() {
  const top = D.topics.filter(t => t.count >= 5);
  const root = h('div', { class: 'view' });
  root.append(h('section', { class: 'hero' },
    h('div', { class: 'eyebrow' }, '21CSC301T · six past papers, Nov 2024 to May 2026'),
    h('h1', {}, 'What the exam keeps asking'),
    h('p', { class: 'lede' }, 'Every paper has the same shape. The same topics come back in the same slots, and several questions repeat almost word for word. Cover these and each 8-mark choice has an answer ready.')));
  root.append(h('div', { class: 'stats' },
    h('div', { class: 'stat' }, h('div', { class: 'big' }, '6', h('small', {}, '/6')), h('span', {}, 'papers asked for a Greibach normal form conversion')),
    h('div', { class: 'stat' }, h('div', { class: 'big' }, '6', h('small', {}, '/6')), h('span', {}, 'papers asked for CFG simplification (ε, unit, useless)')),
    h('div', { class: 'stat' }, h('div', { class: 'big' }, '6', h('small', {}, '/6')), h('span', {}, 'papers had a Turing machine design, 4 of them for 15 marks')),
    h('div', { class: 'stat' }, h('div', { class: 'big' }, String(top.length), h('small', {}, ' topics')), h('span', {}, 'appeared in at least 5 of the 6 papers'))));
  root.append(h('section', { class: 'card' }, h('h2', {}, 'How the 75 marks are built'),
    h('div', { class: 'blueprint' },
      h('div', { class: 'bp' }, h('b', {}, 'Part A · 20 × 1'), h('span', {}, 'Four MCQs per unit, same split every paper. Q1–4 Unit 1 through Q17–20 Unit 5.')),
      h('div', { class: 'bp' }, h('b', {}, 'Part B · 5 × 8'), h('span', {}, 'Q21 to Q25, one per unit, each with an either/or. Prepare two strong options per unit.')),
      h('div', { class: 'bp' }, h('b', {}, 'Part C · 1 × 15'), h('span', {}, 'Q26 or Q27. Grammar normal forms or a Turing machine design was one of the two options in every paper.')))));
  const heat = h('section', { class: 'card' });
  heat.append(h('div', { class: 'row', style: 'justify-content:space-between' }, h('h2', {}, 'Topic by paper'),
    seg([['unit', 'Group by unit'], ['freq', 'Most asked first']], S.sort, v => { S.sort = v; render(); })));
  heat.append(h('div', { class: 'legend' }, h('span', {}, h('i', { class: 'lg8' }), 'asked in a Part B slot (8 marks)'), h('span', {}, h('i', { class: 'lg15' }), 'asked as the 15-mark question (¹⁵)'),
    h('span', { class: 'muted' }, 'Numbers are question numbers. "21a · 21b" means both options.')));
  const rows = [];
  const mk = t => {
    const tl = TOOL[t.tool];
    return h('tr', {},
      h('td', { class: 'topic' }, t.name, h('small', {}, t.tip)),
      t.hits.map(x => x ? h('td', { class: 'hc ' + (x.includes('¹⁵') ? 'hit15' : 'hit') }, x.replace(/·/g, ' · ')) : h('td', { class: 'hc miss', 'aria-label': 'not asked' }, '–')),
      h('td', { class: 'num' }, h('span', { class: 'seen', 'aria-hidden': 'true' }, [0, 1, 2, 3, 4, 5].map(i => h('i', { class: i < t.count ? 'on' : '' }))), h('b', {}, t.count + '/6')),
      h('td', {}, h('span', { class: 'badge t' + t.tier }, t.tier === 1 ? 'MUST' : t.tier === 2 ? 'SHOULD' : 'IF TIME')),
      h('td', { 'aria-label': ['', 'quick', 'medium', 'long'][t.effort] + ' to learn' }, h('span', { class: 'dots' }, '●'.repeat(t.effort) + '○'.repeat(3 - t.effort))),
      h('td', {}, h('a', { href: '#' + tl[1] }, tl[0])));
  };
  if (S.sort === 'unit') for (const u of [1, 2, 3, 4, 5]) { rows.push(h('tr', { class: 'unit' }, h('th', { colspan: 11 }, D.units[u]))); D.topics.filter(t => t.unit === u).forEach(t => rows.push(mk(t))); }
  else D.topics.slice().sort((a, b) => b.count - a.count || a.unit - b.unit).forEach(t => rows.push(mk(t)));
  heat.append(h('div', { class: 'scroll heat' }, h('table', {}, h('thead', {}, h('tr', {}, h('th', {}, 'Topic'), D.papers.map(p => h('th', { class: 'paper' }, p.short)), h('th', { class: 'num' }, 'Seen'), h('th', {}, 'Priority'), h('th', {}, 'Effort'), h('th', {}, 'Drill it'))), h('tbody', {}, rows))));
  heat.append(h('p', { class: 'small muted' }, 'Priority is by how many of the six papers asked it: MUST is 5 or 6, SHOULD is 3 or 4, IF TIME is 2 or fewer. Effort is my estimate of how long the topic takes to learn.'));
  root.append(heat);
  root.append(h('section', { class: 'card' }, h('h2', {}, 'The smallest set that covers every paper'),
    h('p', {}, 'Each Part B question lets you choose between two options. This is the shortest list of topics for which, in every one of the six papers, at least one option in that slot was on the list.'),
    h('div', { class: 'grid2' }, D.slots.map(s => h('div', { class: 'slot card' }, h('h3', {}, s.title), h('div', { class: 'chips' }, s.cover.map(c => h('span', { class: 'chip' }, c))), h('p', { class: 'small muted' }, s.why))))));
  root.append(h('section', { class: 'card' }, h('h2', {}, 'Questions that were asked twice'),
    h('p', {}, 'These came back in later papers, so work them first.'),
    table(['Question', 'Where'], D.repeats.map(r => [r.what, r.where]))));
  root.append(h('section', { class: 'card' }, h('h2', {}, 'Before you trust these notes'), D.watch.map(w => h('div', { class: 'note' }, w))));
  return root;
}

/* ---------- Study plan ---------- */
const BLOCKS = [
  { id: 'gram', title: 'Grammar normal forms', time: '75 min', tool: 'gram', why: 'GNF and simplification were in 6 of 6 papers, CNF in 5. This is also the 15-mark option most often.', items: [
    'Simplify and convert to CNF by hand: May 2026 Q22a, then Jul 2025 P1 Q27 (several nullable variables)',
    'Greibach normal form: May 2025 Q22b (S→AA|a, A→SS|b) and Jul 2025 P2 Q22b',
    'Do the 15-mark chain once: simplify, CNF, then GNF (Nov 2025 Q26, May 2026 Q26)',
    'Left recursion: add Z and back-substitute, once without looking',
    'Ambiguity: find one string with two parse trees (Nov 2025 Q22b)',
    'Check every answer in the Grammar lab'] },
  { id: 'tm', title: 'Turing machine designs', time: '90 min', tool: 'tm', why: 'A design was offered in all 6 papers. Four put one in Part C for 15 marks.', items: [
    'aⁿbⁿcⁿ with markers X, Y, Z (Nov 2024, Nov 2025)',
    'Unary addition, then subtraction (Nov 2024, Jul 2025 P1 and P2)',
    'w wᴿ by crossing off both ends (May 2025, Jul 2025 P1 and P2)',
    'Copy w to ww (May 2026 Q27)',
    'Unary multiplication (May 2025 Q27, Nov 2025 Q27)',
    'Be ready to trace the exact sample string with instantaneous descriptions',
    'Half a page each on TM variants, UTM, recursive vs RE (May 2025, Nov 2025, May 2026)'] },
  { id: 'pda', title: 'Pushdown automata', time: '60 min', tool: 'pda', why: 'PDA design and CFG to PDA each appeared in 5 papers.', items: [
    'Equal number of a and b, trace baab (Jul 2025 P1, Nov 2025)',
    'aⁿbⁿcᵐdᵐ (Jul 2025 P1, May 2026)',
    'a^(m+n) bᵐ cⁿ (Nov 2024)',
    'CFG to PDA with trace: S→0BB, B→0S|1S|0 and 010⁴ (Nov 2024, Jul 2025 P1)',
    'CFG to PDA: E→E+E|E*E|a and a*a (Nov 2025)',
    'PDA to CFG once (Jul 2025 P1 and P2)'] },
  { id: 'fa', title: 'Finite automata quick wins', time: '60 min', tool: 'fa', why: 'Cheap marks. NFA to DFA and Mealy/Moore were each in 4 papers, DFA design or minimization in 5.', items: [
    'NFA to DFA: second-last symbol is 1 (asked twice), May 2026 Q21b',
    'ε-NFA to DFA with ε-closures (Jul 2025 P1 Q21a)',
    'Mealy to Moore (May 2026 Q21a) and a Moore machine design (Nov 2024 Q21b)',
    'Minimize with table filling (May 2025 Q26)',
    'Design a DFA from the language: no substring xxy, aⁿbᵐ with n ≥ 2',
    'DFA to regular expression by Rᵢⱼᵏ once (Nov 2024 Q26)'] },
  { id: 'undec', title: 'PCP, decidability, NP', time: '50 min', tool: 'undec', why: 'PCP was in 5 papers. The theory questions repeat the same definitions.', items: [
    'Solve each PCP instance from the papers, and say when there is no solution',
    'MPCP: starts with tile 1',
    'Rice theorem statement and proof sketch (Nov 2024, Jul 2025 P1)',
    'Lₑ is not recursive',
    'Halting problem proof',
    'Decidable vs undecidable, recursive vs RE, closure under complement',
    'P, NP, NP-complete, NP-hard with examples'] },
  { id: 'proofs', title: 'Pumping lemma proofs', time: '30 min', tool: 'undec', why: 'Three papers asked for a proof (May 2025, Jul 2025 P2, Nov 2025).', items: [
    'aⁿbⁿ is not regular (Jul 2025 P2)',
    '0ⁿ10ⁿ is not regular (Nov 2025)',
    'aⁿbⁿcⁿ is not context free (May 2025)'] },
  { id: 'quiz', title: 'Part A drill', time: '30 min', tool: 'quiz', why: 'Four marks per unit, every paper. The same facts repeat.', items: [
    'Finish the quiz until every unit scores 80% or more',
    'Read the quick facts below once'] }
];
function viewPlan() {
  const root = h('div', { class: 'view' });
  const done = store.get('plan', {});
  const total = BLOCKS.reduce((a, b) => a + b.items.length, 0);
  const bar = h('i', {}), count = h('b', {});
  const upd = () => { const d = Object.values(done).filter(Boolean).length; bar.style.width = Math.round(100 * d / total) + '%'; count.textContent = d + ' of ' + total + ' done'; };
  root.append(h('section', { class: 'hero' }, h('div', { class: 'eyebrow' }, 'Study plan'), h('h1', {}, 'Where to spend the hours'),
    h('p', { class: 'lede' }, 'Ordered by how often a topic came up and how many marks it carries. Time boxes are my suggestion, about seven hours in total. Tick things off as you go.'),
    h('div', { class: 'progress', role: 'progressbar', 'aria-label': 'Plan progress' }, bar), h('div', { class: 'small' }, count)));
  BLOCKS.forEach((b, i) => {
    const sec = h('section', { class: 'card block' },
      h('header', {}, h('span', { class: 'num' }, String(i + 1)), h('h2', { style: 'margin:0' }, b.title), h('span', { class: 'badge t2' }, b.time), h('a', { href: '#' + b.tool, class: 'small' }, 'Open the ' + (TOOL[b.tool] ? TOOL[b.tool][0] : 'Part A quiz') + ' →')),
      h('p', { class: 'muted', style: 'margin:0' }, b.why),
      b.items.map((it, j) => { const key = b.id + j; const span = h('span', { class: done[key] ? 'done' : '' }, it);
        return h('label', { class: 'check' }, h('input', { type: 'checkbox', id: 'c-' + key, checked: !!done[key], onchange: e => { done[key] = e.target.checked; span.className = e.target.checked ? 'done' : ''; store.set('plan', done); upd(); } }), span); }));
    root.append(sec);
  });
  upd();
  root.append(h('section', {}, h('h2', {}, 'Answer skeletons'), h('p', { class: 'muted' }, 'A sequence that keeps the marker looking for working. This is my layout, not an official marking scheme.'),
    D.templates.map(t => h('details', {}, h('summary', {}, t.name), h('div', { class: 'body' }, h('ol', {}, t.steps.map(s => h('li', {}, s))))))));
  const cl = D.facts.closure;
  root.append(h('section', { class: 'card' }, h('h2', {}, 'Quick facts for Part A'),
    h('div', { class: 'grid2' },
      h('div', {}, h('h3', {}, 'Closure properties'), table(['Class', ...cl.cols], cl.rows.map(r => [r[0], ...r.slice(1).map(v => v ? h('span', { class: 'ok' }, 'yes') : h('span', { class: 'no' }, 'no'))]), { numCols: [1, 2, 3, 4, 5] })),
      h('div', {}, h('h3', {}, 'Chomsky hierarchy'), table(['Type', 'Grammar', 'Machine'], D.facts.hierarchy))),
    h('h3', { style: 'margin-top:14px' }, 'One-liners that were asked as MCQs'),
    table(['Term', 'Answer'], D.facts.oneLiners)));
  root.append(h('section', {}, h('h2', {}, 'One-page theory notes'), D.theory.map(t => h('details', {}, h('summary', {}, t.title), h('div', { class: 'body' }, t.body.map(p => h('p', {}, p)))))));
  return root;
}

/* ---------- Automata lab ---------- */
function labText(key, def) { if (S.texts[key] === undefined) S.texts[key] = def; return S.texts[key]; }
function textArea(key, def, rows) {
  const t = h('textarea', { id: 'ta-' + key, rows: rows || 9, spellcheck: 'false', 'aria-label': 'Machine definition' });
  t.value = labText(key, def); t.addEventListener('input', () => { S.texts[key] = t.value; }); return t;
}
function setTA(key, v) { S.texts[key] = v; const t = $('#ta-' + key); if (t) t.value = v; }
function renameStates(states) { const L = {}; states.forEach((s, i) => { L[s] = String.fromCharCode(65 + i % 26) + (i >= 26 ? Math.floor(i / 26) : ''); }); return L; }
function dfaText(d, L) {
  const lines = ['start: ' + L[d.start], 'final: ' + d.finals.map(s => L[s]).join(' ')];
  for (const s of d.states) for (const a of d.alphabet) lines.push(L[s] + ' ' + a + ' -> ' + L[d.delta[s][a]]);
  return lines.join('\n');
}
function viewFA() {
  const root = h('div', { class: 'view' });
  root.append(h('section', { class: 'hero' }, h('div', { class: 'eyebrow' }, 'Unit 1 and 2 · finite automata'), h('h1', {}, 'Automata lab'),
    h('p', { class: 'lede' }, 'Load a machine from a past paper or type your own. Each tool shows the working in the order you would write it in the exam.'),
    seg([['nfa', 'NFA → DFA'], ['min', 'Minimize a DFA'], ['mm', 'Mealy / Moore']], S.faSub, v => { S.faSub = v; render(); })));
  root.append(S.faSub === 'nfa' ? labNFA() : S.faSub === 'min' ? labMin() : labMM());
  return root;
}
function labNFA() {
  const wrap = h('div', { class: 'lab' }), out = h('div', { class: 'lab' });
  const first = P.nfa[selIndex('nfa-preset')];
  const ta = textArea('nfa', first.text, 12);
  const tests = h('input', { type: 'text', id: 'nfa-tests', value: S.texts.nfaTests === undefined ? first.tests.join(' ') : S.texts.nfaTests, 'aria-label': 'Test strings' });
  tests.addEventListener('input', () => { S.texts.nfaTests = tests.value; });
  const sel = presetSelect('nfa-preset', P.nfa, p => { setTA('nfa', p.text); tests.value = p.tests.join(' '); S.texts.nfaTests = tests.value; run(); });
  const run = () => {
    out.replaceChildren();
    let fa, r;
    try { fa = F.parseFA(S.texts.nfa); r = F.nfaToDfa(fa); } catch (e) { out.append(err(e)); return; }
    const L = {}; r.states.forEach((s, i) => { L[s.name] = String.fromCharCode(65 + i); });
    const dd = r.dfa;
    if (fa.hasEps) out.append(stage('Step 1 · ε-closure of each state', table(['State', 'ε-closure'], fa.states.map(s => [s, '{' + F.epsClosure(fa, [s]).join(', ') + '}']), { monoCols: [0, 1] })));
    out.append(stage((fa.hasEps ? 'Step 2' : 'Step 1') + ' · subset construction', h('p', { class: 'small muted' }, 'Start state: ' + (fa.hasEps ? 'ε-closure of ' + fa.start + ' = ' : '') + r.nameOf(r.startSet) + '. A subset is final if it contains a final NFA state (marked *).'),
      table(['Name', 'DFA state', ...fa.alphabet.map(a => 'on ' + a)], r.states.map(s => {
        const row = r.rows.filter(x => r.nameOf(x.from) === s.name);
        return [(s.name === dd.start ? '→ ' : '') + (s.final ? '* ' : '') + L[s.name], s.name, ...fa.alphabet.map(a => { const x = row.find(y => y.sym === a); return fa.hasEps ? r.nameOf(x.move) + ' → ' + L[r.nameOf(x.to)] + ' ' + r.nameOf(x.to) : L[r.nameOf(x.to)] + '  ' + r.nameOf(x.to); })];
      }), { monoCols: [0, 1, ...fa.alphabet.map((_, i) => i + 2)] })));
    out.append(h('div', { class: 'grid2' }, h('div', {}, h('h3', { style: 'margin-bottom:6px' }, 'NFA'), faGraph(fa)), h('div', {}, h('h3', { style: 'margin-bottom:6px' }, 'DFA (' + dd.states.length + ' states)'), dfaGraph(dd, L))));
    const strs = (tests.value || '').split(/\s+/).filter(Boolean);
    const rows = strs.map(s => { const a = F.runNFA(fa, s), b = F.runDFA(dd, s); return [s, a.accepted ? h('span', { class: 'pill ok' }, 'accepted') : h('span', { class: 'pill no' }, 'rejected'), b.accepted ? h('span', { class: 'pill ok' }, 'accepted') : h('span', { class: 'pill no' }, 'rejected'), b.path.map(x => L[x]).join(' → ')]; });
    if (rows.length) out.append(stage('Test strings', table(['String', 'NFA', 'DFA', 'DFA path'], rows, { monoCols: [0, 3] })));
    let agree = 0, total = 0;
    const alpha = fa.alphabet;
    let layer = ['']; for (let k = 0; k <= 7; k++) { for (const s of layer) { total++; if (F.runNFA(fa, s).accepted === F.runDFA(dd, s).accepted) agree++; } layer = [].concat(...layer.map(s => alpha.map(a => s + a))); if (layer.length > 3000) break; }
    out.append(h('p', { class: 'small' }, agree === total ? h('span', { class: 'ok' }, 'Cross-check passed: ') : h('span', { class: 'no' }, 'Mismatch: '), 'NFA and DFA agree on ' + agree + ' of ' + total + ' strings (all strings up to the length tried).'));
    out.append(h('div', { class: 'row' }, h('button', { class: 'btn', type: 'button', onclick: () => { const rl = renameStates(dd.states); S.texts.min = dfaText(dd, rl); S.texts.minTests = ''; S.faSub = 'min'; render(); } }, 'Minimize this DFA →')));
  };
  wrap.append(h('div', { class: 'toolbar' }, h('div', { class: 'field' }, h('label', { for: 'nfa-preset' }, 'Load from a paper'), sel)),
    h('div', { class: 'field' }, h('label', { for: 'ta-nfa' }, 'NFA (one transition per line: state symbol -> targets). Type ε for ε-moves.'), ta),
    h('div', { class: 'toolbar' }, h('div', { class: 'field' }, h('label', { for: 'nfa-tests' }, 'Test strings (space separated; use ε-free strings)'), tests), h('button', { class: 'btn primary', type: 'button', onclick: run }, 'Convert to DFA'), h('button', { class: 'btn', type: 'button', onclick: () => { setTA('nfa', 'start: q0\nfinal: q1\nq0 a -> q0 q1\nq0 b -> q0\nq1 a ->\nq1 b ->'); run(); } }, 'Tiny example')), out);
  run();
  return wrap;
}
function labMin() {
  const wrap = h('div', { class: 'lab' }), out = h('div', { class: 'lab' });
  const m0 = P.dfa[selIndex('min-preset')];
  const ta = textArea('min', m0.text, 14);
  const tests = h('input', { type: 'text', id: 'min-tests', value: S.texts.minTests === undefined ? m0.tests.join(' ') : S.texts.minTests, 'aria-label': 'Test strings' });
  tests.addEventListener('input', () => { S.texts.minTests = tests.value; });
  const sel = presetSelect('min-preset', P.dfa, p => { setTA('min', p.text); tests.value = p.tests.join(' '); S.texts.minTests = tests.value; run(); });
  const run = () => {
    out.replaceChildren();
    let d, m;
    try { d = F.faToDfaObj(F.parseFA(S.texts.min)); m = F.minimizeDFA(d); } catch (e) { out.append(err(e)); return; }
    out.append(stage('Step 1 · clean up', h('p', { class: 'small' }, (m.removed.length ? 'Unreachable states removed: ' + m.removed.join(', ') + '. ' : 'Every state is reachable. ') + (m.trapAdded ? 'Some transitions were missing, so a dead state "' + m.trapAdded + '" was added. ' : 'The DFA is complete. ') + 'Working with ' + m.states.length + ' states.')));
    const R = m.states;
    if (R.length > 1) {
      const rows = [];
      for (let i = 1; i < R.length; i++) rows.push([R[i], ...R.slice(0, i).map(p => { const k = m.pk(R[i], p), mk = m.marks.get(k); return mk ? h('span', { class: 'mkcell', 'data-m': 1 }, String(mk.round)) : '≡'; })]);
      const t = table(['', ...R.slice(0, R.length - 1)], rows, { cls: 'pairs' });
      t.querySelectorAll('tbody tr').forEach(tr => [...tr.children].forEach((td, i) => { if (i === 0) return; td.className = td.textContent === '≡' ? 'eq' : 'mk'; }));
      t.querySelectorAll('tbody tr').forEach(tr => { [...tr.children].forEach((td, i) => { if (i === 0) td.style.fontWeight = '600'; }); });
      out.append(stage('Step 2 · table filling', h('p', { class: 'small muted' }, 'Number = the round in which the pair was marked as distinguishable (0 = one is final and one is not). ≡ means never marked, so the two states are equivalent.'), t));
      const lines = [];
      for (let r = 0; r <= m.rounds; r++) { const ps = [...m.marks.entries()].filter(([, v]) => v.round === r); if (ps.length) lines.push('Round ' + r + ':\n' + ps.map(([k, v]) => '  (' + k.replace('|', ', ') + ')  ' + v.reason).join('\n')); }
      out.append(stage('Why each pair was marked', pre(lines.join('\n'))));
    }
    out.append(stage('Step 3 · equivalence classes', h('p', {}, m.classes.map(c => '{' + c.join(', ') + '}').join('   ')), h('p', { class: 'small muted' }, R.length + ' states reduce to ' + m.min.states.length + '.')));
    out.append(stage('Minimal DFA', dfaTable(m.min), dfaGraph(m.min)));
    let ok = 0, tot = 0, layer = ['']; for (let k = 0; k <= 7; k++) { for (const s of layer) { tot++; if (F.runDFA(d, s).accepted === F.runDFA(m.min, s).accepted) ok++; } layer = [].concat(...layer.map(s => d.alphabet.map(a => s + a))); if (layer.length > 3000) break; }
    out.append(h('p', { class: 'small' }, ok === tot ? h('span', { class: 'ok' }, 'Cross-check passed: ') : h('span', { class: 'no' }, 'Mismatch: '), 'the original and minimal DFA agree on ' + ok + ' of ' + tot + ' strings.'));
    const strs = (tests.value || '').split(/\s+/).filter(Boolean);
    if (strs.length) out.append(stage('Test strings', table(['String', 'Original', 'Minimal'], strs.map(s => [s, F.runDFA(d, s).accepted ? 'accepted' : 'rejected', F.runDFA(m.min, s).accepted ? 'accepted' : 'rejected']), { monoCols: [0] })));
  };
  wrap.append(h('div', { class: 'toolbar' }, h('div', { class: 'field' }, h('label', { for: 'min-preset' }, 'Load from a paper'), sel)),
    h('div', { class: 'field' }, h('label', { for: 'ta-min' }, 'DFA (one transition per line, one target each)'), ta),
    h('div', { class: 'toolbar' }, h('div', { class: 'field' }, h('label', { for: 'min-tests' }, 'Test strings'), tests), h('button', { class: 'btn primary', type: 'button', onclick: run }, 'Minimize')), out);
  run();
  return wrap;
}
function labMM() {
  const wrap = h('div', { class: 'lab' });
  wrap.append(seg([['mealy', 'Mealy machine'], ['moore', 'Moore machine']], S.mmSub, v => { S.mmSub = v; render(); }));
  const out = h('div', { class: 'lab' });
  const isMealy = S.mmSub === 'mealy', list = isMealy ? P.mealy : P.moore, key = isMealy ? 'mealy' : 'moore';
  const l0 = list[selIndex('mm-preset')] || list[0];
  const ta = textArea(key, l0.text, 11);
  const inp = h('input', { type: 'text', id: 'mm-in', value: S.texts[key + 'In'] === undefined ? l0.test : S.texts[key + 'In'], 'aria-label': 'Input string' });
  inp.addEventListener('input', () => { S.texts[key + 'In'] = inp.value; });
  const init = h('select', { id: 'mm-init' }, ['0', '1', 'a', 'b', 'ε-free default'].slice(0, 4).map(x => h('option', { value: x }, x)));
  const sel = presetSelect('mm-preset', list, p => { setTA(key, p.text); inp.value = p.test; S.texts[key + 'In'] = p.test; run(); });
  const graphMealy = m => { const edges = []; for (const s of m.states) for (const a of m.alphabet) { const t = m.delta[s] && m.delta[s][a]; if (t) edges.push({ from: s, to: t[0], label: a + '/' + t[1] }); } return svgGraph({ nodes: m.states.map(s => ({ id: s, label: s, start: s === m.start })), edges }); };
  const graphMoore = m => { const edges = []; for (const s of m.states) for (const a of m.alphabet) { const t = m.delta[s] && m.delta[s][a]; if (t) edges.push({ from: s, to: t, label: a }); } return svgGraph({ nodes: m.states.map(s => ({ id: s, label: s.includes('/') ? s : s + '/' + m.out[s], start: s === m.start })), edges }); };
  const mealyTable = m => table(['State', ...m.alphabet.map(a => 'on ' + a + ' → next / out')], m.states.map(s => [(s === m.start ? '→ ' : '') + s, ...m.alphabet.map(a => { const t = m.delta[s] && m.delta[s][a]; return t ? t[0] + ' / ' + t[1] : '–'; })]), { monoCols: [0, ...m.alphabet.map((_, i) => i + 1)] });
  const mooreTable = m => table(['State', 'Output', ...m.alphabet.map(a => 'on ' + a)], m.states.map(s => [(s === m.start ? '→ ' : '') + s, m.out[s], ...m.alphabet.map(a => (m.delta[s] && m.delta[s][a]) || '–')]), { monoCols: [0, 1, ...m.alphabet.map((_, i) => i + 2)] });
  const run = () => {
    out.replaceChildren();
    try {
      if (isMealy) {
        const m = F.parseMealy(S.texts.mealy), r = F.runMealy(m, inp.value.trim());
        out.append(stage('Run the Mealy machine', r.error ? err(new Error(r.error)) : [table(['Step', 'From', 'Input', 'To', 'Output'], r.steps.map((s, i) => [i + 1, s.from, s.sym, s.to, s.out]), { monoCols: [1, 2, 3, 4] }), h('p', {}, 'Output string: ', h('b', { class: 'mono' }, r.out || 'ε'), '  (one output symbol per input symbol)')]));
        out.append(h('div', { class: 'grid2' }, h('div', {}, mealyTable(m)), graphMealy(m)));
        const io = init.value, c = F.mealyToMoore(m, io);
        out.append(stage('Mealy → Moore', h('p', { class: 'small muted' }, 'Each Mealy state q is split into one Moore state q/o for every output o that arrives at q. The start state gets the initial output chosen below (' + io + ').'),
          table(['Mealy state', 'Outputs on incoming edges', 'Moore states'], m.states.map(s => [s, c.incoming[s].join(', ') || '(none)', c.moore.states.filter(x => x.split('/')[0] === s).join('  ') || '(unreachable)']), { monoCols: [0, 1, 2] }),
          mooreTable(c.moore), graphMoore(c.moore)));
        let ok = 0, tot = 0, layer = ['']; for (let k = 0; k <= 6; k++) { for (const s of layer) { tot++; if (F.runMoore(c.moore, s).out === io + F.runMealy(m, s).out) ok++; } layer = [].concat(...layer.map(s => m.alphabet.map(a => s + a))); }
        out.append(h('p', { class: 'small' }, ok === tot ? h('span', { class: 'ok' }, 'Cross-check passed: ') : h('span', { class: 'no' }, 'Mismatch: '), 'Moore output equals the initial output followed by the Mealy output on ' + ok + ' of ' + tot + ' strings.'));
      } else {
        const m = F.parseMoore(S.texts.moore), r = F.runMoore(m, inp.value.trim());
        out.append(stage('Run the Moore machine', r.error ? err(new Error(r.error)) : [table(['Step', 'From', 'Input', 'To', 'Output of new state'], [[0, '', '', m.start, m.out[m.start]], ...r.steps.map((s, i) => [i + 1, s.from, s.sym, s.to, s.out])], { monoCols: [1, 2, 3, 4] }), h('p', {}, 'Output string: ', h('b', { class: 'mono' }, r.out), '  (one symbol longer than the input, because the start state also prints)')]));
        out.append(h('div', { class: 'grid2' }, h('div', {}, mooreTable(m)), graphMoore(m)));
        const me = F.mooreToMealy(m);
        out.append(stage('Moore → Mealy', h('p', { class: 'small muted' }, 'Each transition prints the output of the state it enters. The start state output is dropped.'), mealyTable(me), graphMealy(me)));
        let ok = 0, tot = 0, layer = ['']; for (let k = 0; k <= 6; k++) { for (const s of layer) { tot++; if (F.runMoore(m, s).out.slice(1) === F.runMealy(me, s).out) ok++; } layer = [].concat(...layer.map(s => m.alphabet.map(a => s + a))); }
        out.append(h('p', { class: 'small' }, ok === tot ? h('span', { class: 'ok' }, 'Cross-check passed: ') : h('span', { class: 'no' }, 'Mismatch: '), 'Mealy output equals the Moore output without its first symbol on ' + ok + ' of ' + tot + ' strings.'));
      }
    } catch (e) { out.append(err(e)); }
  };
  wrap.append(h('div', { class: 'toolbar' }, h('div', { class: 'field' }, h('label', { for: 'mm-preset' }, 'Load from a paper'), sel)),
    h('div', { class: 'field' }, h('label', { for: 'ta-' + key }, isMealy ? 'Mealy machine: state input -> next output' : 'Moore machine: outputs on an  out:  line, transitions state input -> next'), ta),
    h('div', { class: 'toolbar' }, h('div', { class: 'field' }, h('label', { for: 'mm-in' }, 'Input string'), inp),
      isMealy ? h('div', { class: 'field' }, h('label', { for: 'mm-init' }, 'Initial output for Moore start'), init) : null,
      h('button', { class: 'btn primary', type: 'button', onclick: run }, isMealy ? 'Run and convert to Moore' : 'Run and convert to Mealy')), out);
  run();
  return wrap;
}

/* ---------- Grammar lab ---------- */
function viewGram() {
  const root = h('div', { class: 'view' }), out = h('div', { class: 'lab' });
  root.append(h('section', { class: 'hero' }, h('div', { class: 'eyebrow' }, 'Unit 2 · context-free grammars'), h('h1', {}, 'Grammar lab'),
    h('p', { class: 'lede' }, 'Simplify, convert to Chomsky or Greibach normal form, derive a string, or look for an ambiguity. Every step is printed so you can copy the method.')));
  const g0 = P.grammar[selIndex('g-preset', 1)];
  const ta = textArea('gram', g0.text, 8), str = h('input', { type: 'text', id: 'g-str', value: S.texts.gStr === undefined ? (g0.words || '') : S.texts.gStr, 'aria-label': 'String to test' });
  str.addEventListener('input', () => { S.texts.gStr = str.value; });
  const keep = h('input', { type: 'checkbox', id: 'g-keep', checked: true }), viaCnf = h('input', { type: 'checkbox', id: 'g-via' });
  const sel = presetSelect('g-preset', P.grammar, p => { setTA('gram', p.text); str.value = p.words || ''; S.texts.gStr = str.value; out.replaceChildren(); }, 1);
  const gstage = (title, note, g) => stage(title, note ? h('p', { class: 'small muted' }, note) : null, pre(F.grammarText(g)));
  const get = () => F.parseGrammar(S.texts.gram);
  const simp = () => F.simplify(get(), keep.checked);
  const verify = (g0, test) => {
    const g = get(); if (g.word) return null;
    const alpha = [...new Set([].concat(...g.nts.map(A => [].concat(...g.P[A].map(r => r.filter(t => !F.isNT(t)))))))].slice(0, 3);
    let ok = 0, tot = 0, layer = [''];
    for (let k = 1; k <= 6; k++) { layer = [].concat(...layer.map(s => alpha.map(a => s + a))); for (const s of layer) { tot++; if (F.cykAccepts(g, [...s]) === test([...s])) ok++; } }
    return h('p', { class: 'small' }, ok === tot ? h('span', { class: 'ok' }, 'Cross-check passed: ') : h('span', { class: 'no' }, 'Mismatch: '), 'the result accepts the same ' + tot + ' non-empty strings as the original (up to length 6, parser cross-check).');
  };
  const act = fn => () => { out.replaceChildren(); try { fn(); } catch (e) { out.append(err(e)); } };
  const bSimp = act(() => { const g = get(), r = simp(); out.append(gstage('Given', null, g)); r.log.forEach(l => out.append(gstage(l.title, l.note, l.g))); out.append(gstage('Simplified grammar', r.startNullable && keep.checked ? 'ε is in the language, so S → ε is kept.' : null, r.g)); });
  const bCnf = act(() => { const g = get(), r = simp(); out.append(gstage('Given', null, g)); r.log.forEach(l => out.append(gstage(l.title, l.note, l.g))); const c = F.toCNF(r.g); out.append(gstage('Chomsky normal form', 'Terminals inside longer rules get a variable Cₐ → a. Rules longer than 2 symbols are split with variables D1, D2, …', c)); const v = verify(g, w => F.cnfAccepts(c, w)); if (v) out.append(v); });
  const bGnf = act(() => { const g = get(); let r = simp(); out.append(gstage('Given', null, g)); r.log.forEach(l => out.append(gstage(l.title, l.note, l.g))); let base = r.g;
    if (viaCnf.checked) { base = F.toCNF(r.g); out.append(gstage('Chomsky normal form (first)', null, base)); }
    const hasEps = base.P[base.start] && base.P[base.start].some(x => !x.length); const clean = JSON.parse(JSON.stringify(base)); clean.P[clean.start] = clean.P[clean.start].filter(x => x.length);
    const gn = F.toGNF(clean); gn.log.forEach(l => out.append(gstage(l.title, l.note, l.g))); out.append(gstage('Greibach normal form', hasEps ? 'S → ε is not shown. Add it back only if ε must be in the language and S never appears on a right side.' : 'Every rule is A → aα with a terminal a and α a string of variables.', gn.g)); const v = verify(g, w => F.gnfAccepts(gn.g, w)); if (v) out.append(v); });
  const bDer = act(() => { const g = get(), w = str.value.trim(); const d = F.derive(g, w); if (!d) { out.append(stage('Leftmost derivation', h('p', {}, 'No derivation found for "' + w + '". Either it is not in the language, or it needs a longer search than this tool does.'))); return; }
    const fm = f => f.length ? (g.word ? f.join(' ') : f.join('')) : 'ε';
    out.append(stage('Leftmost derivation of "' + (w || 'ε') + '"', pre(d.forms.map((f, i) => (i ? '⇒ ' : '  ') + fm(f) + (i ? '        [' + d.rules[i - 1].lhs + ' → ' + F.fmtRHS(d.rules[i - 1].rhs) + ']' : '')).join('\n'))));
    out.append(stage('Parse tree', pre(F.treeText(F.buildTree(g, d.rules, g.start))))); });
  const bAmb = act(() => { const g = get(), w = F.findAmbiguity(g, 6, { ms: 3000 });
    if (!w) out.append(stage('Ambiguity check', h('p', {}, 'No string up to length 6 has two different leftmost derivations. That suggests the grammar is unambiguous, but it is not a proof.')));
    else if (w.timedOut) out.append(stage('Ambiguity check', h('p', {}, 'The search ran out of time. Try a smaller grammar.')));
    else { const fm = f => f.length ? (g.word ? f.join(' ') : f.join('')) : 'ε'; out.append(stage('Ambiguous: "' + w.string + '" has two leftmost derivations', pre('Derivation 1\n' + w.d1.map((f, i) => (i ? '⇒ ' : '  ') + fm(f)).join('\n')), pre('Derivation 2\n' + w.d2.map((f, i) => (i ? '⇒ ' : '  ') + fm(f)).join('\n')), h('p', { class: 'small muted' }, 'Two different leftmost derivations of one string are two different parse trees, which is the definition of ambiguity.'))); } });
  const bMem = act(() => { const g = get(), w = F.tokInput(str.value); const ok = F.cykAccepts(g, w); out.append(stage('Membership', h('p', {}, '"' + (str.value.trim() || 'ε') + '" ', ok ? h('span', { class: 'pill ok' }, 'is generated') : h('span', { class: 'pill no' }, 'is not generated'), ' by the grammar (CYK on its CNF).'))); });
  root.append(h('div', { class: 'lab' }, h('div', { class: 'toolbar' }, h('div', { class: 'field' }, h('label', { for: 'g-preset' }, 'Load from a paper'), sel)),
    h('div', { class: 'field' }, h('label', { for: 'ta-gram' }, 'Grammar. One variable per line, alternatives with |. Capital letters are variables, ε is the empty string. For multi-letter symbols separate with spaces.'), ta),
    h('div', { class: 'toolbar' }, h('label', { class: 'check', for: 'g-keep' }, keep, h('span', {}, 'Keep S → ε if ε is in the language')), h('label', { class: 'check', for: 'g-via' }, viaCnf, h('span', {}, 'GNF: go through CNF first'))),
    h('div', { class: 'toolbar' }, h('button', { class: 'btn primary', type: 'button', onclick: bSimp }, 'Simplify'), h('button', { class: 'btn primary', type: 'button', onclick: bCnf }, 'To CNF'), h('button', { class: 'btn primary', type: 'button', onclick: bGnf }, 'To GNF'), h('button', { class: 'btn', type: 'button', onclick: bAmb }, 'Check ambiguity')),
    h('div', { class: 'toolbar' }, h('div', { class: 'field' }, h('label', { for: 'g-str' }, 'String (letters together, or words separated by spaces)'), str), h('button', { class: 'btn', type: 'button', onclick: bDer }, 'Leftmost derivation + tree'), h('button', { class: 'btn', type: 'button', onclick: bMem }, 'Is it generated?')), out));
  return root;
}

/* ---------- PDA lab ---------- */
function pdaTrace(pda, w) {
  const r = F.simulatePDA(pda, w);
  const box = h('div', { class: 'lab' });
  const fmtSt = s => s.length ? s.join('') : 'ε';
  if (!r.accepted) { box.append(h('p', {}, h('span', { class: 'pill no' }, 'rejected'), ' no sequence of moves consumes the whole input and accepts (' + r.explored + ' configurations explored' + (r.truncated ? ', search limit reached' : '') + ').')); return box; }
  const rows = r.path.map((c, i) => [i, i ? 'δ(' + c.via.q + ', ' + c.via.a + ', ' + c.via.X + ') → (' + c.via.p + ', ' + fmtSt(c.via.push) + ')' : 'start', c.q, c.i >= F.tokInput(w).length ? 'ε' : F.tokInput(w).slice(c.i).join(''), fmtSt(c.st)]);
  box.append(h('p', {}, h('span', { class: 'pill ok' }, 'accepted'), ' in ' + (r.path.length - 1) + ' moves. Stack is written top first.'));
  box.append(table(['#', 'Move', 'State', 'Input left', 'Stack'], rows, { monoCols: [1, 2, 3, 4] }));
  return box;
}
function viewPDA() {
  const root = h('div', { class: 'view' });
  root.append(h('section', { class: 'hero' }, h('div', { class: 'eyebrow' }, 'Unit 3 · pushdown automata'), h('h1', {}, 'PDA lab'),
    h('p', { class: 'lede' }, 'Run a PDA on a string and read the move-by-move trace, or turn any grammar into a PDA and trace a string through it.')));
  const out1 = h('div', { class: 'lab' }), out2 = h('div', { class: 'lab' });
  const p0 = P.pda[selIndex('pda-preset')];
  const ta1 = textArea('pda', p0.text, 11);
  const in1 = h('input', { type: 'text', id: 'pda-in', value: S.texts.pdaIn === undefined ? p0.tests[0] : S.texts.pdaIn, 'aria-label': 'Input string' });
  in1.addEventListener('input', () => { S.texts.pdaIn = in1.value; });
  const quick1 = h('div', { class: 'row' });
  const setQuick = p => { quick1.replaceChildren(h('span', { class: 'small muted' }, 'Try:'), ...p.tests.map(t => h('button', { class: 'btn', type: 'button', onclick: () => { in1.value = t; S.texts.pdaIn = t; run1(); } }, t || 'ε'))); };
  setQuick(p0);
  const sel1 = presetSelect('pda-preset', P.pda, p => { setTA('pda', p.text); in1.value = p.tests[0]; S.texts.pdaIn = in1.value; setQuick(p); run1(); });
  const run1 = () => { out1.replaceChildren(); try { out1.append(pdaTrace(F.parsePDA(S.texts.pda), in1.value.trim())); } catch (e) { out1.append(err(e)); } };
  root.append(h('section', { class: 'card lab' }, h('h2', {}, 'Run a PDA'),
    h('div', { class: 'toolbar' }, h('div', { class: 'field' }, h('label', { for: 'pda-preset' }, 'Load from a paper'), sel1)),
    h('div', { class: 'field' }, h('label', { for: 'ta-pda' }, 'One move per line:  state input top -> next push.  The push string is written top first. ε is the empty input or push. Use  final:  or  accept: empty.'), ta1),
    h('div', { class: 'toolbar' }, h('div', { class: 'field' }, h('label', { for: 'pda-in' }, 'Input string'), in1), h('button', { class: 'btn primary', type: 'button', onclick: run1 }, 'Run')), quick1, out1));
  const c0 = P.cfg2pda[selIndex('cp-preset')];
  const ta2 = textArea('cfgpda', c0.text, 6);
  const in2 = h('input', { type: 'text', id: 'cp-in', value: S.texts.cpIn === undefined ? c0.tests[0] : S.texts.cpIn, 'aria-label': 'Input string' });
  in2.addEventListener('input', () => { S.texts.cpIn = in2.value; });
  const quick2 = h('div', { class: 'row' });
  const setQuick2 = p => { quick2.replaceChildren(h('span', { class: 'small muted' }, 'Try:'), ...p.tests.map(t => h('button', { class: 'btn', type: 'button', onclick: () => { in2.value = t; S.texts.cpIn = t; run2(); } }, t))); };
  setQuick2(c0);
  const sel2 = presetSelect('cp-preset', P.cfg2pda, p => { setTA('cfgpda', p.text); in2.value = p.tests[0]; S.texts.cpIn = in2.value; setQuick2(p); run2(); });
  const run2 = () => { out2.replaceChildren(); try { const g = F.parseGrammar(S.texts.cfgpda), pda = F.cfgToPDA(g);
      out2.append(stage('Construction', h('p', { class: 'small muted' }, 'Push S above Z₀. For every rule A → α add δ(q1, ε, A) = (q1, α). For every terminal a add δ(q1, a, a) = (q1, ε). When Z₀ is back on top move to the final state.'), pre(F.pdaText(pda))));
      out2.append(stage('Trace of "' + (in2.value.trim() || 'ε') + '"', pdaTrace(pda, in2.value.trim()))); } catch (e) { out2.append(err(e)); } };
  root.append(h('section', { class: 'card lab' }, h('h2', {}, 'Context-free grammar to PDA'),
    h('div', { class: 'toolbar' }, h('div', { class: 'field' }, h('label', { for: 'cp-preset' }, 'Load from a paper'), sel2)),
    h('div', { class: 'field' }, h('label', { for: 'ta-cfgpda' }, 'Grammar'), ta2),
    h('div', { class: 'toolbar' }, h('div', { class: 'field' }, h('label', { for: 'cp-in' }, 'Input string'), in2), h('button', { class: 'btn primary', type: 'button', onclick: run2 }, 'Build PDA and trace')), quick2, out2));
  run1(); run2();
  return root;
}

/* ---------- Turing lab ---------- */
function viewTM() {
  const root = h('div', { class: 'view' });
  root.append(h('section', { class: 'hero' }, h('div', { class: 'eyebrow' }, 'Unit 4 · Turing machines'), h('h1', {}, 'Turing lab'),
    h('p', { class: 'lede' }, 'Eight machines taken from the papers. Watch the tape, step through, and copy the transition table. B is the blank. Edit any line and run it again.')));
  const t0 = P.tm[selIndex('tm-preset')];
  const ta = textArea('tm', t0.text, 18);
  const inp = h('input', { type: 'text', id: 'tm-in', value: S.texts.tmIn === undefined ? t0.tests[0] : S.texts.tmIn, 'aria-label': 'Tape input' });
  inp.addEventListener('input', () => { S.texts.tmIn = inp.value; });
  const quick = h('div', { class: 'row' });
  const tapeEl = h('div', { class: 'tape', role: 'img', 'aria-label': 'Tape' }), stateEl = h('span', { class: 'statebox' }), statusEl = h('span', {}), explain = h('div', { class: 'explain' }), stepEl = h('b', { class: 'mono' });
  const idsEl = h('div', { class: 'ids' }), tableBox = h('div', {}), errBox = h('div', {});
  let cfgs = [], idx = 0, result = null, tm = null;
  const sel = presetSelect('tm-preset', P.tm, p => { setTA('tm', p.text); inp.value = p.tests[0]; S.texts.tmIn = inp.value; setQuick(p); load(); });
  const go = t => { inp.value = t; S.texts.tmIn = t; load(); };
  const setQuick = p => quick.replaceChildren(h('span', { class: 'small muted' }, 'Try:'), ...p.tests.map(t => h('button', { class: 'btn', type: 'button', onclick: () => go(t) }, t)));
  setQuick(t0);
  const draw = () => {
    const c = cfgs[idx]; if (!c) return;
    const pad = 4, cells = c.tape.slice(); const blank = tm.blank;
    const left = Math.max(0, pad - c.head), right = Math.max(0, pad - (cells.length - 1 - c.head));
    const all = Array(left).fill(blank).concat(cells, Array(right).fill(blank)), hd = c.head + left;
    tapeEl.replaceChildren(...all.map((ch, i) => h('div', { class: 'cell' + (i === hd ? ' head' : '') + (ch === blank ? ' blank' : '') }, ch === blank ? '·' : ch)));
    const hc = tapeEl.querySelector('.head'); if (hc && hc.scrollIntoView) { const box = tapeEl.getBoundingClientRect(), r = hc.getBoundingClientRect(); tapeEl.scrollLeft += (r.left + r.width / 2) - (box.left + box.width / 2); }
    stateEl.textContent = 'state ' + c.state; stepEl.textContent = 'step ' + idx + ' of ' + (cfgs.length - 1); explain.textContent = idx ? c.note : 'start: head on the first symbol';
    const last = idx === cfgs.length - 1;
    statusEl.replaceChildren(last ? (result.status === 'accepted' ? h('span', { class: 'pill ok' }, 'accepted') : result.status === 'rejected' ? h('span', { class: 'pill no' }, 'halted, no move (reject)') : h('span', { class: 'pill run' }, 'step limit reached')) : h('span', { class: 'pill run' }, 'running'));
    const start = Math.max(0, Math.min(idx - 12, cfgs.length - 40));
    idsEl.replaceChildren(...cfgs.slice(start, start + 40).map((cc, i) => h('div', { class: start + i === idx ? 'cur' : '' }, String(start + i).padStart(3, ' ') + '  ' + F.idString(cc, blank))));
  };
  const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
  const load = () => {
    stop(); errBox.replaceChildren(); tableBox.replaceChildren();
    try { tm = F.parseTM(S.texts.tm); } catch (e) { errBox.append(err(e)); return; }
    result = F.runTM(tm, inp.value.trim()); cfgs = result.configs; idx = 0; draw();
    const rows = Object.entries(tm.trans).map(([k, v]) => { const [s, a] = k.split('\u0001'); return [s, a, v[0], v[1], v[2]]; });
    tableBox.append(h('details', {}, h('summary', {}, 'Transition table (' + rows.length + ' rules)'), h('div', { class: 'body' }, table(['State', 'Read', 'Next', 'Write', 'Move'], rows, { monoCols: [0, 1, 2, 3, 4] }))));
    if (result.status === 'accepted' || result.output) tableBox.append(h('p', { class: 'small' }, 'Tape contents when halted (blanks removed): ', h('b', { class: 'mono' }, result.output || '(empty)')));
  };
  const play = () => { stop(); if (idx >= cfgs.length - 1) idx = 0; const speed = +$('#tm-speed').value; timer = setInterval(() => { if (idx >= cfgs.length - 1) { stop(); return; } idx++; draw(); }, speed); };
  root.append(h('div', { class: 'lab' },
    h('div', { class: 'toolbar' }, h('div', { class: 'field' }, h('label', { for: 'tm-preset' }, 'Machine'), sel)),
    h('div', { class: 'toolbar' }, h('div', { class: 'field' }, h('label', { for: 'tm-in' }, 'Tape input'), inp), h('button', { class: 'btn primary', type: 'button', onclick: load }, 'Load'), quick),
    tapeEl,
    h('div', { class: 'row' }, stateEl, stepEl, statusEl),
    explain,
    h('div', { class: 'row' }, h('button', { class: 'btn', type: 'button', onclick: () => { stop(); idx = 0; draw(); } }, '⏮ Reset'), h('button', { class: 'btn', type: 'button', onclick: () => { stop(); if (idx > 0) { idx--; draw(); } } }, '◀ Back'), h('button', { class: 'btn primary', type: 'button', onclick: () => { stop(); if (idx < cfgs.length - 1) { idx++; draw(); } } }, 'Step ▶'), h('button', { class: 'btn', type: 'button', onclick: play }, '▶ Play'), h('button', { class: 'btn', type: 'button', onclick: stop }, '⏸ Pause'), h('button', { class: 'btn', type: 'button', onclick: () => { stop(); idx = cfgs.length - 1; draw(); } }, 'Jump to end ⏭'),
      h('div', { class: 'field', style: 'margin-left:8px' }, h('label', { for: 'tm-speed' }, 'Delay (ms)'), h('input', { type: 'range', id: 'tm-speed', min: 30, max: 700, value: 160 }))),
    errBox,
    h('div', { class: 'grid2' }, h('div', { class: 'field' }, h('label', { for: 'ta-tm' }, 'Machine definition:  state read -> next write move  (L, R or S). The accept: line lists halting states.'), ta),
      h('div', { class: 'field' }, h('label', {}, 'Instantaneous descriptions (state in [brackets] sits before the scanned symbol)'), idsEl)),
    tableBox));
  load();
  return root;
}

/* ---------- Undecidability lab ---------- */
function viewUndec() {
  const root = h('div', { class: 'view' });
  root.append(h('section', { class: 'hero' }, h('div', { class: 'eyebrow' }, 'Unit 5 · undecidability and complexity'), h('h1', {}, 'Undecidability lab'),
    h('p', { class: 'lede' }, 'Solve a Post Correspondence Problem instance with the overhang method, then read the one-page proofs the papers ask for.')));
  const out = h('div', { class: 'lab' });
  const first = P.pcp[selIndex('pcp-preset')];
  const tileText = tl => tl.map(t => t[0] + ' ' + t[1]).join('\n');
  const ta = textArea('pcp', tileText(first.tiles), 5);
  const mp = h('input', { type: 'checkbox', id: 'pcp-m' });
  const sel = presetSelect('pcp-preset', P.pcp, p => { setTA('pcp', tileText(p.tiles)); run(); });
  const run = () => {
    out.replaceChildren();
    const tiles = S.texts.pcp.split(/\n/).map(l => l.trim().split(/\s+/)).filter(a => a.length === 2 && a[0]);
    if (!tiles.length) { out.append(err(new Error('Enter one tile per line as: top bottom'))); return; }
    out.append(table(['Tile', 'Top (list A)', 'Bottom (list B)'], tiles.map((t, i) => [i + 1, t[0], t[1]]), { monoCols: [1, 2] }));
    const r = F.solvePCP(tiles, { mpcp: mp.checked });
    if (r.found) {
      let T = '', B = ''; const rows = r.seq.map((i, k) => { T += tiles[i - 1][0]; B += tiles[i - 1][1]; return [k + 1, i, tiles[i - 1][0], tiles[i - 1][1], T, B]; });
      out.append(stage(mp.checked ? 'Solution that starts with tile 1 (MPCP)' : 'Solution found', h('p', {}, 'Sequence ', h('b', { class: 'mono' }, r.seq.join(', ')), ': both rows spell ', h('b', { class: 'mono' }, r.top), '.'), table(['Step', 'Tile', 'Top adds', 'Bottom adds', 'Top so far', 'Bottom so far'], rows, { monoCols: [2, 3, 4, 5] })));
    } else {
      const topLonger = tiles.every(t => t[0].length > t[1].length), botLonger = tiles.every(t => t[1].length > t[0].length);
      out.append(stage('No solution found', h('p', {}, topLonger ? 'Every top string is longer than its bottom string, so the top row always stays ahead and the two rows can never be equal. There is no solution.' : botLonger ? 'Every bottom string is longer than its top string, so the bottom row always stays ahead. There is no solution.' : 'The search tried every sequence whose overhang stays consistent' + (r.exhausted ? ' and ran out of options, so within the length limits there is no solution.' : ' within its limits. PCP is undecidable, so failing to find one does not prove none exists.'))));
    }
  };
  root.append(h('section', { class: 'card lab' }, h('h2', {}, 'PCP solver'),
    h('div', { class: 'toolbar' }, h('div', { class: 'field' }, h('label', { for: 'pcp-preset' }, 'Load from a paper'), sel)),
    h('div', { class: 'field' }, h('label', { for: 'ta-pcp' }, 'Tiles, one per line: top bottom'), ta),
    h('div', { class: 'toolbar' }, h('label', { class: 'check', for: 'pcp-m' }, mp, h('span', {}, 'MPCP: the sequence must start with tile 1')), h('button', { class: 'btn primary', type: 'button', onclick: run }, 'Solve')), out,
    h('p', { class: 'small muted' }, 'Two lists that I read from the scans (Nov 2025 and May 2025) may differ from your paper. Check the tiles before relying on the answer.')));
  run();
  root.append(h('section', {}, h('h2', {}, 'One-page proofs and definitions'), D.theory.filter(t => /Rice|Lₑ|Halting|PCP|Decidable|NP|variants|Pumping|regular sets|DPDA/.test(t.title)).map(t => h('details', {}, h('summary', {}, t.title), h('div', { class: 'body' }, t.body.map(p => h('p', {}, p)))))));
  return root;
}

/* ---------- Quiz ---------- */
function viewQuiz() {
  const root = h('div', { class: 'view' });
  const stats = store.get('quiz', {});
  root.append(h('section', { class: 'hero' }, h('div', { class: 'eyebrow' }, 'Part A · 4 marks per unit'), h('h1', {}, 'Part A drill'),
    h('p', { class: 'lede' }, D.quiz.length + ' real MCQs from the six papers, grouped by unit. Answers come with a one-line reason.')));
  const area = h('div', {});
  let filter = S.qUnit || 0;
  const start = (pool) => {
    const list = pool.slice().sort(() => Math.random() - 0.5); let i = 0, score = 0; const missed = [], per = {};
    const show = () => {
      area.replaceChildren();
      if (i >= list.length) {
        const rows = [1, 2, 3, 4, 5].filter(u => per[u]).map(u => h('div', { class: 'r' }, h('span', {}, 'Unit ' + u), h('div', { class: 'bar' }, h('i', { style: 'width:' + Math.round(100 * per[u][0] / per[u][1]) + '%' })), h('span', {}, per[u][0] + '/' + per[u][1])));
        area.append(h('div', { class: 'card qbox' }, h('h2', {}, 'Score ' + score + ' of ' + list.length), h('div', { class: 'meter' }, rows),
          h('div', { class: 'row' }, missed.length ? h('button', { class: 'btn primary', type: 'button', onclick: () => start(missed) }, 'Retry the ' + missed.length + ' you missed') : null, h('button', { class: 'btn', type: 'button', onclick: () => start(filter ? D.quiz.filter(q => q.u === filter) : D.quiz) }, 'Start again'))));
        const st = store.get('quiz', {}); st.last = { score, total: list.length }; store.set('quiz', st); return;
      }
      const q = list[i]; let answered = false; let optsBox = null;
      const opts = q.o.map((t, k) => h('button', { class: 'opt', type: 'button', onclick: () => {
        if (answered) return; answered = true; per[q.u] = per[q.u] || [0, 0]; per[q.u][1]++;
        const right = k === q.a; if (right) { score++; per[q.u][0]++; } else missed.push(q);
        [...optsBox.children].forEach((b, j) => { b.disabled = true; if (j === q.a) b.classList.add('right'); else if (j === k) b.classList.add('wrong'); });
        area.querySelector('.fb').replaceChildren(h('p', {}, h('b', { class: right ? 'ok' : 'no' }, right ? 'Correct. ' : 'Not quite. '), q.why), h('button', { class: 'btn primary', type: 'button', onclick: () => { i++; show(); } }, i + 1 >= list.length ? 'See score' : 'Next question'));
      } }, t));
      optsBox = h('div', { class: 'opts' }, opts);
      area.append(h('div', { class: 'card qbox' }, h('div', { class: 'src' }, 'Question ' + (i + 1) + ' of ' + list.length + ' · Unit ' + q.u + ' · ' + q.src), h('h3', { style: 'font-family:var(--body);font-weight:500;font-size:17px;line-height:1.45' }, q.q), optsBox, h('div', { class: 'fb' })));
    };
    show();
  };
  root.append(h('div', { class: 'row' }, seg([[0, 'All units'], [1, 'Unit 1'], [2, 'Unit 2'], [3, 'Unit 3'], [4, 'Unit 4'], [5, 'Unit 5']], filter, v => { S.qUnit = v; filter = v; render(); }), h('button', { class: 'btn primary', type: 'button', onclick: () => start(filter ? D.quiz.filter(q => q.u === filter) : D.quiz) }, 'Start')));
  if (stats.last) root.append(h('p', { class: 'small muted' }, 'Last round on this device: ' + stats.last.score + ' of ' + stats.last.total + '.'));
  root.append(area);
  return root;
}

/*LESSONS*/
/* ---------- router ---------- */
const LABS = ['fa', 'gram', 'pda', 'tm', 'undec'];
const TABS = [['start', 'Start', viewHome], ['priority', 'Exam map', viewPriority], ['plan', 'Revision', viewPlan], ['fa', 'Sandbox', viewFA], ['quiz', 'Part A quiz', viewQuiz]];
const LAB_VIEWS = { fa: viewFA, gram: viewGram, pda: viewPDA, tm: viewTM, undec: viewUndec };
const LAB_NAMES = { fa: 'Automata', gram: 'Grammar', pda: 'PDA', tm: 'Turing', undec: 'PCP' };
function route() {
  const id = (location.hash || '').slice(1);
  if (id.startsWith('learn/')) return { tab: 'start', fn: () => viewLesson(id.slice(6)), lab: null };
  if (LAB_VIEWS[id]) return { tab: 'fa', fn: LAB_VIEWS[id], lab: id };
  const t = TABS.find(x => x[0] === id) || TABS[0];
  return { tab: t[0], fn: t[2], lab: null };
}
function render() {
  if (timer) { clearInterval(timer); timer = null; }
  const r = route();
  $('#tabs').replaceChildren(...TABS.map(t => h('a', { href: '#' + t[0], 'aria-current': t[0] === r.tab ? 'page' : null }, t[1])));
  const main = $('#view'); main.replaceChildren();
  if (r.lab) main.append(h('div', { class: 'subnav' }, h('span', { class: 'small muted' }, 'Sandbox:'), Object.entries(LAB_NAMES).map(([k, v]) => h('a', { href: '#' + k, 'aria-current': k === r.lab ? 'page' : null }, v))));
  main.append(r.fn());
  const a = $('#tabs a[aria-current]'); if (a && a.scrollIntoView) a.scrollIntoView({ inline: 'center', block: 'nearest' });
}
let last = null;
window.addEventListener('hashchange', () => { if (last !== location.hash) { last = location.hash; render(); window.scrollTo(0, 0); } });
last = location.hash; render(); xpBadge();
})();
