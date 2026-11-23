# EnigmaPath — question writing brief

EnigmaPath is a school learning app. The Practice Quiz has **eight subjects**, each with **10 levels** (Mathematics adds an **11th A-Level extension**).
ICT keeps its original pool of **at least 100 multiple-choice questions per level**; the other subjects
(maths, general science, physics, chemistry, biology, geography, general knowledge) keep **at least 20
per level**, enough for a varied run. The number of levels is read from each `meta.json`; maths has 11. Levels map to school grades (never shown to students, but they set
the difficulty and content). New subject files live in `data/questions/<topic>/level-NN.json` with a
`meta.json` beside them; ICT keeps `data/questions/level-NN.json` and `data/questions/meta.json`.

The ICT level table below is the original one; each new subject's `meta.json` contains its own
per-level title and blurb, and levels 7-9 should follow IGCSE subject content while level 10 should
follow IB/higher content.

| Level | Grade | Content focus |
|---|---|---|
| 1 | 3 | Basic computer use, parts of a computer, keyboard/mouse, simple Word/Excel/PowerPoint, safe behaviour |
| 2 | 4 | More Office skills, file handling, internet basics, safety, simple ciphers |
| 3 | 5 | Spreadsheets, documents, security habits, hardware/software, networks intro |
| 4 | 6 | Lower-secondary foundations |
| 5 | 7 | Binary basics, networks, spreadsheets formulas, databases intro, algorithms |
| 6 | 8 | Data vs information, storage, protocols, HTML basics, security threats, programming ideas |
| 7 | 9 | Cambridge IGCSE ICT (0417): computer systems, input/output devices, storage |
| 8 | 10 | IGCSE ICT: networks, effects of ICT, ICT applications |
| 9 | 11 | IGCSE ICT: systems life cycle, safety & security, communication, file management, images |
| 10 | 12 | IGCSE ICT: layout/styles/proofing/documents, graphs, databases, presentations, spreadsheets, web authoring |

## File format

Each file is a JSON list. Every item has exactly these four keys:

```json
{
  "question_text": "Which device converts a printed page into a digital image?",
  "options": ["Scanner", "Plotter", "Speaker", "Trackball"],
  "correct_answer_index": 0,
  "term_category": "Term 1"
}
```

* Exactly **4 options**, all different, all non-empty strings.
* `correct_answer_index` is 0-3. **Spread the correct answer evenly**: across your 100 questions, about 25 should
  be at each of positions 0, 1, 2, 3 (not mostly 0).
* `term_category` = difficulty inside the level: `"Term 1"` easy (~34 questions), `"Term 2"` medium (~33),
  `"Term 3"` hard (~33). Hard means more reasoning, not obscure trivia.

## Quality rules (accuracy is the top priority)

1. **Only write what you are certain is correct**, stable, and uncontroversial for a Cambridge/IGCSE-style
   syllabus. If a fact depends on a software version, vendor menu path, or a date, do not use it. Prefer
   concepts to button locations. Use British spelling (e.g. "colour", "programme" only for TV, "analyse").
2. Exactly **one** option is defensibly correct. Every wrong option must be **clearly wrong** to someone who
   knows the topic, yet plausible to someone who does not. Re-read each question asking: "could a knowledgeable
   teacher argue for a second option?" If yes, rewrite it.
3. **Any numeric, binary, hex, file-size, cipher, spreadsheet-result, sorting or logic question must be
   computed with a Python snippet in the shell**, not by hand. Check the result before writing it down.
4. **Do not make the correct answer recognisable by its shape.** Options must be similar in length, grammar and
   detail. The correct option must not be the longest in more than ~35% of the questions; it must not be the
   only detailed or only hedged option. Do not use "all of the above", "none of the above", "both A and B".
5. Self-contained: no pictures, no "see the diagram". Short code/formula snippets in plain text are fine.
   `question_text` <= 220 characters, each option <= 90 characters, no trailing numbering, no "A)" prefixes.
6. Avoid "Which of these is NOT ..." for more than 5 questions per level. Never ask opinion questions.
7. No duplicates: not within your level and not against other levels. Before writing, skim the existing
   `data/questions/level-NN.json` files of the neighbouring levels (read only) so you do not repeat the same
   facts at the same depth. Cover your level's topics **broadly** (every topic listed in your brief at least a
   few times) and vary the question style (definition, scenario, "which is the best", calculation, odd-one-out
   phrased positively, matching purpose to tool, ordering of steps by asking "which comes first/last").
8. Keep difficulty matched to the school grade. Do not write university-level content.
9. Do not copy past-paper questions verbatim. Write original questions.

## Workflow

1. Write your questions in 4 files of 25 questions each:
   `data/questions/<topic>/_parts/LNN-1.json` ... `LNN-4.json` (NN = two-digit level, e.g. `L07-1.json`).
   ICT parts go directly in `data/questions/_parts/`.
   Use the write tool, valid JSON, UTF-8.
2. From the project root (`EnigmaPath/`) run `python3 tools/questions_tool.py merge <topic> N` then
   `python3 tools/questions_tool.py validate <topic> N` and fix every ERROR and every WARN that concerns your level
   (edit the level file directly afterwards). Omit `<topic>` for ICT.
3. Finally re-read your whole level file once, slowly, as a strict examiner, and fix any questionable item.
   Report: the final question count, term counts, and anything you were unsure about.
