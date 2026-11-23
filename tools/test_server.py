#!/usr/bin/env python3
"""API tests for server.py. Uses a temporary folder, so real exams/results are untouched.
Run: python3 tools/test_server.py"""
import csv
import io
import json
import sys
import tempfile
import threading
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
import server  # noqa: E402

tmp = Path(tempfile.mkdtemp(prefix="enigmapath-test-"))
server.EXAMS_DIR = tmp / "exams"
server.RESULTS_DIR = tmp / "results"
server.TEACHER_PASSWORD = "Mirija04"
httpd = server.make_server("127.0.0.1", 0)
PORT = httpd.server_address[1]
threading.Thread(target=httpd.serve_forever, daemon=True).start()
BASE = "http://127.0.0.1:%d" % PORT

failures = 0
COOKIE = None


def call_raw(method, path, body=None, as_teacher=True):
    data = json.dumps(body).encode() if body is not None else None
    headers = {"Content-Type": "application/json"}
    if as_teacher and COOKIE:
        headers["Cookie"] = COOKIE
    req = urllib.request.Request(BASE + path, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req) as r:
            raw = r.read()
            parsed = json.loads(raw) if r.headers.get_content_type() == "application/json" else raw.decode()
            return r.status, parsed, r.headers
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            parsed = json.loads(raw)
        except ValueError:
            parsed = raw.decode()
        return e.code, parsed, e.headers


def call(method, path, body=None, as_teacher=True):
    status, parsed, _ = call_raw(method, path, body, as_teacher)
    return status, parsed


def check(name, cond, extra=""):
    global failures
    if cond:
        print("ok  ", name)
    else:
        failures += 1
        print("FAIL", name, extra)


MAZE = {"name": "Tiny", "map": ["#####", "#S.G#", "#####"], "dir": "E"}
EXAM = {
    "id": "unit-test-exam", "title": "Unit test exam", "description": "",
    "items": [
        {"type": "question", "id": "q1", "text": "2+2?", "options": ["3", "4", "5", "6"], "correct": 1},
        {"type": "maze", "id": "m1", "title": "Tiny maze", "intro": "Look", "maze": MAZE, "questions": [
            {"id": "m1a", "text": "Fewest instructions?", "options": ["1", "2", "3"], "correct": 1, "auto": "fewestInstructions"},
            {"id": "m1b", "text": "Turns?", "options": ["0", "1"], "correct": 0},
        ]},
    ],
}

# ------------------------------------------------------------------ login
s, r = call("POST", "/api/login", {"password": "wrong"}, as_teacher=False)
check("wrong teacher password rejected", s == 401, r)
s, r, h = call_raw("POST", "/api/login", {"password": "Mirija04"}, as_teacher=False)
check("correct teacher password accepted", s == 200 and r.get("ok") is True, r)
COOKIE = (h.get("Set-Cookie") or "").split(";")[0]
check("login sets an HttpOnly cookie", "ep_teacher=" in COOKIE and "HttpOnly" in h.get("Set-Cookie", ""), h.get("Set-Cookie"))
s, r = call("GET", "/api/login-status", as_teacher=False)
check("login-status is false without cookie", s == 200 and r["teacher"] is False, r)
s, r = call("GET", "/api/login-status")
check("login-status is true with cookie", s == 200 and r["teacher"] is True, r)

# teacher endpoints are closed before login
s, r = call("POST", "/api/exams", EXAM, as_teacher=False)
check("save exam denied before login", s == 401 and r.get("login") == "/exam/login.html", r)
s, r = call("GET", "/api/exams/unit-test-exam", as_teacher=False)
check("answer key denied before login", s in (401, 404), r)
s, r = call("GET", "/api/results", as_teacher=False)
check("results denied before login", s == 401, r)

s, r = call("POST", "/api/exams", EXAM)
check("save valid exam", s == 200 and r.get("questions") == 3, r)
bad = json.loads(json.dumps(EXAM)); bad["items"][0]["correct"] = 9
check("reject correct index out of range", call("POST", "/api/exams", bad)[0] == 400)
bad = json.loads(json.dumps(EXAM)); bad["items"][0]["options"] = ["a", "A", "b"]
check("reject duplicate options", call("POST", "/api/exams", bad)[0] == 400)
bad = json.loads(json.dumps(EXAM)); bad["items"][1]["maze"]["map"] = ["#####", "#S.##", "#####"]
check("reject maze without goal", call("POST", "/api/exams", bad)[0] == 400)
bad = json.loads(json.dumps(EXAM)); bad["id"] = "../evil"
check("reject bad id", call("POST", "/api/exams", bad)[0] == 400)

s, r = call("GET", "/api/exams", as_teacher=False)
check("list has the exam (public)", s == 200 and [e["id"] for e in r["exams"]] == ["unit-test-exam"] and r["exams"][0]["questions"] == 3, r)
s, r = call("GET", "/api/exams/unit-test-exam")
check("teacher view has the answer key", s == 200 and r["items"][0]["correct"] == 1)
s, r = call("GET", "/api/exams/unit-test-exam/student", as_teacher=False)
text = json.dumps(r)
check("student view hides answers", s == 200 and '"correct"' not in text and '"auto"' not in text, text[:200])
check("student view keeps questions and maze", len(r["items"]) == 2 and r["items"][1]["maze"]["map"])

# students answer: q1 right (original index 1), m1a wrong (0), m1b unanswered
sub = {
    "examId": "unit-test-exam", "student": "Ada Lovelace", "grade": 7, "startedAt": "2026-01-01 10:00:00", "durationSec": 61,
    "answers": [
        {"qid": "q1", "chosen": 1, "order": [2, 1, 0, 3], "position": 2},
        {"qid": "m1a", "chosen": 0, "order": [1, 0, 2], "position": 3},
        {"qid": "m1b", "chosen": None, "order": [0, 1], "position": 1},
    ],
}
s, r = call("POST", "/api/submit", sub, as_teacher=False)
check("submit works without login", s == 200 and r == {"ok": True}, r)
for bad_sub in ({**sub, "student": ""}, {**sub, "grade": 2}, {**sub, "grade": 13}, {**sub, "examId": "nope"}):
    check("reject bad submission %s/%s" % (bad_sub["student"], bad_sub["grade"]), call("POST", "/api/submit", bad_sub, as_teacher=False)[0] in (400, 404))

s, r = call("GET", "/api/results")
check("result stored", s == 200 and len(r["results"]) == 1 and r["results"][0]["student"] == "Ada Lovelace")
rec = r["results"][0]
check("result lists wrong questions with chosen/correct text", [(a["n"], a["chosenText"], a["correctText"]) for a in rec["answers"] if not a["isCorrect"]] == [(2, "1", "2"), (3, None, "0")], rec["answers"])
files = list((server.RESULTS_DIR / "unit-test-exam").glob("*.json"))
check("one json file per attempt", len(files) == 1)
rows = list(csv.DictReader(io.StringIO((server.RESULTS_DIR / "results.csv").read_text(encoding="utf-8-sig"))))
check("csv row", len(rows) == 1 and rows[0]["student"] == "Ada Lovelace" and rows[0]["wrong_questions"] == "Q2" and rows[0]["unanswered_questions"] == "Q3" and rows[0]["grade"] == "7", rows)
s, text = call("GET", "/api/results.csv")
check("csv endpoint", s == 200 and "Ada Lovelace" in text)
check("csv endpoint denied before login", call("GET", "/api/results.csv", as_teacher=False)[0] == 401)

# import
imp = dict(rec); imp["id"] = "imported-1"; imp["student"] = "Grace Hopper"
s, r = call("POST", "/api/results/import", {"results": [imp, imp, {"nonsense": True}]})
check("import adds once, skips dup, flags invalid", s == 200 and (r["added"], r["skipped"], r["invalid"]) == (1, 1, 1), r)
s, r = call("GET", "/api/results?exam=unit-test-exam")
check("filter by exam", {x["student"] for x in r["results"]} == {"Ada Lovelace", "Grace Hopper"})

# delete
s, r = call("DELETE", "/api/results/imported-1")
check("delete result", s == 200 and len(call("GET", "/api/results?exam=unit-test-exam")[1]["results"]) == 1)
check("delete denied before login", call("DELETE", "/api/exams/unit-test-exam", as_teacher=False)[0] == 401)
check("csv rewritten after delete", "Grace Hopper" not in (server.RESULTS_DIR / "results.csv").read_text(encoding="utf-8-sig"))
check("delete exam", call("DELETE", "/api/exams/unit-test-exam")[0] == 200 and call("GET", "/api/exams/unit-test-exam")[0] == 404)

# logout
s, _, h = call_raw("POST", "/api/logout")
check("logout clears the cookie", s == 200 and "Max-Age=0" in h.get("Set-Cookie", ""), h.get("Set-Cookie"))
COOKIE = None
check("teacher call denied after logout", call("GET", "/api/results")[0] == 401)

# static files and blocked paths
for path, code in (("/index.html", 200), ("/shared/theme.css", 200), ("/server.py", 404), ("/data/exams/unit-test-exam.json", 404), ("/results/results.csv", 404), ("/tools/test_server.py", 404)):
    try:
        with urllib.request.urlopen(BASE + path) as resp:
            got = resp.status
    except urllib.error.HTTPError as e:
        got = e.code
    check("GET %s -> %d" % (path, code), got == code, got)

httpd.shutdown()
print("%d failure(s)" % failures if failures else "server tests passed")
sys.exit(1 if failures else 0)
