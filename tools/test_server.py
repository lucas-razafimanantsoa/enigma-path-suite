#!/usr/bin/env python3
"""API tests for server.py. Uses a temporary folder, so real exams/results are untouched.
Run: python3 tools/test_server.py"""
import csv
import http.client
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
originals = [p for p in files if not p.name.endswith(".marked.json")]
check("one original json file per attempt", len(originals) == 1, files)
check("mcq-only attempt gets an auto-marked file", len(files) == 2 and any(p.name.endswith(".marked.json") for p in files), files)
auto_marked = json.loads([p for p in files if p.name.endswith(".marked.json")][0].read_text(encoding="utf-8"))
check("auto-marked file has score and symbol",
      auto_marked["status"] == "marked" and auto_marked["score"] == 1 and auto_marked["total"] == 3
      and auto_marked["percent"] == 33.3 and auto_marked["symbol"] == "F", auto_marked)
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

# --------------------------------------------------------------- mixed exam
MIXED = {
    "id": "mixed-test-exam", "title": "Mixed unit test", "subject": "ICT", "mode": "mixed",
    "description": "MCQ and open questions.",
    "items": [
        {"type": "question", "id": "mq1", "text": "2+2?", "options": ["3", "4", "5"], "correct": 1},
        {"type": "open", "id": "op1", "text": "Explain a network.", "points": 5,
         "modelAnswer": "Devices connected to share data.", "markingNotes": "Look for devices and sharing."},
        {"type": "open", "id": "op2", "text": "Name one protocol.", "points": 3, "modelAnswer": "TCP or HTTP."},
    ],
}
s, r = call("POST", "/api/exams", MIXED)
check("save mixed exam", s == 200 and r.get("questions") == 3 and r.get("points") == 9, r)
bad = json.loads(json.dumps(MIXED)); del bad["items"][1]["modelAnswer"]
check("open question requires an answer key", call("POST", "/api/exams", bad)[0] == 400)
s, r = call("GET", "/api/exams/mixed-test-exam/student", as_teacher=False)
mixed_text = json.dumps(r)
check("student view shows mixed mode and open points",
      s == 200 and r["mode"] == "mixed" and r["items"][1]["type"] == "open" and r["items"][1]["points"] == 5
      and "modelAnswer" not in mixed_text and "markingNotes" not in mixed_text, mixed_text[:300])
bad = json.loads(json.dumps(EXAM)); bad["items"].append({"type": "open", "id": "opx", "text": "x", "points": 2})
check("open question rejected in mcq-only exam", call("POST", "/api/exams", bad)[0] == 400)

mixed_sub = {
    "examId": "mixed-test-exam", "student": "Mary Jackson", "grade": 9,
    "startedAt": "2026-01-01 11:00:00", "durationSec": 120,
    "answers": [
        {"qid": "mq1", "chosen": 1, "order": [1, 0, 2], "position": 1},
        {"qid": "op1", "position": 2, "response": "Computers connected to share files."},
        {"qid": "op2", "position": 3, "response": ""},
    ],
}
s, r = call("POST", "/api/submit", mixed_sub, as_teacher=False)
check("mixed submit works", s == 200, r)
s, r = call("GET", "/api/results?exam=mixed-test-exam")
check("mixed result is pending", s == 200 and len(r["results"]) == 1, r)
mixed_rec = r["results"][0]
check("mixed result has auto score and null final score",
      mixed_rec["status"] == "pending" and mixed_rec["autoScore"] == 1 and mixed_rec["total"] == 9
      and mixed_rec["percent"] is None and mixed_rec["marked"] is False and mixed_rec["finalScore"] is None, mixed_rec)
s, r = call("GET", "/api/results/" + mixed_rec["id"])
check("single result endpoint returns no marked file yet", s == 200 and r["result"]["student"] == "Mary Jackson" and r["marked"] is None, r)
check("mark endpoint denied before login",
      call("POST", "/api/results/%s/mark" % mixed_rec["id"], {}, as_teacher=False)[0] == 401)
s, r = call("POST", "/api/results/%s/mark" % mixed_rec["id"], {"marks": {"op1": 5}})
check("mark rejects missing open marks", s == 400, r)
s, r = call("POST", "/api/results/%s/mark" % mixed_rec["id"], {
    "marks": {"op1": 3.5, "op2": 0},
    "comments": {"op1": "Good example.", "op2": "No answer."},
    "generalComment": "Keep practising protocols.",
})
check("mark saves mixed result", s == 200 and r["marked"]["score"] == 4.5 and r["marked"]["total"] == 9
      and r["marked"]["percent"] == 50.0 and r["marked"]["symbol"] == "E", r)
marked_file = server.RESULTS_DIR / "mixed-test-exam" / (mixed_rec["id"] + ".marked.json")
check("marked sidecar file written", marked_file.exists())
s, r = call("GET", "/api/results/" + mixed_rec["id"])
check("single result endpoint returns marked data", s == 200 and r["marked"]["generalComment"] == "Keep practising protocols.")
check("open marks and comments stored", r["marked"]["answers"][1]["awarded"] == 3.5
      and r["marked"]["answers"][1]["comment"] == "Good example." and r["marked"]["answers"][2]["awarded"] == 0)
s, r = call("GET", "/api/results?exam=mixed-test-exam")
rec2 = r["results"][0]
check("results list exposes final marked score", rec2["marked"] is True and rec2["finalScore"] == 4.5
      and rec2["finalPercent"] == 50.0 and rec2["symbol"] == "E", rec2)
rows = list(csv.DictReader(io.StringIO((server.RESULTS_DIR / "results.csv").read_text(encoding="utf-8-sig"))))
mixed_row = [row for row in rows if row["student"] == "Mary Jackson"][0]
check("csv has marked symbol and status", mixed_row["symbol"] == "E" and mixed_row["status"] == "marked"
      and mixed_row["open_score"] == "3.5", mixed_row)

for p, symbol in ((100, "A+"), (96, "A+"), (95.9, "A"), (90, "A"), (86, "B+"), (80, "B"),
                  (76, "C+"), (70, "C"), (66, "D+"), (60, "D"), (56, "E+"), (50, "E"), (49.9, "F")):
    check("symbol %s -> %s" % (p, symbol), server.symbol_for(p) == symbol, server.symbol_for(p))

# delete
s, r = call("DELETE", "/api/results/imported-1")
check("delete result", s == 200 and len(call("GET", "/api/results?exam=unit-test-exam")[1]["results"]) == 1)
check("delete denied before login", call("DELETE", "/api/exams/unit-test-exam", as_teacher=False)[0] == 401)
check("clear history denied before login", call("DELETE", "/api/results", as_teacher=False)[0] == 401)
check("csv rewritten after delete", "Grace Hopper" not in (server.RESULTS_DIR / "results.csv").read_text(encoding="utf-8-sig"))
check("delete exam", call("DELETE", "/api/exams/unit-test-exam")[0] == 200 and call("GET", "/api/exams/unit-test-exam")[0] == 404)

# clear all exam history
s, r = call("DELETE", "/api/results")
check("clear all exam history", s == 200 and r.get("deleted") == 2, r)
check("history is empty after clearing", call("GET", "/api/results")[1]["results"] == [])
check("no attempt files remain after clearing", list(server.RESULTS_DIR.glob("*/*.json")) == [])
csv_after_clear = (server.RESULTS_DIR / "results.csv").read_text(encoding="utf-8-sig")
check("csv cleared but header kept", "Ada Lovelace" not in csv_after_clear and "Mary Jackson" not in csv_after_clear
      and csv_after_clear.startswith("finished_at"), csv_after_clear)

# logout
s, _, h = call_raw("POST", "/api/logout")
check("logout clears the cookie", s == 200 and "Max-Age=0" in h.get("Set-Cookie", ""), h.get("Set-Cookie"))
COOKIE = None
check("teacher call denied after logout", call("GET", "/api/results")[0] == 401)

conn = http.client.HTTPConnection("127.0.0.1", PORT)
conn.request("GET", "/exam/report.html?id=abc")
resp = conn.getresponse()
location = resp.getheader("Location") or ""
check("report page redirects to login and keeps the result id",
      resp.status == 302 and "report.html" in location and "abc" in location, location)
conn.close()

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
