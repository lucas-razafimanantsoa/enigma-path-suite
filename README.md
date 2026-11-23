# EnigmaPath

**Version v2026.11.23.0** · **Status: in development**

EnigmaPath is an in-development educational app for students and teachers. It combines practice quizzes with small educational games and a teacher-made exam tool. The static apps run in any modern browser; the exam tools need the small Python server in this repository.

## What is inside

- **Practice Quiz** — eight subjects: ICT, Mathematics, General Science, Physics, Chemistry, Biology, Geography and General Knowledge, with ten levels each and an A-Level maths extension.
- **Educational games** — Guide the Robot, Enigmatica Cipher Lab, Tower of Hanoi, Binary Search, Knight's Tour, Graph Colouring, Huffman Coding and Guess the Password.
- **Exam tools** — multiple-choice or mixed exams, a point-and-click builder with the full practice bank, a student exam page, manual marking with per-question and general comments, printable A4 result papers with the marking scheme, an answered teacher copy, and a blank exam paper with checkboxes and answer lines.
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

The exam builder lets you choose a multiple-choice-only exam or a mixed exam with open-ended questions. Open-ended questions require an answer key. The builder can add questions from the full practice bank, including every subject and level.

After students submit, open **Mark exams** to mark the open answers. Each open question can receive a full mark, a partial mark or 0, plus a comment. Add a general comment for the whole exam. The results page can download CSV or JSON, import results from other computers, or clear the saved exam history.

### Printable papers

All printable pages use the browser's **Print / Save as PDF** dialog and request A4 portrait. The builder has these print options:

- **Save exam paper as PDF** — blank student paper. Questions only, MCQ choices with checkboxes, and ruled space for open-ended answers. No answers are shown.
- **Print answered exam** — teacher copy with every question, answer and answer key.
- **Marked result paper** — from the marking page. It includes the marking scheme, the student's answers, correct answers or answer keys, comments, score, percentage and symbol.

The symbol thresholds are A+ ≥ 96, A ≥ 90, B+ ≥ 86, B ≥ 80, C+ ≥ 76, C ≥ 70, D+ ≥ 66, D ≥ 60, E+ ≥ 56, E ≥ 50, F below 50.

### Printable templates

Edit these files to customise the printed pages:

- `exam/result-header.js` — marked result paper: school name, title, field labels, parent's signature and footer.
- `exam/paper-header.js` — exam paper: school name, title, instructions, candidate fields and footer.
- `exam/css/report.css` and `exam/css/paper.css` — layout and print styles.

Changes affect both the on-screen preview and the PDF produced by the print dialog.

### Hosting an exam for a class

For a single computer, use the default localhost address. For a class, host the exam on a teacher laptop or desktop and let students connect over the local network:

1. Connect the teacher computer to the school Wi-Fi or a router. Use Ethernet if possible.
2. Start the server for the whole network:

   Windows:
   ```bat
   start.bat --host 0.0.0.0 --teacher-password "choose-a-strong-password"
   ```
   macOS/Linux:
   ```bash
   ./start.sh --host 0.0.0.0 --teacher-password "choose-a-strong-password"
   ```
3. Find the teacher computer's local IP address:
   - Windows: `ipconfig`
   - macOS: `ipconfig getifaddr en0`
   - Linux: `hostname -I`
4. Allow port `8000` in the computer's firewall if students cannot connect.
5. Students open `http://<teacher-ip>:8000/exam/index.html`.
6. The teacher opens `http://<teacher-ip>:8000/exam/login.html` and signs in.

For smoothness, use a router or the school Wi-Fi instead of a phone hotspot. A dedicated router with the teacher computer on Ethernet is the most reliable option. Keep the teacher computer awake and plugged in, and keep the server running until every student has submitted.

Do not expose this server to the internet. It uses a simple password and no HTTPS, so only host it on a trusted classroom network. **Hosting from a phone or tablet is not supported yet.**

The results are saved on the teacher computer in `results/`. Download a backup from the results page after the exam.

## Data and privacy

- The static apps keep everything in the browser.
- Teacher-created exams are saved in `data/exams/` and student results in `results/`.
- Both folders are ignored by Git. Never commit or push exam files or student results.
- Results contain names and grades. Keep the folders private and back them up securely.

## Version

**v2026.11.23.0** — in development. Features, question banks and file formats may change.

Contact: lucas.mirija@pm.me  
Repository: <https://github.com/lucas-razafimanantsoa/enigma-path-suite>
