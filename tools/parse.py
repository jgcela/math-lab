"""Parse the Archdiocese of Denver 2018 Math Standards (pdftotext -layout output) into JSON.

Output: standards.json with grades PK..7 plus Algebra I, each objective carrying
an ID (grade.domain.subdomain.number), its text, and its PDF page number.
"""
import json, re, sys

src = open(sys.argv[1], encoding="utf-8").read()
pages = src.split("\f")

GRADE_HEADERS = {
    "PRESCHOOL – PRE-KINDERGARTEN": "PK", "KINDERGARTEN": "K",
    "1ST GRADE": "1", "2ND GRADE": "2", "3RD GRADE": "3", "4TH GRADE": "4",
    "5TH GRADE": "5", "6TH GRADE": "6", "7TH GRADE": "7", "ALGEBRA I": "ALG1",
}
GRADE_NAMES = {"PK": "Preschool – Pre-K", "K": "Kindergarten", "1": "1st Grade", "2": "2nd Grade",
               "3": "3rd Grade", "4": "4th Grade", "5": "5th Grade", "6": "6th Grade",
               "7": "7th Grade", "ALG1": "Algebra I"}

grades = {}
cur_grade = cur_domain = cur_sub = None
cur_obj = None
in_disp = False
cur_section = None

def title(s):
    small = {"and", "of", "the"}
    return " ".join(w.capitalize() if i == 0 or w.lower() not in small else w.lower()
                    for i, w in enumerate(s.lower().split()))

for pno, page in enumerate(pages, start=1):
    lines = page.split("\n")
    for raw in lines:
        line = raw.rstrip()
        s = line.strip()
        if not s:
            continue
        if s.startswith("2018 Math Standards") or re.fullmatch(r"\(Page \d+ of \d+\)", s) or re.fullmatch(r"\d+", s):
            continue
        if s == "2018 Math Scope and Sequence":
            cur_grade = None
            break
        if s in GRADE_HEADERS:
            g = GRADE_HEADERS[s]
            cur_grade = g
            if g not in grades:
                grades[g] = {"id": g, "name": GRADE_NAMES[g], "page": pno, "dispositions": [], "domains": []}
                cur_domain = cur_sub = cur_obj = None
            in_disp = False
            continue
        if s.startswith("HIGH SCHOOL:") or s in ("GEOMETRY",) and cur_grade == "ALG1":
            cur_grade = None
            continue
        if cur_grade is None:
            continue
        G = grades[cur_grade]
        sm = re.match(r"^SECTION (\d+): (.+)$", s)
        if sm:
            in_disp = False
            cur_section = {"n": int(sm.group(1)), "name": title(sm.group(2))}
            cur_obj = None
            continue
        if s == "CATHOLIC DISPOSITIONS":
            in_disp = True
            continue
        m = re.match(r"^([IVX]+)\.\s+(.+)$", s)
        if m:
            in_disp = False
            name = m.group(2)
            note = None
            if "–" in name:
                name, note = [x.strip() for x in name.split("–", 1)]
            cur_domain = {"code": m.group(1), "name": title(name), "page": pno, "subdomains": [], "objectives": []}
            if note:
                cur_domain["note"] = note
            if cur_grade == "ALG1" and cur_section:
                cur_domain["section"] = cur_section
            G["domains"].append(cur_domain)
            cur_sub = cur_obj = None
            continue
        if in_disp:
            if s.startswith("-"):
                G["dispositions"].append(s.lstrip("- ").strip())
            elif G["dispositions"]:
                G["dispositions"][-1] += " " + s
            continue
        m = re.match(r"^([A-H])\.\s+(.+)$", s)
        if m and cur_domain is not None:
            name = m.group(2)
            note = None
            if "–" in name:
                name, note = [x.strip() for x in name.split("–", 1)]
            cur_sub = {"code": m.group(1), "name": name, "page": pno, "objectives": []}
            if note:
                cur_sub["note"] = note
            cur_domain["subdomains"].append(cur_sub)
            cur_obj = None
            continue
        if s.lower().endswith("the student will:"):
            continue
        m = re.match(r"^(\d+)\.\s+(.+)$", s)
        if m and cur_domain is not None:
            n = int(m.group(1))
            parts = [cur_grade, cur_domain["code"]] + ([cur_sub["code"]] if cur_sub else []) + [str(n)]
            cur_obj = {"id": ".".join(parts), "n": n, "text": m.group(2), "page": pno}
            (cur_sub or cur_domain)["objectives"].append(cur_obj)
            continue
        if cur_obj is not None:
            cur_obj["text"] += " " + s
            continue

for G in grades.values():
    for d in G["domains"]:
        for o in d["objectives"] + [o for sd in d["subdomains"] for o in sd["objectives"]]:
            o["text"] = re.sub(r"\s+", " ", o["text"]).strip()
        # The source document has a few numbering slips (e.g. 1st Grade I.D starts at 3 and repeats 5 and 6).
        # Keep the printed number, make IDs unique, and record what happened.
        for holder in [d] + d["subdomains"]:
            seen = {}
            objs = holder["objectives"]
            if objs and objs[0]["n"] != 1:
                holder["numberingNote"] = f"In the document, numbering in this section starts at {objs[0]['n']}."
            for o in objs:
                if o["id"] in seen:
                    seen[o["id"]] += 1
                    o["id"] += "b" if seen[o["id"]] == 1 else str(seen[o["id"]])
                    o["numberingNote"] = f"The document numbers this objective {o['n']} a second time."
                else:
                    seen[o["id"]] = 0

json.dump({"source": "Archdiocese of Denver Catholic Schools, 2018 Math Standards",
           "grades": [grades[k] for k in ["PK", "K", "1", "2", "3", "4", "5", "6", "7", "ALG1"] if k in grades]},
          open(sys.argv[2], "w", encoding="utf-8"), ensure_ascii=False, indent=1)

for k, G in grades.items():
    n = sum(len(d["objectives"]) + sum(len(sd["objectives"]) for sd in d["subdomains"]) for d in G["domains"])
    print(k, "domains", len(G["domains"]), "objectives", n, "dispositions", len(G["dispositions"]))
