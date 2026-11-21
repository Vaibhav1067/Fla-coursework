/* FLA engines: finite automata, Mealy/Moore, grammars, PDA, TM, PCP. Pure functions, no DOM. */
(function (root) {
'use strict';
const EPS = 'ε';
const isEps = t => t === 'ε' || t === 'eps' || t === 'epsilon' || t === 'λ' || t === '~';
const uniq = a => [...new Set(a)];
const clone = o => JSON.parse(JSON.stringify(o));

/* ===================== Finite automata ===================== */
const KEY = '\u0001';
function parseTargets(str) {
  str = str.replace(/[{}]/g, ' ').replace(/,/g, ' ').trim();
  if (!str) return [];
  return uniq(str.split(/\s+/).filter(t => t && !/^(-|—|∅|phi|φ|none)$/i.test(t)));
}
function parseFA(text) {
  const fa = { start: null, finals: [], trans: {}, states: [], alphabet: [], hasEps: false };
  const seen = new Set();
  const addState = s => { if (!seen.has(s)) { seen.add(s); fa.states.push(s); } };
  for (const raw of text.split(/\n/)) {
    const line = raw.replace(/#.*$/, '').trim();
    if (!line) continue;
    let m;
    if ((m = line.match(/^start\s*[:=]\s*(.+)$/i))) { fa.start = m[1].trim().replace(/[{}]/g, ''); addState(fa.start); continue; }
    if ((m = line.match(/^(final|finals|accept|accepting)\s*[:=]\s*(.*)$/i))) { fa.finals = parseTargets(m[2]); fa.finals.forEach(addState); continue; }
    m = line.match(/^(\S+?)\s*[, ]\s*(\S+)\s*(?:->|→|=)\s*(.*)$/);
    if (!m) throw new Error('Cannot read: "' + raw.trim() + '". Write transitions like:  p 0 -> q r');
    const s = m[1];
    let a = m[2];
    if (isEps(a)) { a = EPS; fa.hasEps = true; } else if (!fa.alphabet.includes(a)) fa.alphabet.push(a);
    const t = parseTargets(m[3]);
    addState(s); t.forEach(addState);
    const k = s + KEY + a;
    fa.trans[k] = uniq((fa.trans[k] || []).concat(t));
  }
  if (!fa.states.length) throw new Error('Add at least one transition.');
  if (!fa.start) fa.start = fa.states[0];
  return fa;
}
const delta = (fa, s, a) => fa.trans[s + KEY + a] || [];
function epsClosure(fa, set) {
  const out = new Set(set), st = [...set];
  while (st.length) {
    const s = st.pop();
    for (const t of delta(fa, s, EPS)) if (!out.has(t)) { out.add(t); st.push(t); }
  }
  return [...out];
}
function nfaToDfa(fa) {
  const idx = s => fa.states.indexOf(s);
  const norm = arr => uniq(arr).sort((x, y) => idx(x) - idx(y));
  const nameOf = set => set.length ? '{' + set.join(',') + '}' : '∅';
  const closures = {};
  if (fa.hasEps) fa.states.forEach(s => { closures[s] = norm(epsClosure(fa, [s])); });
  const start = norm(epsClosure(fa, [fa.start]));
  const seen = new Map([[nameOf(start), start]]);
  const queue = [start], rows = [];
  while (queue.length) {
    const S = queue.shift();
    for (const a of fa.alphabet) {
      const move = norm([].concat(...S.map(s => delta(fa, s, a))));
      const to = norm(epsClosure(fa, move));
      rows.push({ from: S, sym: a, move, to });
      const n = nameOf(to);
      if (!seen.has(n)) { seen.set(n, to); queue.push(to); }
    }
  }
  const states = [...seen.entries()].map(([name, set]) => ({ name, set, final: set.some(s => fa.finals.includes(s)) }));
  const dfa = { states: states.map(s => s.name), alphabet: fa.alphabet.slice(), start: nameOf(start), finals: states.filter(s => s.final).map(s => s.name), delta: {} };
  for (const r of rows) { (dfa.delta[nameOf(r.from)] = dfa.delta[nameOf(r.from)] || {})[r.sym] = nameOf(r.to); }
  return { closures, startSet: start, rows, states, dfa, nameOf };
}
function runNFA(fa, w) {
  let cur = epsClosure(fa, [fa.start]);
  const trace = [cur.slice()];
  for (const c of w) {
    const next = [];
    for (const s of cur) next.push(...delta(fa, s, c));
    cur = uniq(epsClosure(fa, next));
    trace.push(cur.slice());
  }
  return { accepted: cur.some(s => fa.finals.includes(s)), trace };
}
function faToDfaObj(fa) {
  const d = { states: fa.states.slice(), alphabet: fa.alphabet.slice(), start: fa.start, finals: fa.finals.slice(), delta: {} };
  let trap = false;
  for (const s of fa.states) for (const a of fa.alphabet) {
    const t = delta(fa, s, a);
    if (t.length > 1) throw new Error('State ' + s + ' on ' + a + ' has several targets, so this is an NFA. Use the NFA to DFA converter.');
    (d.delta[s] = d.delta[s] || {})[a] = t.length ? t[0] : null;
  }
  return d;
}
function completeDfa(d) {
  d = clone(d);
  let needs = false;
  for (const s of d.states) for (const a of d.alphabet) if (!d.delta[s][a]) needs = true;
  if (needs) {
    let trap = 'dead'; while (d.states.includes(trap)) trap += "'";
    d.states.push(trap); d.delta[trap] = {};
    for (const a of d.alphabet) d.delta[trap][a] = trap;
    for (const s of d.states) for (const a of d.alphabet) if (!d.delta[s][a]) d.delta[s][a] = trap;
    d.trap = trap;
  }
  return d;
}
function runDFA(d, w) {
  let s = d.start; const path = [s];
  for (const c of w) {
    const t = d.delta[s] && d.delta[s][c];
    if (!t) return { accepted: false, path, stuck: true };
    s = t; path.push(s);
  }
  return { accepted: d.finals.includes(s), path };
}
function minimizeDFA(d0) {
  const d = completeDfa(d0);
  // reachable
  const reach = [d.start], seen = new Set(reach);
  for (let i = 0; i < reach.length; i++) for (const a of d.alphabet) { const t = d.delta[reach[i]][a]; if (!seen.has(t)) { seen.add(t); reach.push(t); } }
  const R = d.states.filter(s => seen.has(s));
  const removed = d.states.filter(s => !seen.has(s));
  const fin = s => d.finals.includes(s);
  const pk = (p, q) => R.indexOf(p) < R.indexOf(q) ? p + '|' + q : q + '|' + p;
  const marks = new Map(); // key -> {round, reason}
  const pairs = [];
  for (let i = 0; i < R.length; i++) for (let j = i + 1; j < R.length; j++) pairs.push([R[i], R[j]]);
  let round = 0;
  for (const [p, q] of pairs) if (fin(p) !== fin(q)) marks.set(pk(p, q), { round: 0, reason: 'one is final, the other is not' });
  let changed = true;
  while (changed) {
    changed = false; round++;
    const add = [];
    for (const [p, q] of pairs) {
      if (marks.has(pk(p, q))) continue;
      for (const a of d.alphabet) {
        const x = d.delta[p][a], y = d.delta[q][a];
        if (x !== y && marks.has(pk(x, y)) && marks.get(pk(x, y)).round < round) { add.push([pk(p, q), { round, reason: 'on ' + a + ' they go to (' + x + ', ' + y + '), already distinguishable' }]); break; }
      }
    }
    for (const [k, v] of add) { marks.set(k, v); changed = true; }
  }
  // classes
  const parent = {}; R.forEach(s => parent[s] = s);
  const find = s => parent[s] === s ? s : (parent[s] = find(parent[s]));
  for (const [p, q] of pairs) if (!marks.has(pk(p, q))) parent[find(q)] = find(p);
  const classes = [];
  const byRoot = {};
  for (const s of R) { const r = find(s); if (!byRoot[r]) { byRoot[r] = []; classes.push(byRoot[r]); } byRoot[r].push(s); }
  const cname = c => c.length === 1 ? c[0] : '{' + c.join(',') + '}';
  const of = {}; classes.forEach(c => c.forEach(s => of[s] = cname(c)));
  const min = { states: classes.map(cname), alphabet: d.alphabet.slice(), start: of[d.start], finals: classes.filter(c => fin(c[0])).map(cname), delta: {} };
  for (const c of classes) { min.delta[cname(c)] = {}; for (const a of d.alphabet) min.delta[cname(c)][a] = of[d.delta[c[0]][a]]; }
  return { complete: d, trapAdded: d.trap || null, removed, states: R, pairs, marks, rounds: round - 1, classes, min, pk };
}

/* ===================== Mealy / Moore ===================== */
function parseMealy(text) {
  const m = { start: null, states: [], alphabet: [], delta: {} };
  const add = s => { if (!m.states.includes(s)) m.states.push(s); };
  for (const raw of text.split(/\n/)) {
    const line = raw.replace(/#.*$/, '').trim(); if (!line) continue;
    let r;
    if ((r = line.match(/^start\s*[:=]\s*(\S+)/i))) { m.start = r[1]; add(m.start); continue; }
    r = line.match(/^(\S+)\s+(\S+)\s*(?:->|→)\s*(\S+)\s+(\S+)$/);
    if (!r) throw new Error('Mealy line should look like:  q1 0 -> q3 1   (state input -> next output). Got: ' + raw.trim());
    add(r[1]); add(r[3]);
    if (!m.alphabet.includes(r[2])) m.alphabet.push(r[2]);
    (m.delta[r[1]] = m.delta[r[1]] || {})[r[2]] = [r[3], r[4]];
  }
  if (!m.start) m.start = m.states[0];
  return m;
}
function parseMoore(text) {
  const m = { start: null, states: [], alphabet: [], delta: {}, out: {} };
  const add = s => { if (!m.states.includes(s)) m.states.push(s); };
  for (const raw of text.split(/\n/)) {
    const line = raw.replace(/#.*$/, '').trim(); if (!line) continue;
    let r;
    if ((r = line.match(/^start\s*[:=]\s*(\S+)/i))) { m.start = r[1]; add(m.start); continue; }
    if ((r = line.match(/^(?:out|output|outputs)\s*[:=]\s*(.*)$/i))) {
      for (const pair of r[1].split(/[\s,]+/).filter(Boolean)) { const kv = pair.split('='); if (kv.length !== 2) throw new Error('Outputs look like  out: q0=0 q1=1'); add(kv[0]); m.out[kv[0]] = kv[1]; }
      continue;
    }
    r = line.match(/^(\S+)\s+(\S+)\s*(?:->|→)\s*(\S+)$/);
    if (!r) throw new Error('Moore line should look like:  q0 a -> q1.  Outputs go on a line like  out: q0=0 q1=1. Got: ' + raw.trim());
    add(r[1]); add(r[3]);
    if (!m.alphabet.includes(r[2])) m.alphabet.push(r[2]);
    (m.delta[r[1]] = m.delta[r[1]] || {})[r[2]] = r[3];
  }
  if (!m.start) m.start = m.states[0];
  for (const s of m.states) if (m.out[s] === undefined) throw new Error('State ' + s + ' has no output. Add it to the  out:  line.');
  return m;
}
function runMealy(m, w) {
  let s = m.start; const steps = []; let out = '';
  for (const c of w) {
    const t = m.delta[s] && m.delta[s][c];
    if (!t) return { error: 'No transition from ' + s + ' on ' + c, steps, out };
    steps.push({ from: s, sym: c, to: t[0], out: t[1] }); out += t[1]; s = t[0];
  }
  return { steps, out, end: s };
}
function runMoore(m, w) {
  let s = m.start; const steps = []; let out = m.out[s];
  for (const c of w) {
    const t = m.delta[s] && m.delta[s][c];
    if (!t) return { error: 'No transition from ' + s + ' on ' + c, steps, out };
    steps.push({ from: s, sym: c, to: t, out: m.out[t] }); out += m.out[t]; s = t;
  }
  return { steps, out, end: s };
}
function mooreToMealy(m) {
  const me = { start: m.start, states: m.states.slice(), alphabet: m.alphabet.slice(), delta: {} };
  for (const s of m.states) for (const a of m.alphabet) { const t = m.delta[s] && m.delta[s][a]; if (t) (me.delta[s] = me.delta[s] || {})[a] = [t, m.out[t]]; }
  return me;
}
function mealyToMoore(me, initOut) {
  const incoming = {}; me.states.forEach(s => incoming[s] = []);
  for (const s of me.states) for (const a of me.alphabet) { const t = me.delta[s] && me.delta[s][a]; if (t && !incoming[t[0]].includes(t[1])) incoming[t[0]].push(t[1]); }
  const name = (q, o) => q + '/' + o;
  const startOut = initOut;
  const m = { start: name(me.start, startOut), states: [], alphabet: me.alphabet.slice(), delta: {}, out: {} };
  const todo = [[me.start, startOut]], seen = new Set([name(me.start, startOut)]);
  while (todo.length) {
    const [q, o] = todo.shift(); const n = name(q, o);
    m.states.push(n); m.out[n] = o;
    for (const a of me.alphabet) {
      const t = me.delta[q] && me.delta[q][a]; if (!t) continue;
      const tn = name(t[0], t[1]);
      (m.delta[n] = m.delta[n] || {})[a] = tn;
      if (!seen.has(tn)) { seen.add(tn); todo.push([t[0], t[1]]); }
    }
  }
  return { moore: m, incoming };
}

/* ===================== Grammars ===================== */
const isNT = t => /^[A-Z]/.test(t);
function tokRHS(str, word) {
  const s = str.trim();
  if (s === '' || isEps(s)) return [];
  if (word || /\s/.test(s)) return s.split(/\s+/).filter(t => !isEps(t));
  return s.match(/[A-Z]'*|./gu) || [];
}
function fmtRHS(r) { return r.length ? (r.every(t => t.length === 1) ? r.join('') : r.join(' ')) : 'ε'; }
function parseGrammar(text) {
  const g = { start: null, nts: [], P: {} };
  let word = false;
  for (const raw of text.split(/\n/)) {
    const mm = raw.replace(/#.*$/, '').match(/(?:->|→|::=|:=)\s*(.*)$/);
    if (mm) for (const alt of mm[1].split('|')) if (/\S\s+\S/.test(alt.trim())) word = true;
  }
  g.word = word;
  for (const raw of text.split(/\n/)) {
    const line = raw.replace(/#.*$/, '').trim(); if (!line) continue;
    const m = line.match(/^(\S+?)\s*(?:->|→|::=|:=)\s*(.*)$/);
    if (!m) throw new Error('Cannot read: "' + raw.trim() + '". Write rules like:  S -> aSb | ε');
    const A = m[1];
    if (!isNT(A)) throw new Error('Left side "' + A + '" must start with a capital letter.');
    if (!g.start) g.start = A;
    if (!g.P[A]) { g.P[A] = []; g.nts.push(A); }
    for (const alt of m[2].split('|')) {
      const r = tokRHS(alt, word);
      if (!g.P[A].some(x => x.join('\u0001') === r.join('\u0001'))) g.P[A].push(r);
    }
  }
  if (!g.start) throw new Error('Add at least one rule.');
  // nonterminals appearing only on right side
  for (const A of g.nts.slice()) for (const r of g.P[A]) for (const t of r) if (isNT(t) && !g.P[t]) { g.P[t] = []; g.nts.push(t); }
  return g;
}
function grammarText(g) {
  return g.nts.filter(A => g.P[A] && g.P[A].length).map(A => A + ' → ' + g.P[A].map(fmtRHS).join(' | ')).join('\n');
}
function nullableSet(g) {
  const N = new Set(); let ch = true;
  while (ch) { ch = false; for (const A of g.nts) if (!N.has(A) && g.P[A].some(r => r.every(t => N.has(t)))) { N.add(A); ch = true; } }
  return N;
}
function dedupeRules(rs) { const seen = new Set(); return rs.filter(r => { const k = r.join('\u0001'); if (seen.has(k)) return false; seen.add(k); return true; }); }
function freshName(g, base) {
  let n = base; while (g.nts.includes(n)) n += "'"; return n;
}
function removeNull(g0, keepStartEps) {
  const g = clone(g0); const N = nullableSet(g);
  const P = {};
  for (const A of g.nts) {
    let out = [];
    for (const r of g.P[A]) {
      if (!r.length) continue;
      const pos = r.map((t, i) => N.has(t) ? i : -1).filter(i => i >= 0);
      for (let mask = 0; mask < (1 << pos.length); mask++) {
        const drop = new Set(); pos.forEach((p, k) => { if (mask & (1 << k)) drop.add(p); });
        const nr = r.filter((t, i) => !drop.has(i));
        if (nr.length) out.push(nr);
      }
    }
    P[A] = dedupeRules(out);
  }
  g.P = P;
  const startNullable = N.has(g.start);
  if (keepStartEps && startNullable) {
    const used = g.nts.some(A => g.P[A].some(r => r.includes(g.start)));
    if (used) {
      const S0 = freshName(g, g.start + '0'); g.nts.unshift(S0); g.P[S0] = [[g.start], []]; g.start = S0;
    } else g.P[g.start].push([]);
  }
  return { g, nullable: [...N], startNullable };
}
function removeUnit(g0) {
  const g = clone(g0); const pairs = [];
  const P = {};
  for (const A of g.nts) {
    const U = [A]; for (let i = 0; i < U.length; i++) for (const r of g.P[U[i]]) if (r.length === 1 && isNT(r[0]) && !U.includes(r[0])) U.push(r[0]);
    U.forEach(B => { if (B !== A) pairs.push([A, B]); });
    let out = [];
    for (const B of U) for (const r of g.P[B]) if (!(r.length === 1 && isNT(r[0]))) out.push(r);
    P[A] = dedupeRules(out);
  }
  g.P = P;
  return { g, pairs };
}
function removeUseless(g0) {
  const g = clone(g0);
  const gen = new Set(); let ch = true;
  while (ch) { ch = false; for (const A of g.nts) if (!gen.has(A) && g.P[A].some(r => r.every(t => !isNT(t) || gen.has(t)))) { gen.add(A); ch = true; } }
  const nonGen = g.nts.filter(A => !gen.has(A));
  const P1 = {};
  for (const A of g.nts) if (gen.has(A)) P1[A] = g.P[A].filter(r => r.every(t => !isNT(t) || gen.has(t)));
  const reach = new Set(gen.has(g.start) ? [g.start] : []); const st = [...reach];
  while (st.length) { const A = st.pop(); for (const r of P1[A]) for (const t of r) if (isNT(t) && !reach.has(t)) { reach.add(t); st.push(t); } }
  const unreach = g.nts.filter(A => gen.has(A) && !reach.has(A));
  g.nts = g.nts.filter(A => reach.has(A)); g.P = {}; g.nts.forEach(A => g.P[A] = P1[A]);
  return { g, nonGenerating: nonGen, unreachable: unreach };
}
function simplify(g0, keepStartEps = true) {
  const log = [];
  const a = removeNull(g0, keepStartEps);
  log.push({ title: 'Step 1: remove ε-productions', note: 'Nullable variables: ' + (a.nullable.length ? a.nullable.join(', ') : 'none'), g: a.g });
  const b = removeUnit(a.g);
  log.push({ title: 'Step 2: remove unit productions', note: b.pairs.length ? 'Unit pairs: ' + b.pairs.map(p => '(' + p[0] + ',' + p[1] + ')').join(' ') : 'No unit productions.', g: b.g });
  const c = removeUseless(b.g);
  log.push({ title: 'Step 3: remove useless symbols', note: 'Non-generating: ' + (c.nonGenerating.join(', ') || 'none') + '. Unreachable: ' + (c.unreachable.join(', ') || 'none') + '.', g: c.g });
  return { g: c.g, log, startNullable: a.startNullable };
}
function toCNF(g0) {
  const g = clone(g0); const P = {}; const added = [];
  const tv = {}; let dcount = 0;
  const gnew = () => ({ nts: g.nts.concat(Object.values(tv), added) });
  const exists = n => g.nts.includes(n) || added.includes(n);
  const fresh = base => { let n = base; while (exists(n)) n += "'"; added.push(n); return n; };
  const termVar = t => { if (!tv[t]) { tv[t] = fresh('C' + t); P[tv[t]] = [[t]]; } return tv[t]; };
  for (const A of g.nts) P[A] = [];
  for (const A of g.nts) {
    for (const r of g.P[A]) {
      if (r.length <= 1) { P[A].push(r); continue; }
      let rr = r.map(t => isNT(t) ? t : termVar(t));
      let head = A;
      while (rr.length > 2) {
        const D = fresh('D' + (++dcount));
        P[head].push([rr[0], D]); P[D] = [];
        head = D; rr = rr.slice(1);
      }
      P[head].push(rr);
    }
    P[A] = dedupeRules(P[A]);
  }
  const out = { start: g.start, nts: g.nts.concat(added), P };
  for (const A of out.nts) P[A] = dedupeRules(P[A] || []);
  return out;
}
function toGNF(g0, opts = {}) {
  const log = [];
  const g = clone(g0);
  const order = g.nts.slice();
  const P = {}; order.forEach(A => P[A] = g.P[A].filter(r => r.length).map(r => r.slice()));
  const Zs = [];
  const exists = n => order.includes(n) || Zs.includes(n) || Object.keys(P).includes(n);
  const fresh = base => { let n = base; while (exists(n)) n += "'"; return n; };
  const snapshot = (title, note) => { const gg = { start: g.start, nts: Object.keys(P), P: clone(P) }; log.push({ title, note, g: gg }); };
  snapshot('Start', 'Variables are ordered ' + order.map((A, i) => A + ' = A' + (i + 1)).join(', ') + '. Goal: every rule starts with a terminal.');
  for (let i = 0; i < order.length; i++) {
    const Ai = order[i];
    let guard = 0, changed = true;
    while (changed && guard++ < 50) {
      changed = false; const out = [];
      for (const rhs of P[Ai]) {
        const j = order.indexOf(rhs[0]);
        if (j >= 0 && j < i) { for (const beta of P[rhs[0]]) out.push(beta.concat(rhs.slice(1))); changed = true; } else out.push(rhs);
      }
      P[Ai] = dedupeRules(out);
    }
    const rec = P[Ai].filter(r => r[0] === Ai), non = P[Ai].filter(r => r[0] !== Ai);
    if (rec.length) {
      const Z = fresh('Z' + (i + 1)); Zs.push(Z);
      const nA = []; for (const b of non) { nA.push(b); nA.push(b.concat([Z])); }
      const zp = []; for (const a of rec) { const al = a.slice(1); zp.push(al); zp.push(al.concat([Z])); }
      P[Ai] = dedupeRules(nA); P[Z] = dedupeRules(zp);
      snapshot('Pass A' + (i + 1) + ' (' + Ai + ')', 'Removed left recursion on ' + Ai + ' by adding ' + Z + '.');
    } else snapshot('Pass A' + (i + 1) + ' (' + Ai + ')', 'Substituted earlier variables at the front of ' + Ai + '. No left recursion.');
  }
  // back substitution until all rules start with terminal
  const all = () => Object.keys(P);
  const startsTerm = X => P[X].every(r => !isNT(r[0]));
  let guard = 0;
  while (all().some(X => !startsTerm(X)) && guard++ < 200) {
    let progressed = false;
    for (const X of all()) {
      if (startsTerm(X)) continue;
      const deps = uniq(P[X].filter(r => isNT(r[0])).map(r => r[0]));
      if (deps.every(B => B !== X && startsTerm(B))) {
        const out = [];
        for (const r of P[X]) { if (isNT(r[0])) for (const b of P[r[0]]) out.push(b.concat(r.slice(1))); else out.push(r); }
        P[X] = dedupeRules(out); progressed = true;
      }
    }
    if (!progressed) throw new Error('Could not finish back-substitution (the grammar may have a cycle such as A → A).');
  }
  snapshot('Back-substitution', 'Substituted from the last variable upward until every rule begins with a terminal.');
  // terminals after the first position
  const tv = {}; let did = false;
  for (const X of all()) {
    P[X] = dedupeRules(P[X].map(r => r.map((t, i) => {
      if (i === 0 || isNT(t)) return t;
      did = true; if (!tv[t]) { tv[t] = fresh('C' + t); }
      return tv[t];
    })));
  }
  for (const [t, v] of Object.entries(tv)) P[v] = [[t]];
  if (did) snapshot('Terminals inside rules', 'Replaced non-leading terminals by variables: ' + Object.entries(tv).map(([t, v]) => v + ' → ' + t).join(', ') + '.');
  const res = { start: g.start, nts: Object.keys(P), P };
  return { g: res, log };
}
/* membership */
function cykAccepts(g0, w) { return cnfAccepts(toCNF(simplify(g0, true).g), w); }
function cnfAccepts(c, w) {
  const n = w.length;
  if (n === 0) return c.P[c.start] && c.P[c.start].some(r => r.length === 0);
  const T = Array.from({ length: n }, () => Array.from({ length: n }, () => new Set()));
  for (let i = 0; i < n; i++) for (const A of c.nts) if (c.P[A].some(r => r.length === 1 && r[0] === w[i])) T[i][i].add(A);
  for (let len = 2; len <= n; len++) for (let i = 0; i + len <= n; i++) { const j = i + len - 1;
    for (let k = i; k < j; k++) for (const A of c.nts) for (const r of c.P[A]) if (r.length === 2 && T[i][k].has(r[0]) && T[k + 1][j].has(r[1])) T[i][j].add(A); }
  return T[0][n - 1].has(c.start);
}
function gnfAccepts(g, w) { // every rule starts with terminal -> top-down recursion terminates
  const memo = new Map();
  function parse(syms, i) { // returns true if syms derive w[i..]
    const key = syms.join('\u0001') + '@' + i;
    if (memo.has(key)) return memo.get(key);
    let res = false;
    if (!syms.length) res = i === w.length;
    else if (i >= w.length) res = false;
    else if (!isNT(syms[0])) res = syms[0] === w[i] && parse(syms.slice(1), i + 1);
    else for (const r of g.P[syms[0]]) { if (r.length && r[0] === w[i] && parse(r.slice(1).concat(syms.slice(1)), i + 1)) { res = true; break; } }
    memo.set(key, res); return res;
  }
  return parse([g.start], 0);
}
function enumLanguage(g, maxLen, extra = 4, cap = 300000) {
  const out = new Set(); const seen = new Set(); const q = [[g.start]]; let n = 0;
  while (q.length && n++ < cap) {
    const f = q.shift(); const k = f.join('\u0001'); if (seen.has(k)) continue; seen.add(k);
    const i = f.findIndex(isNT);
    if (i < 0) { if (f.length <= maxLen) out.add(f.join('')); continue; }
    if (f.filter(t => !isNT(t)).length > maxLen) continue;
    if (f.length > maxLen + extra) continue;
    for (const r of g.P[f[i]]) q.push(f.slice(0, i).concat(r, f.slice(i + 1)));
  }
  return out;
}
/* leftmost derivation search */
function derive(g, w, opts = {}) {
  const wt = tokInput(w); const cap = opts.cap || 200000; const extra = opts.extra || 6;
  const start = { f: [g.start], parent: null, rule: null };
  const q = [start]; const seen = new Set([g.start]); let n = 0;
  while (q.length && n++ < cap) {
    const node = q.shift(); const f = node.f;
    const i = f.findIndex(isNT);
    if (i < 0) {
      if (f.length === wt.length && f.every((t, k) => t === wt[k])) {
        const path = []; for (let x = node; x; x = x.parent) path.unshift(x);
        return { forms: path.map(p => p.f), rules: path.slice(1).map(p => p.rule) };
      }
      continue;
    }
    for (let k = 0; k < i; k++) if (f[k] !== wt[k]) { n--; break; }
    let bad = false; for (let k = 0; k < i; k++) if (k >= wt.length || f[k] !== wt[k]) { bad = true; break; }
    if (bad) continue;
    if (f.length > wt.length + extra) continue;
    for (const r of g.P[f[i]]) {
      const nf = f.slice(0, i).concat(r, f.slice(i + 1)); const key = nf.join('\u0001');
      if (seen.has(key)) continue; seen.add(key);
      q.push({ f: nf, parent: node, rule: { lhs: f[i], rhs: r } });
    }
  }
  return null;
}
function tokInput(w) { w = w.trim(); if (!w || isEps(w)) return []; return /\s/.test(w) ? w.split(/\s+/) : [...w]; }
function buildTree(g, rules, startSym) {
  let k = 0;
  function expand(sym) {
    if (!isNT(sym)) return { sym, kids: [] };
    const r = rules[k++]; return { sym, kids: r.rhs.length ? r.rhs.map(expand) : [{ sym: 'ε', kids: [] }] };
  }
  return expand(startSym);
}
function treeText(t, prefix = '', last = true, root = true) {
  let s = root ? t.sym + '\n' : prefix + (last ? '└─ ' : '├─ ') + t.sym + '\n';
  const np = root ? '' : prefix + (last ? '   ' : '│  ');
  t.kids.forEach((c, i) => { s += treeText(c, np, i === t.kids.length - 1, false); });
  return s;
}
function derivationsOf(g, w, limit, nodeCap) {
  const n = w.length, depthMax = 2 * n + 4, lenMax = n + 3; const found = []; let nodes = 0;
  function rec(f, path) {
    if (found.length >= limit || nodes++ > nodeCap) return;
    const i = f.findIndex(isNT);
    if (i < 0) { if (f.length === n && f.every((t, k) => t === w[k])) found.push(path.slice()); return; }
    for (let k = 0; k < i; k++) if (k >= n || f[k] !== w[k]) return;
    if (f.length > lenMax || path.length > depthMax) return;
    if (f.filter(t => !isNT(t)).length > n) return;
    for (const r of g.P[f[i]]) {
      const nf = f.slice(0, i).concat(r, f.slice(i + 1)); const key = nf.join('\u0001');
      if (path.some(p => p.join('\u0001') === key)) continue; // skip ε-cycles
      path.push(nf); rec(nf, path); path.pop();
    }
  }
  rec([g.start], [[g.start]]);
  return found;
}
function findAmbiguity(g, maxLen = 6, opts = {}) {
  const terms = uniq([].concat(...g.nts.map(A => [].concat(...g.P[A].map(r => r.filter(t => !isNT(t)))))));
  const deadline = Date.now() + (opts.ms || 3000);
  let level = [[]];
  for (let len = 0; len <= maxLen; len++) {
    for (const w of level) {
      if (Date.now() > deadline) return { timedOut: true };
      if (!cykAccepts(g, w)) continue;
      const ds = derivationsOf(g, w, 2, 40000);
      if (ds.length >= 2) return { string: w.join(g.word ? ' ' : '') || 'ε', d1: ds[0], d2: ds[1] };
    }
    if (len < maxLen) level = [].concat(...level.map(w => terms.map(t => w.concat([t]))));
  }
  return null;
}

/* ===================== PDA ===================== */
function tokStack(s) {
  s = s.trim(); if (s === '' || isEps(s)) return [];
  if (/\s/.test(s)) return s.split(/\s+/).filter(t => !isEps(t));
  return s.match(/[A-Z][0-9]*'*|./gu) || [];
}
function parsePDA(text) {
  const p = { start: null, Z0: 'Z0', finals: [], accept: 'final', trans: [] };
  for (const raw of text.split(/\n/)) {
    const line = raw.replace(/#.*$/, '').trim(); if (!line) continue;
    let m;
    if ((m = line.match(/^start\s*[:=]\s*(\S+)/i))) { p.start = m[1]; continue; }
    if ((m = line.match(/^(?:stack|z0|bottom)\s*[:=]\s*(\S+)/i))) { p.Z0 = m[1]; continue; }
    if ((m = line.match(/^(?:final|finals)\s*[:=]\s*(.*)$/i))) { p.finals = parseTargets(m[1]); p.accept = 'final'; continue; }
    if ((m = line.match(/^accept\s*[:=]\s*(empty|final)/i))) { p.accept = m[1].toLowerCase(); continue; }
    m = line.match(/^(\S+)\s+(\S+)\s+(\S+)\s*(?:->|→)\s*(.*)$/);
    if (!m) throw new Error('PDA line should look like:  q0 a Z0 -> q0 aZ0   (state input top -> next push). Got: ' + raw.trim());
    for (const alt of m[4].split('|')) {
      const mm = alt.trim().match(/^(\S+)(?:\s+(.*))?$/);
      if (!mm) throw new Error('Missing next state in: ' + raw.trim());
      p.trans.push({ q: m[1], a: isEps(m[2]) ? EPS : m[2], X: m[3], p: mm[1], push: mm[2] ? tokStack(mm[2]) : [] });
      if (!p.start) p.start = m[1];
    }
  }
  if (!p.start) throw new Error('Add at least one transition.');
  return p;
}
function pdaText(p) {
  const lines = ['start: ' + p.start, 'stack: ' + p.Z0, p.accept === 'final' ? 'final: ' + p.finals.join(' ') : 'accept: empty'];
  for (const t of p.trans) lines.push(t.q + ' ' + t.a + ' ' + t.X + ' -> ' + t.p + ' ' + fmtRHS(t.push));
  return lines.join('\n');
}
function simulatePDA(p, w, opts = {}) {
  const inp = tokInput(w); const n = inp.length;
  const cap = opts.cap || 150000, scap = opts.stackCap || (4 * n + 12);
  const root = { q: p.start, i: 0, st: [p.Z0], parent: null, via: null };
  const q = [root]; const seen = new Set(); let explored = 0;
  const byState = {}; p.trans.forEach(t => (byState[t.q] = byState[t.q] || []).push(t));
  while (q.length && explored < cap) {
    const c = q.shift(); const k = c.q + '|' + c.i + '|' + c.st.join(' ');
    if (seen.has(k)) continue; seen.add(k); explored++;
    const ok = c.i === n && (p.accept === 'final' ? p.finals.includes(c.q) : c.st.length === 0);
    if (ok) { const path = []; for (let x = c; x; x = x.parent) path.unshift(x); return { accepted: true, path, explored }; }
    if (!c.st.length) continue;
    for (const t of byState[c.q] || []) {
      if (t.X !== c.st[0]) continue;
      let ni = c.i;
      if (t.a !== EPS) { if (c.i >= n || inp[c.i] !== t.a) continue; ni = c.i + 1; }
      const ns = t.push.concat(c.st.slice(1)); if (ns.length > scap) continue;
      q.push({ q: t.p, i: ni, st: ns, parent: c, via: t });
    }
  }
  return { accepted: false, explored, truncated: explored >= cap, input: inp };
}
function cfgToPDA(g) {
  const p = { start: 'q0', Z0: 'Z0', finals: ['qf'], accept: 'final', trans: [] };
  p.trans.push({ q: 'q0', a: EPS, X: 'Z0', p: 'q1', push: [g.start, 'Z0'] });
  for (const A of g.nts) for (const r of g.P[A]) p.trans.push({ q: 'q1', a: EPS, X: A, p: 'q1', push: r });
  const terms = uniq([].concat(...g.nts.map(A => [].concat(...g.P[A].map(r => r.filter(t => !isNT(t)))))));
  for (const t of terms) p.trans.push({ q: 'q1', a: t, X: t, p: 'q1', push: [] });
  p.trans.push({ q: 'q1', a: EPS, X: 'Z0', p: 'qf', push: ['Z0'] });
  return p;
}

/* ===================== Turing machines ===================== */
function parseTM(text) {
  const tm = { blank: 'B', start: null, accept: [], trans: {}, states: [] };
  const add = s => { if (!tm.states.includes(s)) tm.states.push(s); };
  for (const raw of text.split(/\n/)) {
    const line = raw.replace(/#.*$/, '').trim(); if (!line) continue;
    let m;
    if ((m = line.match(/^start\s*[:=]\s*(\S+)/i))) { tm.start = m[1]; add(m[1]); continue; }
    if ((m = line.match(/^accept\s*[:=]\s*(.*)$/i))) { tm.accept = parseTargets(m[1]); tm.accept.forEach(add); continue; }
    if ((m = line.match(/^blank\s*[:=]\s*(\S+)/i))) { tm.blank = m[1]; continue; }
    m = line.match(/^(\S+)\s+(\S+)\s*(?:->|→)\s*(\S+)\s+(\S+)\s+([LRSlrs])$/);
    if (!m) throw new Error('TM line should look like:  q0 a -> q1 X R   (state read -> next write move). Got: ' + raw.trim());
    add(m[1]); add(m[3]);
    tm.trans[m[1] + KEY + m[2]] = [m[3], m[4], m[5].toUpperCase()];
    if (!tm.start) tm.start = m[1];
  }
  if (!tm.start) throw new Error('Add at least one transition.');
  return tm;
}
function runTM(tm, input, maxSteps = 5000) {
  const tape = input.length ? [...input] : [tm.blank]; let head = 0, state = tm.start;
  const snap = (note) => ({ state, tape: tape.slice(), head, note });
  const configs = [snap('start')]; let status = 'running', steps = 0;
  while (steps < maxSteps) {
    if (tm.accept.includes(state)) { status = 'accepted'; break; }
    const sym = tape[head] === undefined ? tm.blank : tape[head];
    const t = tm.trans[state + KEY + sym];
    if (!t) { status = 'rejected'; break; }
    tape[head] = t[1];
    if (t[2] === 'R') head++; else if (t[2] === 'L') head--;
    if (head < 0) { tape.unshift(tm.blank); head = 0; }
    if (head >= tape.length) tape.push(tm.blank);
    const note = 'δ(' + state + ', ' + sym + ') = (' + t[0] + ', ' + t[1] + ', ' + t[2] + ')';
    state = t[0]; steps++;
    configs.push(snap(note));
  }
  if (status === 'running') status = 'limit';
  const out = tape.join('').replace(new RegExp(tm.blank, 'g'), ' ').trim().replace(/ /g, tm.blank);
  return { status, steps, configs, output: tape.filter(c => c !== tm.blank).join('') };
}
function idString(c, blank) {
  const t = c.tape.slice();
  while (t.length && t[0] === blank && c.head > 0) { t.shift(); c = { ...c, head: c.head - 1 }; }
  while (t.length - 1 > c.head && t[t.length - 1] === blank) t.pop();
  return t.slice(0, c.head).join('') + '[' + c.state + ']' + t.slice(c.head).join('');
}

/* ===================== PCP ===================== */
function solvePCP(tiles, opts = {}) {
  const mpcp = !!opts.mpcp, maxOver = opts.maxOver || 28, cap = opts.cap || 250000, maxDepth = opts.maxDepth || 60;
  const q = []; const seen = new Set(); let explored = 0;
  const apply = (top, bot, i) => { const T = top + tiles[i][0], B = bot + tiles[i][1]; if (T.startsWith(B) || B.startsWith(T)) return [T, B]; return null; };
  const norm = (T, B) => T.length >= B.length ? ['t', T.slice(B.length)] : ['b', B.slice(T.length)];
  const starts = mpcp ? [0] : tiles.map((_, i) => i);
  for (const i of starts) { const r = apply('', '', i); if (r) { const [s, o] = norm(r[0], r[1]); q.push({ side: s, over: o, seq: [i], T: r[0], B: r[1] }); } }
  while (q.length && explored++ < cap) {
    const c = q.shift();
    if (c.over === '' ) return { found: true, seq: c.seq.map(i => i + 1), top: c.T, bottom: c.B, explored };
    if (c.seq.length >= maxDepth) continue;
    const key = c.side + ':' + c.over; if (seen.has(key)) continue; seen.add(key);
    for (let i = 0; i < tiles.length; i++) {
      const r = apply(c.T, c.B, i); if (!r) continue;
      const [s, o] = norm(r[0], r[1]); if (o.length > maxOver) continue;
      q.push({ side: s, over: o, seq: c.seq.concat([i]), T: r[0], B: r[1] });
    }
  }
  return { found: false, explored, exhausted: !q.length };
}

const api = { EPS, parseFA, delta, epsClosure, nfaToDfa, runNFA, faToDfaObj, completeDfa, runDFA, minimizeDFA,
  parseMealy, parseMoore, runMealy, runMoore, mooreToMealy, mealyToMoore,
  isNT, tokRHS, fmtRHS, parseGrammar, grammarText, nullableSet, removeNull, removeUnit, removeUseless, simplify, toCNF, toGNF,
  cykAccepts, cnfAccepts, gnfAccepts, enumLanguage, derive, buildTree, treeText, findAmbiguity, tokInput,
  parsePDA, pdaText, simulatePDA, cfgToPDA, parseTM, runTM, idString, solvePCP };
if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.FLA = api;
})(typeof window !== 'undefined' ? window : globalThis);
