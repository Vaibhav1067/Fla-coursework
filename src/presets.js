/* Presets taken from the past papers. Shared by the page and the tests. */
(function (root) {
const P = {};

P.nfa = [
  { id: 'n24', label: 'Nov 2024 · Jul 2025 P2: second-last symbol is 1', text: `# NFA: second symbol from the end is 1   (Nov 2024 Q21a, Jul 2025 P2 Q21b)
start: q0
final: q2
q0 0 -> q0
q0 1 -> q0 q1
q1 0 -> q2
q1 1 -> q2`, tests: ['100010', '100000', '11', '0110'] },
  { id: 'm26', label: 'May 2026 Q21b: NFA P,Q,R,S', text: `# May 2026 Q21b
start: P
final: Q S
P 0 -> Q S
P 1 -> Q
Q 0 -> R
Q 1 -> Q R
R 0 -> S
R 1 -> P
S 0 ->
S 1 -> P`, tests: ['01', '0010', '1'] },
  { id: 'j1', label: 'Jul 2025 P1 Q21b: NFA p,q,r,s', text: `# Jul 2025 P1 Q21b
start: p
final: s
p 0 -> p q
p 1 -> p
q 0 -> r
q 1 -> r
r 0 -> s
r 1 ->
s 0 -> s
s 1 -> s`, tests: ['000', '0100', '111'] },
  { id: 'j1e', label: 'Jul 2025 P1 Q21a: ε-NFA p,q,r', text: `# Jul 2025 P1 Q21a-i  (ε-NFA, columns ε a b c)
start: p
final: r
p ε -> q r
p a ->
p b -> q
p c -> r
q ε ->
q a -> p
q b -> r
q c -> p q
r ε ->
r a ->
r b ->
r c ->`, tests: ['b', 'ac', 'bb', 'a'] }
];

P.dfa = [
  { id: 'm25', label: 'May 2025 Q26: minimize this FA', text: `# May 2025 Q26 part 2
start: q0
final: q1 q2 q5
q0 a -> q1
q0 b -> q2
q1 a -> q3
q1 b -> q4
q2 a -> q4
q2 b -> q3
q3 a -> q5
q3 b -> q5
q4 a -> q5
q4 b -> q5
q5 a -> q5
q5 b -> q5`, tests: ['a', 'ab', 'aab', ''] },
  { id: 'xxy', label: 'May 2025 Q21a: strings with no substring xxy', text: `# no substring "xxy" over {x,y}
start: A
final: A B C
A x -> B
A y -> A
B x -> C
B y -> A
C x -> C
C y -> D
D x -> D
D y -> D`, tests: ['xyxy', 'xxy', 'yxxx', 'xxxy'] },
  { id: 'ends01', label: 'Example: ends with ab (Nov 2025 Q4 DFA)', text: `# Nov 2025 Q4: M = ({q0,q1,q2},{a,b},δ,q0,{q2})
start: q0
final: q2
q0 a -> q1
q0 b -> q0
q1 a -> q1
q1 b -> q2
q2 a -> q1
q2 b -> q0`, tests: ['aab', 'abb', 'ababb', 'ab'] }
];

P.mealy = [
  { id: 'j1', label: 'Jul 2025 P1 Q4: Mealy, input 0010', text: `# Jul 2025 P1 Q4
start: q1
q1 0 -> q3 0
q1 1 -> q2 0
q2 0 -> q1 1
q2 1 -> q4 0
q3 0 -> q2 1
q3 1 -> q1 1
q4 0 -> q4 1
q4 1 -> q3 0`, test: '0010' },
  { id: 'm26', label: 'May 2026 Q21a: Mealy to convert', text: `# May 2026 Q21a  (a/1 b/0 style, edges read from the figure)
start: q1
q1 b -> q2 0
q1 a -> q4 1
q2 a -> q4 1
q2 b -> q2 1
q4 a -> q3 0
q4 b -> q4 1
q3 a -> q1 1
q3 b -> q1 1`, test: 'abab' }
];
P.moore = [
  { id: 'j1', label: 'Jul 2025 P1 Q21b-ii: Moore, runs aabab and ababb', text: `# Jul 2025 P1 Q21b-ii
start: q0
out: q0=0 q1=0 q2=1
q0 a -> q1
q0 b -> q0
q1 a -> q1
q1 b -> q2
q2 a -> q1
q2 b -> q0`, test: 'aabab' },
  { id: 'n24', label: 'Nov 2024 Q21b: print a for 10, b for 11, else c', text: `# Moore machine: last two bits 10 -> a, 11 -> b, otherwise c
start: s
out: s=c z=c o=c a=a b=b
s 0 -> z
s 1 -> o
z 0 -> z
z 1 -> o
o 0 -> a
o 1 -> b
a 0 -> z
a 1 -> o
b 0 -> a
b 1 -> b`, test: '1011010' }
];

P.grammar = [
  { id: 'j1g', label: 'Jul 2025 P1 Q22b-i as I read it: S→AB, A→BSB|BB|b, B→aAb|a (GNF)', text: `S -> AB\nA -> BSB | BB | b\nB -> aAb | a`, alphabet: 'ab' },
  { id: 'm25', label: 'May 2025 Q22b: S→AA|a, A→SS|b  (to GNF)', text: `S -> AA | a\nA -> SS | b`, alphabet: 'ab' },
  { id: 'm26', label: 'May 2026 Q26: to GNF', text: `S -> aA | bB\nB -> bB | ε\nA -> aA | ε`, alphabet: 'ab' },
  { id: 'j2', label: 'Jul 2025 P2 Q22b: to GNF', text: `S -> XB | AA\nA -> a | SA\nB -> b\nX -> a`, alphabet: 'ab' },
  { id: 'j1', label: 'Jul 2025 P1 Q27: S→ABC, B and C nullable (CNF)', text: `S -> ABC\nA -> BC | a\nB -> bAC | ε\nC -> cAB | ε`, alphabet: 'abc' },
  { id: 'm26c', label: 'May 2026 Q22a: to CNF', text: `S -> aAa | bBb | ε\nA -> C | a\nB -> C | b\nC -> CDE | ε\nD -> A | B | ab`, alphabet: 'abE' },
  { id: 'j2c', label: 'Jul 2025 P2 Q26: CNF with ε and unit rules', text: `A -> AaB | Ca | Ba\nB -> aB | ε\nC -> CaC\nD -> Aa`, alphabet: 'a' },
  { id: 'n24', label: 'Nov 2024 Q27: sentence grammar (CNF, GNF, parse tree)', text: `S -> NP VP\nN -> cat | dog\nNP -> the N | NP that VP\nVI -> barks | bites\nVT -> bites | catches\nVP -> VI | VT NP`, words: 'the dog catches the cat' },
  { id: 'n25', label: 'Nov 2025 Q26: voice commands (derive, CNF, GNF)', text: `S -> VP | Aux VP\nVP -> V NP | V\nNP -> Det N | N\nDet -> the | a | ε\nN -> cooler | fan | door\nV -> on | off | open | close\nAux -> please`, words: 'please open the door' }
];
P.ambig = [
  { id: 'n25', label: 'Nov 2025 Q22b: S→aSb|bSa|SS|ε', text: `S -> aSb | bSa | SS | ε` },
  { id: 'n24', label: 'Nov 2024 Q22a: S→AS|A, A→aAb|c', text: `S -> AS | A\nA -> aAb | c` },
  { id: 'j1', label: 'Jul 2025 P1 Q22b: S→0S1S|1S0S|ε', text: `S -> 0S1S | 1S0S | ε` },
  { id: 'j1b', label: 'Jul 2025 P1 Q22b-ii (2): S→AA, A→aAb|bAa|ε', text: `S -> AA\nA -> aAb | bAa | ε` },
  { id: 'j1g', label: 'Jul 2025 P1 Q22b-i as I read it: S→AB, A→BSB|BB|b, B→aAb|a', text: `S -> AB\nA -> BSB | BB | b\nB -> aAb | a` },
  { id: 'unamb', label: 'Control: S→aSb|ε (unambiguous)', text: `S -> aSb | ε` }
];

P.pda = [
  { id: 'eq', label: 'Equal number of a and b (Jul 2025 P1 Q23a, Nov 2025 Q23a)', tests: ['baab', 'abba', 'aab', ''], text: `start: q0
stack: Z0
final: qf
q0 a Z0 -> q0 aZ0
q0 b Z0 -> q0 bZ0
q0 a a -> q0 aa
q0 b b -> q0 bb
q0 a b -> q0 ε
q0 b a -> q0 ε
q0 ε Z0 -> qf Z0` },
  { id: 'abcd', label: 'aⁿbⁿcᵐdᵐ (Jul 2025 P1 Q23b, May 2026 Q23b)', tests: ['aabbcd', 'abcd', 'aabbccdd', 'aabcd'], text: `start: q0
stack: Z0
final: qf
q0 a Z0 -> q0 aZ0
q0 a a -> q0 aa
q0 b a -> q1 ε
q1 b a -> q1 ε
q1 ε Z0 -> q2 Z0
q2 c Z0 -> q2 cZ0
q2 c c -> q2 cc
q2 d c -> q3 ε
q3 d c -> q3 ε
q3 ε Z0 -> qf Z0` },
  { id: 'mnbc', label: 'a^(m+n) bᵐ cⁿ (Nov 2024 Q23a-i)', tests: ['aabc', 'aab', 'abc', 'aaabbc', ''], text: `start: q0
stack: Z0
final: qf
q0 a Z0 -> q0 aZ0
q0 a a -> q0 aa
q0 ε Z0 -> q1 Z0
q0 ε a -> q1 a
q1 b a -> q1 ε
q1 ε Z0 -> q2 Z0
q1 ε a -> q2 a
q2 c a -> q2 ε
q2 ε Z0 -> qf Z0` },
  { id: 'anbn', label: 'aⁿbⁿ, n ≥ 0 (warm-up)', tests: ['aabb', 'aab', ''], text: `start: q0
stack: Z0
final: qf
q0 a Z0 -> q0 aZ0
q0 a a -> q0 aa
q0 b a -> q1 ε
q1 b a -> q1 ε
q0 ε Z0 -> qf Z0
q1 ε Z0 -> qf Z0` }
];
P.cfg2pda = [
  { id: 'n24', label: 'S→0BB, B→0S|1S|0 and 010⁴ (Nov 2024 Q23b, Jul 2025 P1 Q23a-ii)', text: `S -> 0BB\nB -> 0S | 1S | 0`, tests: ['010000', '0000', '01'] },
  { id: 'n25', label: 'E→E+E | E*E | a and a*a (Nov 2025 Q23b)', text: `E -> E+E | E*E | a`, tests: ['a*a', 'a+a*a', 'a+'] },
  { id: 'm26', label: 'S→aA, A→aABC|bB|a, B→b, C→c and abcba (May 2026 Q23a)', text: `S -> aA\nA -> aABC | bB | a\nB -> b\nC -> c`, tests: ['abcba', 'aa', 'abb'] }
];

P.tm = [
  { id: 'anbncn', label: 'aⁿbⁿcⁿ  (Nov 2024 Q24a, Nov 2025 Q24b)', tests: ['aabbcc', 'aaabbbccc', 'aabbc'], text: `start: q0
accept: qf
# for n >= 0 also add:  q0 B -> qf B R
q0 a -> q1 X R
q0 Y -> q4 Y R
q1 a -> q1 a R
q1 Y -> q1 Y R
q1 b -> q2 Y R
q2 b -> q2 b R
q2 Z -> q2 Z R
q2 c -> q3 Z L
q3 a -> q3 a L
q3 b -> q3 b L
q3 Y -> q3 Y L
q3 Z -> q3 Z L
q3 X -> q0 X R
q4 Y -> q4 Y R
q4 Z -> q4 Z R
q4 B -> qf B R` },
  { id: 'zn1n', label: '0ⁿ1ⁿ  (Jul 2025 P1 Q24a-ii)', tests: ['000111', '0011', '0111'], text: `start: q0
accept: qf
q0 0 -> q1 X R
q0 Y -> q3 Y R
q1 0 -> q1 0 R
q1 Y -> q1 Y R
q1 1 -> q2 Y L
q2 0 -> q2 0 L
q2 Y -> q2 Y L
q2 X -> q0 X R
q3 Y -> q3 Y R
q3 B -> qf B R` },
  { id: 'wwr', label: 'w wᴿ, even palindromes  (May 2025, Jul 2025 P1 Q24b, P2 Q27)', tests: ['abba', 'aabbaa', 'aba', 'ab'], text: `start: q0
accept: qf
q0 a -> q1 B R
q0 b -> q2 B R
q0 B -> qf B R
q1 a -> q1 a R
q1 b -> q1 b R
q1 B -> q3 B L
q3 a -> q5 B L
q2 a -> q2 a R
q2 b -> q2 b R
q2 B -> q4 B L
q4 b -> q5 B L
q5 a -> q5 a L
q5 b -> q5 b L
q5 B -> q0 B R` },
  { id: 'add', label: 'Unary addition m + n  (Nov 2024 Q24b, Jul 2025 P2 Q24b)', tests: ['11011', '1101', '0111'], text: `start: q0
accept: qf
# input 1^m 0 1^n  ->  output 1^(m+n)
q0 1 -> q0 1 R
q0 0 -> q1 1 R
q1 1 -> q1 1 R
q1 B -> q2 B L
q2 1 -> qf B R` },
  { id: 'sub', label: 'Proper subtraction m ∸ n  (Jul 2025 P1 Q24a-i)', tests: ['111011', '110111', '1101'], text: `start: q0
accept: qf
# input 1^m 0 1^n  ->  output 1^(m-n), or empty if m <= n
q0 1 -> q0 1 R
q0 0 -> q1 0 R
q1 X -> q1 X R
q1 1 -> q2 X L
q1 B -> q4 B L
q2 X -> q2 X L
q2 0 -> q3 0 L
q3 X -> q3 X L
q3 1 -> q5 X R
q3 B -> q6 B R
q5 X -> q5 X R
q5 0 -> q1 0 R
q4 X -> q4 B L
q4 0 -> q4 B L
q4 1 -> q8 1 L
q4 B -> qf B R
q8 1 -> q8 1 L
q8 B -> qf B R
q6 X -> q6 B R
q6 1 -> q6 B R
q6 0 -> q6 B R
q6 B -> qf B R` },
  { id: 'mul', label: 'Unary multiplication m × n  (May 2025 Q27, Nov 2025 Q27)', tests: ['110111', '1101', '1110111'], text: `start: q0
accept: qf
# input 1^m 0 1^n  ->  output 1^(m*n)
# 1. add a 0 after n:  1^m 0 1^n 0
q0 1 -> q0 1 R
q0 0 -> q0 0 R
q0 B -> q1 0 L
q1 1 -> q1 1 L
q1 0 -> q1 0 L
q1 B -> q2 B R
# 2. take the next 1 of m
q2 X -> q2 X R
q2 1 -> q3 X R
q2 0 -> q11 0 L
# 3. walk to the n block
q3 1 -> q3 1 R
q3 0 -> q4 0 R
# 4. copy each 1 of n to the end
q4 Y -> q4 Y R
q4 1 -> q5 Y R
q4 0 -> q8 0 L
q5 1 -> q5 1 R
q5 0 -> q6 0 R
q6 1 -> q6 1 R
q6 B -> q7 1 L
q7 1 -> q7 1 L
q7 0 -> q7 0 L
q7 Y -> q4 Y R
# 5. restore n and go back to m
q8 Y -> q8 1 L
q8 0 -> q10 0 L
q10 1 -> q10 1 L
q10 X -> q10 X L
q10 B -> q2 B R
# 6. clean up, leave only the product
q11 X -> q11 B L
q11 B -> q12 B R
q12 B -> q12 B R
q12 0 -> q13 B R
q13 1 -> q13 B R
q13 0 -> qf B R` },
  { id: 'copy', label: 'Copy w to ww  (May 2026 Q27)', tests: ['10', '010', '1'], text: `start: q0
accept: qf
# input w over {0,1}  ->  output ww.  X,Y mark 0,1 already copied; A,C hold the copies
q0 0 -> q1 X R
q0 1 -> q2 Y R
q0 A -> q5 0 R
q0 C -> q5 1 R
q0 B -> qf B R
q1 0 -> q1 0 R
q1 1 -> q1 1 R
q1 A -> q1 A R
q1 C -> q1 C R
q1 B -> q3 A L
q2 0 -> q2 0 R
q2 1 -> q2 1 R
q2 A -> q2 A R
q2 C -> q2 C R
q2 B -> q3 C L
q3 0 -> q3 0 L
q3 1 -> q3 1 L
q3 A -> q3 A L
q3 C -> q3 C L
q3 X -> q0 X R
q3 Y -> q0 Y R
q5 A -> q5 0 R
q5 C -> q5 1 R
q5 B -> q6 B L
q6 0 -> q6 0 L
q6 1 -> q6 1 L
q6 X -> q6 0 L
q6 Y -> q6 1 L
q6 B -> qf B R` },
  { id: 'endb', label: 'Strings ending with b  (May 2026 Q24b)', tests: ['aab', 'abba', 'bab', 'b'], text: `start: q0
accept: qf
q0 a -> q0 a R
q0 b -> q1 b R
q1 a -> q0 a R
q1 b -> q1 b R
q1 B -> qf B R` }
];

P.pcp = [
  { id: 'j2', label: 'Jul 2025 P2 Q25a: A=(1,10111,10)  B=(111,10,0)', tiles: [['1', '111'], ['10111', '10'], ['10', '0']] },
  { id: 'j1', label: 'Jul 2025 P1 Q26: A=(ab,bbab,baa,b)  B=(abbb,a,aa,bbb)', tiles: [['ab', 'abbb'], ['bbab', 'a'], ['baa', 'aa'], ['b', 'bbb']] },
  { id: 'n25', label: 'Nov 2025 Q25b: A=(a,bab,bb,abba)? B=(ab,b,bab,ba)', tiles: [['a', 'ab'], ['bab', 'b'], ['bb', 'bab'], ['abba', 'ba']] },
  { id: 'm26', label: 'May 2026 Q25b: M=(ab,bab,bbaaa)  N=(a,ba,bab)', tiles: [['ab', 'a'], ['bab', 'ba'], ['bbaaa', 'bab']] },
  { id: 'm25', label: 'May 2025 Q25a: A=(y, yxy³, yx)  B=(y³, yx, x)', tiles: [['y', 'yyy'], ['yxyyy', 'yx'], ['yx', 'x']] }
];

if (typeof module !== 'undefined' && module.exports) module.exports = P; else root.PRESETS = P;
})(typeof window !== 'undefined' ? window : globalThis);
