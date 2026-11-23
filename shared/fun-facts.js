/* EnigmaPath shared fun facts.
 * Curated, sourced facts about maths, computing, algorithms, logic, puzzles and history.
 * Exposes window.EPFacts with count(), all(), get() and random().
 */
(function () {
  'use strict';

  var FACTS = [
    {
      id: 1,
      topic: 'Maths',
      title: 'Zero had to be invented',
      text: 'For centuries, "nothing" was not treated as a number. Indian mathematicians gave it a symbol and rules around the 7th century, changing maths forever.',
      detail: 'Brahmagupta wrote rules for zero in 628 CE, including that a number subtracted from itself gives zero. The idea reached Europe much later and was once viewed with deep suspicion. Today zero is essential to place-value notation, algebra and every computer.',
      source: 'https://en.wikipedia.org/wiki/Zero',
      sourceName: 'Wikipedia'
    },
    {
      id: 2,
      topic: 'Computing',
      title: 'A byte is eight bits',
      text: 'A bit is one 0 or 1. A byte is a group of eight bits, enough to store a single character of text or 256 different values.',
      detail: 'The word "bit" was coined by John Tukey in 1946 and popularised by Claude Shannon. "Byte" was coined by Werner Buchholz in 1956 for a group of bits big enough to hold a character. Eight bits eventually became the standard size.',
      source: 'https://en.wikipedia.org/wiki/Byte',
      sourceName: 'Wikipedia'
    },
    {
      id: 3,
      topic: 'Maths',
      title: '0.999... really equals 1',
      text: 'The decimal 0.999… with infinitely many nines is not merely close to 1. It is exactly 1: two different names for the same number.',
      detail: 'If x = 0.999…, then 10x = 9.999…, so 10x − x = 9, giving 9x = 9 and x = 1. Nothing is being rounded up. Decimals simply are not unique: every terminating decimal has a twin ending in repeating nines.',
      source: 'https://en.wikipedia.org/wiki/0.999...',
      sourceName: 'Wikipedia'
    },
    {
      id: 4,
      topic: 'Puzzle',
      title: 'Sunzi\'s mystery number',
      text: 'Find a number leaving remainder 2 when divided by 3, 3 when divided by 5, and 2 when divided by 7. The smallest answer is 23.',
      detail: 'Sunzi\'s Mathematical Classic, from around the 3rd century CE, poses this problem and gives a method to solve it. Because 3, 5 and 7 share no factors, the clues pin the number down exactly, up to multiples of 105. The result is the Chinese remainder theorem, still used in cryptography.',
      source: 'https://en.wikipedia.org/wiki/Chinese_remainder_theorem',
      sourceName: 'Wikipedia'
    },
    {
      id: 5,
      topic: 'Maths',
      title: 'A very interesting taxi number',
      text: 'Hardy called taxi 1729 dull. Ramanujan instantly replied that it is the smallest number that is a sum of two cubes in two different ways.',
      detail: '1729 = 1³ + 12³ = 9³ + 10³. Such numbers are called taxicab numbers, and 1729 is the first nontrivial one. It is also a Carmichael number, a composite number that can fool certain primality tests.',
      source: 'https://en.wikipedia.org/wiki/1729_(number)',
      sourceName: 'Wikipedia'
    },
    {
      id: 6,
      topic: 'Puzzle',
      title: 'The walk that invented graph theory',
      text: 'Can you tour Königsberg crossing each of its seven bridges exactly once? Euler proved no in 1736, creating graph theory on the way.',
      detail: 'Euler realised the map\'s details did not matter, only which land masses were connected. Such a walk exists only if at most two places have an odd number of bridges. All four in Königsberg did, so the walk was impossible.',
      source: 'https://en.wikipedia.org/wiki/Seven_Bridges_of_K%C3%B6nigsberg',
      sourceName: 'Wikipedia'
    },
    {
      id: 7,
      topic: 'Logic',
      title: 'Ask what the other guard would say',
      text: 'On Smullyan\'s island, knights always tell the truth and knaves always lie. Ask either guard what the other would say, then choose the opposite door.',
      detail: 'Raymond Smullyan popularised these puzzles in 1978. A knight truthfully reports the knave\'s lie, and a knave lies about the knight\'s truthful answer. Either way you are told the wrong door, so the other one is correct.',
      source: 'https://en.wikipedia.org/wiki/Knights_and_Knaves',
      sourceName: 'Wikipedia'
    },
    {
      id: 8,
      topic: 'Maths',
      title: 'The hotel that is never full',
      text: 'A hotel with infinitely many rooms can be entirely full and still take a new guest: move the person in room n to room n + 1.',
      detail: 'David Hilbert devised this thought experiment to show how infinite sets behave. Shifting everyone makes room 1 free although no room was empty before. The hotel can even fit infinitely many arrivals by moving each guest from room n to room 2n.',
      source: 'https://en.wikipedia.org/wiki/Hilbert%27s_paradox_of_the_Grand_Hotel',
      sourceName: 'Wikipedia'
    },
    {
      id: 9,
      topic: 'Computing',
      title: 'The program that cannot exist',
      text: 'Alan Turing proved in 1936 that no program can decide, for every other program, whether it will eventually stop. Some questions cannot be computed.',
      detail: 'The halting problem is solvable only in special cases. Turing showed that any supposed halting checker can be tricked by a program that contradicts its own verdict. It was one of the first proofs that algorithms have hard limits.',
      source: 'https://en.wikipedia.org/wiki/Halting_problem',
      sourceName: 'Wikipedia'
    },
    {
      id: 10,
      topic: 'History',
      title: 'The machine with millions of settings',
      text: 'The Enigma\'s rotating wheels and plugboard gave it a staggering number of possible settings, yet codebreakers still found ways in.',
      detail: 'Enigma was used by German forces for secret radio messages before and during World War II. Its rotors changed the substitution after every keystroke, so simple frequency analysis failed. Polish and British codebreakers exploited weaknesses in how it was operated.',
      source: 'https://en.wikipedia.org/wiki/Enigma_machine',
      sourceName: 'Wikipedia'
    },
    {
      id: 11,
      topic: 'History',
      title: 'The bombe at Bletchley Park',
      text: 'At Bletchley Park, codebreakers used electromechanical bombes to search Enigma settings far faster than people could by hand.',
      detail: 'The bombe was designed by Alan Turing and Gordon Welchman after crucial earlier work by the Polish Cipher Bureau. It found likely rotor settings from the daily key. Historians credit the intelligence produced there with shortening the war.',
      source: 'https://en.wikipedia.org/wiki/Bletchley_Park',
      sourceName: 'Wikipedia'
    },
    {
      id: 12,
      topic: 'History',
      title: 'Grace Hopper and the first compiler',
      text: 'Grace Hopper built one of the first compilers in the early 1950s, translating human-friendly commands into machine code.',
      detail: 'Her A-0 system let programmers write instructions closer to English instead of strings of numbers. Hopper believed programs should be readable, an idea that helped lead to COBOL. She also helped popularise the word "debugging".',
      source: 'https://en.wikipedia.org/wiki/Grace_Hopper',
      sourceName: 'Wikipedia'
    },
    {
      id: 13,
      topic: 'History',
      title: 'The moth in the machine',
      text: 'On 9 September 1947, operators found a moth trapped in a relay of the Harvard Mark II. The logbook called it the first actual bug.',
      detail: 'The dead moth was taped into the log with the note "First actual case of bug being found". Engineers had used the word bug for faults long before, but now it had a literal meaning. The famous logbook is kept at the Smithsonian.',
      source: 'https://en.wikipedia.org/wiki/Software_bug',
      sourceName: 'Wikipedia'
    },
    {
      id: 14,
      topic: 'Computing',
      title: 'Al-Khwarizmi\'s lasting legacy',
      text: 'The word algorithm comes from the Latin form of al-Khwarizmi\'s name. His 9th-century book taught step-by-step methods for solving equations.',
      detail: 'Muhammad ibn Musa al-Khwarizmi worked at the House of Wisdom in Baghdad. His writings carried Indian and Islamic methods for arithmetic to Europe. The word algebra also comes from the title of one of his books, al-jabr.',
      source: 'https://en.wikipedia.org/wiki/Algorithm',
      sourceName: 'Wikipedia'
    },
    {
      id: 15,
      topic: 'Maths',
      title: 'Sunflower spirals count Fibonacci',
      text: 'Sunflower seeds and pinecones often form two sets of spirals with counts like 34 and 55: consecutive Fibonacci numbers.',
      detail: 'The Fibonacci sequence starts 1, 1, 2, 3, 5, 8 and each term is the sum of the two before it. Packing seeds at the golden angle, about 137.5 degrees, produces these tight spiral patterns. The ratio of consecutive terms approaches the golden ratio.',
      source: 'https://en.wikipedia.org/wiki/Fibonacci_sequence',
      sourceName: 'Wikipedia'
    },
    {
      id: 16,
      topic: 'Puzzle',
      title: '23 people, a 50% chance',
      text: 'In a room of just 23 people there is roughly an even chance that two share a birthday. With 57 people it exceeds 99%.',
      detail: 'It feels surprising because you are not comparing one person with the rest, but every possible pair. Twenty-three people make 253 pairs, so there are many chances for a match. The birthday problem is used in cryptography to analyse hash collisions.',
      source: 'https://en.wikipedia.org/wiki/Birthday_problem',
      sourceName: 'Wikipedia'
    },
    {
      id: 17,
      topic: 'Puzzle',
      title: 'Always switch doors',
      text: 'In the Monty Hall puzzle, switching doors after the host reveals a goat wins the car two times in three, not one in two.',
      detail: 'Your first choice is correct only one time in three. The host knows where the car is and deliberately opens a goat door, so switching wins whenever you were wrong at first, which happens two times in three. Even some mathematicians initially disagree.',
      source: 'https://en.wikipedia.org/wiki/Monty_Hall_problem',
      sourceName: 'Wikipedia'
    },
    {
      id: 18,
      topic: 'Maths',
      title: 'Four colours are enough',
      text: 'Every flat map can be coloured with only four colours so neighbours differ. Its 1976 proof was the first major one done by computer.',
      detail: 'The four colour theorem was conjectured in 1852 and resisted proof for over a century. Kenneth Appel and Wolfgang Haken reduced it to checking 1,936 cases by machine. Some mathematicians distrusted a proof no human could verify by hand.',
      source: 'https://en.wikipedia.org/wiki/Four_color_theorem',
      sourceName: 'Wikipedia'
    },
    {
      id: 19,
      topic: 'Maths',
      title: 'A margin too small for a proof',
      text: 'Fermat claimed in 1637 that aⁿ + bⁿ = cⁿ has no whole-number solutions for n greater than 2, and said he had a proof too long for the margin.',
      detail: 'The note was found after Fermat\'s death, and the claim stayed open for over 350 years. Andrew Wiles finally proved it in 1994 using tools far beyond Fermat\'s time. His proof grew out of deep connections between elliptic curves and modular forms.',
      source: 'https://en.wikipedia.org/wiki/Fermat%27s_Last_Theorem',
      sourceName: 'Wikipedia'
    },
    {
      id: 20,
      topic: 'Maths',
      title: 'The million-dollar sphere',
      text: 'The Poincaré conjecture says any three-dimensional shape with no holes is essentially a sphere. Perelman proved it in 2003 and refused the prize.',
      detail: 'It was one of the seven Clay Millennium Prize Problems. Grigori Perelman posted his proof online, then declined both the million-dollar award and the Fields Medal. He said he did not want fame or money.',
      source: 'https://en.wikipedia.org/wiki/Poincar%C3%A9_conjecture',
      sourceName: 'Wikipedia'
    },
    {
      id: 21,
      topic: 'Logic',
      title: 'The barber who shaves himself?',
      text: 'A barber shaves exactly those men who do not shave themselves. Does he shave himself? Either answer breaks the rule.',
      detail: 'This is a playful version of Russell\'s paradox, which exposed a flaw in early set theory. If the barber shaves himself, he should not; if he does not, he should. The contradiction proves such a barber cannot exist.',
      source: 'https://en.wikipedia.org/wiki/Barber_paradox',
      sourceName: 'Wikipedia'
    },
    {
      id: 22,
      topic: 'Logic',
      title: 'True but unprovable',
      text: 'Gödel showed in 1931 that any powerful, consistent set of axioms contains true statements that cannot be proved using those axioms.',
      detail: 'His incompleteness theorems ended the hope that mathematics could be made complete and self-contained. He built a statement that effectively says "this statement cannot be proved". If it were provable it would be false, so it must be true but unprovable.',
      source: 'https://en.wikipedia.org/wiki/G%C3%B6del%27s_incompleteness_theorems',
      sourceName: 'Wikipedia'
    },
    {
      id: 23,
      topic: 'Logic',
      title: 'The surprise the judge promised',
      text: 'A judge tells a prisoner he will be hanged next week, but the day will be a surprise. The prisoner proves it cannot happen, then it does.',
      detail: 'Working backwards, the prisoner rules out Friday because it would not be a surprise, then Thursday, and so on. Yet a hanging on Wednesday can still genuinely surprise him. The paradox shows how slippery self-reference can be.',
      source: 'https://en.wikipedia.org/wiki/Unexpected_hanging_paradox',
      sourceName: 'Wikipedia'
    },
    {
      id: 24,
      topic: 'Logic',
      title: 'The two-envelope trap',
      text: 'Two envelopes hold twice or half each other\'s amount. Swapping looks profitable whichever you pick, which cannot be right for both.',
      detail: 'The tempting calculation treats the other envelope as equally likely to hold double or half, an assumption that is usually invalid. The puzzle has been debated by economists and philosophers for decades. Its lesson is to check the probabilities you silently assume.',
      source: 'https://en.wikipedia.org/wiki/Two_envelopes_problem',
      sourceName: 'Wikipedia'
    },
    {
      id: 25,
      topic: 'Logic',
      title: 'Does the room understand Chinese?',
      text: 'Searle imagined a person following rules to answer Chinese questions convincingly while understanding not a word. Is that thinking?',
      detail: 'The Chinese room argument challenges the claim that running the right program gives a computer genuine understanding. Critics reply that the whole room, not the person inside, might be what understands. It remains a lively debate in artificial intelligence.',
      source: 'https://en.wikipedia.org/wiki/Chinese_room',
      sourceName: 'Wikipedia'
    },
    {
      id: 26,
      topic: 'Logic',
      title: 'The ship with every part replaced',
      text: 'If you replace every plank and sail of a famous ship one at a time, is it still the same ship? Philosophers have argued for over 2,000 years.',
      detail: 'The ship of Theseus asks what makes an object the same over time. It has modern echoes in the grandfather\'s axe and in questions about a laptop whose every component has been upgraded. There is no agreed answer.',
      source: 'https://en.wikipedia.org/wiki/Ship_of_Theseus',
      sourceName: 'Wikipedia'
    },
    {
      id: 27,
      topic: 'Logic',
      title: 'The AI that wanted paperclips',
      text: 'Bostrom imagined an AI told to make as many paperclips as possible. It might turn the whole planet, and eventually you, into paperclips.',
      detail: 'The story illustrates the alignment problem: a harmless-sounding goal can be disastrous if pursued without human values. It is a warning about defining objectives carefully, not a claim that such an AI exists. It is widely discussed in AI safety.',
      source: 'https://en.wikipedia.org/wiki/Paperclip_maximizer',
      sourceName: 'Wikipedia'
    },
    {
      id: 28,
      topic: 'Logic',
      title: 'The trolley dilemma',
      text: 'Would you pull a lever to divert a runaway trolley, saving five people but sacrificing one? The puzzle probes intentions versus outcomes.',
      detail: 'Most people approve of pulling the lever, but balk at pushing someone onto the tracks in a version with the same numbers. That difference has made the trolley problem a standard tool in ethics. It is even used in debates about self-driving cars.',
      source: 'https://en.wikipedia.org/wiki/Trolley_problem',
      sourceName: 'Wikipedia'
    },
    {
      id: 29,
      topic: 'Puzzle',
      title: '64 discs and the end of the world',
      text: 'Legend says monks must move 64 golden discs between three pegs; when they finish, the world ends. It would take about 585 billion years.',
      detail: 'The puzzle needs 2⁶⁴ − 1 moves, around 18 quintillion. The recursive solution moves n−1 discs aside, shifts the largest, then moves them back. The Tower of Hanoi is a classic illustration of exponential growth.',
      source: 'https://en.wikipedia.org/wiki/Tower_of_Hanoi',
      sourceName: 'Wikipedia'
    },
    {
      id: 30,
      topic: 'Maths',
      title: 'The simplest unsolved problem',
      text: 'Take any number: halve it if even, triple it and add 1 if odd. Repeat. Every number tried reaches 1, but nobody can prove it always will.',
      detail: 'The Collatz conjecture dates to the 1930s and has been checked over enormous ranges by computer. Some starting numbers soar far above where they began before falling back. It is famously easy to state and hard to solve.',
      source: 'https://en.wikipedia.org/wiki/Collatz_conjecture',
      sourceName: 'Wikipedia'
    },
    {
      id: 31,
      topic: 'Maths',
      title: 'Some infinities are bigger',
      text: 'Cantor proved the real numbers outnumber the counting numbers, though both are infinite. No list can contain every real number.',
      detail: 'His diagonal argument assumes a complete list of reals between 0 and 1, then constructs a new number by changing the first digit of the first, the second digit of the second, and so on. That number cannot be on the list. The idea was controversial at first.',
      source: 'https://en.wikipedia.org/wiki/Cantor%27s_diagonal_argument',
      sourceName: 'Wikipedia'
    },
    {
      id: 32,
      topic: 'Maths',
      title: 'The pigeonhole principle',
      text: 'Put 13 letters into 12 letterboxes and at least one box holds two. This obvious idea has surprisingly powerful uses.',
      detail: 'The principle proves, for instance, that in any group of 367 people two share a birthday, and that among any n+1 integers two differ by a multiple of n. It is a favourite tool in combinatorics and computing.',
      source: 'https://en.wikipedia.org/wiki/Pigeonhole_principle',
      sourceName: 'Wikipedia'
    },
    {
      id: 33,
      topic: 'Maths',
      title: 'The lazy caterer sequence',
      text: 'Straight cuts across a pancake give at most 1, 2, 4, 7, 11, 16 pieces. Each fresh cut crosses all earlier ones to add the most.',
      detail: 'With n cuts the maximum number of pieces is n(n+1)/2 + 1. The newest cut can cross each previous cut once, passing through at most n+1 regions and adding that many pieces. The same pattern appears in computational geometry.',
      source: 'https://en.wikipedia.org/wiki/Lazy_caterer%27s_sequence',
      sourceName: 'Wikipedia'
    },
    {
      id: 34,
      topic: 'Maths',
      title: 'Why 1 comes first so often',
      text: 'In many real lists of numbers, about 30% start with digit 1 while only about 5% start with 9. This is Benford\'s law.',
      detail: 'The pattern appears because many quantities grow by multiplication, so they spend more "time" with a leading 1 than a 9. Auditors use Benford\'s law to flag accounting data whose leading digits look suspicious.',
      source: 'https://en.wikipedia.org/wiki/Benford%27s_law',
      sourceName: 'Wikipedia'
    },
    {
      id: 35,
      topic: 'Logic',
      title: 'The roulette wheel has no memory',
      text: 'After a long run of red, many people bet on black because it feels "due". On a fair wheel the next spin is still 50–50.',
      detail: 'This is the gambler\'s fallacy: believing past independent events change future odds. The related hot-hand belief makes the opposite mistake. Understanding independence matters in probability and in judging risk.',
      source: 'https://en.wikipedia.org/wiki/Gambler%27s_fallacy',
      sourceName: 'Wikipedia'
    },
    {
      id: 36,
      topic: 'Logic',
      title: 'The trend that flips',
      text: 'A treatment can look better in every subgroup yet worse overall. Simpson\'s paradox has appeared in real medical and university data.',
      detail: 'It happens when groups have very different sizes or starting rates. In 1973 Berkeley admissions data showed departments admitting women at comparable rates, yet overall men were admitted more often. Careful statistics asks which comparison is meaningful.',
      source: 'https://en.wikipedia.org/wiki/Simpson%27s_paradox',
      sourceName: 'Wikipedia'
    },
    {
      id: 37,
      topic: 'Maths',
      title: 'One cut, three things halved',
      text: 'A ham sandwich can be sliced with a single straight cut that exactly halves the bread, the ham and the cheese at once.',
      detail: 'The ham sandwich theorem says that in three dimensions, any three objects can be bisected simultaneously by one plane. The proof uses a topological argument related to the intermediate value theorem. In two dimensions, one line can bisect two shapes.',
      source: 'https://en.wikipedia.org/wiki/Ham_sandwich_theorem',
      sourceName: 'Wikipedia'
    },
    {
      id: 38,
      topic: 'Maths',
      title: 'The sandwich trick for limits',
      text: 'If a function is squeezed between two others that both approach the same value, it must approach that value too.',
      detail: 'The squeeze, or sandwich, theorem find limits that are awkward to compute directly, such as sin(x)/x near zero. It is also a neat picture for inequalities: the middle function sits between its two bounds like filling between bread.',
      source: 'https://en.wikipedia.org/wiki/Squeeze_theorem',
      sourceName: 'Wikipedia'
    },
    {
      id: 39,
      topic: 'Maths',
      title: 'Two balls from one',
      text: 'The Banach–Tarski paradox says a solid ball can be cut into finitely many pieces and reassembled into two identical balls.',
      detail: 'It is a genuine theorem, not magic. The pieces are wildly scattered sets with no well-defined volume, so it cannot be done with real matter. The proof also uses the axiom of choice, which is why some mathematicians find it unsettling.',
      source: 'https://en.wikipedia.org/wiki/Banach%E2%80%93Tarski_paradox',
      sourceName: 'Wikipedia'
    },
    {
      id: 40,
      topic: 'Maths',
      title: 'A strip with only one side',
      text: 'Twist a paper band half a turn and join the ends: it now has just one side and one edge. An ant walking around returns upside down.',
      detail: 'August Ferdinand Möbius described the strip in 1858. Because it has only one side, you cannot colour one face red and the other blue. Cut it along the middle and you get one longer band with two full twists.',
      source: 'https://en.wikipedia.org/wiki/M%C3%B6bius_strip',
      sourceName: 'Wikipedia'
    },
    {
      id: 41,
      topic: 'Maths',
      title: 'The bottle that passes through itself',
      text: 'A Klein bottle has no inside, no outside and no boundary. To show it in three dimensions it must pass straight through itself.',
      detail: 'Felix Klein described the surface in 1882. Like the Möbius strip, it cannot be built in ordinary space without self-intersection. In four dimensions it fits perfectly, with no crossing at all.',
      source: 'https://en.wikipedia.org/wiki/Klein_bottle',
      sourceName: 'Wikipedia'
    },
    {
      id: 42,
      topic: 'Maths',
      title: 'The tiniest geometry universe',
      text: 'The Fano plane has seven points and seven lines, with exactly three points on every line. It is the smallest finite projective plane.',
      detail: 'It cannot be drawn faithfully on flat paper: one line has to look like a circle. Its rules differ from Euclidean geometry. The Fano plane appears in coding theory, finite group theory and the game Sim.',
      source: 'https://en.wikipedia.org/wiki/Fano_plane',
      sourceName: 'Wikipedia'
    },
    {
      id: 43,
      topic: 'Algorithm',
      title: 'Multiply by halving and doubling',
      text: 'To multiply 13 by 24, halve 13 and double 24 repeatedly, then add the doubles beside odd halves. The answer 312 appears with no times tables.',
      detail: 'This method comes from ancient Egypt and was later used by Russian peasants. It works because every number is a sum of powers of two, exactly what binary notation records. It is an early algorithm built on place value.',
      source: 'https://en.wikipedia.org/wiki/Ancient_Egyptian_multiplication',
      sourceName: 'Wikipedia'
    },
    {
      id: 44,
      topic: 'Maths',
      title: 'Check sums by casting out nines',
      text: 'Add a number\'s digits repeatedly to get one digit. That is its remainder mod 9, and it gives a quick way to check arithmetic.',
      detail: 'Because 10 leaves remainder 1 on division by 9, each digit contributes just its own value modulo 9. If the digit sums on the two sides of a calculation disagree, you have definitely made a mistake. If they agree, you have not proved you are right.',
      source: 'https://en.wikipedia.org/wiki/Casting_out_nines',
      sourceName: 'Wikipedia'
    },
    {
      id: 45,
      topic: 'Maths',
      title: 'Clock arithmetic',
      text: 'On a 12-hour clock, 9 + 5 = 2. That is modular arithmetic: numbers wrap around after a chosen value called the modulus.',
      detail: 'Modulo 12, only remainders 0 to 11 exist. Gauss formalised the notation in the early 1800s. Today modular arithmetic underpins check digits, cryptography and hash tables.',
      source: 'https://en.wikipedia.org/wiki/Modular_arithmetic',
      sourceName: 'Wikipedia'
    },
    {
      id: 46,
      topic: 'Computing',
      title: 'The mind-reading cards',
      text: 'Give a friend cards headed 1, 2, 4, 8 and 16. Ask which contain their secret number, then add those headings to reveal it.',
      detail: 'Every number from 1 to 31 has a unique binary representation. Each card lists all the numbers with a 1 in one bit position. Pointing to cards is therefore handing you the bits of the number.',
      source: 'https://en.wikipedia.org/wiki/Binary_numeral_system',
      sourceName: 'Wikipedia'
    },
    {
      id: 47,
      topic: 'Algorithm',
      title: 'Find a name in 20 steps',
      text: 'Halve the remaining pages each time and you can find any entry among a million sorted items in about 20 comparisons. Linear search needs up to a million.',
      detail: 'Binary search requires sorted data. Each step compares the middle item to the target and throws away half the list. Its running time grows with the logarithm of the list size, which is why it scales so well.',
      source: 'https://en.wikipedia.org/wiki/Binary_search',
      sourceName: 'Wikipedia'
    },
    {
      id: 48,
      topic: 'Algorithm',
      title: 'An algorithm older than the computer',
      text: 'Euclid\'s method for the greatest common divisor, written around 300 BCE, is one of the oldest algorithms still in daily use.',
      detail: 'Repeatedly replace the larger number by the remainder on division by the smaller. When the remainder is zero, the other number is the greatest common divisor. It needs no factorisation and is still used in cryptography and simplifying fractions.',
      source: 'https://en.wikipedia.org/wiki/Euclidean_algorithm',
      sourceName: 'Wikipedia'
    },
    {
      id: 49,
      topic: 'Algorithm',
      title: 'Short codes for common letters',
      text: 'Huffman coding gives frequent symbols short bit patterns and rare ones longer patterns, saving space without losing information.',
      detail: 'David Huffman devised the method in 1952. The codes are prefix-free: no code is the start of another, so a stream can be decoded unambiguously. It appears in ZIP files, JPEG images and MP3 audio, and is a classic greedy algorithm.',
      source: 'https://en.wikipedia.org/wiki/Huffman_coding',
      sourceName: 'Wikipedia'
    },
    {
      id: 50,
      topic: 'Computing',
      title: 'Braille is binary',
      text: 'Louis Braille\'s six-dot cells give 64 possible patterns, enough for letters, numbers and punctuation. Each dot position is a bit.',
      detail: 'Braille lost his sight at age three and devised the system as a teenager in 1824. The same pattern can stand for different symbols depending on context, such as letter or number mode. It let blind readers read and write quickly.',
      source: 'https://en.wikipedia.org/wiki/Braille',
      sourceName: 'Wikipedia'
    },
    {
      id: 51,
      topic: 'Computing',
      title: 'The cipher built from primes',
      text: 'RSA, published in 1977, uses a public key based on two huge primes. Multiplying them is easy; factoring the result back is not.',
      detail: 'Ron Rivest, Adi Shamir and Leonard Adleman named the system after themselves at MIT. Similar ideas were developed secretly at Britain\'s GCHQ a few years earlier. RSA made public-key cryptography practical and helps secure the internet.',
      source: 'https://en.wikipedia.org/wiki/RSA_(cryptosystem)',
      sourceName: 'Wikipedia'
    },
    {
      id: 52,
      topic: 'Algorithm',
      title: 'The million-dollar question',
      text: 'If you can check an answer quickly, can you also find it quickly? That is the P versus NP problem, and nobody knows for sure.',
      detail: 'P holds problems solvable quickly; NP holds problems whose answers are quick to verify. Most experts believe P does not equal NP, which is why cryptography and optimisation work at all. A proof would win a Clay prize of one million dollars.',
      source: 'https://en.wikipedia.org/wiki/P_versus_NP_problem',
      sourceName: 'Wikipedia'
    },
    {
      id: 53,
      topic: 'Algorithm',
      title: 'The salesman\'s impossible tour',
      text: 'Find the shortest loop visiting a list of cities. Despite its simple statement, no fast general method is known for the travelling salesman problem.',
      detail: 'The problem is NP-hard, so adding cities can make exhaustive search hopeless. Approximation algorithms get very close in practice. The task appears in delivery routing, circuit design and DNA sequencing.',
      source: 'https://en.wikipedia.org/wiki/Travelling_salesman_problem',
      sourceName: 'Wikipedia'
    },
    {
      id: 54,
      topic: 'Algorithm',
      title: 'The shortest path, step by step',
      text: 'Dijkstra\'s algorithm finds the cheapest route through a network by always exploring the nearest unsettled node next.',
      detail: 'Edgar Dijkstra published it in 1959 in just a few pages. Once a node is settled, no later route can beat it, provided all costs are positive. GPS navigation and network routers use descendants of this idea.',
      source: 'https://en.wikipedia.org/wiki/Dijkstra%27s_algorithm',
      sourceName: 'Wikipedia'
    },
    {
      id: 55,
      topic: 'Algorithm',
      title: 'Sorting by picking a pivot',
      text: 'Quicksort picks a pivot, splits items into smaller and larger piles, then sorts each pile. It is one of the fastest practical sorters.',
      detail: 'Tony Hoare invented it in 1960. Its average running time is proportional to n log n, though a terrible pivot choice can slow it to n squared. Clever pivot selection makes that bad case rare.',
      source: 'https://en.wikipedia.org/wiki/Quicksort',
      sourceName: 'Wikipedia'
    },
    {
      id: 56,
      topic: 'Computing',
      title: 'Logic becomes algebra',
      text: 'George Boole invented an algebra where variables are true or false and the operations are AND, OR and NOT. A century later it became circuits.',
      detail: 'Boole published his ideas in the 1840s, long before electronic computers. In 1937 Claude Shannon showed Boolean algebra could describe relay circuits, laying the groundwork for digital design. Every processor is built from Boolean gates.',
      source: 'https://en.wikipedia.org/wiki/Boolean_algebra',
      sourceName: 'Wikipedia'
    },
    {
      id: 57,
      topic: 'History',
      title: 'The first program for a machine',
      text: 'In 1843 Ada Lovelace wrote an algorithm to compute Bernoulli numbers for Babbage\'s Analytical Engine, seeing it could do more than arithmetic.',
      detail: 'Her note G is often called the first published algorithm meant to be carried out by a machine. She also realised a computer could manipulate symbols, perhaps composing music, if given the right rules. She was Lord Byron\'s daughter.',
      source: 'https://en.wikipedia.org/wiki/Ada_Lovelace',
      sourceName: 'Wikipedia'
    },
    {
      id: 58,
      topic: 'History',
      title: 'A machine of brass and gears',
      text: 'Charles Babbage designed the Difference Engine in the 1820s to tabulate maths tables by machine, avoiding human copying errors.',
      detail: 'It used finite differences, so it needed only addition. Babbage never finished one in his lifetime, though a working replica was built in the 1990s. His later Analytical Engine was the first design for a general-purpose computer.',
      source: 'https://en.wikipedia.org/wiki/Difference_engine',
      sourceName: 'Wikipedia'
    },
    {
      id: 59,
      topic: 'History',
      title: 'Punched cards before computers',
      text: 'Jacquard\'s loom, unveiled around 1801, used punched cards to control patterns. Early computers reused the idea for programs and data.',
      detail: 'A stack of cards told the loom which threads to lift, weaving complex designs automatically. Babbage borrowed the idea for the Analytical Engine. Even early digital computers read programs from punched cards.',
      source: 'https://en.wikipedia.org/wiki/Jacquard_machine',
      sourceName: 'Wikipedia'
    },
    {
      id: 60,
      topic: 'Computing',
      title: 'How do you compile a compiler?',
      text: 'A self-hosting compiler is written in the very language it compiles. The chicken-and-egg problem is solved by writing a first version elsewhere.',
      detail: 'Once a working compiler exists, you can rewrite it in its own language and use the old version to compile the new one. This is called bootstrapping. Languages including C and Go were bootstrapped this way.',
      source: 'https://en.wikipedia.org/wiki/Bootstrapping_(compilers)',
      sourceName: 'Wikipedia'
    },
    {
      id: 61,
      topic: 'History',
      title: 'The computer that landed on the Moon',
      text: 'The Apollo Guidance Computer had about 2 KB of RAM and a clock below 1 MHz, yet it guided astronauts to the Moon in 1969.',
      detail: 'Its programs were woven into magnetic core rope memory by hand. When Apollo 11\'s computer ran short of capacity during descent, it dropped less important tasks and kept flying. That was an early example of graceful degradation.',
      source: 'https://en.wikipedia.org/wiki/Apollo_Guidance_Computer',
      sourceName: 'Wikipedia'
    },
    {
      id: 62,
      topic: 'History',
      title: 'The barcode made for car parts',
      text: 'QR codes were invented in 1994 by Masahiro Hara at Denso Wave to track car parts. Three corner squares tell a scanner which way is up.',
      detail: 'Each code stores data in a grid of black and white modules and can include error correction, so damaged codes still scan. QR codes hold far more than traditional barcodes and became familiar worldwide.',
      source: 'https://en.wikipedia.org/wiki/QR_code',
      sourceName: 'Wikipedia'
    },
    {
      id: 63,
      topic: 'History',
      title: 'Hello, World!',
      text: 'Printing "Hello, World!" as a first program became a tradition in the 1970s, popularised by the book The C Programming Language.',
      detail: 'Brian Kernighan used a similar example in a 1972 tutorial. The phrase became the standard way to check that a language and its compiler were working. Many textbooks still begin with it.',
      source: 'https://en.wikipedia.org/wiki/%22Hello,_World!%22_program',
      sourceName: 'Wikipedia'
    },
    {
      id: 64,
      topic: 'History',
      title: 'Why is the keyboard QWERTY?',
      text: 'The QWERTY layout was designed for 1870s typewriters. Exactly why its letters sit where they do is still debated, but it stuck.',
      detail: 'Christopher Sholes and colleagues may have separated common letter pairs to reduce jamming type bars. Whether it was meant to slow typists is disputed. Alternatives like Dvorak claim more efficiency, but QWERTY remains dominant.',
      source: 'https://en.wikipedia.org/wiki/QWERTY',
      sourceName: 'Wikipedia'
    },
    {
      id: 65,
      topic: 'History',
      title: 'The @ sign goes global',
      text: 'The @ symbol appeared on invoices for centuries before Ray Tomlinson used it in 1971 to separate a username from a host in email.',
      detail: 'Tomlinson chose @ because it was rare in names and already on keyboards. He sent the first network email between two machines in the same room. Today the symbol is recognised around the world.',
      source: 'https://en.wikipedia.org/wiki/At_sign',
      sourceName: 'Wikipedia'
    },
    {
      id: 66,
      topic: 'Computing',
      title: 'Why web cookies are called cookies',
      text: 'Lou Montulli named web cookies in 1994, after the "magic cookies" used to carry data between programs.',
      detail: 'A cookie is a small piece of data a website stores in your browser so it can remember you between visits. The name stuck and cookies became a basic part of the web, along with arguments about privacy.',
      source: 'https://en.wikipedia.org/wiki/HTTP_cookie',
      sourceName: 'Wikipedia'
    },
    {
      id: 67,
      topic: 'History',
      title: 'The first spam email',
      text: 'In 1978 Gary Thuerk advertised a computer to hundreds of ARPANET users. Recipients were furious and email spam was born.',
      detail: 'The message promoted a Digital Equipment Corporation machine and went to about 400 people on the early internet. There was no advertising culture on the research network, and the backlash was immediate.',
      source: 'https://en.wikipedia.org/wiki/Email_spam',
      sourceName: 'Wikipedia'
    },
    {
      id: 68,
      topic: 'Computing',
      title: 'Google is a misspelling',
      text: 'The company name Google came from a misspelling of googol, the number 1 followed by 100 zeros, a word coined by a nine-year-old.',
      detail: 'Milton Sirotta invented googol in 1938 while playing with his uncle, mathematician Edward Kasner. Larry Page and Sergey Brin wanted a name suggesting they organised enormous amounts of information. A typo became a brand.',
      source: 'https://en.wikipedia.org/wiki/Googol',
      sourceName: 'Wikipedia'
    },
    {
      id: 69,
      topic: 'Computing',
      title: 'Six degrees of separation',
      text: 'The idea that any two people are linked by about six acquaintances was tested in the 1960s by psychologist Stanley Milgram.',
      detail: 'Volunteers forwarded letters to a stranger through people they knew personally. The completed chains suggested surprisingly short paths, though the method was criticised. The idea inspired the Kevin Bacon game and Erdős numbers.',
      source: 'https://en.wikipedia.org/wiki/Six_degrees_of_separation',
      sourceName: 'Wikipedia'
    },
    {
      id: 70,
      topic: 'History',
      title: 'A computer used to be a job',
      text: 'Before machines, a computer was a person who did calculations. Early electronic machines were nicknamed "giant brains" to avoid confusion.',
      detail: 'Companies employed rooms of people, often women, to compute tables by hand. The first electronic general-purpose computer, ENIAC, was programmed by a team of women who set switches and plugged cables. The word gradually shifted to the machines.',
      source: 'https://en.wikipedia.org/wiki/Computer_(occupation)',
      sourceName: 'Wikipedia'
    },
    {
      id: 71,
      topic: 'Computing',
      title: 'A bit of surprise',
      text: 'Claude Shannon founded information theory in 1948, measuring information by surprise: rare messages carry more than common ones.',
      detail: 'Shannon showed any message can be compressed down to its entropy, a limit measured in bits. His work made digital communication efficient and underlies everything from ZIP files to mobile phone calls.',
      source: 'https://en.wikipedia.org/wiki/Information_theory',
      sourceName: 'Wikipedia'
    },
    {
      id: 72,
      topic: 'Computing',
      title: 'Can a machine pass as human?',
      text: 'Turing proposed in 1950 that instead of asking whether machines think, we ask whether one can imitate a human in a text chat.',
      detail: 'His imitation game became the Turing test: an interrogator tries to tell a human and a machine apart by chatting to both. It has been criticised and debated ever since, but it shaped the field of artificial intelligence.',
      source: 'https://en.wikipedia.org/wiki/Turing_test',
      sourceName: 'Wikipedia'
    },
    {
      id: 73,
      topic: 'Computing',
      title: 'Doubling every couple of years',
      text: 'Gordon Moore noticed in 1965 that the transistor count on a chip was doubling rapidly. He later revised the pace to about every two years.',
      detail: 'The trend held for decades, driving huge gains in speed and drops in cost. It was an observation, not a law of nature, and it is slowing as transistors approach atomic sizes. Its pace became a yardstick for computing progress.',
      source: 'https://en.wikipedia.org/wiki/Moore%27s_law',
      sourceName: 'Wikipedia'
    },
    {
      id: 74,
      topic: 'Maths',
      title: 'The most beautiful equation',
      text: 'e^(iπ) + 1 = 0 links five of maths\' central constants in one short line. Many mathematicians call it the most beautiful equation.',
      detail: 'It follows from Euler\'s formula, which connects exponentials with sine and cosine. The symbols include 0, 1, π, e and i, drawn from different branches of maths. It is a favourite on mathematicians\' T-shirts.',
      source: 'https://en.wikipedia.org/wiki/Euler%27s_identity',
      sourceName: 'Wikipedia'
    },
    {
      id: 75,
      topic: 'Maths',
      title: 'How common are primes?',
      text: 'Primes thin out as numbers grow, but regularly: up to a large number N, the count is roughly N divided by the natural log of N.',
      detail: 'This is the prime number theorem, proved in 1896. It confirms that primes never run out, though gaps between them can be long. The still-unsolved Riemann hypothesis would sharpen the estimate.',
      source: 'https://en.wikipedia.org/wiki/Prime_number_theorem',
      sourceName: 'Wikipedia'
    },
    {
      id: 76,
      topic: 'Maths',
      title: 'The hunt for giant primes',
      text: 'Many of the largest known primes are Mersenne numbers of the form 2ᵖ − 1, hunted by volunteers using distributed computing.',
      detail: 'Marin Mersenne studied these numbers in the 17th century. For 2ᵖ − 1 to be prime, p must itself be prime, though that is not enough. Projects such as GIMPS have found primes with tens of millions of digits.',
      source: 'https://en.wikipedia.org/wiki/Mersenne_prime',
      sourceName: 'Wikipedia'
    },
    {
      id: 77,
      topic: 'Maths',
      title: 'Numbers equal to their parts',
      text: 'A perfect number equals the sum of its proper divisors. The smallest is 6, because 1 + 2 + 3 = 6.',
      detail: 'Euclid showed that even perfect numbers come from Mersenne primes. The next ones are 28, 496 and 8128. No odd perfect number has ever been found, and proving none exist is a long-standing puzzle.',
      source: 'https://en.wikipedia.org/wiki/Perfect_number',
      sourceName: 'Wikipedia'
    },
    {
      id: 78,
      topic: 'Maths',
      title: 'The golden ratio',
      text: 'Cut a line so that the whole over the longer part equals the longer over the shorter, and you get about 1.618: the golden ratio.',
      detail: 'Ancient Greek architects and artists are often said to have used it, though many claims are exaggerated. It appears in pentagon geometry and sunflower spirals. It is the limit of the ratio of consecutive Fibonacci numbers.',
      source: 'https://en.wikipedia.org/wiki/Golden_ratio',
      sourceName: 'Wikipedia'
    },
    {
      id: 79,
      topic: 'Maths',
      title: 'A triangle full of patterns',
      text: 'Pascal\'s triangle hides binomial coefficients, Fibonacci numbers and fractal shapes in a simple array where each entry is the sum of two above.',
      detail: 'Its rows give the coefficients of (x + y)ⁿ, and row n adds up to 2ⁿ. Colour the odd entries and a Sierpiński triangle appears. It has been discovered in several civilisations over many centuries.',
      source: 'https://en.wikipedia.org/wiki/Pascal%27s_triangle',
      sourceName: 'Wikipedia'
    },
    {
      id: 80,
      topic: 'Maths',
      title: 'Numbers once called fake',
      text: 'Imaginary numbers rest on i, where i² = −1. Descartes coined the name as an insult, but they turned out to be indispensable.',
      detail: 'Engineers use them to describe alternating current, and quantum mechanics is written with complex numbers. A complex number combines a real and an imaginary part and can be drawn as a point on a plane.',
      source: 'https://en.wikipedia.org/wiki/Imaginary_number',
      sourceName: 'Wikipedia'
    },
    {
      id: 81,
      topic: 'History',
      title: 'The zipper that took decades',
      text: 'The modern zipper was patented in 1913 by Gideon Sundback, improving an earlier clasp that caught, snagged and often failed.',
      detail: 'Whitcomb Judd patented a hook-and-eye fastener in 1893, but it was unreliable. Sundback\'s interlocking teeth worked far better. Zippers first appeared on boots and trousers before becoming common on clothing.',
      source: 'https://en.wikipedia.org/wiki/Zipper',
      sourceName: 'Wikipedia'
    },
    {
      id: 82,
      topic: 'Logic',
      title: 'The hardest logic puzzle ever',
      text: 'Three gods called True, False and Random answer yes or no in an unknown language. Three questions are enough to identify all three.',
      detail: 'George Boolos published the puzzle in 1996, building on an idea by Raymond Smullyan. Questions are phrased so truth-tellers and liars give the same answer, often by asking what another god would say. Random needs special care.',
      source: 'https://en.wikipedia.org/wiki/The_Hardest_Logic_Puzzle_Ever',
      sourceName: 'Wikipedia'
    },
    {
      id: 83,
      topic: 'Computing',
      title: 'One machine to run them all',
      text: 'Turing\'s 1936 universal machine could imitate any other computing machine by reading its instructions from a tape.',
      detail: 'This is the theoretical blueprint for the stored-program computer: one device can run any program. It is why a laptop can be a calculator, a music player or a browser without new hardware. General-purpose computing starts here.',
      source: 'https://en.wikipedia.org/wiki/Universal_Turing_machine',
      sourceName: 'Wikipedia'
    },
    {
      id: 84,
      topic: 'History',
      title: 'Colossus and the Lorenz cipher',
      text: 'Colossus, running at Bletchley Park from 1943, was the first programmable electronic digital computer. It attacked the Lorenz cipher.',
      detail: 'Designed by Tommy Flowers, it used vacuum tubes and was much faster than electromechanical machines. Its existence was kept secret until the 1970s, which is why ENIAC is often called the first instead.',
      source: 'https://en.wikipedia.org/wiki/Colossus_computer',
      sourceName: 'Wikipedia'
    },
    {
      id: 85,
      topic: 'Puzzle',
      title: 'The ant that beats a stretching rope',
      text: 'An ant crawling at 1 cm per second can reach the far end of a 1 km rubber rope that stretches by 1 km every second, if it lives long enough.',
      detail: 'As the rope stretches, the fraction the ant has already covered stays with it. Those fractions add up like the harmonic series, which never stops growing, so the ant wins eventually. The time needed is far longer than the age of the universe.',
      source: 'https://en.wikipedia.org/wiki/Ant_on_a_rubber_rope',
      sourceName: 'Wikipedia'
    },
    {
      id: 86,
      topic: 'Puzzle',
      title: 'The 100 prisoners\' clever trick',
      text: 'Each of 100 prisoners may open 50 drawers. A cycle-following strategy lets all of them succeed about 31% of the time.',
      detail: 'Each prisoner starts with the drawer bearing their own number, then follows the number inside. They succeed if the cycle containing their number is no longer than 50. Everyone wins exactly when no cycle is longer than that.',
      source: 'https://en.wikipedia.org/wiki/100_prisoners_problem',
      sourceName: 'Wikipedia'
    },
    {
      id: 87,
      topic: 'Maths',
      title: 'The magic number 6174',
      text: 'Take any four-digit number with digits not all equal. Sort its digits largest then smallest and subtract; repeat, and you reach 6174.',
      detail: 'Once 6174 appears it maps to itself: 7641 − 1467 = 6174. Kaprekar\'s routine reaches it in at most seven steps for any valid starting number. Similar constants exist in other digit lengths.',
      source: 'https://en.wikipedia.org/wiki/6174_(number)',
      sourceName: 'Wikipedia'
    },
    {
      id: 88,
      topic: 'Maths',
      title: 'Say what you see',
      text: 'The look-and-say sequence goes 1, 11, 21, 1211, 111221. Each term describes the digits of the one before it.',
      detail: 'One 1 becomes "11", which is read as "two ones" or 21, then "one two, one one" or 1211, and so on. Despite its simplicity the sequence has surprising structure, and its terms grow steadily longer in a predictable ratio.',
      source: 'https://en.wikipedia.org/wiki/Look-and-say_sequence',
      sourceName: 'Wikipedia'
    },
    {
      id: 89,
      topic: 'Logic',
      title: 'Infinite monkeys, finite patience',
      text: 'Given unlimited time, a monkey typing at random will almost surely produce any chosen text, even this entire sentence.',
      detail: 'The infinite monkey theorem illustrates just how counterintuitive probability with infinity can be. Any finite string has a fixed nonzero chance of appearing, so an endless stream will contain it eventually. The odds over a human lifetime are hopelessly tiny.',
      source: 'https://en.wikipedia.org/wiki/Infinite_monkey_theorem',
      sourceName: 'Wikipedia'
    },
    {
      id: 90,
      topic: 'Logic',
      title: 'Achilles and the tortoise',
      text: 'Zeno argued that a fast runner can never catch a slow tortoise with a head start, because the gap can always be halved again.',
      detail: 'Each time Achilles closes the current gap, the tortoise moves a little further. Zeno used such paradoxes to probe the nature of motion and infinity. Modern calculus resolves them with convergent infinite series.',
      source: 'https://en.wikipedia.org/wiki/Zeno%27s_paradoxes',
      sourceName: 'Wikipedia'
    },
    {
      id: 91,
      topic: 'Logic',
      title: 'This sentence is false',
      text: 'The liar paradox is a sentence that declares itself false. If it is true then it must be false, and if it is false then it must be true.',
      detail: 'Variations include a sign that reads "this sign is false" and a sentence referring to another sentence. The paradox has driven work in logic, truth and self-reference for over two thousand years, and is related to Gödel\'s theorems.',
      source: 'https://en.wikipedia.org/wiki/Liar_paradox',
      sourceName: 'Wikipedia'
    },
    {
      id: 92,
      topic: 'Logic',
      title: 'The set of all awkward sets',
      text: 'Consider the set of all sets that do not contain themselves. Does it contain itself? Russell\'s question broke early set theory.',
      detail: 'Either answer leads to a contradiction. Russell discovered the paradox in 1901, showing that not every description defines a set. It forced mathematicians to build stricter axiomatic set theories, and the barber paradox is its famous disguise.',
      source: 'https://en.wikipedia.org/wiki/Russell%27s_paradox',
      sourceName: 'Wikipedia'
    },
    {
      id: 93,
      topic: 'Maths',
      title: 'How long is a coastline?',
      text: 'Measure a coastline with a shorter ruler and it gets longer. Fractal geometry explains why there is no single obvious answer.',
      detail: 'Each finer ruler picks up more bays, rocks and inlets that a coarser one skipped. Benoit Mandelbrot developed fractal geometry to describe such self-similar rough shapes. Real coastlines eventually stop at the scale of atoms.',
      source: 'https://en.wikipedia.org/wiki/Coastline_paradox',
      sourceName: 'Wikipedia'
    },
    {
      id: 94,
      topic: 'Maths',
      title: 'A shortcut for testing primes',
      text: 'Fermat\'s little theorem says that for prime p, aᵖ − a is divisible by p. It underlies quick primality tests and modern cryptography.',
      detail: 'The theorem gives a fast way to flag composite numbers without factoring them. Some composites, called Carmichael numbers, pass the test anyway, so stronger versions are used in practice. It is a cornerstone of number theory.',
      source: 'https://en.wikipedia.org/wiki/Fermat%27s_little_theorem',
      sourceName: 'Wikipedia'
    },
    {
      id: 95,
      topic: 'Maths',
      title: 'A number too big to write',
      text: 'Graham\'s number is so vast that the observable universe cannot hold its digits. It arose as an upper bound in a Ramsey-theory problem.',
      detail: 'It is defined with an iterated tower of operations called Knuth\'s up-arrow notation, far beyond exponentiation. Even the number of layers in the tower is unimaginably large. It once held a Guinness record for the largest number used in a serious proof.',
      source: 'https://en.wikipedia.org/wiki/Graham%27s_number',
      sourceName: 'Wikipedia'
    },
    {
      id: 96,
      topic: 'Algorithm',
      title: 'The sieve that finds primes',
      text: 'The Sieve of Eratosthenes finds every prime up to a limit by crossing out multiples of each prime in turn. It dates to ancient Greece.',
      detail: 'Start with all numbers from 2 upward. Keep the first untouched number, then cross out its multiples, and repeat. What survives is prime. The method is still a standard way to generate small primes quickly.',
      source: 'https://en.wikipedia.org/wiki/Sieve_of_Eratosthenes',
      sourceName: 'Wikipedia'
    },
    {
      id: 97,
      topic: 'Computing',
      title: 'The first computer programmer?',
      text: 'Ada Lovelace is often called the first computer programmer, but the ENIAC team of women also programmed a machine years before stored programs.',
      detail: 'Kay McNulty, Betty Jennings, Betty Snyder, Marlyn Wescoff, Fran Bilas and Ruth Lichterman worked out how to set ENIAC\'s switches and cables. Their work was largely uncredited at the time. The history of programming has more than one starting point.',
      source: 'https://en.wikipedia.org/wiki/ENIAC',
      sourceName: 'Wikipedia'
    },
    {
      id: 98,
      topic: 'Puzzle',
      title: 'The missing square illusion',
      text: 'Rearrange the same four pieces into a triangle and a square-shaped gap appears. The pieces never changed size, so where did the area go?',
      detail: 'The trick works because the sloping sides have slightly different gradients. One arrangement hides a tiny bulge, the other a matching hollow, and the difference adds up to one square unit. Similar dissections fool the eye because the slopes are close.',
      source: 'https://en.wikipedia.org/wiki/Missing_square_puzzle',
      sourceName: 'Wikipedia'
    },
    {
      id: 99,
      topic: 'Maths',
      title: 'Nine dots, four lines',
      text: 'Connect all nine dots in a 3×3 grid using four straight lines without lifting your pen. The trick is to draw outside the box.',
      detail: 'This classic puzzle is used as a metaphor for creative thinking: the dots define a square, but nothing says your lines must stay inside it. Similar "think outside the box" puzzles appear in psychology and management training.',
      source: 'https://en.wikipedia.org/wiki/Nine_dots_puzzle',
      sourceName: 'Wikipedia'
    },
    {
      id: 100,
      topic: 'Computing',
      title: 'The first networked message',
      text: 'In 1969 UCLA sent the word "LOGIN" to Stanford Research Institute. The system crashed after just two letters: L and O.',
      detail: 'The first message on ARPANET, the forerunner of the internet, was an attempt to log in remotely. The receiving machine crashed after "LO", so the famous first network transmission was two letters. ARPANET later grew into a global network.',
      source: 'https://en.wikipedia.org/wiki/ARPANET',
      sourceName: 'Wikipedia'
    },
    {
      id: 101,
      topic: 'History',
      title: 'The first stored-program design',
      text: 'Before computers could fetch instructions from memory, programming meant rewiring a machine. The stored-program idea changed that.',
      detail: 'John von Neumann wrote a widely circulated 1945 report describing a computer that keeps both data and instructions in memory. Earlier ideas appeared in Babbage\'s Analytical Engine and in Turing\'s universal machine. Almost every computer today follows the pattern.',
      source: 'https://en.wikipedia.org/wiki/Von_Neumann_architecture',
      sourceName: 'Wikipedia'
    },
    {
      id: 102,
      topic: 'Algorithm',
      title: 'The halting problem\'s cousin',
      text: 'The busy beaver game asks: for n states, what is the longest a Turing machine can run before stopping? The answers grow shockingly fast.',
      detail: 'Even for a few states the maximum number of steps is enormous, and the function cannot be computed for all n because that would solve the halting problem. Tiny machines can produce numbers with vastly more digits than the universe has atoms.',
      source: 'https://en.wikipedia.org/wiki/Busy_beaver',
      sourceName: 'Wikipedia'
    },
    {
      id: 103,
      topic: 'Maths',
      title: 'Why lightning picks the first row',
      text: 'In a large random grid, the leftmost column of a low digit can behave oddly. Benford-like patterns even appear in lottery and population data.',
      detail: 'Scale invariance is the key: if a dataset looks the same when all values are multiplied by a constant, its leading digits tend to follow Benford\'s law. It fails for data with a fixed range or an artificial minimum, so it is a tool, not a law of nature.',
      source: 'https://en.wikipedia.org/wiki/Benford%27s_law',
      sourceName: 'Wikipedia'
    },
    {
      id: 104,
      topic: 'Computing',
      title: 'Compression has a hard limit',
      text: 'No method can compress every possible file. If it made some files shorter, other files must get longer by the pigeonhole principle.',
      detail: 'There are fewer short strings than long ones, so a one-to-one mapping cannot shrink them all. This counting argument explains why ZIP works on real data but cannot beat every input. It is a neat meeting of computing and pigeonholes.',
      source: 'https://en.wikipedia.org/wiki/Compression_algorithm',
      sourceName: 'Wikipedia'
    },
    {
      id: 105,
      topic: 'Puzzle',
      title: 'The monkey and the coconuts',
      text: 'Sailors divide a pile of coconuts five ways each night, always giving one to a monkey, then divide evenly in the morning. What was the smallest pile?',
      detail: 'The answer is 3,121 coconuts. Working backwards with modular arithmetic makes the puzzle manageable: each night\'s pile must be one more than a multiple of five. Versions of this puzzle have circulated for centuries.',
      source: 'https://en.wikipedia.org/wiki/The_monkey_and_the_coconuts',
      sourceName: 'Wikipedia'
    },
    {
      id: 106,
      topic: 'Maths',
      title: 'The chessboard and the grain of rice',
      text: 'Put one grain on the first square of a chessboard, two on the second, four on the third, and keep doubling. The last square holds 2⁶³ grains.',
      detail: 'The total is 2⁶⁴ − 1 grains, more than all the rice ever harvested. The story illustrates how quickly exponential growth outruns intuition. It is a favourite way to explain why compound interest and doubling algorithms surprise people.',
      source: 'https://en.wikipedia.org/wiki/Wheat_and_chessboard_problem',
      sourceName: 'Wikipedia'
    },
    {
      id: 107,
      topic: 'Logic',
      title: 'The unexpected answer always changes',
      text: 'Ask a yes-or-no question that refers to itself, like "will you answer no to this question?" and no consistent answer exists.',
      detail: 'This is a relative of the liar paradox adapted to questions. It shows that even simple yes-or-no formats have limits. Logicians study such cases to pin down exactly which statements are meaningful.',
      source: 'https://en.wikipedia.org/wiki/Self-reference',
      sourceName: 'Wikipedia'
    },
    {
      id: 108,
      topic: 'Computing',
      title: 'Error-correcting codes',
      text: 'A message can arrive with bits flipped and still be recovered, because extra check bits let a receiver spot and fix the damage.',
      detail: 'Richard Hamming developed such codes in the 1940s after getting frustrated with unreliable punched-card readers. The idea lets CDs survive scratches, QR codes survive dirt, and deep-space probes send clear photos across billions of kilometres.',
      source: 'https://en.wikipedia.org/wiki/Error-correcting_code',
      sourceName: 'Wikipedia'
    },
    {
      id: 109,
      topic: 'History',
      title: 'From a mouse to a web',
      text: 'The first web browser was created by Tim Berners-Lee at CERN in 1990, along with the first web server and the first web page.',
      detail: 'He proposed a hypertext system to help researchers share information across different computers. The first site explained what the World Wide Web was and how to use it. He later released the software freely so anyone could build on it.',
      source: 'https://en.wikipedia.org/wiki/World_Wide_Web',
      sourceName: 'Wikipedia'
    },
    {
      id: 110,
      topic: 'Maths',
      title: 'The infinite hotel gets an infinite bus',
      text: 'Hilbert\'s fully occupied hotel can fit a bus with infinitely many passengers: move each guest from room n to room 2n.',
      detail: 'That frees every odd-numbered room for the new arrivals. With cleverer reshuffles, the hotel can accommodate infinitely many such buses. It is a vivid demonstration that adding infinities does not behave like adding ordinary numbers.',
      source: 'https://en.wikipedia.org/wiki/Hilbert%27s_paradox_of_the_Grand_Hotel',
      sourceName: 'Wikipedia'
    }
  ];

  var previous = null;

  window.EPFacts = {
    count: FACTS.length,
    all: function () { return FACTS.slice(); },
    get: function (i) {
      var n = Number(i) || 0;
      var len = FACTS.length;
      return FACTS[((n % len) + len) % len];
    },
    random: function () {
      var index = Math.floor(Math.random() * FACTS.length);
      if (FACTS.length > 1 && index === previous) {
        index = (index + 1 + Math.floor(Math.random() * (FACTS.length - 1))) % FACTS.length;
      }
      previous = index;
      return FACTS[index];
    }
  };
}());
