#!/usr/bin/env python3
"""
EnigmaPath local server (Python 3 standard library only).

The games (quiz, robot, ciphers, Hanoi) work by double-clicking index.html.
The EXAM needs this server because it saves exams and results as files.

    python3 server.py                 # http://127.0.0.1:8000/
    python3 server.py --port 8080
    python3 server.py --host 0.0.0.0  # let other computers on the network connect
    python3 server.py --no-browser
    python3 server.py --teacher-password secret  # skip the startup prompt

The teacher password is asked for on startup (default: Mirija04). Teacher pages and
teacher API calls also need a browser login at /exam/login.html. Students can take
exams without logging in.

Folders (created automatically):
    data/exams/<exam-id>.json                 exams made with the builder
    results/<exam-id>/<result-id>.json        one file per student attempt
    results/results.csv                       one row per attempt (opens in Excel)

API (JSON):
    GET    /api/exams                         list of exams (no answers)
    GET    /api/exams/<id>                    full exam with answer key (teacher)
    GET    /api/exams/<id>/student            exam without answers (student)
    POST   /api/login                         teacher login (sets an HttpOnly cookie)
    POST   /api/logout                        clear the teacher cookie
    GET    /api/login-status                  is this browser logged in as teacher?
    POST   /api/exams                         create / replace an exam (teacher only)
    DELETE /api/exams/<id>                    (teacher only)
    POST   /api/submit                        a student's answers: graded here and saved
    GET    /api/results[?exam=<id>]           saved results (teacher only)
    POST   /api/results/import                merge result files copied from other computers (teacher only)
    DELETE /api/results/<id>                  (teacher only)
    GET    /api/results.csv                   all results as CSV (teacher only)

Everything marked "teacher only" is also denied without a password on startup.
"""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import getpass
import hmac
import io
import json
import re
import secrets
import threading
import time
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse, parse_qs, quote

BASE_DIR = Path(__file__).resolve().parent
EXAMS_DIR = BASE_DIR / "data" / "exams"
RESULTS_DIR = BASE_DIR / "results"
CSV_FIELDS = [
    "finished_at", "exam_id", "exam_title", "student", "grade", "score", "total",
    "percent", "duration_sec", "wrong_questions", "unanswered_questions", "wrong_details",
]
MAX_BODY = 8_000_000
LOCK = threading.Lock()

# --- teacher access -------------------------------------------------------
DEFAULT_PASSWORD = "Mirija04"
TEACHER_PASSWORD = DEFAULT_PASSWORD   # set in main()
TEACHER_COOKIE = "ep_teacher"
TEACHER_TOKENS = {}                   # token -> expiry (unix time), memory only
TEACHER_TTL = 8 * 3600                # 8 hours
TEACHER_PAGES = ("/exam/builder.html", "/exam/results.html")

ID_RE = re.compile(r"^[a-z0-9][a-z0-9-]{1,79}$")
REVEAL = ("score", "wrong", "all")
BLOCKED_PREFIXES = ("/data/", "/results", "/tools/", "/server.py", "/.", "/start.")
TILES = set("#.SG")


# ----------------------------------------------------------------- teacher access

def password_ok(value):
    return isinstance(value, str) and hmac.compare_digest(value, TEACHER_PASSWORD)


def new_teacher_token():
    token = secrets.token_urlsafe(24)
    now = time.time()
    with LOCK:
        for old in [k for k, expiry in TEACHER_TOKENS.items() if expiry <= now]:
            TEACHER_TOKENS.pop(old, None)
        TEACHER_TOKENS[token] = now + TEACHER_TTL
    return token


def teacher_token_valid(token):
    if not token:
        return False
    with LOCK:
        expiry = TEACHER_TOKENS.get(token)
        if expiry is None:
            return False
        if expiry <= time.time():
            TEACHER_TOKENS.pop(token, None)
            return False
    return True


def read_start_password(provided):
    """Ask for the teacher password. Returns None if it was refused."""
    if provided is not None:
        return provided
    for attempt in range(3):
        try:
            value = getpass.getpass("Teacher password (Enter for %s): " % DEFAULT_PASSWORD)
        except (EOFError, KeyboardInterrupt):
            print()
            return None
        if not value:
            value = DEFAULT_PASSWORD
        if hmac.compare_digest(value, DEFAULT_PASSWORD):
            return value
        left = 2 - attempt
        print("Incorrect password." + (" %d attempt(s) left." % left if left else ""))
    return None


# ----------------------------------------------------------------- validation

def clean_text(value, limit):
    return value.strip() if isinstance(value, str) and len(value.strip()) <= limit else None


def validate_question(q, where, seen_ids):
    if not isinstance(q, dict):
        return "{}: must be an object.".format(where)
    qid = q.get("id")
    if not isinstance(qid, str) or not re.match(r"^[A-Za-z0-9_-]{1,40}$", qid):
        return "{}: needs an id (letters, digits, - or _).".format(where)
    if qid in seen_ids:
        return "{}: duplicate id {}.".format(where, qid)
    seen_ids.add(qid)
    text = clean_text(q.get("text"), 1000)
    if not text:
        return "{}: question text is empty or too long.".format(where)
    opts = q.get("options")
    if not isinstance(opts, list) or not 2 <= len(opts) <= 6:
        return "{}: needs 2 to 6 options.".format(where)
    seen = set()
    for o in opts:
        t = clean_text(o, 300)
        if not t:
            return "{}: an option is empty or too long.".format(where)
        if t.lower() in seen:
            return "{}: two options are identical ({}).".format(where, t)
        seen.add(t.lower())
    c = q.get("correct")
    if not isinstance(c, int) or isinstance(c, bool) or not 0 <= c < len(opts):
        return "{}: the correct answer is not set.".format(where)
    return None


def validate_maze(m, where):
    if not isinstance(m, dict):
        return "{}: maze missing.".format(where)
    rows = m.get("map")
    if not isinstance(rows, list) or not 3 <= len(rows) <= 61:
        return "{}: maze needs 3 to 61 rows.".format(where)
    if not all(isinstance(r, str) for r in rows) or len({len(r) for r in rows}) != 1:
        return "{}: maze rows must be text of equal length.".format(where)
    if not 3 <= len(rows[0]) <= 61:
        return "{}: maze needs 3 to 61 columns.".format(where)
    flat = "".join(rows)
    if set(flat) - TILES:
        return "{}: maze may only contain # . S G.".format(where)
    if flat.count("S") != 1 or flat.count("G") != 1:
        return "{}: maze needs exactly one S and one G.".format(where)
    if m.get("dir") not in ("N", "E", "S", "W"):
        return "{}: maze start direction must be N, E, S or W.".format(where)
    return None


def validate_exam(exam):
    if not isinstance(exam, dict):
        return "The exam must be an object."
    if not isinstance(exam.get("id"), str) or not ID_RE.match(exam["id"]):
        return "The exam id must be lowercase letters, digits and dashes (2-80 characters)."
    if not clean_text(exam.get("title"), 120):
        return "The exam needs a title (up to 120 characters)."
    if not isinstance(exam.get("description", ""), str) or len(exam.get("description", "")) > 2000:
        return "The description is too long."
    if exam.get("reveal", "wrong") not in REVEAL:
        return "reveal must be one of {}.".format(", ".join(REVEAL))
    items = exam.get("items")
    if not isinstance(items, list) or not 1 <= len(items) <= 300:
        return "The exam needs between 1 and 300 items."
    seen_ids = set()
    count = 0
    for i, item in enumerate(items, 1):
        where = "Item {}".format(i)
        if not isinstance(item, dict):
            return "{}: must be an object.".format(where)
        if item.get("type") == "question":
            err = validate_question(item, where, seen_ids)
            if err:
                return err
            count += 1
        elif item.get("type") == "maze":
            mid = item.get("id")
            if not isinstance(mid, str) or not re.match(r"^[A-Za-z0-9_-]{1,40}$", mid) or mid in seen_ids:
                return "{}: maze block needs a unique id.".format(where)
            seen_ids.add(mid)
            if not isinstance(item.get("title", ""), str) or len(item.get("title", "")) > 120:
                return "{}: maze title is too long.".format(where)
            if not isinstance(item.get("intro", ""), str) or len(item.get("intro", "")) > 1000:
                return "{}: maze introduction is too long.".format(where)
            err = validate_maze(item.get("maze"), where)
            if err:
                return err
            qs = item.get("questions")
            if not isinstance(qs, list) or not 1 <= len(qs) <= 50:
                return "{}: a maze block needs 1 to 50 questions.".format(where)
            for j, q in enumerate(qs, 1):
                err = validate_question(q, "{}, question {}".format(where, j), seen_ids)
                if err:
                    return err
                count += 1
        else:
            return "{}: type must be 'question' or 'maze'.".format(where)
    if count < 1:
        return "The exam has no questions."
    return None


def flat_questions(exam):
    """Questions in teacher order with their number (1-based) and maze title."""
    out = []
    n = 0
    for item in exam["items"]:
        if item["type"] == "question":
            n += 1
            out.append((n, item, None))
        else:
            for q in item["questions"]:
                n += 1
                out.append((n, q, item.get("title") or "Maze"))
    return out


def student_view(exam):
    def strip_q(q):
        return {"id": q["id"], "text": q["text"], "options": q["options"]}

    items = []
    for item in exam["items"]:
        if item["type"] == "question":
            d = strip_q(item)
            d["type"] = "question"
            items.append(d)
        else:
            items.append({
                "type": "maze", "id": item["id"], "title": item.get("title", ""),
                "intro": item.get("intro", ""), "maze": item["maze"],
                "questions": [strip_q(q) for q in item["questions"]],
            })
    return {"id": exam["id"], "title": exam["title"], "description": exam.get("description", ""), "items": items}


# --------------------------------------------------------------------- results

def slug(text, fallback="x", limit=30):
    s = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:limit].strip("-")
    return s or fallback


def now_iso():
    return dt.datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def grade_submission(exam, sub):
    """Return (result dict, error)."""
    if not isinstance(sub, dict):
        return None, "Invalid submission."
    name = clean_text(sub.get("student"), 80)
    if not name:
        return None, "Student name is required (up to 80 characters)."
    grade = sub.get("grade")
    if not isinstance(grade, int) or isinstance(grade, bool) or not 3 <= grade <= 12:
        return None, "Grade must be a number from 3 to 12."
    answers = sub.get("answers")
    if not isinstance(answers, list) or len(answers) > 400:
        return None, "answers must be a list."
    by_id = {}
    for a in answers:
        if isinstance(a, dict) and isinstance(a.get("qid"), str):
            by_id[a["qid"]] = a
    details, score, total = [], 0, 0
    for n, q, maze_title in flat_questions(exam):
        total += 1
        a = by_id.get(q["id"], {})
        chosen = a.get("chosen")
        if not (isinstance(chosen, int) and not isinstance(chosen, bool) and 0 <= chosen < len(q["options"])):
            chosen = None
        order = a.get("order")
        if not (isinstance(order, list) and sorted(order) == list(range(len(q["options"])))):
            order = list(range(len(q["options"])))
        position = a.get("position") if isinstance(a.get("position"), int) else None
        ok = chosen is not None and chosen == q["correct"]
        score += 1 if ok else 0
        details.append({
            "n": n, "qid": q["id"], "position": position, "text": q["text"], "maze": maze_title,
            "options": q["options"], "shownOrder": order,
            "chosen": chosen, "chosenText": q["options"][chosen] if chosen is not None else None,
            "correct": q["correct"], "correctText": q["options"][q["correct"]], "isCorrect": ok,
        })
    started = clean_text(sub.get("startedAt"), 40) or ""
    duration = sub.get("durationSec")
    duration = duration if isinstance(duration, int) and 0 <= duration < 10 ** 6 else None
    finished = now_iso()
    rid = "{}-{}-{}".format(dt.datetime.now().strftime("%Y%m%d-%H%M%S"), slug(name, "student", 20), secrets.token_hex(2))
    return {
        "id": rid, "examId": exam["id"], "examTitle": exam["title"], "student": name, "grade": grade,
        "startedAt": started, "finishedAt": finished, "durationSec": duration,
        "score": score, "total": total, "percent": round(100.0 * score / total, 1) if total else 0.0,
        "answers": details,
    }, None


def csv_row(r):
    wrong = [a for a in r["answers"] if a["chosen"] is not None and not a["isCorrect"]]
    skipped = [a for a in r["answers"] if a["chosen"] is None]
    details = " | ".join(
        "Q{}: chose '{}' (correct: '{}')".format(a["n"], a["chosenText"], a["correctText"]) for a in wrong
    )
    return {
        "finished_at": r["finishedAt"], "exam_id": r["examId"], "exam_title": r["examTitle"],
        "student": r["student"], "grade": r["grade"], "score": r["score"], "total": r["total"],
        "percent": r["percent"], "duration_sec": r.get("durationSec", ""),
        "wrong_questions": "; ".join("Q{}".format(a["n"]) for a in wrong),
        "unanswered_questions": "; ".join("Q{}".format(a["n"]) for a in skipped),
        "wrong_details": details,
    }


def result_files():
    if not RESULTS_DIR.exists():
        return []
    return sorted(RESULTS_DIR.glob("*/*.json"))


def load_results(exam_id=None):
    out = []
    for p in result_files():
        if exam_id and p.parent.name != exam_id:
            continue
        try:
            out.append(json.loads(p.read_text(encoding="utf-8")))
        except (OSError, json.JSONDecodeError):
            continue
    out.sort(key=lambda r: r.get("finishedAt", ""), reverse=True)
    return out


def results_csv_text(results):
    buf = io.StringIO()
    w = csv.DictWriter(buf, fieldnames=CSV_FIELDS)
    w.writeheader()
    for r in sorted(results, key=lambda r: r.get("finishedAt", "")):
        w.writerow(csv_row(r))
    return buf.getvalue()


def write_result(r):
    folder = RESULTS_DIR / r["examId"]
    folder.mkdir(parents=True, exist_ok=True)
    (folder / (r["id"] + ".json")).write_text(json.dumps(r, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    csv_path = RESULTS_DIR / "results.csv"
    new = not csv_path.exists() or csv_path.stat().st_size == 0
    with csv_path.open("a", newline="", encoding="utf-8-sig" if new else "utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=CSV_FIELDS)
        if new:
            w.writeheader()
        w.writerow(csv_row(r))


def valid_imported_result(r):
    if not isinstance(r, dict):
        return False
    if not isinstance(r.get("id"), str) or not re.match(r"^[A-Za-z0-9_-]{3,80}$", r["id"]):
        return False
    if not isinstance(r.get("examId"), str) or not ID_RE.match(r["examId"]):
        return False
    if not isinstance(r.get("student"), str) or not r["student"].strip() or len(r["student"]) > 80:
        return False
    if not isinstance(r.get("grade"), int) or not 3 <= r["grade"] <= 12:
        return False
    if not all(isinstance(r.get(k), (int, float)) for k in ("score", "total", "percent")):
        return False
    if not isinstance(r.get("answers"), list):
        return False
    for a in r["answers"]:
        if not isinstance(a, dict) or not all(k in a for k in ("n", "text", "isCorrect", "correctText", "chosen", "chosenText")):
            return False
    for k in ("examTitle", "finishedAt"):
        if not isinstance(r.get(k), str):
            return False
    return True


def exam_path(exam_id):
    return EXAMS_DIR / (exam_id + ".json")


def read_exam(exam_id):
    if not isinstance(exam_id, str) or not ID_RE.match(exam_id):
        return None
    try:
        return json.loads(exam_path(exam_id).read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None


def list_exams():
    out = []
    if EXAMS_DIR.exists():
        for p in sorted(EXAMS_DIR.glob("*.json")):
            try:
                e = json.loads(p.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                continue
            if validate_exam(e):
                continue
            out.append({
                "id": e["id"], "title": e["title"], "description": e.get("description", ""),
                "questions": len(flat_questions(e)), "updated": e.get("updated", ""),
            })
    out.sort(key=lambda e: e["updated"], reverse=True)
    return out


# ---------------------------------------------------------------------- server

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(BASE_DIR), **kwargs)

    # -- helpers
    def send_json(self, status, payload, headers=None):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        for key, value in (headers or []):
            self.send_header(key, value)
        self.end_headers()
        self.wfile.write(body)

    def cookie_token(self):
        for part in self.headers.get("Cookie", "").split(";"):
            key, _, value = part.strip().partition("=")
            if key == TEACHER_COOKIE:
                return value
        return ""

    def is_teacher(self):
        return teacher_token_valid(self.cookie_token())

    def deny_teacher(self):
        self.send_json(401, {"error": "Teacher login required.", "login": "/exam/login.html"})

    def set_teacher_cookie(self, token, delete=False):
        if delete:
            value = "%s=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict" % TEACHER_COOKIE
        else:
            value = "%s=%s; Path=/; Max-Age=%d; HttpOnly; SameSite=Strict" % (
                TEACHER_COOKIE, token, TEACHER_TTL)
        self.send_header("Set-Cookie", value)

    def read_json(self):
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            length = 0
        if length <= 0 or length > MAX_BODY:
            self.send_json(400, {"error": "Invalid request size."})
            return None
        try:
            return json.loads(self.rfile.read(length).decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            self.send_json(400, {"error": "Invalid JSON."})
            return None

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def list_directory(self, path):
        self.send_error(403, "Directory listing is disabled.")

    def log_message(self, fmt, *args):
        print("[{}] {}".format(self.log_date_time_string(), fmt % args))

    # -- routing
    def do_GET(self):
        parsed = urlparse(self.path)
        path = unquote(parsed.path)
        if path.startswith("/api/"):
            if path == "/api/login-status":
                return self.send_json(200, {"teacher": self.is_teacher()})
            return self.api_get(path, parse_qs(parsed.query))
        low = path.lower()
        if any(low.startswith(p) for p in BLOCKED_PREFIXES) or ".." in path:
            return self.send_error(404, "Not found")
        if path in TEACHER_PAGES and not self.is_teacher():
            self.send_response(302)
            self.send_header("Location", "/exam/login.html?next=" + quote(path, safe=""))
            self.send_header("Content-Length", "0")
            self.end_headers()
            return
        return super().do_GET()

    def do_HEAD(self):
        return self.do_GET()

    def do_POST(self):
        path = unquote(urlparse(self.path).path)
        if path == "/api/login":
            return self.api_login()
        if path == "/api/logout":
            return self.api_logout()
        if not self.is_teacher() and path != "/api/submit":
            return self.deny_teacher()
        if path == "/api/exams":
            return self.api_save_exam()
        if path == "/api/submit":
            return self.api_submit()
        if path == "/api/results/import":
            return self.api_import()
        self.send_json(404, {"error": "Not found"})

    def do_DELETE(self):
        if not self.is_teacher():
            return self.deny_teacher()
        path = unquote(urlparse(self.path).path)
        m = re.match(r"^/api/exams/([a-z0-9-]+)$", path)
        if m:
            with LOCK:
                try:
                    exam_path(m.group(1)).unlink()
                except OSError:
                    return self.send_json(404, {"error": "Exam not found."})
            return self.send_json(200, {"ok": True})
        m = re.match(r"^/api/results/([A-Za-z0-9_-]+)$", path)
        if m:
            with LOCK:
                for p in result_files():
                    if p.stem == m.group(1):
                        p.unlink()
                        self.rewrite_csv()
                        return self.send_json(200, {"ok": True})
            return self.send_json(404, {"error": "Result not found."})
        self.send_json(404, {"error": "Not found"})

    # -- API
    def api_login(self):
        payload = self.read_json()
        if payload is None:
            return
        if not password_ok(payload.get("password") if isinstance(payload, dict) else None):
            return self.send_json(401, {"error": "Incorrect password."})
        token = new_teacher_token()
        self.send_response(200)
        self.set_teacher_cookie(token)
        body = json.dumps({"ok": True}).encode("utf-8")
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def api_logout(self):
        with LOCK:
            token = self.cookie_token()
            TEACHER_TOKENS.pop(token, None)
        self.send_response(200)
        self.set_teacher_cookie("", delete=True)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def api_get(self, path, query):
        if path == "/api/exams":
            return self.send_json(200, {"exams": list_exams()})
        m = re.match(r"^/api/exams/([a-z0-9-]+)(/student)?$", path)
        if m:
            exam = read_exam(m.group(1))
            if not exam or validate_exam(exam):
                return self.send_json(404, {"error": "Exam not found."})
            if not m.group(2) and not self.is_teacher():
                return self.deny_teacher()
            return self.send_json(200, student_view(exam) if m.group(2) else exam)
        if path in ("/api/results", "/api/results.csv") and not self.is_teacher():
            return self.deny_teacher()
        if path == "/api/results":
            exam_id = (query.get("exam") or [None])[0]
            return self.send_json(200, {"results": load_results(exam_id)})
        if path == "/api/results.csv":
            body = ("\ufeff" + results_csv_text(load_results())).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/csv; charset=utf-8")
            self.send_header("Content-Disposition", 'attachment; filename="enigmapath-results.csv"')
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return None
        self.send_json(404, {"error": "Not found"})

    def api_save_exam(self):
        exam = self.read_json()
        if exam is None:
            return
        err = validate_exam(exam)
        if err:
            return self.send_json(400, {"error": err})
        with LOCK:
            EXAMS_DIR.mkdir(parents=True, exist_ok=True)
            old = read_exam(exam["id"])
            exam["created"] = (old or {}).get("created") or now_iso()
            exam["updated"] = now_iso()
            exam.setdefault("reveal", "wrong")
            exam_path(exam["id"]).write_text(json.dumps(exam, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
        self.send_json(200, {"ok": True, "id": exam["id"], "questions": len(flat_questions(exam))})

    def api_submit(self):
        sub = self.read_json()
        if sub is None:
            return
        exam = read_exam(sub.get("examId") if isinstance(sub, dict) else None)
        if not exam or validate_exam(exam):
            return self.send_json(404, {"error": "Exam not found."})
        result, err = grade_submission(exam, sub)
        if err:
            return self.send_json(400, {"error": err})
        try:
            with LOCK:
                write_result(result)
        except OSError as error:
            return self.send_json(500, {"error": "Could not save the result: {}".format(error)})
        # Students never see their score: it is stored for the teacher's results page only.
        self.send_json(200, {"ok": True})

    def api_import(self):
        payload = self.read_json()
        if payload is None:
            return
        items = payload.get("results") if isinstance(payload, dict) else payload
        if not isinstance(items, list):
            return self.send_json(400, {"error": "Send a list of result objects."})
        added = skipped = invalid = 0
        with LOCK:
            have = {p.stem for p in result_files()}
            for r in items:
                if not valid_imported_result(r):
                    invalid += 1
                elif r["id"] in have:
                    skipped += 1
                else:
                    write_result(r)
                    have.add(r["id"])
                    added += 1
        self.send_json(200, {"ok": True, "added": added, "skipped": skipped, "invalid": invalid})

    def rewrite_csv(self):
        (RESULTS_DIR / "results.csv").write_text(
            "\ufeff" + results_csv_text(load_results()), encoding="utf-8")


def make_server(host, port):
    EXAMS_DIR.mkdir(parents=True, exist_ok=True)
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    return ThreadingHTTPServer((host, port), Handler)


def main():
    global TEACHER_PASSWORD, EXAMS_DIR, RESULTS_DIR

    parser = argparse.ArgumentParser(description="EnigmaPath local server (needed for the exam).")
    parser.add_argument("--host", default="127.0.0.1", help="Address to listen on (default 127.0.0.1; use 0.0.0.0 for the whole network).")
    parser.add_argument("--port", type=int, default=8000, help="Port (default 8000).")
    parser.add_argument("--no-browser", action="store_true", help="Do not open the browser.")
    parser.add_argument("--data", help="Folder for exams/ and results/ (default: this folder).")
    parser.add_argument("--teacher-password", help="Set the teacher password without an interactive prompt.")
    args = parser.parse_args()

    password = read_start_password(args.teacher_password)
    if password is None:
        print("Wrong password too many times. The server did not start.")
        return
    TEACHER_PASSWORD = password

    if args.data:
        EXAMS_DIR = Path(args.data).resolve() / "exams"
        RESULTS_DIR = Path(args.data).resolve() / "results"

    server = None
    port = args.port
    for candidate in range(args.port, args.port + 10):
        try:
            server = make_server(args.host, candidate)
            port = candidate
            break
        except OSError:
            continue
    if server is None:
        print("Could not start: ports {}-{} are busy. Try --port 9000.".format(args.port, args.port + 9))
        return

    url = "http://127.0.0.1:{}/".format(port)
    print("EnigmaPath server")
    print("  Home:      " + url)
    print("  Exam:      " + url + "exam/index.html")
    print("  Teacher:   " + url + "exam/login.html  ->  builder.html / results.html")
    print("  Results:   " + str(RESULTS_DIR))
    print("Press Ctrl+C to stop.")
    if not args.no_browser:
        threading.Timer(0.6, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
