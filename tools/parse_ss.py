"""Parse the 2018 Scope & Sequence (I/D/M by grade, PK–8) using word coordinates.

Input: `pdftotext -bbox -f 51 -l 61 <pdf> ss_bbox.html` (PDF pages 51–61 hold the table).
Each header row ("PK K 1 2 ... 8") fixes the x-centers of the grade columns; those
centers carry over to continuation pages until the next header. A mark (I, D, M, I/D,
D/M) is assigned to the nearest column center.
"""
import html, json, re, sys

src = open(sys.argv[1], encoding="utf-8").read()
COLS = ["PK", "K", "1", "2", "3", "4", "5", "6", "7", "8"]
MARKS = {"I", "D", "M", "I/D", "D/M", "I/D/M"}
STRANDS = {"I": "Numbers and Operations", "II": "Measurement", "III": "Geometry",
           "IV": "Statistics, Probability and Data Analysis", "V": "Foundations of Algebra"}

rows, centers, strand, sub, pending = [], None, "I", None, None
stop = False
for pi, page in enumerate(src.split("<page")[1:]):
    words = [(float(a), float(b), float(c), html.unescape(t)) for a, b, c, t in
             re.findall(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="[\d.]+">([^<]*)</word>', page)]
    lines = {}
    for x0, y0, x1, t in words:
        key = next((k for k in lines if abs(k - y0) < 2.5), y0)
        lines.setdefault(key, []).append((x0, x1, t))
    for y in sorted(lines):
        ws = sorted(lines[y])
        texts = [t for _, _, t in ws]
        line = " ".join(texts)
        if "TEXTBOOK RECOMMENDATIONS" in line:
            stop = True
        if stop:
            break
        if line.startswith("2018 Math Standards") or re.fullmatch(r"\d+", line) or line.startswith("I = Introduce"):
            continue
        if "PK" in texts:
            i = texts.index("PK")
            hdr = ws[i:i + 10]
            if [t for _, _, t in hdr] == COLS:
                centers = [(a + b) / 2 for a, b, _ in hdr]
                label = " ".join(texts[:i])
                m = re.match(r"^([A-H])\.\s+(.+)$", label)
                if m:
                    sub = label
                pending = None
                continue
        m = re.match(r"^(I|II|III|IV|V)\.\s+(.+)$", line)
        if m:
            strand = m.group(1)
            sub = None
            pending = None
            continue
        if re.match(r"^[A-H]\.\s", line) and not any(t in MARKS for t in texts[1:]):
            sub = line
            continue
        if centers is None:
            continue
        left = centers[0] - 12
        label = " ".join(t for a, b, t in ws if a < left).strip()
        marks = {}
        for a, b, t in ws:
            if a >= left and t in MARKS:
                c = (a + b) / 2
                col = min(range(10), key=lambda k: abs(centers[k] - c))
                marks[COLS[col]] = t
        if label.startswith(("After Mastery", "be ongoing")):
            continue
        if marks:
            pending = {"strand": strand, "strandName": STRANDS.get(strand), "sub": sub, "skill": label, "marks": marks}
            rows.append(pending)
        elif pending and label:
            pending["skill"] = (pending["skill"] + " " + label).strip()

for r in rows:
    r["skill"] = re.sub(r"\s+", " ", r["skill"]).replace(" MATHEMATICS", "").strip()
json.dump(rows, open(sys.argv[2], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(len(rows), "rows;", sum(1 for r in rows if "8" in r["marks"]), "with a grade 8 mark")
