// Three more papers: Nov 2023 (N23), May 2024 (M24), Jul 2024 (J24). Same layout as slots.js and mcq.js.
Object.assign(SLOTS[1],{
N23:['Construct a DFA equivalent to the NFA with states a,b,c,d on {0,1} (table given).','Design a minimised DFA by converting the regular expression a(a+b+c)*(a+b+c).'],
M24:['DFA that accepts an odd number of 1s and an even number of 0s.','Convert the regular expression 10+(0+11)0*1 into an ε-NFA.'],
J24:['Prove 1²+2²+…+n² = n(n+1)(2n+1)/6 by induction. (This is a Discrete Maths style question.)','Construct a DFA equivalent to the NFA with states P,Q,R,S on {0,1}: P→{p,q}/{p}, Q→{r}/{r}, R→{s}/–, S→{s}/{s}.']});
Object.assign(SLOTS[2],{
N23:['(i) Find the language of S→aSb|aAb, A→bAa, A→ba. (ii) Write a CFG for the positive and negative integers.','(i) Simplify a given CFG (S→AB, A→a, B→b, B→C, E→C|ε). (ii) Check whether S→bA|aB, A→bAA|aS|a, B→bBB|bS|b is in CNF.'],
M24:['Simplify S→aA|a|C, A→aB|ε, B→aA, C→cCD.','Leftmost and rightmost derivations and a parse tree for w = +*-xyxy using E→+EE|*EE|-EE|x|y.'],
J24:['(1) Minimised DFA for the RE 10+(0+11)0*1. (2) Prove that every regular expression has an ε-NFA.','Show that regular languages are closed under union, intersection, Kleene closure and difference.']});
Object.assign(SLOTS[3],{
N23:['PDA for {wcwᴿ : w ∈ {a,b}+} by empty stack.','PDA for {aⁿbⁿcⁿ⁺ᵐ : n,m ≥ 1} by empty stack and by final state.'],
M24:['PDA for {aⁿbᵐcᵐdⁿ : m,n ≥ 1}.','PDA for {wwᴿ : w ∈ {a,b}*}.'],
J24:['What are DPDA and NPDA? Explain with examples.','PDA for {aⁿbⁿ : n ≥ 1} by empty stack. Draw the diagram and show by instantaneous descriptions that 0011 is accepted.']});
Object.assign(SLOTS[4],{
N23:['TM for {0ⁿ1ⁿ}. Show the instantaneous descriptions for 0011.','TM for the 2’s complement of a binary number.'],
M24:['Prove that the union of two recursive languages is recursive. Discuss the complement.','TM that accepts strings over {a,b} containing aba as a substring.'],
J24:['Convert S→XA|BB, B→b|SB, X→b, A→a to GNF.','TM for {aⁿbⁿcⁿ : n ≥ 0}.']});
Object.assign(SLOTS[5],{
N23:['Define PCP. Find a solution for A = (1, 10111, 10), B = (111, 10, 0).','Define the diagonalisation language L_d and show that it is not recursively enumerable.'],
M24:['Short notes on NP-hard and NP-complete, and how they relate.','PCP instance A = (1, 10111, 10), B = (111, 10, 0).'],
J24:['Define PCP and prove that PCP is undecidable.','Explain class P, class NP, NP-complete and NP-hard with examples.']});
PARTC.unshift(
{p:'N23',q:['Bus-stop pattern: write a regular expression, draw a DFA, list the accepted strings, design an ε-NFA with Thompson’s construction, then an NFA converted to a DFA.','(i) Convert a given PDA (states p,q, stack X,Z) to a CFG (8 marks). (ii) Leftmost and rightmost derivations and parse tree for ((a,a),^(a)),a) in S→a|^|(T), T→T,S|S (7 marks).']},
{p:'M24',q:['Write the code for <M, 1011> for a given TM (q0 to q4) listing its moves, and also design a TM that adds two numbers.','Construct a Turing machine that accepts all palindromes over {0,1}.']},
{p:'J24',q:['(a) State and explain Rice’s theorem. (b) Prove that MPCP reduces to PCP.','(a) TM that replaces every 111 by 101 in a string of 0s and 1s. (b) TM for proper subtraction m − n when m > n.']});
// hits for the three new papers, by topic index (same indexes as D.topics)
const NEWHITS={
0:['21a·26¹⁵',null,'21b'],2:['21b·26¹⁵','21a','22a'],3:['21b·26¹⁵','21b','22a'],5:['22b','22a',null],6:['22b',null,null],7:[null,null,'24a'],
9:['22a·27¹⁵','22b',null],10:[null,null,'22b'],11:['23a·23b','23a·23b','23a·23b'],13:['27¹⁵',null,null],
14:['24a·24b','24b·26¹⁵·27¹⁵','24b·27¹⁵'],15:['24b','26¹⁵','27¹⁵'],16:[null,'27¹⁵',null],17:['24a',null,'24b'],18:[null,'26¹⁵',null],
19:['25a','25b','25a·26¹⁵'],20:['25b','24a',null],21:[null,null,'26¹⁵'],22:[null,'25a','25b']};
MCQ_RAW.N23=[
["Regular expression for all strings over {1} of odd length",["1*","1(11)*","(111)*","1+"],1,"Odd length = one 1 followed by pairs of 1s."],
["Which is true for DFA and NFA?",["A DFA has exactly one transition for each symbol","An NFA has finite states for each alphabet","A DFA has ε-moves","A DFA can have many transitions for each symbol"],0,"A DFA has exactly one move for each state and symbol. ε-moves and several moves belong to NFAs."],
["L = {x01y : x, y are strings of 0s and 1s} describes",["The language that reads the input (0+1)+","Strings that may not have 01 anywhere","Strings of 0s and 1s that must have 01 somewhere","Strings of 0s and 1s separately"],2,"x01y means 01 must appear somewhere in the string."],
["Select the regular expression for the given diagram (q0 splits on a and b into two branches).",["aa*+bb*","a*+b*","a-kb","aba*"],0,"The figure is not readable. If one branch loops on a and the other on b, the language is a⁺ ∪ b⁺ = aa*+bb*. Check this against your paper.","diagram"],
["A CFG is in Chomsky normal form if every production is of the form",["A→BC or A→A","A→BC or A→a","A→BCa or B→b","A→BC or A→B"],1,"CNF: A→BC or A→a."],
["A context-free language is ambiguous if",["it has two or more leftmost derivations for some string","it has two or more rightmost derivations for some string","both (A) and (B)","it has one leftmost derivation for some string"],2,"Two leftmost derivations is the same as two rightmost derivations, because both mean two parse trees."],
["Which statement is false?",["A CFL can be converted into Chomsky normal form","A CFL can be converted into Greibach normal form","A CFL is accepted by a pushdown automaton","All of the above statements are false"],3,"The first three are true. Option D says all three are false, so it is the false one."],
["The CFG S→A111|S1, A→A0|00 is equivalent to",["{0ⁿ1ᵐ | n = 2, m = 3}","{0ⁿ1ᵐ | n = 1, m = 5}","{0ⁿ1ᵐ | n greater than two and m greater than four}","{0ⁿ1ᵐ | n greater than two and m less than four}"],2,"A gives 0ⁿ with n ≥ 2, and S gives 111 followed by more 1s, so m ≥ 3. No option says exactly that, so C is the closest.","check"],
["Which pair has different expressive power?",["DFA and NFA","DPDA and NPDA","Deterministic and non-deterministic single-tape TM","Single-tape and multi-tape TM"],1,"NPDA is more powerful than DPDA. The other pairs are equal."],
["Lexical analysis for a modern language like Java needs which model?",["Finite state automata","Deterministic pushdown automata","Non-deterministic pushdown automata","Turing machine"],0,"Tokens are described by regular expressions, so a finite automaton is enough."],
["The recognising power of NFA and DFA is",["different","sometimes different","the same","sometimes the same"],2,"Subset construction makes any NFA into a DFA."],
["A finite state machine can recognise",["any grammar","only CFG","any unambiguous grammar","only regular grammar"],3,"Regular languages only."],
["Which statement is false?",["CFG can specify lexical and syntax rules","Type checking is done before parsing","High-level programs can be translated to intermediate representations","Arguments to a function can be passed using the program stack"],1,"Type checking is done after parsing, on the parse tree."],
["Which statement is valid for the language (the language is missing from the scan)?",["It is not accepted by a Turing machine","It is regular but not context-free","It is context-free but not regular","It is neither regular nor context-free, but accepted by a Turing machine"],3,"The language line is missing. The same four options came with {aᵖ : p prime} in Jul 2025, and the answer there was D.","check"],
["Which is NOT a possible result of running a Turing machine on an input?",["It may halt and accept","It may halt by changing the input","It may halt and reject","It may never halt"],1,"The outcomes are accept, reject, or loop forever."],
["A Turing machine is more powerful than an FSM because",["its head moves in one direction","its head moves in both directions","its head keeps moving in both directions","it can remember arbitrarily long sequences of the input string"],3,"Unbounded tape memory is the real difference."],
["If a problem has an algorithm to answer it, we call it",["Decidable","Solved","Recognizable","Decidable and solvable"],0,"Decidable."],
["Which is true for the halting problem?",["It is recursively enumerable","It is undecidable","Both (a) and (b)","It is enumerable"],2,"The halting problem is RE and undecidable."],
["A language L is ______ if some TM M has L(M) = L and M halts on every input",["Turing acceptable","Decidable","Undecidable","Turing unacceptable"],1,"Always halting means decidable (recursive)."],
["Problems with no algorithm, whether or not a TM that fails to halt accepts them, are",["Decidable","Undecidable","Computable","Decidable and computable"],1,"Undecidable."]];
MCQ_RAW.M24=[
["Automata used to develop a learning model and involved in decision making",["Pushdown automata","Linear bounded automata","Finite automata","Discrete automata"],2,"Finite automata model decision making in simple systems."],
["If an NFA has N states, the DFA can have a maximum of",["2ᴺ states","N/2 states","2N states","N states"],0,"Subset construction gives at most 2ᴺ states."],
["A language is regular if and only if it is",["accepted by a DFA","accepted by a PDA","accepted by an LBA","accepted by a Turing machine"],0,"Regular = accepted by a DFA."],
["Which is NOT an example of a finite state system?",["Elevator mechanism","Combination locks","Traffic lights","Digital watches"],3,"All four can be modelled by finite state machines. The key probably treats a watch as a counter. Treat this as a doubtful question.","check"],
["In G = (V, E, P, S), the symbol S represents the",["Accepting state","Starting variable","Sensitive grammar","Starting state"],1,"S is the start variable. (E stands for the terminal set Σ.)"],
["A grammar with n > 1 parse trees for a string is called",["Unambiguous","Ambiguous","Regular","Recursive"],1,"More than one parse tree = ambiguous."],
["Which is NOT a grammar simplification procedure?",["Removal of epsilon productions","Removal of unit productions","Removal of useless symbols","Removal of non-reachable states"],3,"Non-reachable states belong to automata. Non-reachable symbols are part of removing useless symbols."],
["Which of these is in CNF?",["A→Aw","A→x","A→xw","A→Xw"],1,"A→x with a single terminal. (Capital X is not a terminal.)"],
["The data structure used by a PDA to process the string is",["Stack","Queue","List","Array"],0,"Stack."],
["The language accepted by a DPDA is",["Regular expression","Context free language","Recursively enumerable","Regular grammar"],1,"Deterministic context-free languages, which are CFLs."],
["Reducing the input string to the start symbol of a grammar is called",["Top-down parsing","Bottom-up parsing","Syntactic parsing","Hybrid parsing"],1,"Bottom-up parsing."],
["Which is NOT a property of CFLs?",["Kleene closure","Homomorphism","Intersection","Concatenation"],2,"CFLs are not closed under intersection."],
["Which can accept even palindromes over {a,b}?",["Deterministic automaton","Turing machine","NDFA","Linear bounded automata"],1,"Even palindromes need guessing the middle (NPDA). A Turing machine can do it, and so can an LBA, so two options fit.","check"],
["A Turing machine has",["Finite memory","Infinite memory","No memory","Stack memory"],1,"Infinite tape."],
["Type 0 languages are called",["Recursively enumerable","Regular expressions","Recursive","Context free grammar"],0,"Type 0 = RE."],
["In the 6-tuple TM (Q, X, Σ, δ, q0, B, F style), X represents",["Tape alphabet","Stack symbol","Initial state","Final state"],0,"X is the tape alphabet Γ."],
["A problem that can be validated in polynomial time is called",["NP problem","P problem","PCP problem","None of the above"],0,"Verified in polynomial time = NP."],
["The Post Correspondence Problem is",["a decidable decision problem","an undecidable decision problem","not a decision problem","an NP problem"],1,"PCP is undecidable."],
["Problems in class NP have",["a deterministic algorithm","a non-deterministic polynomial algorithm","a non-polynomial algorithm","no solution"],1,"NP = solved by a non-deterministic polynomial-time algorithm."],
["The subset sum problem is an ideal example of",["P","NP","NP-hard","Undecidable"],1,"Subset sum is NP-complete, so it is in NP. NP-hard is also true, but NP is the usual key."]];
MCQ_RAW.J24=[
["Which regular expression identity is genuine?",["(x+y)* = x*+y*","(x+y)* = x*y*","(x+y)* = (x*y*)*","x*y* = x*+y*"],2,"(x*y*)* generates every string over x and y, the same as (x+y)*."],
["The limitation of finite automata is",["Recognises non-regular grammar","Fails to recognise regular grammar","Recognises context free grammar","Cannot remember a large amount of memory"],3,"An FA has only finite memory."],
["Regular expression for L = {x ∈ {0,1}* : x starts with 1 and ends with 0}",["0(0*1*)*1","0(0*+1*)1","1(0*+1*)*0","1(0*+1*)0"],2,"Start with 1, anything in the middle, end with 0."],
["The DFA with q0 −b→ q0, q0 −a→ q1, q1 −a→ q1, q1 −b→ q2, q2 −a→ q1, q2 −b→ q0 and final state q2 accepts",["aaabbbab","ababa","bbbaaaa","bbaaabb"],0,"It accepts the strings that end in ab. aaabbbab ends with ab."],
["X1: S→aXb|bXa|XX|a and S→aXb|bXa|a are not equivalent. X2: X→XX|XXX|aXb|bXa|ε and X→XX|aXb|bXa|ε are equivalent.",["X1 correct, X2 not correct","Both X1 and X2 not correct","X1 correct, X2 correct","Both X1 and X2 correct"],2,"The first pair differs because XX gives the string aa, which the other cannot. In the second, XXX is XX followed by X, so it adds nothing. Both statements are right.","check"],
["A context-sensitive grammar is",["Type 0","Type 1","Type 2","Type 3"],1,"Type 1."],
["If all productions have a single non-terminal on the left, the grammar is",["Context sensitive","Context free","Unrestricted","Pharser grammar"],1,"That is the definition of a context-free grammar."],
["The general format of Chomsky normal form is",["A→aB | a","X→YZ | d","X→ABC | ac","A→aXY | a"],1,"X→YZ or X→d."],
["A pushdown automaton does NOT have",["Finite set of input symbols","Starting state","Special rejection state","Transition function"],2,"A PDA has no special rejection state."],
["A deterministic PDA is a PDA in which",["no state p has two or more outgoing transitions on the same input and stack symbol","no state p has two or more outgoing transitions","more than one state can have two or more outgoing transitions","at least one state has more than one transition"],0,"Determinism means one possible move for each input and stack symbol."],
["The PDA configuration (q0, a, b) represents",["(current state, input, stack symbol)","(current state, stack symbol, input)","(next state, input, stack symbol)","(next state, stack symbol, input)"],0,"State, input, stack."],
["A pushdown automaton with two stacks is equivalent to",["a deterministic finite automaton","an ε-NFA","a Turing machine","a non-deterministic finite automaton"],2,"Two stacks can imitate a TM tape."],
["In a multi-head Turing machine there are",["more than one head on the tape","more than one input tape","the same model as the basic one","multiple tracks on the input tape"],0,"Several heads on one tape."],
["An instantaneous description of a Turing machine consists of",["current state and entire input to be processed","current state and processed input","next state and already processed input","next state and entire input to be processed"],0,"State, tape contents and head position. A is the closest.","check"],
["The number of tuples used to represent a Turing machine is",["5","6","7","8"],2,"(Q, Σ, Γ, δ, q0, B, F) = 7."],
["After the machine (q0,1)→(q1,a,R), (q1,0)→(qaccept,b,R), … processes 10110, the tape is",["ab110","10bba","10110","abbba"],0,"Read 1, write a, move right, state q1. Read 0, write b, move right, accept. Tape: ab110. The listed moves have a typo in the scan.","check"],
["If L and L′ are recursively enumerable, then L is",["Regular","Recursive","Context free","Context sensitive"],1,"L and its complement both RE means L is recursive."],
["The relation between RE, CS, recursive and context-free languages is",["CFL ⊂ CS ⊂ RL ⊂ RE","CFL ⊂ CS ⊂ RE ⊂ RL","RE ⊂ RL ⊂ CS ⊂ CFL","RL ⊂ RE ⊂ CS ⊂ CFL"],0,"CFL ⊂ context sensitive ⊂ recursive ⊂ recursively enumerable."],
["Select the false statement",["All context-sensitive languages are recursive","The set of non-recursively-enumerable languages is countable","RE and recursive languages are closed under reversal","RE languages are closed under union"],1,"There are uncountably many languages and only countably many TMs, so the set of non-RE languages is uncountable."],
["Decision problem A is decidable and B is not. Which is correct?",["C is undecidable if C is reducible to B","C is undecidable if B is reducible to C","C is decidable if A is reducible to C","C is decidable if C is reducible to B’s complement"],1,"If B reduces to C and C were decidable, B would be decidable. So C is undecidable."]];
