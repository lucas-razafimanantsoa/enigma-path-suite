# EnigmaPath

**Version v2026.11.23.0** · **Status: in development**

EnigmaPath is an in-development educational app for students and teachers. It combines practice quizzes with small educational games and a teacher-made exam tool. The static apps run in any modern browser; the exam tools need the small Python server in this repository.

## What is inside

- **Practice Quiz** — eight subjects: ICT, Mathematics, General Science, Physics, Chemistry, Biology, Geography and General Knowledge, with ten levels each and an A-Level maths extension.
- **Educational games** — Guide the Robot, Enigmatica Cipher Lab, Tower of Hanoi, Binary Search, Knight's Tour, Graph Colouring, Huffman Coding and Guess the Password.
- **Exam tools** — multiple-choice or mixed exams, a point-and-click builder, a student exam page, manual marking with per-question and general comments, and printable A4 result papers with the marking scheme.
- **Extras** — a fun-fact bank and an About page.

## Try it online

The static version (everything except the exam tools) is deployed for free at:

**https://enigmapath.netlify.app**

## Requirements

- Git
- Python 3 (only needed for the exam server; the static apps do not need it)

## Installation

### Windows

Open PowerShell:

```powershell
winget install --id Git.Git -e
winget install --id Python.Python.3.12 -e
git clone https://github.com/lucas-razafimanantsoa/enigma-path-suite.git
cd enigma-path-suite
```

You can also install Git from <https://git-scm.com/download/win> and Python from <https://www.python.org/downloads/windows/>, then run the `git clone` command.

### macOS

Open Terminal:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install git python
git clone https://github.com/lucas-razafimanantsoa/enigma-path-suite.git
cd enigma-path-suite
```

If Homebrew is already installed, skip the first command. You can also install Git and Python from their official websites, then run the `git clone` command.

## Running the app

### Static apps

Open `index.html` in a browser and choose an app from the home page, or use the Netlify link above.

### Exam version

The exam builder, student exam and results page need the local server.

Windows:

```bat
start.bat --teacher-password "choose-a-strong-password"
```

macOS/Linux:

```bash
./start.sh --teacher-password "choose-a-strong-password"
```

The server opens <http://127.0.0.1:8000/>. The same password unlocks the teacher pages. Do not leave the password blank.

The exam builder lets you choose a multiple-choice-only exam or a mixed exam with open-ended questions. After students submit, open **Mark exams** to mark the open answers, add comments, and print or save the marked A4 result paper as a PDF with the browser's print dialog.

## Data and privacy

- The static apps keep everything in the browser.
- Exams and results are saved locally in `data/exams/` and `results/`.
- Results contain student names and grades. Keep that folder private and back it up securely.

## Version

**v2026.11.23.0** — in development. Features, question banks and file formats may change.

Contact: lucas.mirija@pm.me  
Repository: <https://github.com/lucas-razafimanantsoa/enigma-path-suite>
