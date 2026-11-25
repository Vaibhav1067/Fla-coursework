const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const P=D.papers, UN=D.units;
const UNAME={1:'Unit 1',2:'Unit 2',3:'Unit 3',4:'Unit 4',5:'Unit 5'};
const USHORT={1:'Finite automata and regular expressions',2:'Grammars (CFG, normal forms)',3:'Pushdown automata',4:'Turing machines',5:'Undecidability and complexity'};
const PORDER=['N24','M25','J1','J2','N25','M26'];
const PLONG={N24:'Nov 2024',M25:'May 2025',J1:'Jul 2025 (Paper 1)',J2:'Jul 2025 (Paper 2)',N25:'Nov 2025',M26:'May 2026'};
const PSHORT={N24:'Nov 24',M25:'May 25',J1:'Jul 25 P1',J2:'Jul 25 P2',N25:'Nov 25',M26:'May 26'};
const store={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const tier=n=>n>=5?{k:'must',l:'Must-do'}:n>=4?{k:'high',l:'High'}:n>=3?{k:'med',l:'Medium'}:{k:'bonus',l:'Bonus'};
const T=D.topics.map((t,i)=>({...t,id:i,count:t.hits.filter(Boolean).length}));
T.forEach(t=>{t.tr=tier(t.count)});
const codeLabel=c=>c.split('·').map(x=>{const m=x.match(/^(\d\d)([ab])?(¹⁵)?$/);if(!m)return x;return m[3]?'Q'+m[1]+' (15 marks)':'Q'+m[1]+m[2]}).join(' + ');
const hasCode=(h,code)=>!!h&&h.split('·').includes(code);
// Part B slots: 5 units x 6 papers. A slot is answerable if any topic in the set hits either option.
function slotTopics(u,pi){const a=[],b=[];T.filter(t=>t.unit===u).forEach(t=>{const h=t.hits[pi];if(hasCode(h,'2'+u+'a'))a.push(t.id);if(hasCode(h,'2'+u+'b'))b.push(t.id)});return{a,b}}
function coverage(set){let ok=0,tot=0;const per={};for(let u=1;u<=5;u++){per[u]=0;for(let pi=0;pi<6;pi++){tot++;const s=slotTopics(u,pi);if([...s.a,...s.b].some(id=>set.has(id))){ok++;per[u]++}}}
 let c=0;for(let pi=0;pi<6;pi++){const ids=T.filter(t=>hasCode(t.hits[pi],'26¹⁵')||hasCode(t.hits[pi],'27¹⁵')).map(t=>t.id);if(ids.some(id=>set.has(id)))c++}
 return{ok,tot,per,c}}
const SETS={must:new Set(T.filter(t=>t.count>=5).map(t=>t.id)),high:new Set(T.filter(t=>t.count>=4).map(t=>t.id)),med:new Set(T.filter(t=>t.count>=3).map(t=>t.id)),all:new Set(T.map(t=>t.id))};
const TPL={0:[0],1:[1],2:[2],3:[5,6],4:[7],5:[11],6:[12],7:[14,15,16,17],8:[19]};
const TRAPS={0:['Start the DFA from the ε-closure of q0, not just q0.','Keep ∅ as a dead state if some subset moves nowhere.','A DFA subset is final if it holds any NFA final state.'],
1:['Moore output is one symbol longer than the input (the start state prints too).','Mealy to Moore: a state that is reached with two different outputs must be split in two.'],
2:['Delete unreachable states before you start the table.','Never merge a final state with a non-final state.'],
3:['Rebuild any DFA from the transition table and test two strings.','For RE to DFA, build the NFA first, then convert.'],
4:['Pumping lemma: pick the string first, then say what x, y, z can look like, then pick i.'],
5:['Order matters: ε-productions first, then unit productions, then useless symbols.','Remove non-generating symbols before unreachable ones.'],
6:['Do ε and unit removal first, then replace terminals inside long rules with new variables, then break long rules into pairs.'],
7:['Remove left recursion first. Rename variables A1, A2, … and fix the order.','Every final rule must begin with exactly one terminal.'],
8:['One string with two different parse trees (or two leftmost derivations) proves ambiguity. Draw both.'],
11:['Say whether you accept by empty stack or by final state, and stay with it.','Add a trace of one accepted string. It earns the last marks.','Check the language is really context-free before you try. aⁿbⁿc²ⁿ is not.'],
12:['The recipe is fixed: (q, ε, A) → (q, α) for each rule, and (q, a, a) → (q, ε) for each terminal.','Write the trace as a column of configurations.'],
13:['Triplet variables [p X q]. Count the rules carefully and drop the useless ones at the end.'],
14:['Always draw the transition table, mark the blank as B, and run one short string through it.'],
15:['Unary numbers use 1s. Mark the symbol you are working on with a new symbol, then restore it at the end.'],
16:['Match the first symbol with the last, cross both off, go in. For ww, find the middle first.'],
19:['Check lengths first. If every top string is longer than its bottom string, there is no solution. Say so in one sentence.','For MPCP the sequence must start with tile 1.'],
21:['Rice: the property must be non-trivial, and it must be about the language, not about the machine.']};
const PCHEAD=[['26','Q26'],['27','Q27']];
// Part C data: which topics hit Q26/Q27 per paper
function partCFor(pi){return T.filter(t=>hasCode(t.hits[pi],'26¹⁵')||hasCode(t.hits[pi],'27¹⁵'))}
// MCQ build
const MCQ=[];PORDER.forEach(p=>MCQ_RAW[p].forEach((r,i)=>MCQ.push({p,q:i+1,u:Math.ceil((i+1)/4),text:r[0],o:r[1],a:r[2],why:r[3],flag:r[4]||'',id:p+'-'+(i+1)})));

const QTXT=(pi,code)=>{const p=PORDER[pi]; if(!code)return ''; const m=code.match(/^(\d\d)([ab])?(¹⁵)?$/); if(!m)return ''; if(m[3]){const pc=PARTC.find(x=>x.p===p);return pc?pc.q[m[1]==='26'?0:1]:''} const u=+m[1][1]; return SLOTS[u][p][m[2]==='a'?0:1]};
const ptr=id=>P.findIndex(x=>x.id===id);
// ------- router
const TABS=[['overview','Overview'],['u1','Unit 1'],['u2','Unit 2'],['u3','Unit 3'],['u4','Unit 4'],['u5','Unit 5'],['partc','Part C'],['parta','Part A'],['mcq','MCQ bank'],['plan','Study plan']];
function nav(){return '<nav class="tabs" id="tabs">'+TABS.map(([k,l])=>`<a href="#${k}" data-k="${k}">${l}</a>`).join('')+'</nav>'}
const app=$('#app');
function route(){const k=(location.hash||'#overview').slice(1);const f={overview:vOverview,u1:()=>vUnit(1),u2:()=>vUnit(2),u3:()=>vUnit(3),u4:()=>vUnit(4),u5:()=>vUnit(5),partc:vPartC,parta:vPartA,mcq:vMcq,plan:vPlan}[k]||vOverview;
 $('#view').innerHTML='';f();$$('#tabs a').forEach(a=>a.classList.toggle('on',a.dataset.k===k));window.scrollTo(0,0);const on=$('#tabs a.on');if(on)on.scrollIntoView({block:'nearest',inline:'center'});}
// ------- tooltip
const tip=document.createElement('div');tip.id='tip';document.body.appendChild(tip);
function showTip(el,x,y){tip.innerHTML=el.dataset.tip;tip.style.display='block';const w=tip.offsetWidth,h=tip.offsetHeight;tip.style.left=Math.max(8,Math.min(innerWidth-w-8,x-w/2))+'px';tip.style.top=(y-h-12<8?y+18:y-h-12)+'px'}
document.addEventListener('mouseover',e=>{const el=e.target.closest('[data-tip]');if(el){const r=el.getBoundingClientRect();showTip(el,r.left+r.width/2,r.top+scrollY-scrollY)}});
document.addEventListener('mouseout',e=>{if(e.target.closest('[data-tip]'))tip.style.display='none'});
document.addEventListener('click',e=>{const el=e.target.closest('[data-tip]');if(el&&matchMedia('(hover:none)').matches){const r=el.getBoundingClientRect();showTip(el,r.left+r.width/2,r.top);clearTimeout(tip._t);tip._t=setTimeout(()=>tip.style.display='none',3500)}else if(!el)tip.style.display='none'});
// ------- shared bits
const chip=t=>`<span class="chip ${t.tr.k}">${t.tr.l}</span>`;
function dots(t){return '<span class="dots">'+PORDER.map(p=>{const pi=P.findIndex(x=>x.id===p);const h=t.hits[pi];return `<i class="${h?'on':''}" title="${PSHORT[p]}${h?': '+codeLabel(h):''}"></i>`}).join('')+'</span>'}
function covBar(label,v,tot,cls){const pc=Math.round(v/tot*100);return `<div class="cov"><div class="cl"><span>${label}</span><b>${pc}%</b> <small>${v} of ${tot}</small></div><div class="bar"><div class="fill ${cls}" style="width:${pc}%"></div></div></div>`}
// ------- OVERVIEW
function vOverview(){
 const n1=T.filter(t=>t.count>=5).length,n2=T.filter(t=>t.count>=3&&t.count<5).length;
 const cm=coverage(SETS.must),ch=coverage(SETS.high),cmd=coverage(SETS.med);
 const reps=REPEATS;
 let h=`<section class="hero"><h2>The short version</h2><ul class="big">
 <li><b>Same shape every time.</b> Part A is 20 MCQs, exactly 4 per unit. Part B is one 8-mark question per unit, each with an OR. Part C is one 15-mark question out of two.</li>
 <li><b>${n1} topics came up in 5 or 6 of the 6 papers.</b> Learn those first. They alone can answer ${cm.ok} of the ${cm.tot} Part B slots.</li>
 <li><b>Add the next ${n2} topics</b> (asked in 3 or 4 papers) and ${cmd.ok} of ${cmd.tot} slots are covered. Each slot has two options, so you only need one of them.</li>
 <li><b>Questions repeat.</b> ${reps.length} questions came back almost word for word, and the Part A bank (${MCQ.length} questions) has the same MCQ appearing in several papers.</li>
 <li><b>Part C</b> was a normal-form conversion (CNF or GNF) or a Turing machine design in every paper.</li></ul></section>`;
 h+=`<section><h3>Where the 75 marks sit</h3><div class="marks"><div style="flex:20" class="m a"><b>Part A</b><span>20 × 1 = 20</span></div><div style="flex:40" class="m b"><b>Part B</b><span>5 × 8 = 40</span></div><div style="flex:15" class="m c"><b>Part C</b><span>1 × 15 = 15</span></div></div>
 <p class="muted">Part A is on an OMR sheet in the first 40 minutes. Parts B and C go in the answer booklet. Part B and C carry 55 of the 75 marks, so that is where practice pays most.</p></section>`;
 h+=`<section><h3>How much of Part B is covered?</h3><p class="muted">Share of the 30 Part B slots (5 units × 6 papers) where at least one of the two options is a topic you studied.</p>
 ${covBar('Must-do only ('+n1+' topics)',cm.ok,cm.tot,'c1')}${covBar('+ High, 4 papers ('+T.filter(t=>t.count===4).length+' topics)',ch.ok,ch.tot,'c2')}${covBar('+ Medium, 3 papers ('+T.filter(t=>t.count===3).length+' topics)',cmd.ok,cmd.tot,'c3')}
 <p class="muted">Part C: must-do topics alone cover ${cm.c} of 6 papers.</p></section>`;
 h+=`<section><h3>Topic × paper map</h3><p class="muted">Each cell is one paper. Tap or hover for the exact question number. Darker means more questions on that topic in that paper.</p><div class="hmwrap"><table class="hm"><thead><tr><th></th>${PORDER.map(p=>`<th>${PSHORT[p]}</th>`).join('')}<th>Total</th></tr></thead><tbody>`;
 for(let u=1;u<=5;u++){h+=`<tr class="uh"><td colspan="8">${UNAME[u]} · ${USHORT[u]}</td></tr>`;
  T.filter(t=>t.unit===u).sort((a,b)=>b.count-a.count).forEach(t=>{h+=`<tr><td class="tn"><a href="#u${u}">${esc(t.name)}</a></td>`+PORDER.map(p=>{const pi=P.findIndex(x=>x.id===p);const hh=t.hits[pi];const n=hh?hh.split('·').length:0;return `<td><span class="hc l${n}" ${hh?`data-tip="<b>${PLONG[p]}</b><br>${hh.split('·').map(c=>'<b>'+codeLabel(c)+'</b> '+esc(QTXT(pi,c))).join('<br>')}"`:''}>${n||''}</span></td>`}).join('')+`<td class="tot">${t.count}/6</td></tr>`})}
 h+='</tbody></table></div></section>';
 h+=`<section><h3>Questions that came back</h3><p class="muted">Almost word for word. If you can do these, you have already banked marks.</p><div class="grid2">`+reps.map(r=>`<div class="card rep"><span class="x">×${r.n}</span><b>${esc(r.w)}</b><small>${esc(r.p)}</small></div>`).join('')+'</div></section>';
 h+=`<section><h3>How to write an 8-marker</h3><ol class="steps"><li>Write the definition or the idea in one line.</li><li>Draw the table, grammar or machine neatly. Label every state or symbol.</li><li>Do the steps in the standard order. Number them.</li><li>Test the string they gave you, and show the trace.</li><li>Write the answer in one line at the end.</li></ol><p class="muted">Show the steps even when you can see the answer. Marks go to the working.</p></section>`;
 $('#view').innerHTML=h}
// ------- UNIT
function topicCard(t){
 const tpl=Object.entries(TPL).filter(([k,v])=>v.includes(t.id)).map(([k])=>D.templates[k]);
 const steps=tpl.length?tpl[0].steps:null;
 const traps=TRAPS[t.id]||[];
 const asked=PORDER.map(p=>{const pi=P.findIndex(x=>x.id===p);const h=t.hits[pi];return `<li class="${h?'y':'n'}"><span class="ap">${PSHORT[p]}</span><div>${h?h.split('·').map(c=>`<span class="tg">${codeLabel(c)}</span> ${esc(QTXT(pi,c))}`).join('<br>'):'<span class="muted">not asked</span>'}</div></li>`}).join('');
 return `<details class="topic ${t.tr.k}"><summary>${chip(t)}<span class="tt">${esc(t.name)}</span>${dots(t)}<span class="cnt">${t.count}/6</span></summary><div class="tb"><p class="tipline">${esc(t.tip)}</p><h5>How it was asked</h5><ul class="asked">${asked}</ul>${EX[t.id]?`<h5>Worked check</h5><p class="ex">${esc(EX[t.id])}</p>`:''}${steps?`<h5>Answer blueprint</h5><ol class="steps">${steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol>`:''}${traps.length?`<h5>Watch out</h5><ul class="trap">${traps.map(s=>`<li>${esc(s)}</li>`).join('')}</ul>`:''}<a class="try" href="${'Fla-course.html'}" onclick="return false" style="display:none"></a></div></details>`}

function bet(u){const ts=T.filter(t=>t.unit===u&&t.count>=3).sort((a,b)=>b.count-a.count);const due=ts.filter(t=>!t.hits[5]).map(t=>t.name);const top=ts.slice(0,2).map(t=>t.name);return `<p class="note"><b>If you had to bet:</b> ${esc(top.join(' and '))} are the safest. ${due.length?'Not in the latest paper (May 2026) but regular before, so they may be due: '+esc(due.slice(0,3).join('; '))+'.':''}</p>`}
function vUnit(u){
 const ts=T.filter(t=>t.unit===u).sort((a,b)=>b.count-a.count||a.effort-b.effort);
 const sl=D.slots.find(s=>s.unit===u);
 const cv=coverage(SETS.must).per[u],ca=coverage(SETS.med).per[u];
 let h=`<section class="hero"><h2>${UN[u]}</h2><p class="lead">${sl.title}. ${esc(sl.why)}</p><p class="muted">Must-do topics here cover ${cv} of 6 papers. With the medium topics, ${ca} of 6.</p>
 ${bet(u)}<p class="muted">Part A: 4 MCQs on this unit in every paper. <a href="#mcq" onclick="setTimeout(()=>mcqUnit(${u}),30)">See them in the MCQ bank</a>.</p></section>`;
 h+='<div class="legend"><span class="chip must">Must-do 5–6 papers</span><span class="chip high">High 4</span><span class="chip med">Medium 3</span><span class="chip bonus">Bonus 1–2</span></div>';
 h+=ts.map(topicCard).join('');
 h+=`<section><h3>Every question slot, paper by paper</h3><div class="hmwrap"><table class="slots"><thead><tr><th>Paper</th><th>Option (a)</th><th>Option (b)</th></tr></thead><tbody>`+PORDER.map(p=>{const pi=P.findIndex(x=>x.id===p);const s=slotTopics(u,pi);const f=(ids,i)=>`<div class="qx">${esc(SLOTS[u][p][i])}</div>`+(ids.length?ids.map(id=>`<span class="pill ${T[id].tr.k}">${esc(T[id].name)}</span>`).join(' '):'');return `<tr><th scope="row">${PLONG[p]}</th><td>${f(s.a,0)}</td><td>${f(s.b,1)}</td></tr>`}).join('')+'</tbody></table></div><p class="muted">Each paper asks you to answer one of (a) or (b). The coloured tags show which topic card covers each option.</p></section>';
 if(u===3||u===2||u===5){h+=`<section><h3>Watch list</h3><ul class="trap">${D.watch.filter((w,i)=>(u===3&&i<2)||(u===5&&i===2)||(u===2&&i===3)).map(w=>`<li>${esc(w)}</li>`).join('')}</ul></section>`}
 $('#view').innerHTML=h}
// ------- PART C
function vPartC(){
 let h=`<section class="hero"><h2>Part C · 15 marks</h2><p class="lead">One question to answer out of Q26 and Q27. Both are 15 marks, so look at both and take the one you know.</p></section><div class="hmwrap"><table class="slots"><thead><tr><th>Paper</th><th>Q26</th><th>Q27</th></tr></thead><tbody>`;
 PARTC.forEach(c=>{const pi=P.findIndex(x=>x.id===c.p);const ts=partCFor(pi);const tg=q=>ts.filter(t=>t.hits[pi].split('·').some(x=>x===(q?'27¹⁵':'26¹⁵'))).map(t=>`<span class="pill ${t.tr.k}">${esc(t.name)}</span>`).join(' ');h+=`<tr><th scope="row">${PLONG[c.p]}</th><td><div class="qx">${esc(c.q[0])}</div>${tg(0)}</td><td><div class="qx">${esc(c.q[1])}</div>${tg(1)}</td></tr>`});
 h+='</tbody></table></div>';
 const fam=T.filter(t=>t.hits.some(x=>x&&(x.includes('26¹⁵')||x.includes('27¹⁵')))).map(t=>({t,n:t.hits.filter(x=>x&&(x.includes('26¹⁵')||x.includes('27¹⁵'))).length})).sort((a,b)=>b.n-a.n);
 h+=`<section><h3>Families, ranked by how often they were a Part C option</h3><div class="grid2">`+fam.map(f=>`<div class="card"><span class="x">×${f.n}</span><b>${esc(f.t.name)}</b><small>${UNAME[f.t.unit]}</small></div>`).join('')+'</div></section>';
 h+=`<section><h3>Pick-two strategy</h3><ol class="steps"><li><b>Normal forms.</b> Simplify, then CNF, then GNF on one grammar. These are the same mechanical steps you already use in Unit 2.</li><li><b>One Turing machine.</b> Unary multiplication or w wᴿ, with a transition table and a trace.</li></ol><p class="muted">Between them, one of these two families was a Part C option in every paper.</p></section>`;
 $('#view').innerHTML=h}
// ------- PART A
const PA_CONCEPTS=[
['Finite automata',[['NFA, ε-NFA and DFA have the same power','M25 Q4, N25 Q1'],['Minimal DFA counts (no two a\'s: 3, third bit: 5)','J2 Q2, M25 Q2'],['δ of a DFA is Q × Σ → Q','N24 Q4, M26 Q4'],['Regular set facts: concatenation is not commutative','N25 Q6'],['Moore and Mealy are finite automata with output','M26 Q3']]],
['Grammars and parse trees',[['Type 0 to Type 3 and the machine for each','N24 Q8, M25 Q10, N25 Q5'],['CNF shape A → BC or A → a','M25 Q12, N25 Q7, J1 Q8'],['GNF shape A → aα','J2 Q7, M26 Q5'],['Leaves are terminals, internal nodes are variables','J2 Q6, N25 Q8, M26 Q8'],['S → aS | bS | a | b is (a+b)(a+b)*','J1 Q9, M26 Q6']]],
['Pushdown automata',[['Z₀ is the initial stack symbol','N24 Q12, M25 Q9, M26 Q12'],['PDA accepts CFLs. NPDA is more powerful than DPDA','N24 Q5, J1 Q11, J1 Q17'],['ID / configuration is (state, unread input, stack)','N25 Q10, M26 Q11'],['Which languages are DCFL (wcwᴿ yes, wwᴿ no)','J1 Q13, J1 Q14']]],
['Turing machines',[['Halting states are accept and reject','N24 Q16, M25 Q16 style, J1 Q15, J2 Q16'],['δ undefined means the machine halts','J2 Q15'],['ID of a TM: state and tape','J2 Q14, M26 Q15'],['RE is closed under union and intersection, not complement','M25 Q16, N25 Q15'],['NTM and DTM are equal in power. A UTM simulates any TM','M26 Q16, N25 Q13']]],
['Undecidability and complexity',[['Decidable = has an algorithm that always halts','N24 Q17, M25 Q17'],['L and L̄ both RE ⇒ L recursive','J1 Q19, M26 Q17'],['NP-complete = NP-hard and in NP. SAT is NP-complete','N24 Q19, N25 Q17, N25 Q19'],['NP means verifiable in polynomial time','N25 Q16, N25 Q20'],['MPCP forces the first tile','J2 Q18, N25 Q18'],['If P ≠ NP, NP-complete ∩ P = ∅','M26 Q20']]]];
function vPartA(){
 let h=`<section class="hero"><h2>Part A · 20 MCQs</h2><p class="lead">Exactly 4 MCQs per unit in every paper, in unit order: Q1–4 Unit 1, Q5–8 Unit 2, Q9–12 Unit 3, Q13–16 Unit 4, Q17–20 Unit 5. They are mostly definitions, and the same facts come round again and again.</p></section>`;
 PA_CONCEPTS.forEach(([t,rows],i)=>{h+=`<section><h3>${UNAME[i+1]} · ${t}</h3><div class="hmwrap"><table class="slots"><thead><tr><th>Concept</th><th>Seen in</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r[0])}</td><td class="muted">${esc(r[1])}</td></tr>`).join('')}</tbody></table></div></section>`});
 h+=`<section><h3>Facts to remember</h3><div class="grid2">`+D.facts.oneLiners.map(f=>`<div class="card"><b>${esc(f[0])}</b><small>${esc(f[1])}</small></div>`).join('')+'</div></section>';
 h+=`<section><h3>Closure and hierarchy tables</h3><div class="hmwrap"><table class="slots"><thead><tr><th>Closed under</th>${D.facts.closure.cols.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>${D.facts.closure.rows.map(r=>`<tr><td>${r[0]}</td>${r.slice(1).map(v=>`<td>${v?'✔':'✘'}</td>`).join('')}</tr>`).join('')}</tbody></table></div><div class="hmwrap"><table class="slots"><thead><tr><th>Type</th><th>Grammar</th><th>Machine</th></tr></thead><tbody>${D.facts.hierarchy.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div></section>`;
 $('#view').innerHTML=h}
// ------- MCQ BANK
let F={p:'',u:'',q:'',chk:false,star:false,all:false};
const stars=new Set(store.get('fla.stars',[]));
function mcqUnit(u){F.u=String(u);vMcq()}
function vMcq(){
 const nc=MCQ.filter(m=>m.flag).length;
 $('#view').innerHTML=`<section class="hero"><h2>MCQ bank</h2><p class="lead">All ${MCQ.length} Part A questions from the six papers, with answers worked out from theory. This is not an official key. ${nc} questions are flagged because the scan, the wording or a missing figure leaves doubt.</p></section>
 <div class="filters"><select id="fp"><option value="">All papers</option>${PORDER.map(p=>`<option value="${p}">${PLONG[p]}</option>`).join('')}</select><select id="fu"><option value="">All units</option>${[1,2,3,4,5].map(u=>`<option value="${u}">${UNAME[u]}</option>`).join('')}</select><input id="fq" type="search" placeholder="Search questions"><label><input type="checkbox" id="fc"> Only Check</label><label><input type="checkbox" id="fs"> Only ☆ Revise</label><label><input type="checkbox" id="fa"> Show all answers</label></div><div id="mc"></div>`;
 $('#fp').value=F.p;$('#fu').value=F.u;$('#fq').value=F.q;$('#fc').checked=F.chk;$('#fs').checked=F.star;$('#fa').checked=F.all;
 const upd=()=>{F.p=$('#fp').value;F.u=$('#fu').value;F.q=$('#fq').value;F.chk=$('#fc').checked;F.star=$('#fs').checked;F.all=$('#fa').checked;renderMcq()};
 ['fp','fu','fq','fc','fs','fa'].forEach(id=>$('#'+id).addEventListener(id==='fq'?'input':'change',upd));renderMcq()}
function renderMcq(){
 const q=F.q.toLowerCase();
 const list=MCQ.filter(m=>(!F.p||m.p===F.p)&&(!F.u||m.u==F.u)&&(!F.chk||m.flag)&&(!F.star||stars.has(m.id))&&(!q||(m.text+m.o.join(' ')).toLowerCase().includes(q)));
 const L='ABCD';
 $('#mc').innerHTML=`<p class="muted">${list.length} question${list.length===1?'':'s'}</p>`+list.map(m=>`<div class="mq" data-id="${m.id}"><div class="mh"><span class="pill">${PSHORT[m.p]} · Q${m.q}</span><span class="pill u">${UNAME[m.u]}</span>${m.flag?`<span class="pill flag">${m.flag==='diagram'?'Diagram':'Check'}</span>`:''}<button class="star ${stars.has(m.id)?'on':''}" aria-label="Revise later">${stars.has(m.id)?'★':'☆'}</button></div><p class="qt">${esc(m.text)}</p><ol class="opts">${m.o.map((o,i)=>`<li data-i="${i}"><b>${L[i]}</b> ${esc(o)}</li>`).join('')}</ol><button class="rev">${F.all?'Hide':'Show answer'}</button><div class="ans" ${F.all?'':'hidden'}><b>Answer: ${L[m.a]}</b>. ${esc(m.why)}</div></div>`).join('');
 $$('.mq').forEach(el=>{const m=MCQ.find(x=>x.id===el.dataset.id);const ans=$('.ans',el),btn=$('.rev',el);
  const mark=on=>$$('.opts li',el).forEach(li=>li.classList.toggle('right',on&&+li.dataset.i===m.a));
  if(F.all)mark(true);
  btn.onclick=()=>{const on=ans.hidden;ans.hidden=!on;btn.textContent=on?'Hide':'Show answer';mark(on)};
  $$('.opts li',el).forEach(li=>li.onclick=()=>{ans.hidden=false;btn.textContent='Hide';mark(true);li.classList.add(+li.dataset.i===m.a?'got':'miss')});
  $('.star',el).onclick=e=>{if(stars.has(m.id))stars.delete(m.id);else stars.add(m.id);store.set('fla.stars',[...stars]);e.target.classList.toggle('on');e.target.textContent=stars.has(m.id)?'★':'☆'}})}
// ------- PLAN
const EST={1:20,2:35,3:50};
function vPlan(){
 const done=new Set(store.get('fla.done',[]));
 const ph=[['Phase 1 · Must-do',T.filter(t=>t.count>=5),'Learn these first. Five or six papers each.'],['Phase 2 · High',T.filter(t=>t.count===4),'Four papers each.'],['Phase 3 · Medium',T.filter(t=>t.count===3),'Three papers each.'],['Phase 4 · Bonus',T.filter(t=>t.count<=2),'Only if you have time.']];
 let h=`<section class="hero"><h2>Study plan</h2><p class="lead">Tick a topic when you can do it without looking. The meter shows how much of Part B that covers.</p><div id="meter"></div></section>`;
 ph.forEach(([n,ts,d],pi)=>{const min=ts.reduce((a,t)=>a+EST[t.effort],0);h+=`<section><h3>${n}</h3><p class="muted">${d} About ${Math.round(min/60*10)/10} hours in total.</p>`+ts.sort((a,b)=>a.unit-b.unit).map(t=>`<label class="task ${done.has(t.id)?'done':''}"><input type="checkbox" data-id="${t.id}" ${done.has(t.id)?'checked':''}><span>${esc(t.name)}<small>${UNAME[t.unit]} · ${t.count}/6 papers · about ${EST[t.effort]} min</small></span></label>`).join('')+'</section>'});
 h+=`<section><h3>Alongside</h3><ul class="trap"><li>Go through the MCQ bank once per unit (10 minutes each). Star anything you got wrong.</li><li>Do one Part C practice: a CNF then GNF conversion and a Turing machine.</li><li>Write out the three repeated 8-markers from the Overview by hand.</li><li>Last hour: read the Part A concepts page and the starred MCQs.</li></ul></section>`;
 $('#view').innerHTML=h;
 const meter=()=>{const c=coverage(done);$('#meter').innerHTML=covBar('Part B slots covered by your ticked topics',c.ok,c.tot,'c1')+`<p class="muted">Part C covered in ${c.c} of 6 papers.</p>`};meter();
 $$('.task input').forEach(i=>i.onchange=()=>{const id=+i.dataset.id;if(i.checked)done.add(id);else done.delete(id);store.set('fla.done',[...done]);i.closest('.task').classList.toggle('done',i.checked);meter()})}
// ------- shell
function stat(n,l){return `<div class="stat"><b>${n}</b><span>${l}</span></div>`}
const nRepeats=REPEATS.length;
app.innerHTML=`<header class="top"><h1>FLA 21CSC301T · Past paper analysis</h1><p>Six papers, Nov 2024 to May 2026. What was asked, what repeats, and what to study first.</p><div class="stats">${stat(6,'papers analysed')}${stat(60,'Part B options mapped')}${stat(T.length,'topics')}${stat(nRepeats,'repeated questions')}${stat(MCQ.length,'MCQs with answers')}</div></header>${nav()}<main id="view"></main><footer>Answers to the MCQs are worked out from theory, not from an official key. Check the flagged ones against your notes. Scans were hard to read in places.</footer>`;
addEventListener('hashchange',route);route();
