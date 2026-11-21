/* Analysis data read from the six past papers, quiz bank, and theory notes. */
(function (root) {
const D = {};
D.papers = [
  { id: 'N24', short: 'Nov 24', long: 'Nov 2024' },
  { id: 'M25', short: 'May 25', long: 'May 2025' },
  { id: 'J1', short: 'Jul 25 P1', long: 'Jul 2025 (6-page paper)' },
  { id: 'J2', short: 'Jul 25 P2', long: 'Jul 2025 Paper 2' },
  { id: 'N25', short: 'Nov 25', long: 'Nov/Dec 2025' },
  { id: 'M26', short: 'May 26', long: 'May 2026' }
];
D.units = {
  1: 'Unit 1 · Finite automata and regular expressions',
  2: 'Unit 2 · Regular sets and context-free grammars',
  3: 'Unit 3 · Pushdown automata',
  4: 'Unit 4 · Turing machines',
  5: 'Unit 5 · Complexity and undecidability'
};
// hits order: N24, M25, J1, J2, N25, M26. A string is the question number; 15 in a hit means a 15-mark Part C question.
const T = (unit, name, hits, effort, tool, tip, extra = {}) => Object.assign({ unit, name, hits, effort, tool, tip }, extra);
D.topics = [
  T(1, 'NFA to DFA (subset construction, ε-closure)', ['21a', null, '21a·21b', '21b', null, '21b'], 1, 'fa', 'Mechanical. Same table every time. The "second-last symbol is 1" NFA came up twice.'),
  T(1, 'Mealy and Moore machines (design, convert, run)', ['21b', '21b', '21a·21b', null, null, '21a'], 1, 'fa', 'Know Mealy to Moore (state, output) pairs and Moore to Mealy.'),
  T(1, 'Design or minimize a DFA', ['26¹⁵', '21a·26¹⁵', '22a', '21a', '21a', null], 2, 'fa', 'Table-filling for minimization; design from the language, then test strings.'),
  T(1, 'Regular expression to automaton and back (Rᵢⱼᵏ, RE to DFA)', ['26¹⁵', null, '27¹⁵', '21a', null, null], 2, 'fa', 'Appears inside 15-mark questions. Practise one Rᵢⱼᵏ and one state elimination.'),
  T(1, 'Pumping lemma (regular and CFL proofs)', [null, '26¹⁵', null, '23b', '21b', null], 2, 'undec', 'Fixed proof template: pick w, split, pump, contradiction.'),
  T(2, 'Simplify a CFG (ε, unit, useless)', ['27¹⁵', '22a', '27¹⁵', '22a·26¹⁵', '26¹⁵', '22a·22b'], 1, 'gram', 'In every paper. It is also step 1 of CNF and GNF.'),
  T(2, 'Chomsky normal form', ['27¹⁵', null, '27¹⁵', '26¹⁵', '26¹⁵', '22a'], 2, 'gram', 'Five papers. Usually the 15-mark option.'),
  T(2, 'Greibach normal form', ['27¹⁵', '22b', '22b', '22b', '26¹⁵', '26¹⁵'], 3, 'gram', 'In every paper, three times as an 8-marker and three as the 15-marker. The single best topic to master.'),
  T(2, 'Ambiguity of a grammar', ['22a', null, '22b', null, '22b', null], 1, 'gram', 'Show one string with two leftmost derivations or two parse trees.'),
  T(2, 'Write a CFG, derivations, parse trees', ['22b·27¹⁵', '23b', null, null, '22a·26¹⁵', null], 2, 'gram', 'Leftmost derivation for a given string, then the parse tree.'),
  T(2, 'Properties of regular sets (closure)', ['22a', null, null, null, '22b', null], 1, 'plan', 'Union, concatenation, Kleene star, complement, intersection, reversal, each with one example.'),
  T(3, 'Design a PDA for a language', ['23a', '23a·23b', '23a·23b', null, '23a', '23b'], 2, 'pda', 'Equal a and b, aⁿbⁿcᵐdᵐ, a^(m+n)bᵐcⁿ. Give the δ table and trace one string.'),
  T(3, 'CFG to PDA and trace a string', ['23b', '23b', '23a', null, '23b', '23a'], 1, 'pda', 'Two moves only: expand a variable, match a terminal. The same grammar (010⁴) was asked twice.'),
  T(3, 'PDA to CFG', [null, null, '23b', '23a', null, null], 3, 'pda', 'Triple construction [p X q]. Lower priority.'),
  T(4, 'Any Turing machine construction (8 or 15 marks)', ['24a·24b', '24a·27¹⁵', '24a·24b', '24a·24b·27¹⁵', '24b·27¹⁵', '24b·27¹⁵'], 3, 'tm', 'Every paper has a TM design option in Unit 4, and four of six also put one in Part C.'),
  T(4, 'TM unary arithmetic (add, subtract, multiply)', ['24b', '27¹⁵', '24a', '24b', '27¹⁵', null], 2, 'tm', 'Addition is the easy 8-marker. Multiplication shows up as the 15-marker.'),
  T(4, 'TM for w wᴿ, ww or copy w to ww', [null, '24a', '24b', '27¹⁵', null, '27¹⁵'], 3, 'tm', 'Cross-off method. Draw the transition diagram and show a trace.'),
  T(4, 'TM for aⁿbⁿcⁿ or 0ⁿ1ⁿ', ['24a', null, '24a', null, '24b', null], 2, 'tm', 'Mark X, Y, Z. Trace aabbcc or aaabbbccc.'),
  T(4, 'TM theory notes (tuple, ID, variants, UTM, Rec/RE)', [null, '24a·24b', null, null, '24a', '24a'], 1, 'undec', 'Multitape, multihead, nondeterministic, universal TM. Learn a half-page each.'),
  T(5, 'PCP and MPCP (solve an instance, undecidability)', [null, '25a', '26¹⁵', '25a', '25b', '25b'], 1, 'undec', 'Five papers. Solve by trying a start tile and tracking the overhang.'),
  T(5, 'Decidable vs undecidable, recursive vs RE, closure', [null, '25b', null, '25b', '25a', '25a'], 1, 'undec', 'Definitions, examples, and closure under complement.'),
  T(5, 'Rice theorem, Lₑ, halting problem', ['25b', null, '25a·25b', null, null, null], 2, 'undec', 'Statement plus proof by reduction from the acceptance problem.'),
  T(5, 'P, NP, NP-complete, NP-hard', ['25a', '25a', null, null, null, null], 1, 'undec', 'Definitions, Venn picture, SAT and Cook–Levin. Also feeds Part A.')
];
D.topics.forEach(t => { t.count = t.hits.filter(Boolean).length; t.tier = t.count >= 5 ? 1 : t.count >= 3 ? 2 : 3; });

D.slots = [
  { unit: 1, title: 'Q21 · Finite automata (8 marks)', cover: ['NFA to DFA', 'Mealy / Moore', 'Design or minimize a DFA'], why: 'In all six papers at least one of the two options is one of these three. Nov 2025 is covered only by the DFA design option (the other was a pumping-lemma proof).' },
  { unit: 2, title: 'Q22 · Grammars (8 marks)', cover: ['Greibach normal form', 'Simplify + CNF', 'Ambiguity'], why: 'Four papers offered GNF, CNF or simplification here. Nov 2024 and Nov 2025 did not, and both offered ambiguity instead.' },
  { unit: 3, title: 'Q23 · Pushdown automata (8 marks)', cover: ['Design a PDA', 'CFG to PDA', 'PDA to CFG'], why: 'Jul 2025 P2 is the only paper without a design or CFG→PDA option, and it asked PDA→CFG.' },
  { unit: 4, title: 'Q24 · Turing machines (8 marks)', cover: ['aⁿbⁿcⁿ / 0ⁿ1ⁿ', 'Unary add / subtract', 'ww / wwᴿ', 'TM variants notes'], why: 'Short notes on TM variants, the universal TM or recursive/RE languages replaced one option in three papers (May 2025, Nov 2025, May 2026), so a half page of notes is cheap insurance next to the designs.' },
  { unit: 5, title: 'Q25 · Undecidability (8 marks)', cover: ['PCP / MPCP', 'Rice + Lₑ', 'Decidable vs undecidable'], why: 'PCP appears in five papers. Nov 2024 is the exception, and it asked Rice and P/NP.' },
  { unit: 0, title: 'Q26 / Q27 · Part C (15 marks, pick one)', cover: ['CNF then GNF', 'A TM design (multiply, copy, ww)', 'DFA to RE + pumping lemma'], why: 'A normal-form conversion was one of the two choices in five papers, and a TM design in four. Between them every paper is covered.' }
];

D.repeats = [
  { what: 'NFA where the second-last symbol is 1, convert to DFA, test 100010 and 100000', where: 'Nov 2024 Q21a and Jul 2025 P2 Q21b (word for word)' },
  { what: 'Grammar S→0BB, B→0S|1S|0 converted to a PDA, test 010⁴', where: 'Nov 2024 Q23b and Jul 2025 P1 Q23a(ii)' },
  { what: 'PDA for aⁿbⁿcᵐdᵐ', where: 'Jul 2025 P1 Q23b and May 2026 Q23b' },
  { what: 'NPDA for an equal number of a and b', where: 'Jul 2025 P1 Q23a(i) and Nov 2025 Q23a (trace baab)' },
  { what: 'TM for aⁿbⁿcⁿ', where: 'Nov 2024 Q24a and Nov 2025 Q24b' },
  { what: 'TM unary addition', where: 'Nov 2024 Q24b and Jul 2025 P2 Q24b' },
  { what: 'TM for unary multiplication (15 marks)', where: 'May 2025 Q27 and Nov 2025 Q27' },
  { what: 'TM for w wᴿ', where: 'Jul 2025 P1 Q24b and Jul 2025 P2 Q27' },
  { what: 'Rice theorem', where: 'Nov 2024 Q25b and Jul 2025 P1 Q25a' },
  { what: 'CFG S→aS|bS|a|b equals (a+b)(a+b)*', where: 'Jul 2025 P1 Q9 and May 2026 Q6 (MCQ)' },
  { what: 'Z₀ is the initial stack symbol', where: 'Nov 2024 Q12, May 2025 Q9, May 2026 Q12 (MCQ)' }
];

D.watch = [
  'Nov 2024 Q23a(ii) asks for a PDA for aⁿbⁿc²ⁿ as printed. That language is not context-free (three counts tied together), so no PDA exists. Skip that option, or say so and prove it with the CFL pumping lemma.',
  'Jul 2025 P1 Q12 lists two languages that PDAs cannot accept (aⁿbᵐcⁿdᵐ and aⁿbⁿcⁿ). Both are non-CFL, so the question has two correct answers. Do not lose time on it.',
  'May 2026 Q25b (M = ab, bab, bbaaa; N = a, ba, bab) has no PCP solution because every top string is longer than its bottom string. Say that one sentence and you have the answer.',
  'Several scans were hard to read. The PCP lists for Nov 2025 and the CFG in Jul 2025 P1 Q22b(i) are my best reading, so check them against your paper before trusting the sample answers.'
];

/* ---- Part A bank: unit, source, question, options, answer index, why ---- */
const Q = (u, src, q, o, a, why) => ({ u, src, q, o, a, why });
D.quiz = [
  Q(1, 'Nov 2024 Q1', 'S1: {0²ⁿ, n ≥ 1} and S2: {0ᵐ1ⁿ0ᵠ, m,n,q ≥ 1}. Which is correct?', ['Only S1 is regular', 'Only S2 is regular', 'Both are regular', 'Neither is regular'], 2, '0²ⁿ is (00)⁺ and S2 is 0⁺1⁺0⁺. Both have regular expressions.'),
  Q(1, 'May 2025 Q1', 'Which pair of regular expressions is NOT equivalent?', ['1(01)* and (10)*1', 'x(xx)* and (xx)*x', '(ab)* and a*b*', 'x⁺ and x*x⁺'], 2, '(ab)* allows abab but a*b* does not.'),
  Q(1, 'May 2025 Q2', 'Minimum states in a DFA (counting the dead state) to check that the 3rd bit is 1 for |w| ≥ 3 over {0,1}?', ['3', '4', '5', '1'], 2, 'q0, q1, q2, an accepting state after a 1 in position 3, and a dead state for a 0 in position 3.'),
  Q(1, 'May 2025 Q4', 'The expressive power of NFA and ε-NFA is', ['Different', 'Same', 'ε-NFA is more powerful', 'NFA is more powerful'], 1, 'Both accept exactly the regular languages.'),
  Q(1, 'May 2025 Q3', 'The reverse of a DFA can be formed by', ['Making final states non-final', 'Making the final state the start state and the start state final (reversing arcs)', 'Using a PDA', 'None of these'], 1, 'Reverse every arc, swap start and final. The result may be an NFA.'),
  Q(1, 'Jul 2025 P2 Q2', 'Minimum states of a DFA over {a,b} that rejects strings with two consecutive a’s (with a dead state)?', ['2', '3', '4', '5'], 1, 'Last symbol not a, last symbol a, and a dead state.'),
  Q(1, 'Jul 2025 P1 Q6', 'The regular expression (0+1)*0(0+1)*0(0+1)* describes', ['Strings containing the substring 00', 'Strings with at most two 0’s', 'Strings with at least two 0’s', 'Strings that begin and end with 0 or 1'], 2, 'Two explicit 0’s with anything around them.'),
  Q(1, 'Nov 2025 Q4', 'DFA: δ(q0,a)=q1, δ(q0,b)=q0, δ(q1,a)=q1, δ(q1,b)=q2, δ(q2,a)=q1, δ(q2,b)=q0, final q2. Which string is accepted?', ['aaba', 'abb', 'aab', 'ababb'], 2, 'It accepts strings ending in ab. aab ends in ab.'),
  Q(1, 'May 2026 Q2', 'States needed to simulate a memory holding 3 words of 8 bits?', ['2^(3×8)', '3^(2×8)', '2^(8+3)', '3^(8×3)'], 0, '24 bits give 2²⁴ configurations.'),
  Q(1, 'May 2026 Q3', 'A Moore machine is an application of', ['Finite automata without input', 'Finite automata with input', 'Finite automata without output', 'Finite automata with output'], 3, 'Moore and Mealy are automata with output.'),
  Q(1, 'May 2026 Q4', 'The transition function of a DFA maps', ['Σ × Σ → Q', 'Σ × Q → Σ', 'Q × Σ → Q', 'Q × Q → Σ'], 2, 'Current state and input symbol give the next state.'),
  Q(2, 'May 2025 Q12', 'Grammar: 1. S→AS  2. S→AAS  3. S→SA  4. A→aa. Which productions violate CNF?', ['2, 4', '1, 3', '1, 2, 3, 4', '2, 3, 4'], 0, 'CNF allows A→BC or A→a. AAS has three symbols and aa is two terminals.'),
  Q(2, 'Nov 2025 Q7', 'Which production is in Chomsky normal form?', ['a → AA', 'D → aDD', 'A → aB', 'D → AB'], 3, 'Exactly two variables on the right.'),
  Q(2, 'May 2026 Q5', 'Productions of the form A → aα with a a terminal and α a string of variables are in', ['Regular grammar', 'Chomsky normal form', 'Linear grammar', 'Greibach normal form'], 3, 'GNF starts with one terminal followed by variables.'),
  Q(2, 'Jul 2025 P2 Q7', 'In Greibach normal form each production has the form', ['A → BCA', 'A → aBA', 'A → BaA', 'B → BBaaAA'], 1, 'Terminal first, then only variables.'),
  Q(2, 'May 2026 Q8', 'Concatenating the leaf labels of a derivation tree from left to right gives the', ['Root', 'Yield', 'Child', 'Production'], 1, 'That string is called the yield.'),
  Q(2, 'Nov 2025 Q8', 'In a parse tree, a leaf node always represents', ['Terminals', 'Variables', 'Start symbols', 'Production rules'], 0, 'Leaves are terminals (or ε).'),
  Q(2, 'Jul 2025 P2 Q6', 'In a derivation tree the internal nodes represent', ['Terminals', 'Non-terminals', 'Productions', 'Start symbols'], 1, 'Only non-terminals have children.'),
  Q(2, 'May 2026 Q6 · Jul 2025 P1 Q9', 'S → aS | bS | a | b is equivalent to the regular expression', ['a+b', '(a+b)*', '(a+b)(a+b)*', '(a+b)(a+b)'], 2, 'One or more symbols, so (a+b)⁺.'),
  Q(2, 'May 2026 Q7', 'Which string is NOT generated by S → SaSbS | ε?', ['aabb', 'aaabb', 'aababb', 'abab'], 1, 'Every string has equally many a and b. aaabb has three a and two b.'),
  Q(2, 'Nov 2024 Q8', 'Match: 1) Type 0  2) Type 1  3) Type 2  4) Type 3 with i) Regular  ii) Context sensitive  iii) Unrestricted  iv) Context free', ['1-iii, 2-ii, 3-iv, 4-i', '1-iv, 2-ii, 3-iii, 4-i', '1-i, 2-ii, 3-iii, 4-iv', '1-ii, 2-iii, 3-iv, 4-i'], 0, 'Type 0 unrestricted, Type 1 context sensitive, Type 2 context free, Type 3 regular.'),
  Q(2, 'Nov 2025 Q6', 'Which statement about regular sets is NOT correct?', ['Union is associative and commutative', 'Concatenation is associative and commutative', '{ε} is the identity for concatenation', 'Concatenation distributes over union'], 1, 'Concatenation is not commutative: ab ≠ ba.'),
  Q(3, 'Nov 2024 Q12', 'In PDA notation, Z₀ represents the', ['Element of state', 'Initial stack symbol', 'Final state', 'Top stack alphabet'], 1, 'Z₀ marks the bottom of the stack at the start.'),
  Q(3, 'May 2025 Q10', 'A pushdown machine represents which grammar type?', ['Type 3', 'Type 2', 'Type 1', 'Type 0'], 1, 'PDAs accept context-free languages, which are Type 2.'),
  Q(3, 'May 2026 Q11', 'A PDA configuration (p, w, y) is written as', ['(current state, unprocessed input, stack content)', '(unprocessed input, stack content, current state)', '(current state, stack content, unprocessed input)', '(current symbol, unprocessed input, stack input)'], 0, 'State, remaining input, stack.'),
  Q(3, 'Nov 2025 Q10', 'Instantaneous description of a PDA where q is the state, w the unread input and u the stack', ['(u, q, w)', '(q, u, w)', '(w, q, u)', '(q, w, u)'], 3, 'State first, then input, then stack.'),
  Q(3, 'Jul 2025 P2 Q11', 'Which PDA is equivalent in power to a context-free grammar?', ['Deterministic PDA', 'Non-deterministic PDA', 'Finite automaton', 'Turing machine'], 1, 'DPDAs accept only deterministic CFLs.'),
  Q(3, 'Jul 2025 P1 Q17', 'Which conversion is NOT possible algorithmically?', ['Regular grammar to CFG', 'NPDA to DPDA', 'NFA to DFA', 'NTM to DTM'], 1, 'NPDAs are strictly more powerful than DPDAs.'),
  Q(3, 'Jul 2025 P1 Q14', 'L1 = {0ⁿ1ⁿ}, L2 = {wcwᴿ}, L3 = {wwᴿ}. Which are deterministic CFLs?', ['Only L3', 'Only L1', 'Only L1 and L2', 'All three'], 2, 'L3 needs a guess for the middle, which needs nondeterminism.'),
  Q(3, 'Jul 2025 P2 Q12', 'The pumping lemma for regular languages is mainly used to prove that a language', ['Is regular', 'Is not regular', 'Is context-free', 'Is finite'], 1, 'It can only show non-regularity.'),
  Q(3, 'Nov 2024 Q5', 'The language accepted by a pushdown automaton is', ['Context free', 'Regular', 'Recursive', 'Context aware'], 0, 'PDA ⇔ CFG.'),
  Q(3, 'Nov 2025 Q9', 'The transition function of a PDA is', ['δ: Q × (Σ∪{ε}) × Γ → Q × Γ*', 'δ: Q × (Σ∪{ε}) → Q × Γ*', 'δ: Q × (Σ∪{ε}) × Γ → Q', 'δ: Q × (Σ∪{ε}) × Γ → Γ*'], 0, 'State, input or ε, and stack top go to a new state and a stack string.'),
  Q(4, 'Nov 2024 Q16', 'The halting states of a Turing machine are', ['Start and stop', 'Accept and reject', 'Reject and allow', 'Start and reject'], 1, 'The machine halts by accepting or rejecting.'),
  Q(4, 'Nov 2024 Q14', 'A Turing machine operates over', ['Infinite memory tape', 'Finite memory tape', 'No memory tape', 'Queue memory'], 0, 'The tape is unbounded in both directions.'),
  Q(4, 'Jul 2025 P2 Q15', 'If δ is not defined for the current state and tape symbol, the machine', ['Does not halt', 'Halts', 'Goes into a loop forever', 'Does not go into a loop'], 1, 'No move available means it halts.'),
  Q(4, 'May 2026 Q14', 'If a language L is recursive then', ['A TM exists that does not guarantee halting', 'A TM exists that never halts', 'No TM exists', 'A TM exists that always halts'], 3, 'Recursive means decidable.'),
  Q(4, 'May 2026 Q16', 'Non-deterministic Turing machines are', ['Less powerful than deterministic TMs', 'Equivalent in power to deterministic TMs', 'More powerful than deterministic TMs', 'Not equal to deterministic TMs'], 1, 'They accept the same languages, possibly slower to simulate.'),
  Q(4, 'Nov 2025 Q13', 'A universal Turing machine is capable of', ['Solving only arithmetic functions', 'Working only as a Mealy machine', 'Simulating any other Turing machine', 'Accepting only regular languages'], 2, 'It takes ⟨M, w⟩ as input and simulates M on w.'),
  Q(4, 'May 2025 Q16 · Nov 2025 Q15', 'Recursively enumerable languages are closed under', ['Union only', 'Intersection only', 'Union and intersection', 'Neither'], 2, 'Not closed under complement.'),
  Q(4, 'Jul 2025 P2 Q13', 'In T = (Q, Σ, Γ, q₀, δ), what does Γ represent?', ['Tape alphabet', 'Input symbols', 'Transition function', 'Initial state'], 0, 'Σ is the input alphabet, Γ the tape alphabet.'),
  Q(4, 'Jul 2025 P1 Q16', 'The language {aᵖ | p is prime}', ['Is regular but not context free', 'Is neither regular nor context free, but is accepted by a TM', 'Is not accepted by a TM', 'Is context free but not regular'], 1, 'Pumping lemmas rule out regular and CFL, but a TM can test primality.'),
  Q(4, 'May 2026 Q13', 'In a TM the transition function is defined on a state and a ______ symbol', ['Input and tape', 'Only input', 'Only tape', 'Only blank'], 2, 'δ(q, X) with X from the tape alphabet.'),
  Q(5, 'Nov 2024 Q19', 'CNF-satisfiability belongs to', ['NP class', 'P class', 'NP-complete', 'NP-hard'], 2, 'SAT is the first NP-complete problem (Cook–Levin).'),
  Q(5, 'Nov 2025 Q17', 'Which is TRUE about complexity classes?', ['Every NP-complete problem is NP-hard and belongs to NP', 'NP-hard ⊆ P', 'NP-complete ⊆ P', 'Every NP-hard problem is NP-complete'], 0, 'NP-complete = NP ∩ NP-hard.'),
  Q(5, 'Nov 2025 Q18', 'The Modified PCP differs from PCP because', ['MPCP is decidable and PCP is not', 'MPCP needs an even number of tiles', 'The sequence must start with the first tile in PCP', 'The sequence must start with the first tile in MPCP'], 3, 'MPCP forces tile 1 to be first.'),
  Q(5, 'May 2026 Q20', 'If P ≠ NP, which holds?', ['NP-hard = NP', 'P = NP-complete', 'NP-complete ∩ P = ∅', 'NP-complete = NP'], 2, 'No NP-complete problem can then be solved in polynomial time.'),
  Q(5, 'May 2026 Q19', 'Which problem is in class P?', ['Hamiltonian circuit', 'Travelling salesman', 'Finding a shortest path in a graph', 'Graph colouring'], 2, 'Dijkstra and BFS run in polynomial time.'),
  Q(5, 'May 2025 Q19', 'Which of these is NOT NP-hard?', ['Hamiltonian circuit', '0/1 knapsack', 'Finding bi-connected components of a graph', 'Graph colouring'], 2, 'Bi-connected components are found in linear time.'),
  Q(5, 'May 2025 Q6', 'If a problem needs O(Nᵏ) steps, it is solved in', ['Non-polynomial time', 'Polynomial time', 'Infinite time', 'None of these'], 1, 'Fixed k means polynomial.'),
  Q(5, 'Nov 2025 Q14', 'The halting problem for Turing machines is', ['Decidable', 'Undecidable', 'Regular', 'Context free'], 1, 'Turing’s diagonal argument.'),
  Q(5, 'Nov 2025 Q16', 'If a non-deterministic TM decides a language in polynomial time, the language belongs to', ['P', 'NP-hard', 'NP-complete', 'NP'], 3, 'That is the definition of NP.'),
  Q(5, 'Jul 2025 P1 Q18', 'Which is true?', ['The complement of a recursive or RE language is RE', 'The complement of an RE language is RE', 'The complement of a recursive language is recursive', 'The complement of a CFL is context free'], 2, 'Recursive languages are closed under complement. RE and CFL are not.'),
  Q(5, 'May 2026 Q17 · Jul 2025 P1 Q19', 'If L and its complement are both recursively enumerable, then L is', ['Regular', 'Context sensitive', 'Context free', 'Recursive'], 3, 'Run both machines in parallel. One of them must accept.'),
  Q(5, 'May 2026 Q18', 'A TM accepts every word of L and either rejects or loops on every word not in L. Then L is', ['Recursive', 'Recursively enumerable', 'NP-hard', 'NP-complete'], 1, 'Acceptance without a halting guarantee means RE.')
];

/* ---- Answer skeletons and theory one-pagers ---- */
D.templates = [
  { name: 'NFA to DFA (8 marks)', steps: ['Write the NFA transition table, with final states marked.', 'If there are ε-moves, list the ε-closure of every state first.', 'Start state of the DFA is the ε-closure of q0.', 'For each new subset and each symbol, take the union of moves, then its closure. Add any new subset to the table.', 'A subset is final if it holds a final NFA state. Keep ∅ as a dead state if it appears.', 'Rename the subsets, draw the DFA, and test the strings from the question on both machines.'] },
  { name: 'Mealy and Moore (8 marks)', steps: ['State the difference in one line: Mealy output is on the transition, Moore output is on the state, and Moore output is one symbol longer.', 'Moore to Mealy: output of a transition is the output of its target state.', 'Mealy to Moore: split each state q into (q, o), one copy per output that arrives at q.', 'Add a start state with a chosen initial output if the start state has incoming edges with different outputs.', 'Run one input through both machines to show they agree.'] },
  { name: 'Minimize a DFA (8 marks)', steps: ['Remove states unreachable from the start.', 'List all pairs. Mark every (final, non-final) pair in round 0.', 'Repeat: mark (p, q) if some symbol takes them to a marked pair.', 'Unmarked pairs are equivalent. Merge them into classes.', 'Draw the minimized DFA and compare the state count.'] },
  { name: 'Simplify, CNF (8 or 15 marks)', steps: ['ε-productions: find nullable variables, add every version of each rule with them dropped, delete A→ε.', 'Unit productions: for each unit pair (A, B) copy B’s non-unit rules to A, delete A→B.', 'Useless symbols: delete non-generating variables, then unreachable ones.', 'CNF: replace terminals inside longer rules by new variables Cₐ → a.', 'CNF: break rules longer than two symbols with new variables D₁, D₂, …', 'Show the final grammar and confirm every rule is A→BC or A→a.'] },
  { name: 'Greibach normal form (8 or 15 marks)', steps: ['Simplify first (no ε, no unit rules, no useless symbols). Going through CNF first is allowed and usually safer.', 'Number the variables A₁ … Aₘ.', 'For i = 1 to m: substitute any rule Aᵢ → Aⱼγ with j < i, then remove left recursion Aᵢ → Aᵢα by adding Zᵢ.', 'After this pass every rule starts with a terminal or a higher-numbered variable.', 'Back-substitute from Aₘ up to A₁, then substitute into the Zᵢ rules.', 'Replace terminals that are not first by variables Cₐ → a. State the final grammar.'] },
  { name: 'PDA design (8 marks)', steps: ['Say the idea in two lines: what you push, what you pop, when you switch phase.', 'Give the 7-tuple, then the δ table (one line per move).', 'State the acceptance mode (final state or empty stack) and stick to it.', 'Trace one accepted string with instantaneous descriptions (q, input left, stack).', 'Trace one rejected string and say why it fails.'] },
  { name: 'CFG to PDA (8 marks)', steps: ['Use one working state. Push S above Z₀ to start.', 'For each rule A → α add δ(q, ε, A) = (q, α).', 'For each terminal a add δ(q, a, a) = (q, ε).', 'Add δ(q, ε, Z₀) = (qf, Z₀) to accept.', 'Trace the given string, choosing the rule that matches the next input symbol at each step.'] },
  { name: 'Turing machine (8 or 15 marks)', steps: ['Write the idea as 3 to 5 plain sentences (mark, scan right, return, repeat, verify).', 'List the tape alphabet and what each marker means.', 'Give the transition table or diagram.', 'Trace the sample string from the question step by step with instantaneous descriptions.', 'State when the machine accepts and what it does on a wrong string.'] },
  { name: 'PCP instance (8 marks)', steps: ['Write the tiles as a table (top over bottom).', 'Pick a first tile whose top and bottom agree as prefixes.', 'Track the overhang after each tile. Extend only with tiles that keep the two strings consistent.', 'Stop when the overhang is empty and give the index sequence with both strings written out.', 'If every tile has a longer top than bottom (or the reverse), say that no sequence can ever balance them.', 'Close with one line: PCP is undecidable in general, so no algorithm decides every instance.'] }
];

D.theory = [
  { title: 'Rice’s theorem', body: ['Statement: every non-trivial property of the language accepted by a Turing machine is undecidable. A property is non-trivial if some recursively enumerable languages have it and some do not.', 'Proof idea: assume ∅ does not have the property (otherwise use the complement). Pick a language L₀ with the property, accepted by M₀. Given ⟨M, w⟩, build M′ that on input x first simulates M on w, and if that halts, runs M₀ on x. Then L(M′) = L₀ if M accepts w, and ∅ otherwise.', 'A decider for the property would therefore decide whether M accepts w, which is the undecidable acceptance problem.'] },
  { title: 'Lₑ is not recursive', body: ['Lₑ = {⟨M⟩ : L(M) = ∅}.', 'Reduce from the acceptance problem. Given ⟨M, w⟩, build M′ that ignores its input, runs M on w, and accepts if M accepts. Then L(M′) ≠ ∅ exactly when M accepts w.', 'A decider for Lₑ would decide acceptance, so Lₑ is not recursive. Its complement is recursively enumerable, so Lₑ itself is not even RE.'] },
  { title: 'Halting problem', body: ['Claim: no TM decides whether M halts on w.', 'Suppose H does. Build D: on input ⟨M⟩, run H on (M, ⟨M⟩); if H says "halts", loop forever; otherwise halt.', 'Run D on ⟨D⟩. If D halts on ⟨D⟩ then D loops, and if it loops then it halts. Contradiction, so H cannot exist.'] },
  { title: 'PCP is undecidable', body: ['Show MPCP reduces to PCP by adding a marker symbol to every tile so that the first tile is forced to start.', 'Show the acceptance problem reduces to MPCP: tiles encode one move of M on w each, so a matching sequence exists exactly when M reaches an accepting configuration.', 'So a PCP decider would decide acceptance, which is impossible.'] },
  { title: 'Decidable, recursive and RE', body: ['Recursive (decidable): some TM halts on every input and accepts exactly L.', 'Recursively enumerable: some TM accepts exactly L, but may loop on strings outside L.', 'L is recursive if and only if both L and its complement are RE.', 'Closure: recursive languages are closed under union, intersection, concatenation, star and complement. RE languages are closed under union, intersection, concatenation and star, but not complement.', 'Examples: halting problem and acceptance problem are RE and undecidable. Their complements are not RE.'] },
  { title: 'P, NP, NP-complete, NP-hard', body: ['P: decidable by a deterministic TM in polynomial time. NP: decidable by a non-deterministic TM in polynomial time, equivalently a proposed solution can be checked in polynomial time.', 'NP-hard: every problem in NP reduces to it in polynomial time. It need not be in NP.', 'NP-complete: in NP and NP-hard. SAT was the first (Cook–Levin). Others: 3-SAT, clique, vertex cover, Hamiltonian circuit, TSP (decision version).', 'P ⊆ NP. Whether P = NP is open. If any NP-complete problem is in P then P = NP.'] },
  { title: 'Variants of Turing machines', body: ['Multitape: several tapes with independent heads. Same power as a single tape. A single-tape machine simulates t steps in O(t²) time.', 'Multihead: one tape, several heads. Same power.', 'Two-way infinite tape, multidimensional tape, offline TM: all equivalent in power.', 'Non-deterministic: several choices per move. Accepts the same languages as a deterministic TM, simulated by breadth-first search over configurations (exponential slowdown).', 'Universal TM: takes ⟨M, w⟩ and simulates M on w. A typical build uses three tapes (description of M, tape of M, state of M).'] },
  { title: 'Pumping lemma, regular', body: ['If L is regular there is p such that every w in L with |w| ≥ p splits as w = xyz with |xy| ≤ p, |y| ≥ 1 and xyⁱz in L for all i ≥ 0.', 'Template for L = {aⁿbⁿ}: assume L is regular with length p. Take w = aᵖbᵖ. Since |xy| ≤ p, y is all a’s, say y = aᵏ with k ≥ 1. Then xy²z has p + k a’s and p b’s, which is not in L. Contradiction.', 'For {0ⁿ10ⁿ} take w = 0ᵖ10ᵖ, and y lies inside the first block of zeros.'] },
  { title: 'Pumping lemma, context-free', body: ['If L is context free there is p such that every w in L with |w| ≥ p splits as w = uvxyz with |vxy| ≤ p, |vy| ≥ 1 and uvⁱxyⁱz in L for all i ≥ 0.', 'Template for {aⁿbⁿcⁿ}: take w = aᵖbᵖcᵖ. Because |vxy| ≤ p, the part vxy cannot touch all three letters. Pumping then changes at most two letter counts, so the three counts are no longer equal. Contradiction, so the language is not context free.'] },
  { title: 'Properties of regular sets', body: ['Closed under union, concatenation, Kleene star, complement, intersection, difference and reversal.', 'Examples: (a+b) ∪ c* is regular. The complement of a regular language over Σ is Σ* minus it, built by swapping final and non-final states of a complete DFA. Intersection comes from the product automaton.', 'Closure under concatenation and star is built with ε-moves between NFAs.'] },
  { title: 'DPDA vs NPDA', body: ['DPDA accepts the deterministic CFLs. NPDA accepts all CFLs, so it is strictly more powerful.', 'Example: {wwᴿ} needs a guess of the middle, so an NPDA accepts it and no DPDA does. {wcwᴿ} is deterministic.', 'Unlike finite automata, nondeterminism cannot be removed from PDAs.'] }
];

D.facts = {
  closure: {
    cols: ['Union', 'Concat.', 'Star', 'Intersection', 'Complement'],
    rows: [
      ['Regular', 1, 1, 1, 1, 1],
      ['Context free', 1, 1, 1, 0, 0],
      ['Recursive', 1, 1, 1, 1, 1],
      ['Recursively enumerable', 1, 1, 1, 1, 0]
    ]
  },
  hierarchy: [
    ['Type 3', 'Regular grammar', 'Finite automaton'],
    ['Type 2', 'Context-free grammar', 'Pushdown automaton'],
    ['Type 1', 'Context-sensitive grammar', 'Linear bounded automaton'],
    ['Type 0', 'Unrestricted grammar', 'Turing machine']
  ],
  oneLiners: [
    ['Z₀', 'initial (bottom) stack symbol'],
    ['TM halting states', 'accept and reject'],
    ['MPCP', 'the sequence must start with tile 1'],
    ['UTM', 'simulates any TM given its description and input'],
    ['NTM vs DTM', 'same power'],
    ['NPDA vs DPDA', 'NPDA is more powerful'],
    ['NFA vs ε-NFA vs DFA', 'same power'],
    ['SAT', 'NP-complete'],
    ['L and L̄ both RE', 'L is recursive'],
    ['CNF rule shape', 'A → BC or A → a'],
    ['GNF rule shape', 'A → aα, α a string of variables'],
    ['Pumping lemma regular', 'proves a language is NOT regular']
  ]
};

if (typeof module !== 'undefined' && module.exports) module.exports = D; else root.FLA_DATA = D;
})(typeof window !== 'undefined' ? window : globalThis);
