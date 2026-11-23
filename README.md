# EnigmaPath

Learning suite: an eight-subject practice quiz, a robot-programming maze game, a cipher lab, a Tower of Hanoi simulator, four algorithm/maths labs, a fun-fact bank and a teacher-made exam with a point-and-click builder. Plain HTML, CSS and JavaScript plus one small Python server for the exam. Everything is local; nothing needs the internet.

Palette: **Tranquil Light Blue Serenity** — `#ADD8E6` `#87CEEB` `#B0E0E6` `#E0FFFF` `#4682B4`
(plus derived darker blue tints for readable text and three status colours for correct / wrong / warning).

## Running it

| What | How |
|---|---|
| Practice Quiz, Guide the Robot, Enigmatica Cipher Lab, Tower of Hanoi, Binary Search Lab, Knight's Tour, Graph Colouring, Huffman Coding, Guess the Password | Double-click **`index.html`** and pick a tile. No server needed. |
| Exam, exam builder, results page | Double-click **`start.bat`** (Windows) or **`start.sh`** (Linux/macOS). Python 3 must be installed. The server asks for the teacher password, then opens the browser. |

The teacher password is **`Mirija04`**. Press Enter at the prompt to accept it. Three wrong attempts and the server refuses to start. To skip the prompt (for automated tests) use `python3 server.py --teacher-password Mirija04`.

Teacher pages also need a browser login: the hub links open `exam/login.html`; enter the same password. The login is an `HttpOnly` cookie that expires after 8 hours and disappears when the server stops. "Sign out" is on the builder and results pages. The exam itself and submitting answers need no login.

To copy EnigmaPath to another computer, copy the whole folder. Each student PC keeps its own `results/` folder.

## The apps

### Practice Quiz (`quiz/`)
Eight subjects, each with the same ten-level structure (Mathematics adds an extra Level 11 A-Level extension) and clear subject cards on the start screen: **ICT, Mathematics, General Science, Physics, Chemistry, Biology, Geography and General Knowledge**.

Every subject maps levels 1-10 to an age/curriculum progression: levels 1-3 are primary, 4-6 lower secondary, 7-9 Cambridge IGCSE, 10 IB/higher; Mathematics level 11 follows the A-Level (Edexcel 9MA0 / Cambridge 9709) content. A run draws a random selection (default 20) with shuffled answers, shows right/wrong straight after each answer, then a result and a review. Options: difficulty (Easy/Medium/Hard/Mixed), number of questions, and *Revision* (also draw from earlier levels). Best scores are remembered in the browser per subject and level.

The build currently bundles **2,823 questions** across the eight subjects: ICT has 1,073 (about 120 per level, including advanced HTML/CSS syntax and relational-database modelling in levels 9-10), Mathematics has 280 including a 40-question A-Level extension covering pure calculus, proof, vectors, mechanics and statistics, and the other six subjects have 240-250 each (24-25 per level). All questions are written to IGCSE/IB/A-Level style with British spelling and a spread of easy, medium and hard questions.

A visible disclaimer on the subject screen says the questions and answers were validated by AI and points students to their teacher or to the contact button (lucas.mirija@pm.me).

Topic guide for the new subjects:

* **Mathematics** — number, algebra, geometry, measure, trigonometry, statistics, IB higher topics, plus an A-Level extension (proof, calculus, vectors, mechanics, distributions and hypothesis testing).
* **General Science** — integrated matter, energy, life and Earth, plus scientific method.
* **Physics** — forces, motion, energy, waves, electricity, thermal physics, magnetism and atomic physics.
* **Chemistry** — materials, states, atoms, bonding, reactions, separation, rates/equilibrium and organic chemistry.
* **Biology** — organisms, plants, human body, cells, genetics, ecology and IB physiology.
* **Geography** — maps, weather, landforms, settlements, population, hazards, development and globalisation.
* **General Knowledge** — history, civilisations, world organisations, culture, global issues and media literacy.

### Guide the Robot (`robot/`)
Orientation mode only: *Forward*, *Turn left*, *Turn right*. 20 hand-checked mazes from 11x11 to 25x27 tiles, all with loops and several
routes. Build the program (buttons or the arrow keys), then Run / Step / Pause / Reset. Levels unlock one after another;
**Teacher mode** (tick the box on the level screen) unlocks everything and can load a shortest program. There is no login.

### Enigmatica Cipher Lab (`cipher/`)
Encrypt, decrypt and crack Caesar and Vigenere ciphers, with illustrated "how it works" pages.

### Tower of Hanoi (`hanoi/`)
3-8 discs, click or drag, undo, hint, auto-solve from any position, move counter against the 2^n-1 minimum, best records, and a short explanation of recursion.

### Binary Search Lab (`binary-search/`)
A guessing game: choose a range (default 1-100), the computer hides a random number, and you guess. The computer only says "higher" or "lower"; a log and a narrowing interval show your progress. At the end the number is revealed along with the number of guesses you used and the binary-search optimum (⌈log₂ n⌉, so 7 for 1-100). A password-protected button reveals the exact search sequence. `how-it-works.html` explains the algorithm with a worked example and a short self-check.

### Knight's Tour (`knights-tour/`)
5x5 to 8x8 boards. Pick a start square, then move the knight yourself: legal destinations are highlighted, illegal or repeated moves are rejected, and undo/restart are available. The status line tells you when you complete a tour or run out of moves. A hint suggests a good next square; the password-protected solution plays a verified complete tour.

### Graph Colouring (`graph-color/`)
Colour the dots so that neighbours differ, using as few colours as possible. Thirteen presets, from a 6-region map up to a 20-region map, a 5x5 grid (25 nodes) and a 6x6 grid (36 nodes), four clearly labelled colours, live conflict detection, move/colour counters and an exact minimum-colours (chromatic number) display. A visible panel explains the game and the Four Colour Theorem (every planar map needs at most four colours; proved with computer assistance by Appel and Haken in 1976). The password-protected solution applies a verified optimal colouring.

### Huffman Coding (`huffman/`)
Type text, build a real Huffman tree, read the generated bit codes, see the tree as SVG, encode and decode messages, and compare the encoded size with 8-bit ASCII. A password-protected button reveals the solution for the current text.

### Guess the Password (`codebreaker/`)
A Bulls and Cows game with 3-, 4- or 5-digit passwords made of different digits. Each guess returns **bulls** (right digit, right place) and **cows** (right digit, wrong place), with the definitions shown beside the board and repeated after every guess. The game also filters all possible passwords after each answer, so the "possible left" counter shows how much information the answer removed.

The info panel gives the combinatorics and information theory for the chosen length: 720 / 5,040 / 30,240 possible passwords, 9.49 / 12.30 / 14.88 bits, 9 / 14 / 20 possible feedback scores, and the resulting average lower bound. For 4 digits it also shows the known optimal result: **5.21 guesses on average, at most 7** (Tanaka, 1996).

`more-about.html` explains the rules, the counting, Shannon information/entropy in plain language, a practical strategy, and links to the maths articles and papers used.

### Fun facts (`facts/`)
The home page opens with a rotating fun fact from technology, maths, logic and computer history. **Learn more** opens `facts/index.html?n=<id>` with a fuller explanation and a link to the source; **Other fact** shows another one. The bank in `shared/fun-facts.js` holds 110 curated facts with topic, title, short hook, longer detail and source URL.

**Show solution** buttons in the offline labs use the same teacher password through a small modal (`shared/gate.js`). This is a classroom gate, not real security: the password is visible in the source.

### About the app (`about/`)
A standalone page linked from the top bar of every page and from the shared footer. It describes what the labs are, what each one teaches, how the app works, its honest limitations (AI-checked questions, simplified models, non-secure exam, browser-only score storage) and how to send feedback (lucas.mirija@pm.me). The shared footer (`shared/footer.js`) also carries the contact address and the GitHub repository link on every page.

### Design (`shared/theme.css`)
A quiet light theme on the Tranquil Light Blue Serenity palette: graph-paper ground, frosted-glass panels (`backdrop-filter: blur`), thin blue borders, and subtle motion. The home page adds a light canvas animation (`shared/hub-bg.js`) of drifting maths/ICT glyphs and linked nodes; both respect `prefers-reduced-motion` and pause when the tab is hidden. Browsers without backdrop-filter fall back to solid panels. Every page is responsive down to 360 px.

## Exams

### Teacher: building an exam (`exam/builder.html`)
Start the server, open the hub, click **Teacher: create an exam**, log in, then:
1. **+ New exam**, give it a title and add instructions for students.
2. Add items:
   * **+ Question**: type the question and 2-6 answers, tick the correct one.
   * **+ Maze with questions**: choose a library maze (loader menu), generate a random one, or draw your own (paint walls, place Start, Goal and the robot's direction). Live statistics show size, fewest instructions, shortest path, loops, dead ends and routes. Then add **automatic questions** (fewest instructions, shortest path, fewest turns, loops, dead ends, number of routes, number of shortest paths, direction after a program, does this program reach the goal?) or **write your own**. Wrong answers for automatic questions are generated; everything stays editable. After changing the maze press *Recalculate automatic questions*.
   * **+ From the practice quiz bank**: tick questions from any of the 10 levels.
3. **Save exam**. Exams are stored as `data/exams/<id>.json`. **Export file** / **Import file** move an exam between computers.

### Students (`exam/index.html`)
The exam **only works through the server**: opening the file directly shows a warning and cannot start. Students choose the exam, type their **name** and **grade (3-12)** and start. One question per page, no right/wrong feedback, free navigation and an overview page before submitting. For every student the order of questions and the position of the correct answer are shuffled, **except** that a maze always stays together with its own questions. There is no timer. An unfinished exam can be resumed on the same computer while the server is running.

On submit the server grades and saves the answers. **No score, percentage or correct answers are shown to the student**: they see a short "answers submitted" message and are taken back to the home menu. The score is available to the teacher in the results page.

### Results (`exam/results.html`)
Each submission is saved in `results/<exam-id>/<id>.json` (name, grade, score, time, and for every question what was asked, what the student chose, the correct answer, and whether it was wrong), and one line is appended to `results/results.csv` (open it in Excel/LibreOffice):
`finished_at, exam_id, exam_title, student, grade, score, total, percent, duration_sec, wrong_questions, unanswered_questions, wrong_details`.
The results page lists attempts, filters by exam, grade or name, expands each student's wrong answers, shows per-question statistics, and exports CSV. Teacher login required.

**Several computers:** copy each student PC's `results` folder (or just the `.json` files) to the teacher's computer and use **Import result files** on the results page. Duplicates are skipped.

**One teacher PC and a network:** run `python3 server.py --host 0.0.0.0` and let students open `http://<teacher-ip>:8000/exam/index.html`.
Use `--data <folder>` to keep exams and results somewhere else. Teacher pages require the login cookie even over the network.

## Questions

* Source: `data/questions/level-01.json` ... `level-10.json` for ICT, and `data/questions/<topic>/level-01.json` ... `level-10.json` for maths, science, physics, chemistry, biology, geography and general. Each file is a list of questions with `question_text`, 4 `options`, `correct_answer_index`, `term_category` = Term 1/2/3 = easy/medium/hard. Each topic folder also has a `meta.json` with its name, blurb, icon and per-level titles/blurbs.
* After editing, run `python3 tools/questions_tool.py build`. It validates every topic (4 distinct options, index in range, no duplicates across levels, balanced answer positions and lengths) and regenerates `quiz/data/questions.js` and `quiz/data/topics.js`, which are what the quiz loads. Use `python3 tools/questions_tool.py validate <topic>` to check one subject, e.g. `validate maths`.
* The writing rules used for the bank are in `tools/QUESTION_BRIEF.md`.

## Mazes

`shared/maze-lib.js` has the robot rules, solver and analysis (also used by the exam). Built-in mazes are in `shared/maze-levels.js`, generated once by
`node tools/gen_mazes.js`; nothing is random at play time. Maze format: `#` wall, `.` floor, `S` start, `G` goal, plus the start direction.

## Tests

```
python3 tools/questions_tool.py validate      # question bank rules
node tools/validate_mazes.js                  # robot rules + all 20 mazes solvable, looped, increasing difficulty
node tools/test_exam_core.js                  # shuffling, automatic questions, validation
node tools/test_hanoi.js                      # Hanoi logic incl. exhaustive optimal-solution check
python3 tools/test_server.py                  # exam server API and teacher login (uses a temporary folder)
node tools/test_robot_ui.js                   # headless Chromium: plays the robot game
node tools/test_quiz_ui.js                    # headless Chromium: plays the quiz
node tools/test_exam_ui.js                    # headless Chromium: builds an exam, takes it, reads the results
node tools/test_codebreaker_ui.js             # headless Chromium: plays Guess the Password and checks the maths page
```

## Folder layout

```
index.html            hub                    start.bat / start.sh   exam server launcher
server.py             exam server + login    shared/                theme, maze library, exam core, password gate, hub animation
quiz/ robot/ cipher/ hanoi/                  the original apps
binary-search/ knights-tour/ graph-color/ huffman/              the new labs
codebreaker/          Guess the Password (Bulls and Cows) and its maths page
facts/                fun-fact detail page       shared/fun-facts.js    the 110-fact bank
exam/                 index.html (student), login.html, builder.html, results.html
data/questions/       question banks         data/exams/            saved exams
results/              saved exam results     tools/                 build + test scripts
```

Contact: lucas.mirija@pm.me · https://github.com/lucas-razafimanantsoa/EnigmaPath

Lucas M.R 2026, with vibes
