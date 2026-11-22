/* ================= COURSE: lessons with checked practice ================= */
const prog = store.get('prog', {});
function markDone(lid, pid) { prog[lid] = prog[lid] || {}; prog[lid][pid] = true; store.set('prog', prog); }
function doneCount(L) { return L.practice.filter((_, i) => prog[L.id] && prog[L.id]['p' + i]).length; }
const byId = (list, id) => list.find(x => x.id === id);
const setKey = a => a.slice().sort().join(',');
const toks = s => s.split(/[^A-Za-z0-9'_]+/).filter(x => x && !/^(phi|empty|null|none)$/i.test(x));

function fbBox() {
  const el = h('div', { class: 'fbk', 'aria-live': 'polite' });
  return { el, ok(m) { el.className = 'fbk good'; el.replaceChildren(h('b', {}, 'Correct. '), m || ''); }, bad(m) { el.className = 'fbk bad'; el.replaceChildren(h('b', {}, 'Not yet. '), m || ''); }, info(m) { el.className = 'fbk'; el.replaceChildren(m); } };
}
function practiceCard(lid, idx, title, prompt, body, fb, answer) {
  const done = !!(prog[lid] && prog[lid]['p' + idx]);
  const card = h('section', { class: 'card try' + (done ? ' isdone' : '') }, h('div', { class: 'row' }, h('span', { class: 'pill run' }, 'Your turn ' + (idx + 1)), h('h3', {}, title), done ? h('span', { class: 'pill ok' }, 'done') : null), prompt, body, fb.el,
    answer ? h('details', {}, h('summary', {}, 'Stuck? Show the answer'), h('div', { class: 'body' }, answer)) : null);
  const orig = fb.ok; fb.ok = m => { const first = !(prog[lid] && prog[lid]['p' + idx]); orig(m); markDone(lid, 'p' + idx); card.classList.add('isdone'); if (first) { xpAdd(20); confetti(); } else confetti(25); };
  return card;
}
function reveal(items) {
  const wrap = h('div', { class: 'reveal' }), list = h('div', {});
  let n = 0;
  const btn = h('button', { class: 'btn primary', type: 'button' }, 'Show next step'), all = h('button', { class: 'btn', type: 'button' }, 'Show everything');
  const add = () => {
    if (n >= items.length) return; const it = items[n++];
    list.append(h('div', { class: 'rstep' }, h('div', { class: 'rn' }, String(n)), h('div', {}, it.t ? h('b', {}, it.t) : null, it.node ? it.node : null)));
    if (n >= items.length) { btn.disabled = true; all.disabled = true; btn.textContent = 'That is the whole example'; }
  };
  btn.addEventListener('click', add); all.addEventListener('click', () => { while (n < items.length) add(); });
  add();
  wrap.append(list, h('div', { class: 'row' }, btn, all));
  return wrap;
}
const P2 = txt => h('p', {}, txt);
const gtext = g => pre(F.grammarText(g));
const fmtSet = a => '{' + a.join(', ') + '}';

/* --- checkers --- */
function mcq(L, idx, title, q, opts, ans, why) {
  const fb = fbBox(); let done = false;
  const box = h('div', { class: 'opts' }, opts.map((t, k) => h('button', { class: 'opt', type: 'button', onclick: e => {
    if (done) return;
    if (k === ans) { done = true; e.target.classList.add('right'); fb.ok(why); } else { e.target.classList.add('wrong'); e.target.disabled = true; fb.bad('Try another option. ' + (why ? 'Think about: ' + why.split('.')[0] + '.' : '')); }
  } }, t)));
  return practiceCard(L.id, idx, title, h('p', {}, q), box, fb, null);
}
function ask(L, idx, title, q, check, hint, answerText, ph) {
  const fb = fbBox(), inp = h('input', { type: 'text', placeholder: ph || 'your answer', 'aria-label': 'Your answer' });
  const go = () => { const r = check(inp.value.trim()); if (r.ok) fb.ok(r.msg); else fb.bad(r.msg || hint); };
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  return practiceCard(L.id, idx, title, h('p', {}, q), h('div', { class: 'row' }, inp, h('button', { class: 'btn primary', type: 'button', onclick: go }, 'Check')), fb, answerText ? h('p', {}, answerText) : null);
}
function allStrings(alpha, max) { const out = ['']; let layer = ['']; for (let k = 1; k <= max; k++) { layer = [].concat(...layer.map(s => alpha.map(a => s + a))); out.push(...layer); } return out; }

function dfaBuilder(L, idx, title, q, alpha, pred, solutionText, nDefault) {
  const fb = fbBox(); let n = nDefault || 3;
  const holder = h('div', {}); let state = null;
  const render = () => {
    const names = Array.from({ length: n }, (_, i) => 'q' + i);
    state = { delta: {}, finals: {} };
    const rows = names.map(s => {
      const cells = alpha.map(a => { const sel = h('select', { 'aria-label': 'From ' + s + ' on ' + a }, names.map(t => h('option', { value: t }, t))); sel.value = s; state.delta[s + '|' + a] = s; sel.addEventListener('change', () => { state.delta[s + '|' + a] = sel.value; }); return h('td', {}, sel); });
      const cb = h('input', { type: 'checkbox', 'aria-label': s + ' is final' }); cb.addEventListener('change', () => { state.finals[s] = cb.checked; });
      return h('tr', {}, h('td', { class: 'mono-cell' }, (s === 'q0' ? '→ ' : '') + s), cells, h('td', {}, cb));
    });
    holder.replaceChildren(h('div', { class: 'scroll' }, h('table', {}, h('thead', {}, h('tr', {}, h('th', {}, 'State'), alpha.map(a => h('th', {}, 'on ' + a)), h('th', {}, 'Final?'))), h('tbody', {}, rows))));
  };
  const nsel = h('select', { id: 'n-' + L.id + idx, 'aria-label': 'Number of states' }, [2, 3, 4, 5, 6].map(k => h('option', { value: k }, k + ' states')));
  nsel.value = String(n); nsel.addEventListener('change', () => { n = +nsel.value; render(); fb.info(''); });
  render();
  const check = () => {
    const names = Array.from({ length: n }, (_, i) => 'q' + i), d = { states: names, alphabet: alpha, start: 'q0', finals: names.filter(s => state.finals[s]), delta: {} };
    for (const s of names) { d.delta[s] = {}; for (const a of alpha) d.delta[s][a] = state.delta[s + '|' + a]; }
    for (const w of allStrings(alpha, 7)) {
      const got = F.runDFA(d, w).accepted, want = pred(w);
      if (got !== want) { const path = F.runDFA(d, w).path.join(' → '); fb.bad('The string "' + (w || 'ε') + '" should be ' + (want ? 'accepted' : 'rejected') + ' but your machine ' + (got ? 'accepts' : 'rejects') + ' it. It runs ' + path + '. Fix the arrows that string uses.'); return; }
    }
    fb.ok('Your DFA matches the rule on every string up to length 7. That is a pass in the exam.');
  };
  return practiceCard(L.id, idx, title, h('p', {}, q), h('div', {}, h('div', { class: 'row' }, h('label', { for: 'n-' + L.id + idx }, 'How many states?'), nsel), holder, h('div', { class: 'row' }, h('button', { class: 'btn primary', type: 'button', onclick: check }, 'Check my DFA'))), fb, h('p', {}, solutionText));
}

function nfaGuided(L, idx, title, q, nfaText) {
  const fb = fbBox(), fa = F.parseFA(nfaText), r = F.nfaToDfa(fa);
  const truth = new Map(); r.rows.forEach(x => truth.set(setKey(x.from) + '|' + x.sym, x.to));
  const startKey = setKey(r.startSet), known = [r.startSet.slice()], given = {}, okCell = {};
  const holder = h('div', {});
  const render = () => {
    const rows = known.map(s => {
      const k = setKey(s);
      return h('tr', {}, h('td', { class: 'mono-cell' }, (k === startKey ? '→ ' : '') + fmtSet(s)), fa.alphabet.map(a => {
        const id = k + '|' + a, inp = h('input', { type: 'text', class: 'cellin' + (okCell[id] ? ' ok' : ''), value: given[id] || '', placeholder: '{…}', 'aria-label': 'Set reached from ' + fmtSet(s) + ' on ' + a, disabled: !!okCell[id] });
        inp.addEventListener('input', () => { given[id] = inp.value; }); inp.addEventListener('keydown', e => { if (e.key === 'Enter') check(); });
        return h('td', {}, inp);
      }));
    });
    holder.replaceChildren(h('div', { class: 'scroll' }, h('table', {}, h('thead', {}, h('tr', {}, h('th', {}, 'DFA state (a set of NFA states)'), fa.alphabet.map(a => h('th', {}, 'on ' + a)))), h('tbody', {}, rows))));
  };
  const check = () => {
    let wrong = [], filled = 0;
    for (const s of known.slice()) for (const a of fa.alphabet) {
      const id = setKey(s) + '|' + a; if (okCell[id] || !(given[id] || '').trim()) continue; filled++;
      const want = truth.get(id) || [], got = toks(given[id]);
      if (setKey(got) === setKey(want)) { okCell[id] = true; if (!known.some(x => setKey(x) === setKey(want))) known.push(want); }
      else wrong.push(fmtSet(s) + ' on ' + a);
    }
    render();
    const total = known.length * fa.alphabet.length, doneCells = Object.keys(okCell).length;
    if (wrong.length) fb.bad('Check ' + wrong.join('; ') + '. For each member of the set, look up where it goes on that symbol in the NFA, then take the union' + (fa.hasEps ? ', then add the ε-closure' : '') + '. Write the empty result as ∅ or leave a dash.');
    else if (doneCells === total) { const fin = known.filter(s => s.some(x => fa.finals.includes(x))); fb.ok('The table is complete: ' + known.length + ' DFA states. Final states are the sets that contain an NFA final state (' + fa.finals.join(', ') + '): ' + (fin.map(fmtSet).join('  ') || 'none') + '.'); }
    else fb.info(filled ? 'Good so far. New rows have appeared at the bottom. Fill them in.' : 'Type a set in a cell, for example {q0,q1}, then press Check.');
  };
  render();
  return practiceCard(L.id, idx, title, h('div', {}, h('p', {}, q), pre(nfaText.replace(/^#.*\n/gm, '').trim()), h('p', { class: 'small muted' }, 'Start with the first row. When a cell is right, any new set it produces gets its own row.')), h('div', {}, holder, h('div', { class: 'row' }, h('button', { class: 'btn primary', type: 'button', onclick: check }, 'Check my cells'))), fb, h('div', {}, table(['State', ...fa.alphabet], r.states.map(s => [s.name, ...fa.alphabet.map(a => { const x = r.rows.find(y => r.nameOf(y.from) === s.name && y.sym === a); return r.nameOf(x.to); })])), h('p', {}, 'Final states: ' + r.states.filter(s => s.final).map(s => s.name).join(', '))));
}

function prodSet(g) { const s = new Set(); for (const A of g.nts) for (const r of g.P[A]) if (r.length) s.add(A + ' → ' + r.join('')); return s; }
function gramStepCheck(userText, want) {
  let ug; try { ug = F.parseGrammar(userText); } catch (e) { return { ok: false, msg: e.message }; }
  const a = prodSet(ug), b = prodSet(want), miss = [...b].filter(x => !a.has(x)), extra = [...a].filter(x => !b.has(x));
  if (!miss.length && !extra.length) return { ok: true };
  return { ok: false, msg: (miss.length ? 'Missing: ' + miss.slice(0, 4).join(',  ') + (miss.length > 4 ? ' …' : '') + '. ' : '') + (extra.length ? 'Should not be there: ' + extra.slice(0, 4).join(',  ') + (extra.length > 4 ? ' …' : '') + '.' : '') };
}
function gramSteps(L, idx, title, q, text) {
  const fb = fbBox(), g = F.parseGrammar(text);
  const a = F.removeNull(g, false), b = F.removeUnit(a.g), c = F.removeUseless(b.g);
  const stages = [
    { label: 'Step 1. Which variables are nullable (can become ε)?', set: true, want: a.nullable, hint: 'A variable is nullable if it has A → ε, or a rule whose right side is made only of nullable variables.' },
    { label: 'Step 2. Write the grammar after removing ε-productions.', want: a.g, hint: 'For every rule, write one copy for every way of deleting nullable variables. Do not write any ε rule.' },
    { label: 'Step 3. Write the grammar after removing unit productions (A → B).', want: b.g, hint: 'Replace each unit rule A → B by every non-unit rule of B. Follow chains, so if B → C then also take what C gives.' },
    { label: 'Step 4. Write the final grammar after removing useless symbols.', want: c.g, hint: 'Delete variables that never produce a terminal string, then variables that cannot be reached from S.' }
  ];
  let at = 0; const area = h('div', {});
  const show = () => {
    area.replaceChildren();
    stages.forEach((st, i) => {
      if (i > at) return;
      const f2 = fbBox();
      const done = i < at;
      const input = st.set ? h('input', { type: 'text', placeholder: 'e.g. A, B', value: st.val || '', disabled: done }) : h('textarea', { rows: 5, spellcheck: 'false', placeholder: 'S -> ...\nA -> ...', disabled: done }, st.val || '');
      if (st.val && !st.set) input.value = st.val;
      const go = () => {
        let res;
        if (st.set) { const got = toks(input.value); res = setKey(got) === setKey(st.want) ? { ok: true } : { ok: false, msg: st.hint }; }
        else res = gramStepCheck(input.value, st.want);
        if (res.ok) { st.val = input.value; at = i + 1; if (at >= stages.length) { fb.ok('All four steps correct. That is a full-marks simplification.'); } show(); }
        else f2.bad((res.msg || '') + ' ' + st.hint);
      };
      area.append(h('div', { class: 'gstep' }, h('label', {}, st.label), input, done ? h('div', { class: 'fbk good' }, 'Correct.') : h('div', { class: 'row' }, h('button', { class: 'btn primary', type: 'button', onclick: go }, 'Check'), h('span', { class: 'small muted' }, st.set ? '' : 'One variable per line, alternatives with |. Skip S → ε.')), done ? null : f2.el));
    });
  };
  show();
  return practiceCard(L.id, idx, title, h('div', {}, h('p', {}, q), pre(text.trim())), area, fb, h('div', {}, F.simplify(g, false).log.map(l => h('div', {}, h('b', {}, l.title + '. '), l.note, gtext(l.g)))));
}

function normalForm(L, idx, title, q, text, kind, hint, answerText) {
  const fb = fbBox(), g = F.parseGrammar(text);
  const ta = h('textarea', { rows: 7, spellcheck: 'false', placeholder: 'S -> AB | a\nA -> ...' });
  const terms = [...new Set([].concat(...g.nts.map(A => [].concat(...g.P[A].map(r => r.filter(t => !F.isNT(t))))))) ].slice(0, 3);
  const go = () => {
    let ug; try { ug = F.parseGrammar(ta.value); } catch (e) { fb.bad(e.message); return; }
    for (const A of ug.nts) for (const r of ug.P[A]) {
      const bad = kind === 'cnf' ? !(r.length === 1 && !F.isNT(r[0]) || r.length === 2 && F.isNT(r[0]) && F.isNT(r[1]) || (!r.length && A === ug.start)) : !(r.length >= 1 && !F.isNT(r[0]) && r.slice(1).every(F.isNT));
      if (bad) { fb.bad('The rule  ' + A + ' → ' + (r.join('') || 'ε') + '  is not in ' + (kind === 'cnf' ? 'CNF. Every rule must be A → BC (two variables) or A → a (one terminal).' : 'GNF. Every rule must be A → a followed by zero or more variables.')); return; }
    }
    for (const w of allStrings(terms, 6)) { if (!w) continue; const arr = [...w], want = F.cykAccepts(g, arr), got = kind === 'cnf' ? F.cnfAccepts(ug, arr) : F.gnfAccepts(ug, arr); if (want !== got) { fb.bad('Your grammar is in the right form but generates a different language. The string "' + w + '" should be ' + (want ? 'generated' : 'not generated') + '. Recheck how you changed the rules that produce it.'); return; } }
    fb.ok('Right form, and it generates the same strings as the original (checked up to length 6).');
  };
  return practiceCard(L.id, idx, title, h('div', {}, h('p', {}, q), pre(text.trim()), h('p', { class: 'small muted' }, hint)), h('div', {}, ta, h('div', { class: 'row' }, h('button', { class: 'btn primary', type: 'button', onclick: go }, 'Check'))), fb, answerText ? pre(answerText) : h('div', {}, h('p', { class: 'small muted' }, 'New variables are named Z2, C… here. In the checker use single capital letters.'), gtext(F.toGNF(F.simplify(g, false).g).g)));
}

function minGuide(L, idx, title, q, dfaText) {
  const fb = fbBox(), d = F.faToDfaObj(F.parseFA(dfaText)), m = F.minimizeDFA(d), want = m.classes.map(c => setKey(c));
  const inp = h('input', { type: 'text', placeholder: '{A,B} {C,D} …', 'aria-label': 'Groups of equivalent states' });
  const go = () => {
    const groups = [...inp.value.matchAll(/\{([^}]*)\}/g)].map(x => setKey(toks(x[1])));
    if (!groups.length) { fb.bad('Write each group of equivalent states in braces, for example {A,B} {C,D}. A state that is alone also gets its own braces.'); return; }
    if (setKey(groups) === setKey(want)) fb.ok('Those are the equivalence classes, so the minimal DFA has ' + want.length + ' states. Each group becomes one state.'); else fb.bad('Not the right groups. Mark the pairs where exactly one state is final first. Then mark a pair if some symbol sends it to an already marked pair. Pairs left unmarked are equivalent.');
  };
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  return practiceCard(L.id, idx, title, h('div', {}, h('p', {}, q), dfaTable(d), dfaGraph(d)), h('div', { class: 'row' }, inp, h('button', { class: 'btn primary', type: 'button', onclick: go }, 'Check')), fb, h('p', {}, 'Groups: ' + m.classes.map(c => fmtSet(c)).join(' ') + '. Minimal DFA has ' + m.min.states.length + ' states.'));
}

function tmPlayer(p, input) {
  const tm = F.parseTM(p.text), res = F.runTM(tm, input), cfgs = res.configs; let i = 0, playing = false;
  const tape = h('div', { class: 'tape' }), info = h('div', { class: 'explain' }), st = h('span', { class: 'statebox' }), cnt = h('b', { class: 'mono' }), sp = speedCtl(900);
  const rules = Object.entries(tm.trans).map(([k, v]) => { const [a, b] = k.split('\u0001'); return { a, b, v, tr: h('tr', {}, [a, b, v[0], v[1], v[2]].map(x => h('td', { class: 'mono-cell' }, x))) }; });
  const rtab = h('div', { class: 'scroll rtab' }, h('table', {}, h('thead', {}, h('tr', {}, ['State', 'Read', 'Next', 'Write', 'Move'].map(x => h('th', {}, x)))), h('tbody', {}, rules.map(r => r.tr))));
  const draw = () => {
    const c = cfgs[i], blank = tm.blank, pad = 3, left = Math.max(0, pad - c.head), right = Math.max(0, pad - (c.tape.length - 1 - c.head));
    const all = Array(left).fill(blank).concat(c.tape, Array(right).fill(blank)), hd = c.head + left;
    const pc = i ? cfgs[i - 1] : null, wrote = pc ? pc.head - c.head + hd : -1;
    tape.replaceChildren(...all.map((ch, k) => h('div', { class: 'cell' + (k === hd ? ' head' : '') + (ch === blank ? ' blank' : '') + (k === wrote ? ' wrote' : '') }, ch === blank ? '·' : ch)));
    st.textContent = 'state ' + c.state; cnt.textContent = 'step ' + i + ' of ' + (cfgs.length - 1);
    info.textContent = i ? c.note : 'Start. The head is on the first symbol.';
    rules.forEach(r => r.tr.classList.remove('now'));
    if (pc) { const sym = pc.tape[pc.head] === undefined ? blank : pc.tape[pc.head]; const r = rules.find(x => x.a === pc.state && x.b === sym); if (r) { r.tr.classList.add('now'); const box = rtab; const top = r.tr.offsetTop - box.clientHeight / 2; box.scrollTop = Math.max(0, top); } }
    if (i === cfgs.length - 1) { info.textContent += '   →   ' + (res.status === 'accepted' ? 'ACCEPTED' : 'halted without accepting'); st.classList.toggle('acc', res.status === 'accepted'); } else st.classList.remove('acc');
  };
  const play = async () => { if (i >= cfgs.length - 1) i = 0; playing = true; while (playing && i < cfgs.length - 1) { i++; draw(); await sleep(sp.get() / 2); } };
  draw();
  return h('div', { class: 'tmp' }, h('div', { class: 'row' }, h('b', {}, 'Input: ' + input), st, cnt), tape, info,
    h('div', { class: 'row' }, h('button', { class: 'btn primary', type: 'button', onclick: play }, '▶ Play'), h('button', { class: 'btn', type: 'button', onclick: () => { playing = false; } }, '⏸'), h('button', { class: 'btn', type: 'button', onclick: () => { playing = false; i = 0; draw(); } }, '⏮'), h('button', { class: 'btn', type: 'button', onclick: () => { playing = false; if (i > 0) { i--; draw(); } } }, '◀'), h('button', { class: 'btn', type: 'button', onclick: () => { playing = false; if (i < cfgs.length - 1) { i++; draw(); } } }, 'Step ▶'), sp.el),
    h('div', { class: 'small muted' }, 'The highlighted row is the rule the machine just used.'), rtab);
}
function tmPredict(L, idx, title, q, presetId, input, n) {
  const p = byId(P.tm, presetId), tm = F.parseTM(p.text), res = F.runTM(tm, input), c = res.configs[n];
  const fb = fbBox(), s = h('input', { type: 'text', placeholder: 'state, e.g. q2', 'aria-label': 'State' }), t = h('input', { type: 'text', placeholder: 'tape, e.g. XaYb', 'aria-label': 'Tape' });
  const trim = a => a.join('').split(tm.blank).join('').trim();
  const go = () => {
    const okS = s.value.trim().toLowerCase() === c.state.toLowerCase(), okT = t.value.replace(/\s+/g, '').split(tm.blank).join('') === trim(c.tape);
    if (okS && okT) fb.ok('After step ' + n + ' the machine is in ' + c.state + ' with tape ' + trim(c.tape) + '.'); else fb.bad((okS ? '' : 'The state is wrong. ') + (okT ? '' : 'The tape is wrong. ') + 'Go back to the player above and press Next step exactly ' + n + ' times. Write the tape without blanks.');
  };
  return practiceCard(L.id, idx, title, h('div', {}, h('p', {}, q), tmPlayer(p, input)), h('div', { class: 'row' }, s, t, h('button', { class: 'btn primary', type: 'button', onclick: go }, 'Check')), fb, h('p', {}, 'Step ' + n + ': state ' + c.state + ', tape ' + trim(c.tape) + '.'));
}
function pdaPredict(L, idx, title, q, presetId, input, upto) {
  const p = byId(P.pda, presetId), pda = F.parsePDA(p.text), r = F.simulatePDA(pda, input), node = r.path.find(x => x.i === upto), want = node.st.join('');
  const fb = fbBox(), inp = h('input', { type: 'text', placeholder: 'stack, top first', 'aria-label': 'Stack' });
  const go = () => { if (inp.value.replace(/\s+/g, '') === want) fb.ok('Right. The stack, top first, is ' + want + '.'); else fb.bad('Follow the moves one at a time from the trace above. Each a that is read pushes one more a above Z0. Write the stack top first with Z0 at the bottom.'); };
  return practiceCard(L.id, idx, title, h('div', {}, h('p', {}, q), pre(p.text.replace(/^#.*\n/gm, '').trim()), pdaAnim(pda, input)), h('div', { class: 'row' }, inp, h('button', { class: 'btn primary', type: 'button', onclick: go }, 'Check')), fb, h('p', {}, 'The stack is ' + want + '.'));
}
function pcpPractice(L, idx, title, q, tiles, mpcp) {
  const fb = fbBox(), inp = h('input', { type: 'text', placeholder: 'tile numbers, e.g. 2 1 1 3', 'aria-label': 'Tile sequence' });
  const sol = F.solvePCP(tiles, { mpcp });
  const go = () => {
    const seq = inp.value.split(/[^0-9]+/).filter(Boolean).map(Number);
    if (!seq.length || seq.some(x => x < 1 || x > tiles.length)) { fb.bad('Type tile numbers between 1 and ' + tiles.length + '.'); return; }
    if (mpcp && seq[0] !== 1) { fb.bad('For MPCP the sequence must start with tile 1.'); return; }
    const T = seq.map(i => tiles[i - 1][0]).join(''), B = seq.map(i => tiles[i - 1][1]).join('');
    if (T === B) fb.ok('Top and bottom both spell ' + T + '. That is a solution.'); else fb.bad('Top spells ' + T + ' and bottom spells ' + B + '. They are not equal. One is a prefix of the other? Then pick the next tile so that it continues the longer row.');
  };
  return practiceCard(L.id, idx, title, h('div', {}, h('p', {}, q), table(['Tile', 'Top', 'Bottom'], tiles.map((t, i) => [i + 1, t[0], t[1]]), { monoCols: [1, 2] })), h('div', { class: 'row' }, inp, h('button', { class: 'btn primary', type: 'button', onclick: go }, 'Check')), fb, h('p', {}, sol.found ? 'One solution is ' + sol.seq.join(', ') + ' (' + sol.top + ').' : 'No solution.'));
}

/* --- lesson content --- */
const DFA_EX = 'start: q0\nfinal: q2\nq0 0 -> q1\nq0 1 -> q0\nq1 0 -> q1\nq1 1 -> q2\nq2 0 -> q1\nq2 1 -> q0';
const NFA_ENDS_AB = '# NFA: strings over {a,b} that end in ab\nstart: q0\nfinal: q2\nq0 a -> q0 q1\nq0 b -> q0\nq1 a ->\nq1 b -> q2\nq2 a ->\nq2 b ->';
const MIN_PRACTICE = 'start: A\nfinal: C D\nA 0 -> B\nA 1 -> C\nB 0 -> A\nB 1 -> D\nC 0 -> E\nC 1 -> F\nD 0 -> E\nD 1 -> F\nE 0 -> E\nE 1 -> F\nF 0 -> F\nF 1 -> F';
const MEALY_PRACTICE = 'q0 0 -> q0 1\nq0 1 -> q0 0';
const count = (w, c) => [...w].filter(x => x === c).length;

const LESSONS = [
  { id: 'dfa', unit: 1, title: 'Read a DFA, then design one', time: '60 min',
    plain: 'A DFA is a machine with a few boxes called states. It reads the string one symbol at a time. Each symbol moves you along exactly one arrow. When the string ends, if you are in a double-circled state, the string is accepted. That is all it is.',
    method: ['Decide what the machine must remember about the part of the string it has read. Every different thing to remember is one state.', 'Make the start state the "nothing read yet" memory.', 'For every state and every symbol draw exactly one arrow. A DFA never has a missing arrow. If a string can never become good again, send it to a dead state that loops on everything.', 'Make a state final if its memory says "the string so far is good".', 'Test three strings: the empty string, one that should pass, and one that should fail.'],
    example: () => { const d = F.faToDfaObj(F.parseFA(DFA_EX)); return reveal([
      { t: 'Problem: strings over {0,1} that end in 01.', node: P2('What must we remember? Only how much of "01" we have just seen at the end.') },
      { t: 'Choose the states.', node: P2('q0: no progress, the last symbol was not a useful 0.  q1: the string just ended in 0 (so a 1 next would finish "01").  q2: the string ends in 01 (final).') },
      { t: 'Draw one arrow per symbol from each state.', node: P2('From q0: 0 starts a possible "01" so go to q1. 1 gives no progress so stay at q0. From q1: 0 keeps us at q1 (the new 0 is the start). 1 completes "01", go to q2. From q2: 0 goes to q1. 1 goes to q0 (progress lost).') },
      { t: 'The finished machine.', node: h('div', {}, dfaTable(d), dfaGraph(d)) },
      { t: 'Test it.', node: P2('"01": q0 → q1 → q2, final, accepted. "101": q0 → q0 → q1 → q2, accepted. "010": ends in q1, rejected. "ε": stays in q0, rejected. All correct.') }]); },
    toy: () => runner(dfaAdapter(F.faToDfaObj(F.parseFA(DFA_EX))), '0101', ['01', '1101', '010', '', '0011'], 'This machine accepts strings that end in 01. Press Play and watch the dot follow the arrows.'),
    pitfalls: ['Forgetting an arrow. Every state needs one arrow for every symbol.', 'Making too many states. Ask what you really must remember.', 'Forgetting that the empty string is accepted only when the start state is final.'],
    practice: [
      L => quickfire(L, 3, 'Quick-fire: accept or reject?', F.faToDfaObj(F.parseFA(DFA_EX)), ['0', '1'], 'Run the machine in your head. Will it accept the string? Get 8 in a row.'),
      L => dfaBuilder(L, 0, 'Even number of 0s', 'Design a DFA over {0,1} that accepts strings with an even number of 0s. Click the arrows with the dropdowns and tick the final states.', ['0', '1'], w => count(w, '0') % 2 === 0, 'Two states. q0 (even, start, final) and q1 (odd). On 0 swap between q0 and q1. On 1 stay where you are.', 2),
      L => dfaBuilder(L, 1, 'No two 0s in a row', 'Design a DFA over {0,1} that accepts strings that do NOT contain 00. Hint: you need a dead state.', ['0', '1'], w => !w.includes('00'), 'q0: start or last symbol 1 (final). q1: last symbol 0 (final). q2: dead (not final). q0: 0→q1, 1→q0. q1: 0→q2, 1→q0. q2: 0→q2, 1→q2.', 3),
      L => dfaBuilder(L, 2, 'Number of a\'s divisible by 3', 'Design a DFA over {a,b} that accepts strings where the number of a\'s is a multiple of 3 (0 counts).', ['a', 'b'], w => count(w, 'a') % 3 === 0, 'Three states counting a\'s mod 3. q0 (start, final), q1, q2. On a: q0→q1→q2→q0. On b: stay in the same state.', 3)] },

  { id: 'nfa', unit: 1, title: 'NFA to DFA (subset construction)', time: '60 min',
    plain: 'An NFA may have choices: one symbol can lead to several states, or to none. A DFA cannot, so we build a DFA whose every state is a set of NFA states. That set means "the NFA could be in any of these right now". This is the most predictable question in Unit 1.',
    method: ['The start state of the DFA is the set {q0}. For an ε-NFA, use the ε-closure of q0 (everything reachable by ε-moves, including q0 itself).', 'Take a set and a symbol. For each NFA state in the set, find where it goes on that symbol. Union all those targets. For an ε-NFA, add the ε-closure of the result. That union is the next set.', 'Any new set is a new DFA state. Repeat step 2 for it, for every symbol, until no new sets appear.', 'The empty set ∅ is allowed. It is a dead state that loops on everything.', 'A DFA state is final if its set contains at least one NFA final state.', 'Draw the table in the exam. Name sets A, B, C if you like, but show what each means.'],
    toy: () => runner(faAdapter(F.parseFA(byId(P.nfa, 'n24').text)), '0110', ['10', '0111', '1100', '11'], 'This NFA guesses. Watch several states light up at once. The set of lit states after each symbol is exactly one DFA state. That is the whole trick.'),
    example: () => subsetAnim(F.parseFA(byId(P.nfa, 'n24').text)),
    exampleOld: () => { const p = byId(P.nfa, 'n24'), fa = F.parseFA(p.text), r = F.nfaToDfa(fa); return reveal([
      { t: 'The NFA: second symbol from the end is 1.', node: h('div', {}, pre(p.text.replace(/^#.*\n/gm, '').trim()), faGraph(fa)) },
      { t: 'Start with {' + r.startSet.join(',') + '}.', node: P2('This is the first row of the table.') },
      ...r.rows.map(x => ({ t: fmtSet(x.from) + ' on ' + x.sym + ' = ' + fmtSet(x.to), node: P2('Union of where each member goes on ' + x.sym + '.' + (!r.rows.some(y => setKey(y.from) === setKey(x.to)) ? ' ' : (setKey(x.to) !== setKey(x.from) ? ' This set is also a DFA state.' : ''))) })),
      { t: 'Finish: mark the finals and draw.', node: h('div', {}, P2('Final: the sets that contain ' + fa.finals.join(', ') + '. The DFA has ' + r.states.length + ' states.'), dfaGraph(r.dfa)) }]); },
    pitfalls: ['Forgetting that the next set is a union over every member, not just one member.', 'Writing sets inconsistently (always list the members in the same order).', 'Forgetting the ε-closure after each move in an ε-NFA.', 'Leaving out the ∅ state when it appears.'],
    practice: [
      L => nfaGuided(L, 0, 'Fill the subset table', 'Convert this NFA to a DFA by filling in the table. The NFA accepts strings that end in ab.', NFA_ENDS_AB),
      L => nfaGuided(L, 1, 'A question from Jul 2025', 'This NFA appeared in Jul 2025, paper 1, Q21b. Convert it to a DFA.', byId(P.nfa, 'j1').text),
      L => nfaGuided(L, 2, 'ε-NFA from Jul 2025', 'This ε-NFA is Jul 2025, paper 1, Q21a. Remember: each set you write already includes the ε-closure, and so does the start set.', byId(P.nfa, 'j1e').text)] },

  { id: 'min', unit: 1, title: 'Minimize a DFA (table filling)', time: '45 min',
    plain: 'Two states are equivalent if no string can tell them apart: from either one, the same strings lead to acceptance. Minimizing means merging every group of equivalent states. The result is the smallest DFA for the same language.',
    method: ['Delete states you can never reach from the start.', 'Draw a triangle table with one cell for every pair of states.', 'Round 0: mark a pair if exactly one of its states is final. Those two are different already.', 'Next rounds: look at each unmarked pair (p,q). For each symbol, see where p and q go. If that pair of targets is already marked, mark (p,q). Repeat until nothing new is marked.', 'The unmarked pairs are equivalent. Group them.', 'Each group becomes one state of the minimal DFA. Transitions go to the group of the old target. The start group contains the old start. A group is final if its members are final.'],
    example: () => h('div', {}, h('p', { class: 'small muted' }, 'May 2025 Q26. Press Next round and watch pairs get crossed out.'), minAnim(F.faToDfaObj(F.parseFA(byId(P.dfa, 'm25').text)))),
    exampleOld: () => { const p = byId(P.dfa, 'm25'), d = F.faToDfaObj(F.parseFA(p.text)), m = F.minimizeDFA(d), R = m.states;
      const pt = () => { const rows = []; for (let i = 1; i < R.length; i++) rows.push([R[i], ...R.slice(0, i).map(q => { const mk = m.marks.get(m.pk(R[i], q)); return mk ? String(mk.round) : '≡'; })]); return table(['', ...R.slice(0, R.length - 1)], rows, { cls: 'pairs' }); };
      return reveal([
        { t: 'The DFA (May 2025 Q26).', node: h('div', {}, dfaTable(d), P2(m.removed.length ? 'Unreachable: ' + m.removed.join(', ') + ' (removed).' : 'Every state is reachable.')) },
        { t: 'Round 0: mark pairs with one final and one non-final.', node: P2('Finals are ' + d.finals.join(', ') + '. Any pair that mixes a final and a non-final state gets marked 0.') },
        { t: 'Later rounds: mark a pair if a symbol sends it to a marked pair.', node: pre([...Array(m.rounds + 1).keys()].map(r => { const ps = [...m.marks.entries()].filter(([, v]) => v.round === r); return ps.length ? 'Round ' + r + ':\n' + ps.map(([k, v]) => '  (' + k.replace('|', ', ') + ')  ' + v.reason).join('\n') : ''; }).filter(Boolean).join('\n')) },
        { t: 'The finished table. Numbers are the round of marking, ≡ means equivalent.', node: pt() },
        { t: 'Groups and the minimal DFA.', node: h('div', {}, P2('Groups: ' + m.classes.map(fmtSet).join('  ') + '. ' + R.length + ' states reduce to ' + m.min.states.length + '.'), dfaTable(m.min), dfaGraph(m.min)) }]); },
    pitfalls: ['Forgetting to remove unreachable states first.', 'Comparing only the symbols and not the targets (you must look at where they go, and whether that pair is marked).', 'Merging two states that are both non-final but go to different groups.'],
    practice: [L => minGuide(L, 0, 'Find the equivalent states', 'Which states are equivalent? Type the groups in braces. Do the table on paper first.', MIN_PRACTICE),
      L => mcq(L, 1, 'The first round', 'In round 0 of table filling, which pairs do you mark?', ['Every pair of states', 'Pairs where exactly one state is final', 'Pairs where both states are final', 'Pairs that have a self-loop'], 1, 'One final and one non-final are already different, because the empty string separates them.')] },

  { id: 'mm', unit: 1, title: 'Mealy and Moore machines', time: '30 min',
    plain: 'These are DFAs that print output instead of accepting or rejecting. A Mealy machine prints on every arrow. A Moore machine prints in every state. A Mealy machine prints one output symbol per input symbol. A Moore machine prints one more, because the start state prints too.',
    method: ['To run a Mealy machine: for each input symbol follow the arrow and write the output written on it.', 'To run a Moore machine: write the start state output first, then each new state output after every move.', 'Mealy to Moore: split each Mealy state q into one Moore state for every different output that arrives at q. The start state gets an initial output (0 unless told otherwise). Then each Moore state prints its own output.', 'Moore to Mealy: on every arrow, the output is the output of the state the arrow goes to. The start output is dropped.'],
    example: () => { const p = byId(P.mealy, 'j1'), m = F.parseMealy(p.text), r = F.runMealy(m, p.test); return reveal([
      { t: 'A Mealy machine (Jul 2025 P1 Q4).', node: pre(p.text.replace(/^#.*\n/gm, '').trim()) },
      { t: 'Run it on ' + p.test + '.', node: table(['Step', 'From', 'Input', 'To', 'Output'], r.steps.map((s, i) => [i + 1, s.from, s.sym, s.to, s.out]), { monoCols: [1, 2, 3, 4] }) },
      { t: 'The output string.', node: P2(r.out + '. It has the same length as the input.') },
      { t: 'Convert to Moore.', node: (() => { const c = F.mealyToMoore(m, '0'); return h('div', {}, P2('Each state is split by the outputs arriving at it. Result: ' + c.moore.states.join(', ') + '.'), table(['State', 'Output', ...c.moore.alphabet.map(a => 'on ' + a)], c.moore.states.map(s => [s, c.moore.out[s], ...c.moore.alphabet.map(a => c.moore.delta[s][a] || '–')]), { monoCols: [0, 1, 2, 3] })); })() }]); },
    toy: () => runner(mealyAdapter(F.parseMealy(byId(P.mealy, 'j1').text)), byId(P.mealy, 'j1').test, ['0010', '1111', '0101'], 'Each arrow is labelled input/output. Watch the output tape fill as the dot moves.'),
    pitfalls: ['Giving a Mealy output with one extra symbol, or a Moore output without the start output.', 'Forgetting to split a state that has two different incoming outputs.'],
    practice: [L => ask(L, 0, 'Run a Mealy machine', 'This Mealy machine flips every bit.\n' + MEALY_PRACTICE.replace(/\n/g, '   ') + '\nWhat is the output for 0110?', t => ({ ok: t === F.runMealy(F.parseMealy(MEALY_PRACTICE), '0110').out, msg: 'Each 0 prints 1 and each 1 prints 0, giving ' + F.runMealy(F.parseMealy(MEALY_PRACTICE), '0110').out + '.' }), 'Print the opposite of each symbol.', null, 'output'),
      L => mcq(L, 1, 'Output length', 'A Moore machine reads an input of length 5. How long is its output string?', ['4', '5', '6', 'It depends on the state'], 2, 'The start state prints once before any input, then 5 more states print, so 6 symbols.')] },

  { id: 'simp', unit: 2, title: 'Context-free grammars: simplify', time: '60 min',
    plain: 'A grammar is a set of rules for building strings. Each rule replaces a variable by a string of variables and terminals. S is the start variable. Simplifying removes rules that are wasted: rules that produce nothing (ε), rules that just rename (A → B), and symbols that never take part. Always do it in this order, because each step can create work for the next one.',
    method: ['ε-removal. Find the nullable variables: A is nullable if A → ε, or A → a string made only of nullable variables. For every rule, write every version with any subset of nullable variables deleted. Then drop all ε rules. (If ε is in the language, you may add S → ε back at the end.)', 'Unit removal. A unit rule is A → B with one variable on the right. For each variable A, find every B reachable by unit rules. Give A all the non-unit rules of every such B. Delete the unit rules.', 'Useless symbols. First delete variables that cannot generate any terminal string. Then delete variables that cannot be reached from S. Do them in that order.'],
    example: () => { const g = F.parseGrammar('S -> AB | a\nA -> aA | ε\nB -> b | A'), r = F.simplify(g, false); return reveal([
      { t: 'The grammar.', node: gtext(g) },
      ...r.log.map(l => ({ t: l.title, node: h('div', {}, P2(l.note), gtext(l.g)) })),
      { t: 'The answer.', node: P2('The last grammar is the answer. Each step is shown in the exam, so show all three.') }]); },
    toy: () => derivAnim(F.parseGrammar('S -> aSb | ab'), 'aaabbb', ['ab', 'aabb', 'aaaabbbb']),
    pitfalls: ['Doing unit removal before ε removal (ε removal can create new unit rules).', 'Forgetting a rule when a rule has two nullable variables: write all four versions.', 'Removing unreachable variables before non-generating ones.'],
    practice: [L => gramSteps(L, 0, 'Simplify step by step', 'Simplify this grammar. Do each step and check it before moving on.', 'S -> ASB | ε\nA -> aAS | a\nB -> SbS | A | bb'),
      L => gramSteps(L, 1, 'One with useless symbols', 'Simplify this grammar (Step 1 has nothing nullable, so just copy it).', 'S -> aA | B\nA -> aA | a\nB -> bB\nC -> c')] },

  { id: 'nf', unit: 2, title: 'Chomsky and Greibach normal forms', time: '75 min',
    plain: 'Normal forms are grammars with a very strict shape. Chomsky normal form (CNF): every rule is A → BC or A → a. Greibach normal form (GNF): every rule is A → a followed by variables. These are the favourite 15-mark questions. Both start with simplification.',
    method: ['CNF step 1: simplify (ε, unit, useless).', 'CNF step 2: in every rule longer than one symbol, replace each terminal a by a new variable Cₐ and add Cₐ → a.', 'CNF step 3: break every rule with three or more variables A → B1B2B3…Bk into A → B1D1, D1 → B2D2, …, ending with a rule of two variables.', 'GNF step 1: simplify, and get to CNF. Number the variables A1, A2, …, An with S as A1.', 'GNF step 2: make every rule Ai → Aj… have j > i. If j < i, replace Aj by its rules (substitute). If j = i it is left recursion: Ai → Ai α | β becomes Ai → β | βZi and Zi → α | αZi, where Zi is a new variable.', 'GNF step 3: now An starts with a terminal. Work upward from An−1 to A1, substituting the first variable of each rule by its rules until every rule starts with a terminal.', 'GNF step 4: do the same for the new Z variables.'],
    example: () => { const g = F.parseGrammar('S -> AA | a\nA -> SS | b'), gn = F.toGNF(g);
      const cn = F.toCNF(F.simplify(F.parseGrammar('S -> aSb | ab'), true).g);
      return reveal([
        { t: 'CNF example: S → aSb | ab.', node: P2('Terminals inside longer rules are replaced. Rules longer than two symbols are split.') },
        { t: 'The CNF result.', node: gtext(cn) },
        { t: 'GNF example (a paper question): S → AA | a, A → SS | b.', node: gtext(g) },
        ...gn.log.map(l => ({ t: l.title, node: h('div', {}, l.note ? P2(l.note) : null, gtext(l.g)) })),
        { t: 'The GNF answer.', node: gtext(gn.g) }]); },
    toy: () => h('div', {}, h('p', { class: 'small muted' }, 'This is the CNF of S → aSb | ab. Play it: every node has exactly two variable children or one terminal child. That is what CNF means.'), derivAnim(F.toCNF(F.simplify(F.parseGrammar('S -> aSb | ab'), true).g), 'aabb', ['ab', 'aaabbb'])),
    pitfalls: ['Splitting a terminal inside a rule like A → aB: in CNF this becomes A → CₐB.', 'Skipping the substitution order in GNF. Always go from the highest-numbered variable down.', 'Using multi-letter variable names. In the checkers below use single capital letters like X, Y, P, Q, R.'],
    practice: [L => normalForm(L, 0, 'Convert to CNF', 'Convert to Chomsky normal form. Use single capital letters for new variables.', 'S -> aAB | b\nA -> aA | a\nB -> bB | b', 'cnf', 'Nothing here is nullable or a unit rule, so go straight to replacing terminals and splitting. New variables: use X, Y, P, Q.', 'S -> XD | b\nA -> XA | a\nB -> YB | b\nX -> a\nY -> b\nD -> AB'),
      L => normalForm(L, 1, 'Convert to GNF', 'Convert this grammar to Greibach normal form.', 'S -> AB\nA -> aA | a\nB -> bB | b', 'gnf', 'S → AB: replace A by its two rules. Then A and B are already in GNF.'),
      L => normalForm(L, 2, 'GNF from a paper', 'May 2025 Q22b style: convert to GNF.', 'S -> AA | a\nA -> SS | b', 'gnf', 'Order S=A1, A=A2. A → SS needs substitution of S.')] },

  { id: 'pda', unit: 3, title: 'Pushdown automata', time: '60 min',
    plain: 'A PDA is a finite automaton with a stack, like a pile of plates. You can push a symbol on top, look at the top, or pop it. The stack gives the machine memory, so it can count: it can match aⁿbⁿ, which a DFA cannot.',
    method: ['Think of the idea in plain words first: "push for every a, pop for every b".', 'One move reads: state, input symbol (or ε), top of stack → new state, string to push in place of the top.', 'Pushing aZ0 puts a on top of Z0. Popping means replacing the top by ε.', 'Z0 is the bottom marker. When the input is finished and Z0 is back on top, move to the final state.', 'Always trace one accepted string and one rejected string.', 'For a CFG: use one state. For each rule A → α, add (ε, A) → α. For each terminal a, add (a, a) → ε. Start by pushing S.'],
    example: () => h('div', {}, pre(byId(P.pda, 'anbn').text.trim()), pdaAnim(F.parsePDA(byId(P.pda, 'anbn').text), 'aaabbb', ['ab', 'aabb', 'aab', 'abb'])),
    exampleOld: () => { const p = byId(P.pda, 'anbn'), pda = F.parsePDA(p.text); return reveal([
      { t: 'Idea for aⁿbⁿ.', node: P2('Push an a for every a. Then pop an a for every b. If we reach the bottom marker exactly when the input ends, accept.') },
      { t: 'The moves.', node: pre(p.text.trim()) },
      { t: 'Trace of aabb.', node: pdaTrace(pda, 'aabb') },
      { t: 'Trace of aab (it is rejected).', node: pdaTrace(pda, 'aab') }]); },
    toy: () => h('div', {}, h('p', { class: 'small muted' }, 'Equal number of a and b (Jul 2025, Nov 2025). Watch the stack: it holds the surplus letters.'), pdaAnim(F.parsePDA(byId(P.pda, 'eq').text), 'abba', ['aabb', 'baab', 'abab', 'aab'])),
    pitfalls: ['Writing the stack in the wrong order. Write top first.', 'Forgetting that pop means replace by ε.', 'No move for some situation, so the machine gets stuck and rejects.'],
    practice: [L => pdaPredict(L, 0, 'Stack contents', 'Look at the trace. Type the stack (top first) after the first two a\'s have been read.', 'anbn', 'aabb', 2),
      L => mcq(L, 1, 'When do we accept', 'In the aⁿbⁿ PDA, when does the machine accept?', ['When the stack is empty and the input is not finished', 'When the input is finished and the stack is back to Z0', 'When it has read at least one a', 'When it has pushed more than it popped'], 1, 'The count matches exactly when the stack is back at the bottom marker as the input ends.'),
      L => mcq(L, 2, 'CFG to PDA', 'In the CFG to PDA construction, what is done for a terminal a?', ['Push a', 'Add a move that reads a when a is on top and pops it', 'Replace a by S', 'Nothing'], 1, 'For each terminal a add δ(q, a, a) = (q, ε). It matches the input symbol against the stack.')] },

  { id: 'tm', unit: 4, title: 'Turing machines', time: '75 min',
    plain: 'A Turing machine has an infinite tape, a head, and states. In one move it reads the symbol under the head, writes a new one, moves left or right, and changes state. It halts when it reaches a halting state. The design is always the same trick: mark symbols you have matched, so you never match one twice.',
    method: ['Say the plan in words. For aⁿbⁿcⁿ: mark an a with X, find a b and mark it Y, find a c and mark it Z, come back, repeat.', 'Give each phase a state: one state to find the next unmarked a, one to move right looking for b, one to find c, one to return left.', 'Write the transition table: current state, symbol read → new state, symbol written, move.', 'For every state, ask: "what symbols can I see here?" and add a move for each, or let it halt and reject.', 'Add the accept: when no unmarked symbol is left and only markers remain, go to the accept state.', 'In the exam, trace the exact sample input with instantaneous descriptions, like  q0aabb ⊢ Xq1abb ⊢ … .'],
    example: () => { const p = byId(P.tm, 'zn1n'); return reveal([
      { t: 'Plan for 0ⁿ1ⁿ.', node: P2('Cross out the leftmost 0 (write X). Move right to the first 1 and cross it out (write Y). Move back left to the next 0. Repeat. When no 0 is left, check that no 1 is left too.') },
      { t: 'The transition table.', node: pre(p.text.replace(/^#.*\n/gm, '').trim()) },
      { t: 'Step through it on ' + p.tests[0] + '.', node: tmPlayer(p, p.tests[0]) }]); },
    pitfalls: ['Forgetting a state to walk back to the left end.', 'Writing moves without saying what happens on the blank B.', 'Not tracing the sample input the question gave you.'],
    practice: [L => tmPredict(L, 0, 'Predict the tape', 'Use the player to follow the machine for 0ⁿ1ⁿ on 0011. What are the state and the tape after step 4? (Write the tape without blanks.)', 'zn1n', '0011', 4),
      L => tmPredict(L, 1, 'Predict again', 'Now the aⁿbⁿcⁿ machine on aabbcc. What are the state and tape after step 7?', 'anbncn', 'aabbcc', 7),
      L => mcq(L, 2, 'The method', 'Why do Turing machines for aⁿbⁿcⁿ write X, Y, Z on the tape?', ['To make the tape longer', 'To mark symbols that are already matched', 'To show the machine halted', 'To reset the state'], 1, 'Marking matched symbols means each a, b, c is used exactly once.')] },

  { id: 'undec', unit: 5, title: 'PCP and the undecidability proofs', time: '45 min',
    plain: 'The Post Correspondence Problem gives you tiles with a top string and a bottom string. You can reuse tiles. Find a sequence where the top row and the bottom row spell the same string. It has no general algorithm, which makes it undecidable. The theory questions are short fixed proofs that you memorise.',
    method: ['PCP: pick a tile whose top and bottom agree at the start (or tile 1 for MPCP).', 'Track the overhang: the part by which one row is longer.', 'Pick the next tile so the longer row stays consistent with the shorter row. If nothing continues it, backtrack.', 'If every tile has a longer top than bottom (or the other way), there is no solution.', 'Theory: memorise the one-line statements below. Then read the proofs in the Revision tab.'],
    example: () => { const tiles = byId(P.pcp, 'j2').tiles, sol = F.solvePCP(tiles); let T = '', B = ''; const rows = sol.seq.map((i, k) => { T += tiles[i - 1][0]; B += tiles[i - 1][1]; return [k + 1, i, tiles[i - 1][0], tiles[i - 1][1], T, B]; });
      return reveal([{ t: 'The tiles (Jul 2025 paper 2).', node: table(['Tile', 'Top', 'Bottom'], tiles.map((t, i) => [i + 1, t[0], t[1]]), { monoCols: [1, 2] }) },
        { t: 'Build the answer one tile at a time.', node: table(['Step', 'Tile', 'Top adds', 'Bottom adds', 'Top so far', 'Bottom so far'], rows, { monoCols: [2, 3, 4, 5] }) },
        { t: 'Result.', node: P2('Sequence ' + sol.seq.join(', ') + ' spells ' + sol.top + ' on both rows.') }]); },
    pitfalls: ['Getting a wrong tile number from the question. Number them in the order given.', 'Stopping when the rows are not equal: they must be exactly equal and non-empty.'],
    practice: [L => pcpGame(L, 0, 'Domino game: solve the PCP', 'Click dominoes to lay them left to right. Green letters match, red ones clash. Make top and bottom spell the same string.', byId(P.pcp, 'j2').tiles, false),
      L => pcpGame(L, 3, 'Harder: Jul 2025 P1 Q26', 'This instance came up in a paper. Use the hint if you get stuck.', byId(P.pcp, 'j1').tiles, false),
      L => mcq(L, 1, 'Rice\'s theorem', 'Rice\'s theorem says…', ['Every property of a Turing machine is decidable', 'Every non-trivial property of the language of a Turing machine is undecidable', 'The halting problem is decidable', 'All languages are context free'], 1, 'Non-trivial means some machines have it and some do not. All such properties of L(M) are undecidable.'),
      L => mcq(L, 2, 'Halting', 'The halting problem is…', ['Decidable', 'Undecidable but recursively enumerable', 'Not recursively enumerable', 'Context free'], 1, 'We can run M on w and say yes if it halts, so it is recursively enumerable, but no machine can always say no.')] },

  { id: 'quiz', unit: 0, title: 'Part A drill', time: '45 min', link: 'quiz', plain: 'Do the 54 real MCQs. Redo the ones you got wrong. Four marks per unit in every paper.', method: [], practice: [], example: null, pitfalls: [] }
];

/* ---------- course views ---------- */
function lessonProgress(L) { return L.practice.length ? doneCount(L) + ' of ' + L.practice.length + ' problems' : ''; }
function viewHome() {
  const root = h('div', { class: 'view' });
  const total = LESSONS.reduce((a, l) => a + l.practice.length, 0), done = LESSONS.reduce((a, l) => a + doneCount(l), 0);
  root.append(h('section', { class: 'hero' }, h('div', { class: 'eyebrow' }, 'FLA · 21CSC301T'), h('h1', {}, 'Learn it. Then prove it.'),
    h('p', { class: 'lede' }, 'Do the lessons in order. Each one explains the idea in plain words, gives you the method, walks through one example step by step, and then asks you to solve problems. The page checks your answer.'),
    h('div', { class: 'progress', role: 'progressbar', 'aria-label': 'Problems solved' }, h('i', { style: 'width:' + Math.round(100 * done / total) + '%' })), h('div', { class: 'small' }, h('b', {}, done + ' of ' + total + ' problems solved'), '  ·  ⚡ ' + xpGet() + ' XP · level ' + (Math.floor(xpGet() / 50) + 1) + '  ·  every solved problem is +20 XP')));
  root.append(h('div', { class: 'lessons' }, LESSONS.map((L, i) => h('a', { class: 'lcard' + (L.practice.length && doneCount(L) === L.practice.length ? ' fin' : ''), href: '#' + (L.link || 'learn/' + L.id) },
    h('span', { class: 'ln' }, String(i + 1)), h('div', { class: 'lb' }, h('b', {}, L.title), h('span', { class: 'small muted' }, (L.unit ? 'Unit ' + L.unit + ' · ' : 'All units · ') + L.time + (L.practice.length ? ' · ' + lessonProgress(L) : ''))), h('span', { class: 'go', 'aria-hidden': 'true' }, '→')))));
  root.append(h('section', { class: 'note' }, h('b', {}, 'Stuck? '), 'Every problem has a "Show the answer" fold. Look only after you have tried on paper. If a lesson does not make sense, tell me which step and I will explain it differently.'));
  root.append(h('p', { class: 'small muted' }, 'The other tabs: Exam map shows what each past paper asked. Revision has answer skeletons and theory notes. Sandbox holds free-form tools.'));
  return root;
}
function viewLesson(id) {
  const i = LESSONS.findIndex(l => l.id === id), L = LESSONS[i]; if (!L) return viewHome();
  const root = h('div', { class: 'view' });
  root.append(h('a', { href: '#start', class: 'small' }, '← All lessons'));
  root.append(h('section', { class: 'hero' }, h('div', { class: 'eyebrow' }, 'Lesson ' + (i + 1) + ' of ' + LESSONS.length + ' · Unit ' + L.unit + ' · ' + L.time), h('h1', {}, L.title)));
  root.append(h('section', { class: 'card' }, h('h2', {}, '1. The idea'), h('p', { class: 'big' }, L.plain)));
  if (L.toy) root.append(h('section', { class: 'card toy' }, h('h2', {}, '🎮 Play with it first'), L.toy()));
  root.append(h('section', { class: 'card' }, h('h2', {}, '2. The method'), h('ol', { class: 'method' }, L.method.map(m => h('li', {}, m)))));
  root.append(h('section', { class: 'card' }, h('h2', {}, '3. Watch one example'), L.example()));
  if (L.pitfalls.length) root.append(h('section', { class: 'note' }, h('b', {}, 'Where marks are lost. '), h('ul', {}, L.pitfalls.map(x => h('li', {}, x)))));
  root.append(h('h2', { style: 'margin-top:8px' }, '4. Now you try'));
  L.practice.forEach(f => root.append(f(L)));
  const nxt = LESSONS[i + 1];
  root.append(h('div', { class: 'row' }, nxt ? h('a', { class: 'btn primary', href: '#' + (nxt.link || 'learn/' + nxt.id) }, 'Next lesson: ' + nxt.title + ' →') : null, h('a', { class: 'btn', href: '#start' }, 'All lessons')));
  return root;
}
