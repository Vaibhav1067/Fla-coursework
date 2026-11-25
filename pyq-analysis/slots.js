// Every Part B option and Part C question, paper by paper. Order of papers: N24, M25, J1, J2, N25, M26.
// SLOTS[unit][paper] = [option a, option b]
const SLOTS={
1:{
N24:['Design an NFA for strings whose second-last symbol is always 1. Convert it to a DFA. Test 100010 and 100000 on both machines.','Design a Moore machine over {0,1}: print a for substring 10, b for 11, c otherwise. Convert it to a Mealy machine.'],
M25:['(1) Formal definition of DFA and NFA with examples. (2) DFA over {x,y} that never contains the substring xxy.','(1) Compare Mealy and Moore, and build a Moore machine for divisibility of a binary number by 3. (2) Can a regular expression describe palindromes? Justify.'],
J1:['(i) ε-NFA table over ε,a,b,c: find every ε-closure and convert to a DFA. (ii) Mealy machine for the 2’s complement of a binary input.','(i) Convert a given NFA table (P,Q,R,S on 0,1) to a DFA. (ii) Run a given Moore machine on aabab and ababb.'],
J2:['Design a minimised DFA by converting the regular expression a(a+b+c)*(a+b+c).','Same as Nov 2024: NFA for second-last symbol 1, convert to DFA, test 100010 and 100000.'],
N25:['Minimal DFA for L = {aⁿbᵐ : n ≥ 2, m ≥ 1} over {a,b}.','Prove that L = {0ⁿ10ⁿ : n ≥ 1} is not regular.'],
M26:['Convert a given 4-state Mealy machine to a Moore machine.','Convert a given NFA (states P,Q,R,S on 0,1, table given) to a DFA.']},
2:{
N24:['(i) Is S→AS|A, A→aAb|c ambiguous? (ii) Discuss any four properties of regular sets with an example.','Design an unambiguous CFG for HTML with tags body, h1, p, a, div and the text inside them.'],
M25:['Remove unit, useless and null productions from S→aA|aBB, A→aaA|ε, B→bB|bbC, C→B. What language does it generate?','Convert S→AA|a, A→SS|b to Greibach normal form.'],
J1:['Use the table-filling algorithm to minimise a given 8-state DFA (q0 to q7).','(i) Convert a given CFG to GNF. (ii) Test whether S→0S1S|1S0S|ε and S→AA, A→aAb|bAa|ε are ambiguous.'],
J2:['Simplify S→XYX, X→0X|ε, Y→1Y|ε.','Convert S→XB|AA, A→a|SA, B→b, X→a to GNF.'],
N25:['Write a CFG for (i) {aⁿb²ⁿ : n ≥ 1} (ii) {aⁿbᵐcᵐdⁿ : n ≥ 1}.','(i) Show regular languages are closed under concatenation and Kleene closure. (ii) Show S→aSb|bSa|SS|ε is ambiguous.'],
M26:['Convert S→aAa|bBb|ε, A→C|a, B→C|b, C→CDE|ε, D→A|B|ab to CNF.','Remove the null productions from (i) S→aS|AB, A→ε, B→ε, D→b and (ii) S→ABC, A→BC|a, B→bAC|ε.']},
3:{
N24:['PDA for (i) {aᵐ⁺ⁿbᵐcⁿ} (ii) {aⁿbⁿc²ⁿ}. The second is printed as asked and is not context-free.','Convert S→0BB, B→0S|1S|0 to a PDA and check the string 010⁴.'],
M25:['DPDA versus NPDA, then design a PDA for {aⁱbʲcᵏ : i = j or j = k}.','A CFG and an equivalent PDA for {aⁿbᵐaⁿ : m,n ≥ 1} ∪ {aⁿcⁿ : n ≥ 1}.'],
J1:['(i) PDA for strings over {a,b} with equal numbers of a’s and b’s. (ii) PDA for S→0BB, B→0S|1S|0; test 010⁴.','(i) PDA for {aⁿbⁿcᵐdᵐ : n,m ≥ 1}. (ii) Convert a given PDA with six transitions to a CFG.'],
J2:['Convert a given PDA (states q0,q1,qf; stack symbols A,Z) to a CFG.','Prove {aⁿbⁿ : n ≥ 0} is not regular with the pumping lemma.'],
N25:['NPDA for {w ∈ {a,b}* : na(w) = nb(w)}. Trace the string baab.','Convert E→E+E|E*E|a to a PDA and check the string a*a.'],
M26:['Convert S→aA, A→aABC|bB|a, B→b, C→c to a PDA. Check the string abcba.','Design a PDA for aⁿbⁿcᵐdᵐ.']},
4:{
N24:['TM for {aⁿbⁿcⁿ : n ≥ 0}. Show that aaabbbccc is accepted.','TM for addition. Compute 2+3 with all steps.'],
M25:['Tuple definition of a TM with instantaneous description. Then a TM for {www : w ∈ {a,b}*}.','Short notes on any two: extensions of TM, universal TM, recursive and recursively enumerable languages.'],
J1:['(i) TM for proper subtraction m ∸ n, with a simulation. (ii) TM for {0ⁿ1ⁿ : n ≥ 1}.','TM for {wwᴿ : w ∈ {a,b}*} using the checking-off-symbols technique.'],
J2:['TM that checks whether the input is prime, using multiple tracks.','TM to add two unary numbers.'],
N25:['Discuss any two variants of the Turing machine with examples and illustrations.','TM for {aⁿbⁿcⁿ : n ≥ 1} over {a,b,c}. Show the working on aabbcc.'],
M26:['Short note on multitape and multihead Turing machines.','TM that accepts strings over {a,b} ending with b.']},
5:{
N24:['Explain P, NP, NP-complete and NP-hard.','Explain the halting problem and Rice’s theorem.'],
M25:['(1) Does the PCP with A = (y, yxy³, yx), B = (y³, yx, x) have a solution? (2) NP-hard and NP-complete with examples.','Compare decidable and undecidable languages with examples.'],
J1:['State and prove Rice’s theorem for recursively enumerable index sets.','Define Lₑ and prove that Lₑ is not recursive.'],
J2:['Find a solution of the PCP with lists A = (1, 10111, 10) and B = (111, 10, 0).','Classify decidable and undecidable problems with an example.'],
N25:['Differentiate recursive and recursively enumerable languages. Describe undecidable problems with examples.','PCP with A = (a, bab, bb, abba), B = (ab, b, bab, ba): find a solution, say whether an MPCP solution exists, and whether PCP is decidable.'],
M26:['Are the recursive and the recursively enumerable languages closed under complementation? Discuss.','Does the PCP instance M = (ab, bab, bbaaa), N = (a, ba, bab) have a solution?']}};
// Part C: [Q26, Q27]
const PARTC=[
{p:'N24',q:['Employee IDs over {a,b} with at least one a: list the strings, build the DFA, convert it to a regular expression with the Rᵢⱼᵏ method.','Grammar for “the dog catches the cat” (S→NP VP …): remove null and unit productions, convert to CNF and GNF, draw the parse tree.']},
{p:'M25',q:['(1) State and prove the pumping lemma for CFLs and test {aⁿbⁿcⁿ}. (2) Minimise a given 6-state FA.','Design a Turing machine that multiplies two numbers.']},
{p:'J1',q:['(i) Prove that PCP is undecidable. (ii) Does the instance A = (ab, bbab, baa, b), B = (abbb, a, aa, bbb) have a PCP solution? Find the MPCP instance.','(i) Convert S→ABC, A→BC|a, B→bAC|ε, C→cAB|ε to CNF, with the intermediate steps. (ii) Find the regular expression of a given 2-state automaton.']},
{p:'J2',q:['(i) Define CNF, simplify G (A→AaB|Ca|Ba, B→aB|ε, C→CaC, D→Aa) and convert it to CNF (12 marks). (ii) Remove the unit productions of S→AB, A→a, B→C|b, C→D, D→E, E→a (3 marks).','Transition diagram of a Turing machine for {wwᴿ : w ∈ (a+b)*}.']},
{p:'N25',q:['Home-automation grammar: leftmost derivation of “please open the door”, then convert the grammar to CNF and GNF.','Turing machine that multiplies two unary numbers (111 × 11), with table or diagram and a trace.']},
{p:'M26',q:['Convert S→aA|bB, B→bB|ε, A→aA|ε to GNF.','Turing machine that reads w ∈ {0,1}* and outputs ww. Show the action on 10 and 010.']}];
// repeated questions: times, text, papers
const REPEATS=[
{n:5,w:'Part C: a normal-form conversion (CNF or GNF)',p:'Nov ’24, Jul ’25 P1, Jul ’25 P2, Nov ’25, May ’26'},
{n:6,w:'Part C or Part B: a Turing machine design or calculation (multiply, copy, wwᴿ)',p:'every paper'},
{n:5,w:'PCP or MPCP: solve a given instance or prove it undecidable',p:'May ’25, Jul ’25 P1, Jul ’25 P2, Nov ’25, May ’26'},
{n:3,w:'Decidable versus undecidable, or recursive versus RE',p:'May ’25, Jul ’25 P2, Nov ’25 (May ’26 asks about closure under complement)'},
{n:3,w:'Test whether a grammar is ambiguous',p:'Nov ’24, Jul ’25 P1, Nov ’25'},
{n:3,w:'Pumping lemma proof (regular or CFL)',p:'May ’25 (Part C), Jul ’25 P2, Nov ’25'},
{n:2,w:'NFA with second-last symbol 1 → DFA, test 100010 and 100000',p:'Nov ’24, Jul ’25 P2 (word for word)'},
{n:2,w:'Grammar S→0BB, B→0S|1S|0 → PDA, test 010⁴',p:'Nov ’24, Jul ’25 P1 (word for word)'},
{n:2,w:'PDA for aⁿbⁿcᵐdᵐ',p:'Jul ’25 P1, May ’26'},
{n:2,w:'PDA for equal numbers of a’s and b’s',p:'Jul ’25 P1, Nov ’25'},
{n:2,w:'TM for aⁿbⁿcⁿ',p:'Nov ’24, Nov ’25'},
{n:2,w:'TM for unary addition',p:'Nov ’24, Jul ’25 P2'},
{n:2,w:'TM for unary multiplication (15 marks)',p:'May ’25, Nov ’25'},
{n:2,w:'TM for wwᴿ',p:'Jul ’25 P1, Jul ’25 P2 (Part C)'},
{n:2,w:'Rice’s theorem',p:'Nov ’24, Jul ’25 P1'},
{n:3,w:'Simplify a CFG by removing ε, unit and useless productions',p:'May ’25, Jul ’25 P2, May ’26'}];
// worked checks (computed with the engine), keyed by topic index
const EX={
0:'Worked check: the NFA for “second-last symbol is 1” becomes a DFA with 4 states, one for each pair of last two symbols (00, 01, 10, 11). Accepting states are 10 and 11. 100010 is accepted (second-last symbol 1). 100000 is rejected (second-last symbol 0).',
5:'Worked check (Jul 2025 P2 Q22a): S→XYX, X→0X|ε, Y→1Y|ε simplifies to S → XYX | XY | YX | XX | 0X | 0 | 1Y | 1 | ε, X → 0X | 0, Y → 1Y | 1.',
19:'Worked checks: Jul 2025 P1 → tiles 1,2,4,3 (both sides spell abbbabbbaa). May 2025 → 2,1,1,3 (yxyyyyyyx). Jul 2025 P2 → 2,1,1,3 (101111110). Nov 2025 → 1,3,4 (abbabba), and it starts with tile 1, so it is also an MPCP solution. May 2026 has no solution: every top string is longer than its bottom string.'};
