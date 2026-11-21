const F = require('./engine.js'), P = require('./presets.js');
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } };
const strings = (alpha, n) => { let out = ['']; let cur = ['']; for (let i = 0; i < n; i++) { cur = [].concat(...cur.map(s => [...alpha].map(c => s + c))); out = out.concat(cur); } return out; };

// NFA -> DFA
for (const p of P.nfa) {
  const fa = F.parseFA(p.text), r = F.nfaToDfa(fa);
  for (const s of strings(fa.alphabet.join(''), 7)) ok(F.runNFA(fa, s).accepted === F.runDFA(r.dfa, s).accepted, 'nfa->dfa ' + p.id + ' on "' + s + '"');
  console.log('NFA', p.id, '-> DFA states', r.dfa.states.length, p.tests.map(t => t + ':' + F.runNFA(fa, t).accepted).join(' '));
}
// minimize
for (const p of P.dfa) {
  const d = F.faToDfaObj(F.parseFA(p.text)); const m = F.minimizeDFA(d);
  for (const s of strings(d.alphabet.join(''), 7)) ok(F.runDFA(d, s).accepted === F.runDFA(m.min, s).accepted, 'min ' + p.id + ' "' + s + '"');
  console.log('DFA', p.id, d.states.length, '->', m.min.states.length, m.min.states.join(' '));
}
// minimize after subset construction
{ const fa = F.parseFA(P.nfa[0].text); const m = F.minimizeDFA(F.nfaToDfa(fa).dfa); console.log('second-last-1 minimal DFA states', m.min.states.length); ok(m.min.states.length === 4, 'second-last-1 min=4'); }
// Mealy / Moore
{
  const me = F.parseMealy(P.mealy[0].text); const r = F.runMealy(me, '0010'); console.log('Mealy 0010 ->', r.out); ok(r.out === '0101', 'mealy out');
  for (const io of ['0', '1']) {
    const { moore } = F.mealyToMoore(me, io);
    for (const s of strings('01', 6)) { const a = F.runMealy(me, s).out, b = F.runMoore(moore, s).out; ok(b === io + a, 'mealy->moore ' + s + ' ' + a + ' ' + b); }
    const back = F.mooreToMealy(moore);
    for (const s of strings('01', 6)) ok(F.runMealy(back, s).out === F.runMealy(me, s).out, 'moore->mealy');
  }
  const mo = F.parseMoore(P.moore[0].text); console.log('Moore aabab ->', F.runMoore(mo, 'aabab').out, ' ababb ->', F.runMoore(mo, 'ababb').out);
  const mo2 = F.parseMoore(P.moore[1].text); console.log('Moore 1011010 ->', F.runMoore(mo2, '1011010').out);
}
// grammars
for (const p of P.grammar) {
  const g = F.parseGrammar(p.text);
  const s = F.simplify(g, false);
  const c = F.toCNF(F.simplify(g, true).g);
  const gnf = F.toGNF(s.g);
  const isGNF = Object.values(gnf.g.P).every(rs => rs.every(r => r.length && !F.isNT(r[0]) && r.slice(1).every(F.isNT)));
  ok(isGNF, 'GNF shape ' + p.id);
  const isCNF = Object.values(c.P).every(rs => rs.every(r => r.length === 0 || (r.length === 1 && !F.isNT(r[0])) || (r.length === 2 && r.every(F.isNT))));
  ok(isCNF, 'CNF shape ' + p.id);
  if (!p.words) {
    const alpha = p.alphabet; const L = F.enumLanguage(g, 6, p.id === 'j1' ? 14 : 6, 2000000);
    for (const w of strings(alpha, 6)) { if (w === '') continue; const inL = L.has(w); ok(F.gnfAccepts(gnf.g, [...w]) === inL, 'GNF lang ' + p.id + ' "' + w + '" expected ' + inL); ok(F.cykAccepts(g, [...w]) === inL, 'CYK lang ' + p.id + ' "' + w + '" expected ' + inL); }
    console.log('Grammar', p.id, 'L size(<=6)', L.size, 'GNF rules', Object.values(gnf.g.P).reduce((a, r) => a + r.length, 0));
  } else {
    const d = F.derive(g, p.words); ok(d, 'derive ' + p.id);
    if (d) { console.log('derive', p.id, d.rules.length, 'steps'); const t = F.buildTree(g, d.rules, g.start); if (p.id === 'n24') console.log(F.treeText(t)); }
    const w = F.tokInput(p.words); ok(F.gnfAccepts(gnf.g, w), 'GNF accepts words ' + p.id);
  }
}
// ambiguity
for (const p of P.ambig) { const g = F.parseGrammar(p.text); const w = F.findAmbiguity(g, 6); console.log('Ambiguity', p.id, w ? (w.timedOut ? 'timeout' : 'AMBIGUOUS e.g. ' + w.string) : 'none found'); }
ok(!F.findAmbiguity(F.parseGrammar(P.ambig.find(x=>x.id==='unamb').text), 6), 'unambiguous control');
ok(F.findAmbiguity(F.parseGrammar(P.ambig[0].text), 6), 'N25 grammar ambiguous');
// PDA
for (const p of P.pda) {
  const pda = F.parsePDA(p.text);
  console.log('PDA', p.id, p.tests.map(t => t + ':' + F.simulatePDA(pda, t).accepted).join(' '));
}
{
  const exp = { eq: { baab: 1, abba: 1, aab: 0, '': 1 }, abcd: { aabbcd: 1, abcd: 1, aabbccdd: 1, aabcd: 0 }, mnbc: { aabc: 1, aab: 0, abc: 0, aaabbc: 1, '': 1 } };
  for (const id in exp) { const pda = F.parsePDA(P.pda.find(x => x.id === id).text); for (const w in exp[id]) ok(F.simulatePDA(pda, w).accepted === !!exp[id][w], 'pda ' + id + ' ' + w); }
  // brute-force check of a^(m+n) b^m c^n
  const pda = F.parsePDA(P.pda.find(x => x.id === 'mnbc').text);
  for (const w of strings('abc', 7)) { const m = w.match(/^(a*)(b*)(c*)$/); const truth = !!m && m[1].length === m[2].length + m[3].length; ok(F.simulatePDA(pda, w).accepted === truth, 'mnbc brute ' + w); }
  const pe = F.parsePDA(P.pda.find(x => x.id === 'eq').text);
  for (const w of strings('ab', 8)) ok(F.simulatePDA(pe, w).accepted === (w.split('a').length === w.split('b').length), 'eq brute ' + w);
}
for (const p of P.cfg2pda) {
  const g = F.parseGrammar(p.text), pda = F.cfgToPDA(g);
  console.log('CFG->PDA', p.id, p.tests.map(t => t + ':' + F.simulatePDA(pda, t).accepted + '/cyk' + F.cykAccepts(g, [...t])).join(' '));
  for (const t of p.tests) ok(F.simulatePDA(pda, t).accepted === F.cykAccepts(g, [...t]), 'cfg2pda vs cyk ' + p.id + ' ' + t);
}
// TM
const tmx = {
  anbncn: s => /^(a+)(b+)(c+)$/.test(s) && (m => m[1].length === m[2].length && m[2].length === m[3].length)(s.match(/^(a+)(b+)(c+)$/)),
  zn1n: s => /^(0+)(1+)$/.test(s) && (m => m[1].length === m[2].length)(s.match(/^(0+)(1+)$/)),
  wwr: s => s.length % 2 === 0 && s === [...s].reverse().join(''),
  endb: s => s.endsWith('b')
};
for (const id in tmx) {
  const tm = F.parseTM(P.tm.find(x => x.id === id).text); const alpha = id === 'anbncn' ? 'abc' : id === 'zn1n' ? '01' : 'ab';
  for (const s of strings(alpha, id === 'anbncn' ? 8 : 9)) { if (s === '' ) continue; ok((F.runTM(tm, s).status === 'accepted') === !!tmx[id](s), 'tm ' + id + ' "' + s + '"'); }
}
const tr = (id, s) => F.runTM(F.parseTM(P.tm.find(x => x.id === id).text), s);
for (let m = 1; m <= 5; m++) for (let n = 1; n <= 5; n++) {
  const inp = '1'.repeat(m) + '0' + '1'.repeat(n);
  const a = tr('add', inp); ok(a.status === 'accepted' && a.output === '1'.repeat(m + n), 'add ' + m + '+' + n + ' got ' + a.output);
  const s = tr('sub', inp); ok(s.status === 'accepted' && s.output === '1'.repeat(Math.max(0, m - n)), 'sub ' + m + '-' + n + ' got ' + s.output + ' ' + s.status);
  const x = tr('mul', inp); ok(x.status === 'accepted' && x.output === '1'.repeat(m * n), 'mul ' + m + '*' + n + ' got ' + x.output.length + ' ' + x.status);
}
for (const s of strings('01', 6)) { const r = tr('copy', s); ok(r.status === 'accepted' && r.output === s + s, 'copy "' + s + '" got ' + r.output); }
console.log('TM mul 2x3 steps', tr('mul', '110111').steps);
// PCP
for (const p of P.pcp) { const r = F.solvePCP(p.tiles); const rm = F.solvePCP(p.tiles, { mpcp: true }); console.log('PCP', p.id, r.found ? 'sol ' + r.seq.join(',') + ' ' + r.top : 'none(explored ' + r.explored + ')', '| MPCP', rm.found ? rm.seq.join(',') + ' ' + rm.top : 'none'); }
{ const r = F.solvePCP(P.pcp[0].tiles); ok(r.found && r.top === r.bottom && r.seq.join() === '2,1,1,3', 'pcp j2 sol'); }
console.log(fails ? fails + ' FAILURES' : 'ALL TESTS PASSED');
