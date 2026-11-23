#!/usr/bin/env python3
"""
EnigmaPath question-bank tool (standard library only).

Source of truth:
  data/questions/level-01.json ... level-10.json           ICT (topic "ict")
  data/questions/<topic>/level-01.json ...                   every other topic
                                                              (the level count comes from meta.json; maths has 11)
Each file is a JSON list of questions:
  {"question_text": str, "options": [4 strings], "correct_answer_index": 0-3,
   "term_category": "Term 1" | "Term 2" | "Term 3"}

Commands:
  python3 tools/questions_tool.py merge [topic] [N ...]    merge data/questions/<topic>/_parts/LNN-*.json
  python3 tools/questions_tool.py validate [topic] [N ...] validate every topic (or one topic / some levels)
  python3 tools/questions_tool.py build                    validate, then write quiz/data/questions.js
                                                          and quiz/data/topics.js

The topic argument defaults to "ict" when omitted or when a number comes first.
"""
from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
QDIR = ROOT / "data" / "questions"
PARTS = QDIR / "_parts"
OUT_JS = ROOT / "quiz" / "data" / "questions.js"
OUT_TOPICS = ROOT / "quiz" / "data" / "topics.js"
DEFAULT_LEVELS = list(range(1, 11))
TERMS = ("Term 1", "Term 2", "Term 3")
MIN_PER_LEVEL = 100          # ICT keeps its original large bank
MIN_PER_NEW_TOPIC = 20       # new subjects: a solid pool per level
KEYS = {"question_text", "options", "correct_answer_index", "term_category"}
BANNED = re.compile(r"\b(all|none|both) of the (above|these)\b|\ball the above\b", re.I)


TOPIC_ORDER = ["ict", "maths", "science", "physics", "chemistry", "biology", "geography", "general"]


def topics():
    found = [p.name for p in QDIR.iterdir() if p.is_dir() and (p / "meta.json").exists()]
    names = [t for t in TOPIC_ORDER if t == "ict" or t in found]
    names += sorted(t for t in found if t not in names)
    return names


def topic_dir(topic: str) -> Path:
    return QDIR if topic == "ict" else QDIR / topic


def level_file(n: int, topic: str = "ict") -> Path:
    return topic_dir(topic) / "level-{:02d}.json".format(n)


def load(n: int, topic: str = "ict"):
    path = level_file(n, topic)
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def norm(text: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9 ]+", " ", text.lower())).strip()


def min_per_level(topic: str) -> int:
    return MIN_PER_LEVEL if topic == "ict" else MIN_PER_NEW_TOPIC


def levels_for(topic: str):
    """Number of levels is read from the topic's meta.json (maths has an A-Level extension)."""
    try:
        meta = json.loads((topic_dir(topic) / "meta.json").read_text(encoding="utf-8"))
        return list(range(1, len(meta.get("levels") or DEFAULT_LEVELS) + 1))
    except (OSError, json.JSONDecodeError):
        return list(DEFAULT_LEVELS)


def validate(levels=None, only_topics=None):
    errors, warnings = [], []
    only_topics = only_topics or topics()
    for topic in only_topics:
        seen = {}
        topic_levels = levels_for(topic)
        use_levels = [n for n in levels if n in topic_levels] if levels else topic_levels
        for n in use_levels:
            data = load(n, topic)
            if data is None:
                if levels is None or n in levels:
                    errors.append("{} level {}: file missing".format(topic, n))
                continue
            if not isinstance(data, list):
                errors.append("{} level {}: must be a list".format(topic, n))
                continue
            for i, q in enumerate(data, 1):
                tag = "{} L{} #{}".format(topic, n, i)
                if not isinstance(q, dict) or set(q) != KEYS:
                    errors.append("{}: bad keys {}".format(tag, sorted(q) if isinstance(q, dict) else type(q)))
                    continue
                text = q["question_text"]
                opts = q["options"]
                idx = q["correct_answer_index"]
                if not isinstance(text, str) or len(text.strip()) < 8:
                    errors.append("{}: question_text too short/not a string".format(tag))
                    continue
                if not (isinstance(opts, list) and len(opts) == 4 and all(isinstance(o, str) and o.strip() for o in opts)):
                    errors.append("{}: needs exactly 4 non-empty string options".format(tag))
                    continue
                if not (isinstance(idx, int) and not isinstance(idx, bool) and 0 <= idx < 4):
                    errors.append("{}: correct_answer_index must be 0-3".format(tag))
                    continue
                if q["term_category"] not in TERMS:
                    errors.append("{}: term_category must be one of {}".format(tag, TERMS))
                if len({re.sub(r"\s+", " ", o.strip().lower()) for o in opts}) != 4:
                    errors.append("{}: duplicate options: {}".format(tag, opts))
                if BANNED.search(" ".join(opts)):
                    errors.append("{}: uses 'all/none of the above' style option".format(tag))
                key = norm(text)
                if key in seen and seen[key] != tag:
                    (errors if levels is None or n in levels else warnings).append("{}: duplicate of {} ({})".format(tag, seen[key], text[:60]))
                else:
                    seen[key] = tag
            if levels is None or n in levels:
                if len(data) < min_per_level(topic):
                    errors.append("{} level {}: only {} questions (need {})".format(topic, n, len(data), min_per_level(topic)))
                terms = Counter(q.get("term_category") for q in data if isinstance(q, dict))
                for t in TERMS:
                    if terms[t] < 0.2 * len(data):
                        warnings.append("{} level {}: few {} questions ({})".format(topic, n, t, terms[t]))
                pos = Counter(q.get("correct_answer_index") for q in data if isinstance(q, dict))
                if n > 3 and pos and max(pos.values()) > 0.45 * len(data):
                    warnings.append("{} level {}: correct answer positions are lopsided {}".format(topic, n, dict(pos)))
                longest = sum(
                    1 for q in data
                    if isinstance(q, dict) and isinstance(q.get("options"), list) and len(q["options"]) == 4
                    and isinstance(q.get("correct_answer_index"), int) and 0 <= q["correct_answer_index"] < 4
                    and len(q["options"][q["correct_answer_index"]]) == max(len(o) for o in q["options"])
                )
                if data and longest > 0.5 * len(data):
                    warnings.append("{} level {}: the correct answer is the longest option in {}/{} questions (bias)".format(topic, n, longest, len(data)))
    return errors, warnings


def cmd_merge(topic: str, only=None):
    base = topic_dir(topic)
    parts_dir = base / "_parts"
    for n in only or levels_for(topic):
        parts = sorted(parts_dir.glob("L{:02d}-*.json".format(n)))
        if not parts:
            continue
        data = load(n, topic) or []
        for p in parts:
            chunk = json.loads(p.read_text(encoding="utf-8"))
            data.extend(chunk)
            print("{} level {}: +{} from {}".format(topic, n, len(chunk), p.name))
        level_file(n, topic).write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
        for p in parts:
            p.unlink()
        print("{} level {}: now {} questions".format(topic, n, len(data)))


def report(errors, warnings):
    for w in warnings:
        print("WARN  " + w)
    for e in errors:
        print("ERROR " + e)
    print("{} error(s), {} warning(s)".format(len(errors), len(warnings)))


def bank_key(topic: str, n: int) -> str:
    return "level{}".format(n) if topic == "ict" else "{}{}".format(topic, n)


def cmd_build():
    errors, warnings = validate()
    report(errors, warnings)
    if errors:
        sys.exit(1)
    bank = {}
    for topic in topics():
        for n in levels_for(topic):
            bank[bank_key(topic, n)] = load(n, topic)
    (OUT_JS.parent).mkdir(parents=True, exist_ok=True)
    OUT_JS.write_text(
        "/* Generated by tools/questions_tool.py build. Do not edit by hand. */\n"
        "window.QUESTION_BANK = " + json.dumps(bank, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )
    meta = []
    for topic in topics():
        m = json.loads((topic_dir(topic) / "meta.json").read_text(encoding="utf-8"))
        m["id"] = topic
        meta.append(m)
    OUT_TOPICS.write_text(
        "/* Generated by tools/questions_tool.py build. Do not edit by hand. */\n"
        "window.QUESTION_TOPICS = " + json.dumps(meta, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )
    print("wrote {} ({} questions across {} topics)".format(
        OUT_JS.relative_to(ROOT), sum(len(v) for v in bank.values()), len(topics())))
    print("wrote {}".format(OUT_TOPICS.relative_to(ROOT)))


def parse_args(argv):
    topic = "ict"
    rest = list(argv)
    if rest and not rest[0].isdigit():
        topic = rest.pop(0)
    if topic not in topics():
        print("Unknown topic '{}'. Known topics: {}".format(topic, ", ".join(topics())))
        sys.exit(2)
    return topic, [int(a) for a in rest] or None


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "validate"
    if cmd in ("merge", "validate"):
        args = sys.argv[2:]
        if cmd == "validate" and not args:
            errors, warnings = validate()
            report(errors, warnings)
            sys.exit(1 if errors else 0)
        topic, levels = parse_args(args)
        if cmd == "merge":
            cmd_merge(topic, levels)
        else:
            errors, warnings = validate(levels, [topic])
            report(errors, warnings)
            sys.exit(1 if errors else 0)
    elif cmd == "build":
        cmd_build()
    else:
        print(__doc__)
        sys.exit(2)


if __name__ == "__main__":
    main()
