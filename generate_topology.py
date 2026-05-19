#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GENERATE_TOPOLOGY.PY
Orhun AI Admin Panel - Loyiha Tahlil va Topologiya
Obsidian uchun Project_Context.md yaratadi

Ishlatish:
  python generate_topology.py
  python generate_topology.py D:/boshqa/papka
"""

import os
import re
import sys
import json
from datetime import datetime

# ══════════════════════════════════════════════════════════
#  SOZLAMALAR — Shu yerdan o'zgartiring
# ══════════════════════════════════════════════════════════
CONFIG = {
    "project_root": r"D:\GitHub\orhun-ai\admin-panel",
    "skip_dirs": {
        "node_modules", ".git", "dist", "dist-electron",
        "release", ".obsidian", "__pycache__"
    },
    "scan_extensions": {".ts", ".tsx"},
    "output_md":  "Project_Context.md",   # loyiha root'iga yoziladi
    "size_threshold_bytes": 1024,          # 1 KB = placeholder chegarasi
    "src_alias": "@",                       # Vite alias (@ -> src/)
    "max_issues_per_file": 5,              # CMD da har faylda max xato
    "max_unused_show": 12,                 # CMD da max unused eksport
}

KB = CONFIG["size_threshold_bytes"]

# ══════════════════════════════════════════════════════════
#  WINDOWS ANSI RANGLAR
# ══════════════════════════════════════════════════════════
def _enable_ansi_windows():
    """Windows 10+ CMD da ANSI ranglarni yoqadi"""
    if sys.platform != "win32":
        return
    try:
        import ctypes
        handle = ctypes.windll.kernel32.GetStdHandle(-11)
        mode = ctypes.c_ulong()
        ctypes.windll.kernel32.GetConsoleMode(handle, ctypes.byref(mode))
        ctypes.windll.kernel32.SetConsoleMode(handle, mode.value | 0x0004)
    except Exception:
        pass

_enable_ansi_windows()

# Rang konstantalari
_R  = '\033[91m'   # Qizil
_G  = '\033[92m'   # Yashil
_Y  = '\033[93m'   # Sariq
_B  = '\033[94m'   # Ko'k
_M  = '\033[95m'   # Binafsha
_C  = '\033[96m'   # Moviy
_W  = '\033[97m'   # Oq
_BD = '\033[1m'    # Bold
_DM = '\033[2m'    # Dim/kulrang
_RS = '\033[0m'    # Reset

def _c(*args):
    """Matnni rang kodlari bilan o'raydi: _c("matn", _R, _BD)"""
    codes = [a for a in args if a.startswith('\033')]
    texts = [str(a) for a in args if not a.startswith('\033')]
    return "".join(codes) + "".join(texts) + _RS

def _clean_len(text):
    """ANSI kodlarini olib, haqiqiy uzunlikni qaytaradi"""
    return len(re.sub(r'\033\[\d+m', '', str(text)))

def out(text=""):
    """Unicode xatolaridan himoyalangan print"""
    try:
        print(text)
    except UnicodeEncodeError:
        print(str(text).encode('ascii', 'replace').decode('ascii'))

def progress(current, total, width=30):
    """Sodda progress bar: ████░░░░░░ 7/42"""
    filled = int(width * current / max(total, 1))
    bar = '█' * filled + '░' * (width - filled)
    print(f"\r  {_C}{bar}{_RS} {_W}{current}/{total}{_RS}", end='', flush=True)

# ══════════════════════════════════════════════════════════
#  CHIQISH FORMATLASH YORDAMCHILARI
# ══════════════════════════════════════════════════════════
_W70 = 72  # Jadval kengligi

def box_header(title):
    inner = _W70 - 2
    pad_l = (inner - len(title)) // 2
    pad_r = inner - len(title) - pad_l
    out()
    out(_c("╔" + "═" * inner + "╗", _C))
    out(_c("║", _C) + " " * pad_l + _c(title, _BD, _W) + " " * pad_r + _c("║", _C))
    out(_c("╚" + "═" * inner + "╝", _C))

def section(title, icon="▶"):
    out()
    out(_c(f"  {icon} {title}", _BD, _Y))
    out(_c("  " + "─" * (_W70 - 4), _DM))

def table(headers, rows, col_widths=None):
    """
    Rangli jadval chiqaradi.
    col_widths — ixtiyoriy, [int, int, ...] shaklida
    """
    if not rows:
        out(_c("    (bo'sh)", _DM))
        return

    # Kengliklarni avtomatik hisoblash
    if not col_widths:
        col_widths = [len(h) for h in headers]
        for row in rows:
            for i, cell in enumerate(row):
                if i < len(col_widths):
                    col_widths[i] = max(col_widths[i], _clean_len(cell))
        col_widths = [min(w, 50) for w in col_widths]

    # Separator qator
    sep = "  ├" + "┼".join("─" * (w + 2) for w in col_widths) + "┤"

    # Header
    hdr = "  │"
    for h, w in zip(headers, col_widths):
        hdr += " " + _c(f"{h:<{w}}", _BD, _C) + " │"
    out(hdr)
    out(_c(sep, _DM))

    # Data qatorlari
    for row in rows:
        line = "  │"
        for i, (cell, w) in enumerate(zip(row, col_widths)):
            cell_s = str(cell)
            pad = w - _clean_len(cell_s)
            line += f" {cell_s}{' ' * max(0, pad)} │"
        out(line)


# ══════════════════════════════════════════════════════════
#  1. FAYL SKANERI
# ══════════════════════════════════════════════════════════
def scan_files(root):
    """
    Barcha .ts/.tsx fayllarni yig'adi.
    SKIP_DIRS papkalarini chetlab o'tadi.
    Har fayl uchun dict qaytaradi.
    """
    results = []
    skip = CONFIG["skip_dirs"]
    exts = CONFIG["scan_extensions"]

    for dirpath, dirnames, filenames in os.walk(root):
        # IN-PLACE o'chiramiz — os.walk chuqurlik bilan o'tmaslik uchun
        dirnames[:] = [d for d in dirnames if d not in skip]

        for fname in sorted(filenames):
            ext = os.path.splitext(fname)[1].lower()
            if ext not in exts:
                continue

            fpath = os.path.join(dirpath, fname)
            try:
                size = os.path.getsize(fpath)
            except OSError:
                size = 0

            rel  = os.path.relpath(fpath, root)
            name = os.path.splitext(fname)[0]

            results.append({
                "path":   fpath,
                "rel":    rel,           # src\routes\users.tsx
                "name":   name,          # users
                "ext":    ext,           # .tsx
                "size":   size,          # bytes
                "active": size > KB,     # True = amalga oshirilgan
                "dir":    dirpath,       # C:\...\src\routes
            })

    return sorted(results, key=lambda f: f["rel"].lower())


# ══════════════════════════════════════════════════════════
#  2. KOD TOZALASH (String va Comment'larni olib tashlash)
# ══════════════════════════════════════════════════════════
def _strip_code(code):
    """
    Qavslar balansini tekshirishdan oldin kodni tozalaymiz:
      - // ...  single-line comment
      - /* ... */ multi-line comment
      - "..." double-quoted string
      - '...' single-quoted string
      - `...` template literal (soddalashtirilgan)
    """
    result = []
    i = 0
    n = len(code)

    while i < n:
        c2 = code[i:i+2]

        # // single-line comment → newline'gacha o'tkazamiz
        if c2 == '//':
            while i < n and code[i] != '\n':
                i += 1

        # /* ... */ multi-line comment
        elif c2 == '/*':
            i += 2
            while i < n - 1:
                if code[i:i+2] == '*/':
                    i += 2
                    break
                if code[i] == '\n':
                    result.append('\n')
                i += 1

        # "..." double-quote string
        elif code[i] == '"':
            i += 1
            while i < n:
                if code[i] == '\\':
                    i += 2
                    continue
                if code[i] == '"':
                    i += 1
                    break
                i += 1

        # '...' single-quote string
        elif code[i] == "'":
            i += 1
            while i < n:
                if code[i] == '\\':
                    i += 2
                    continue
                if code[i] == "'":
                    i += 1
                    break
                i += 1

        # `...` template literal (faqat tashqi tuzilishini saqlaydi)
        elif code[i] == '`':
            i += 1
            depth = 1
            while i < n:
                if code[i] == '\\':
                    i += 2
                    continue
                if code[i:i+2] == '${':
                    result.append('${')
                    i += 2
                    depth = 1
                    while i < n and depth > 0:
                        if code[i] == '{':
                            depth += 1
                        elif code[i] == '}':
                            depth -= 1
                            if depth == 0:
                                result.append('}')
                                i += 1
                                break
                        result.append(code[i])
                        i += 1
                    continue
                if code[i] == '`':
                    i += 1
                    break
                if code[i] == '\n':
                    result.append('\n')
                i += 1

        else:
            result.append(code[i])
            i += 1

    return ''.join(result)


# ══════════════════════════════════════════════════════════
#  3. SINTAKSIS TAHLILI — Qavslar balansi
# ══════════════════════════════════════════════════════════
def analyze_syntax(content):
    """
    { } [ ] ( ) qavslarini tekshiradi.
    Qaytaradi: [xato string, ...]
    """
    issues  = []
    cleaned = _strip_code(content)
    lines   = cleaned.split('\n')

    pairs   = {')': '(', '}': '{', ']': '['}
    stacks  = {'(': [], '{': [], '[': []}

    for line_no, line in enumerate(lines, 1):
        for ch in line:
            if ch in stacks:
                stacks[ch].append(line_no)
            elif ch in pairs:
                opener = pairs[ch]
                if stacks[opener]:
                    stacks[opener].pop()
                else:
                    issues.append(f"Qator {line_no}: ortiqcha '{ch}' (juftisiz yopuvchi)")

    for ch, stack in stacks.items():
        if stack:
            n = len(stack)
            sample = stack[:3]
            issues.append(f"'{ch}' yopilmagan ({n} ta, qatorlar: {sample})")

    return issues


# ══════════════════════════════════════════════════════════
#  4. IMPORT TAHLILI — Broken import tekshiruvi
# ══════════════════════════════════════════════════════════
_IMPORT_FROM_RE = re.compile(
    r'''import\s+(?:type\s+)?(?:[\w*{][^'"]*?)\s+from\s+['"]([^'"]+)['"]''',
    re.MULTILINE
)
_IMPORT_SIDE_RE = re.compile(r'''import\s+['"]([^'"]+)['"]''')

def _resolve(import_path, file_dir, src_root, alias):
    """
    Import yo'lini haqiqiy fayl yo'liga aylantiradi.
    Qaytaradi:
      str  — topilgan fayl yo'li
      None — tashqi paket (tekshirilmaydi)
      False — topilmadi (broken)
    """
    sep = os.sep

    # Tashqi paket (react, lucide-react, va h.k.)
    if not import_path.startswith('.') and not import_path.startswith(alias + '/'):
        return None

    if import_path.startswith(alias + '/'):
        rel = import_path[len(alias) + 1:].replace('/', sep)
        base = os.path.normpath(os.path.join(src_root, rel))
    else:
        rel = import_path.replace('/', sep)
        base = os.path.normpath(os.path.join(file_dir, rel))

    # Mumkin bo'lgan kengaytmalar
    candidates = [
        base + '.ts',
        base + '.tsx',
        base + '.js',
        os.path.join(base, 'index.ts'),
        os.path.join(base, 'index.tsx'),
        base,
    ]

    for candidate in candidates:
        if os.path.isfile(candidate):
            return candidate

    return False


def analyze_imports(content, file_info, src_root):
    """
    Importlarni tahlil qiladi.
    Qaytaradi: (resolved_list, broken_list)
      resolved_list — topilgan fayl yo'llari
      broken_list   — topilmagan import path'lar
    """
    alias    = CONFIG["src_alias"]
    resolved = []
    broken   = []

    for m in _IMPORT_FROM_RE.finditer(content):
        path = m.group(1)
        r = _resolve(path, file_info["dir"], src_root, alias)
        if r is None:
            continue      # Tashqi paket
        elif r is False:
            broken.append(path)
        else:
            if r not in resolved:
                resolved.append(r)

    for m in _IMPORT_SIDE_RE.finditer(content):
        path = m.group(1)
        r = _resolve(path, file_info["dir"], src_root, alias)
        if r is False:
            broken.append(path)

    return resolved, broken


# ══════════════════════════════════════════════════════════
#  5. EKSPORT TAHLILI — Ishlatilmagan eksportlar
# ══════════════════════════════════════════════════════════
_EXPORT_RE = re.compile(
    r'export\s+(?:default\s+)?(?:function|const|class|interface|type|enum)\s+(\w+)',
    re.MULTILINE
)

def collect_all_exports(files):
    """Barcha active fayllardan eksport nomlarini yig'adi"""
    exports = {}  # filepath -> [name, ...]
    for f in files:
        if not f["active"]:
            continue
        try:
            with open(f["path"], encoding='utf-8', errors='ignore') as fh:
                content = fh.read()
            names = _EXPORT_RE.findall(content)
            if names:
                exports[f["path"]] = list(set(names))
        except OSError:
            pass
    return exports


def find_unused_exports(all_exports, files):
    """
    Boshqa fayllarda import qilinmagan eksportlarni topadi.
    Import matni ichida qidiradi — false-positive kamroq.
    """
    # Barcha import satrlarini yig'amiz
    all_import_text_parts = []
    for f in files:
        if not f["active"]:
            continue
        try:
            with open(f["path"], encoding='utf-8', errors='ignore') as fh:
                content = fh.read()
            # Faqat import satrlarini olamiz
            for m in re.finditer(r'import\b[^\n;]+', content):
                all_import_text_parts.append(m.group())
        except OSError:
            pass
    all_imports = ' '.join(all_import_text_parts)

    unused = {}
    for fpath, names in all_exports.items():
        file_unused = []
        for name in names:
            # Ism import'larda ishlatilganmi?
            pattern = re.compile(r'\b' + re.escape(name) + r'\b')
            if not pattern.search(all_imports):
                file_unused.append(name)
        if file_unused:
            unused[fpath] = file_unused

    return unused


# ══════════════════════════════════════════════════════════
#  6. SUPABASE XAVFSIZLIK TAHLILI
# ══════════════════════════════════════════════════════════
_SUPA_CALL_RE = re.compile(
    r'\bsupabase\s*\.\s*(from|rpc|auth|storage|channel)\s*\('
)
_TRY_OPEN_RE   = re.compile(r'\btry\s*\{')
_CATCH_CLOSE_RE = re.compile(r'\}\s*catch\s*[\(\{]')

def analyze_supabase(content):
    """
    supabase.from(), supabase.rpc() chaqiruvlari
    try-catch ichida ekanligini tekshiradi.
    Qaytaradi: [ogohlantirish string, ...]
    """
    issues    = []
    lines     = content.split('\n')
    try_depth = 0

    for lineno, line in enumerate(lines, 1):
        stripped = line.strip()

        # try { → chuqurlikni oshiramiz
        try_depth += len(_TRY_OPEN_RE.findall(stripped))

        # supabase chaqiruvi
        m = _SUPA_CALL_RE.search(stripped)
        if m and try_depth == 0:
            method = m.group(1)
            # Chaqiruv .catch() bilan zanjir qilinganmi?
            if '.catch(' not in stripped:
                issues.append(
                    f"Qator {lineno}: supabase.{method}() → "
                    f"try-catch yoki .catch() ichida emas"
                )

        # } catch → chuqurlikni kamaytiramiz
        catch_cnt = len(_CATCH_CLOSE_RE.findall(stripped))
        if catch_cnt:
            try_depth = max(0, try_depth - catch_cnt)

    return issues


# ══════════════════════════════════════════════════════════
#  7. FAYL TAHLILI (barcha analizatorlarni birlashtiradi)
# ══════════════════════════════════════════════════════════
def analyze_file(file_info, src_root):
    """
    Bitta fayl uchun to'liq tahlil.
    Qaytaradi: {syntax, imports, broken, supabase}
    """
    result = {
        "syntax":  [],
        "imports": [],   # resolved fayl yo'llari
        "broken":  [],   # topilmagan importlar
        "supabase": [],
    }

    if not file_info["active"]:
        return result  # Placeholder fayllarni tahlil qilmaymiz

    try:
        with open(file_info["path"], encoding='utf-8', errors='ignore') as fh:
            content = fh.read()
    except OSError as e:
        result["syntax"].append(f"Fayl o'qilmadi: {e}")
        return result

    result["syntax"]              = analyze_syntax(content)
    result["imports"], result["broken"] = analyze_imports(content, file_info, src_root)
    result["supabase"]            = analyze_supabase(content)

    return result


# ══════════════════════════════════════════════════════════
#  8. CMD HISOBOT CHIQARISH
# ══════════════════════════════════════════════════════════
def print_cmd_report(files, analyses, unused_exports, root):
    """Terminalda rangli, jadval ko'rinishidagi hisobot"""

    box_header("ORHUN AI — LOYIHA TOPOLOGIYASI TAHLILI")
    out(_c(f"  📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", _DM))
    out(_c(f"  📁 {root}", _DM))

    # ── Statistika ──────────────────────────────
    total       = len(files)
    active      = sum(1 for f in files if f["active"])
    placeholder = total - active

    n_broken  = sum(len(a["broken"])  for a in analyses.values())
    n_supa    = sum(len(a["supabase"]) for a in analyses.values())
    n_syntax  = sum(len(a["syntax"])  for a in analyses.values())
    n_unused  = sum(len(v) for v in unused_exports.values())
    n_issues  = n_broken + n_supa + n_syntax

    section("UMUMIY STATISTIKA", "📊")
    table(
        ["Ko'rsatkich", "Qiymat", "Holat"],
        [
            [_c("📁 Jami fayllar",         _W),  _c(str(total),       _BD, _W),  "—"],
            [_c("✅ Amalga oshirilgan",     _G),  _c(str(active),      _BD, _G),  _c("OK", _G)],
            [_c("❌ Placeholder (≤1KB)",   _R),  _c(str(placeholder), _BD, _R),  _c("—", _DM) if not placeholder else _c("Tekshiring", _Y)],
            [_c("🔴 Broken Import",         _R),  _c(str(n_broken),    _BD, _R),  _c("Xato bor!", _R, _BD) if n_broken else _c("✓", _G)],
            [_c("🔶 Supabase xavfsizlik",  _Y),  _c(str(n_supa),      _BD, _Y),  _c("Tekshiring", _Y) if n_supa else _c("✓", _G)],
            [_c("🔵 Sintaksis xatosi",      _B),  _c(str(n_syntax),    _BD, _B),  _c("Xato bor!", _R, _BD) if n_syntax else _c("✓", _G)],
            [_c("🟡 Ishlatilmagan eksport", _M),  _c(str(n_unused),    _BD, _M),  _c("Tozalang", _Y) if n_unused else _c("✓", _G)],
        ],
        [35, 10, 16]
    )

    # ── Fayl holati ─────────────────────────────
    section("FAYL HOLATI (1 KB QOIDASI)", "📋")

    file_rows = []
    for f in files:
        rel_s = f["rel"].replace("\\", "/")
        if len(rel_s) > 46:
            rel_s = "…" + rel_s[-45:]

        status = _c("✅ FAOL",       _G, _BD) if f["active"] else _c("❌ PLACEHOLDER", _R)
        size_s = f"{f['size'] / KB:.1f} KB"

        a = analyses.get(f["path"], {})
        n = len(a.get("broken", [])) + len(a.get("supabase", [])) + len(a.get("syntax", []))
        issue_s = _c(f"{n} xato", _R, _BD) if n else _c("✓", _G)

        file_rows.append([rel_s, status, size_s, issue_s])

    table(["Fayl yo'li", "Holat", "Hajm", "Muammo"], file_rows, [48, 18, 9, 10])

    # ── Broken imports ───────────────────────────
    broken_files = {p: a for p, a in analyses.items() if a.get("broken")}
    section("BROKEN IMPORT'LAR", "🔴")
    if broken_files:
        for fpath, a in broken_files.items():
            rel = os.path.relpath(fpath, root).replace("\\", "/")
            out(_c(f"\n  📄 {rel}", _BD, _W))
            for b in a["broken"][:CONFIG["max_issues_per_file"]]:
                out(_c(f"     ✗  '{b}'  → fayl topilmadi", _R))
    else:
        out(_c("    ✅ Hamma importlar to'g'ri!", _G))

    # ── Supabase xavfsizlik ──────────────────────
    supa_files = {p: a for p, a in analyses.items() if a.get("supabase")}
    section("SUPABASE XAVFSIZLIK MUAMMOLARI", "🔶")
    if supa_files:
        for fpath, a in supa_files.items():
            rel = os.path.relpath(fpath, root).replace("\\", "/")
            out(_c(f"\n  📄 {rel}", _BD, _W))
            for s in a["supabase"][:CONFIG["max_issues_per_file"]]:
                out(_c(f"     ⚠  {s}", _Y))
    else:
        out(_c("    ✅ Barcha so'rovlar xavfsiz!", _G))

    # ── Sintaksis xatolari ───────────────────────
    syntax_files = {p: a for p, a in analyses.items() if a.get("syntax")}
    section("SINTAKSIS XATOLARI (QAVSLAR)", "🔵")
    if syntax_files:
        for fpath, a in syntax_files.items():
            rel = os.path.relpath(fpath, root).replace("\\", "/")
            out(_c(f"\n  📄 {rel}", _BD, _W))
            for s in a["syntax"][:CONFIG["max_issues_per_file"]]:
                out(_c(f"     ✗  {s}", _B))
    else:
        out(_c("    ✅ Qavslar balansi to'g'ri!", _G))

    # ── Ishlatilmagan eksportlar ─────────────────
    section("ISHLATILMAGAN EKSPORTLAR", "🟡")
    if unused_exports:
        cnt = 0
        for fpath, names in unused_exports.items():
            if cnt >= CONFIG["max_unused_show"]:
                out(_c(f"\n    ... va boshqalar", _DM))
                break
            rel = os.path.relpath(fpath, root).replace("\\", "/")
            out(_c(f"\n  📄 {rel}", _BD, _W))
            for name in names[:5]:
                out(_c(f"     ⚡  export '{name}'  → import topilmadi", _M))
            cnt += 1
    else:
        out(_c("    ✅ Barcha eksportlar ishlatilgan!", _G))

    # ── Footer ──────────────────────────────────
    out()
    out(_c("═" * _W70, _C))
    status_msg = (
        _c("  ✅ Tahlil yakunlandi. Xato topilmadi.", _G, _BD)
        if n_issues == 0
        else _c(f"  ⚠️  Tahlil yakunlandi. Jami {n_issues} muammo topildi.", _Y, _BD)
    )
    out(status_msg)
    out(_c("═" * _W70, _C))
    out()


# ══════════════════════════════════════════════════════════
#  9. OBSIDIAN MARKDOWN YARATISH
# ══════════════════════════════════════════════════════════

# Faza → fayl nomi mosligi
FAZA_MAP = {
    "dashboard":     ("Faza 1",  "Dashboard"),
    "users":         ("Faza 2",  "Foydalanuvchilar"),
    "notifications": ("Faza 3",  "Broadcast"),
    "subscriptions": ("Faza 4",  "Obuna tariflari"),
    "songs":         ("Faza 5",  "Qo'shiqlar moderatsiyasi"),
    "genres":        ("Faza 6",  "Janrlar"),
    "analytics":     ("Faza 7",  "Analitika"),
}


def _obsidian_link(fpath):
    """Fayl yo'lini [[WikilLink]] ga aylantiradi"""
    return f"[[{os.path.splitext(os.path.basename(fpath))[0]}]]"


def generate_obsidian_md(files, analyses, unused_exports, root):
    """Obsidian uchun to'liq Project_Context.md matni"""
    now   = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    today = datetime.now().strftime('%Y-%m-%d')

    total       = len(files)
    active      = sum(1 for f in files if f["active"])
    placeholder = total - active
    n_broken    = sum(len(a["broken"])   for a in analyses.values())
    n_supa      = sum(len(a["supabase"]) for a in analyses.values())
    n_syntax    = sum(len(a["syntax"])   for a in analyses.values())
    n_unused    = sum(len(v) for v in unused_exports.values())
    n_issues    = n_broken + n_supa + n_syntax

    health_icon = "🟢" if n_issues == 0 else ("🟡" if n_issues < 5 else "🔴")

    md = []
    A = md.append  # Qisqacha nom

    # ── YAML Front Matter ───────────────────────
    A("---")
    A("tags:")
    A("  - admin-panel")
    A("  - topology")
    A("  - auto-generated")
    A(f"date: {today}")
    A(f"updated: {now}")
    A(f"health: \"{health_icon} {'OK' if n_issues == 0 else str(n_issues) + ' muammo'}\"")
    A("---")
    A("")

    # ── Sarlavha ────────────────────────────────
    A("# 🗂️ Orhun AI Admin Panel — Loyiha Topologiyasi")
    A("")
    A("> [!info] Avtomatik yaratilgan")
    A(f"> Ushbu fayl `generate_topology.py` tomonidan yaratiladi.  ")
    A(f"> **Oxirgi yangilanish:** `{now}`  ")
    A(f"> **Loyiha holati:** {health_icon} {'Muammosiz' if n_issues == 0 else str(n_issues) + ' muammo topildi'}")
    A("")
    A("---")
    A("")

    # ── Statistika ──────────────────────────────
    A("## 📊 Umumiy Statistika")
    A("")
    A("| Ko'rsatkich | Qiymat | Holat |")
    A("|---|:---:|---|")
    A(f"| 📁 Jami fayllar | **{total}** | — |")
    A(f"| ✅ Amalga oshirilgan (>1 KB) | **{active}** | OK |")
    A(f"| ❌ Placeholder (≤1 KB) | **{placeholder}** | {'⚠️ Diqqat' if placeholder else 'OK'} |")
    A(f"| 🔴 Broken Import | **{n_broken}** | {'🚨 Xato bor' if n_broken else '✅ OK'} |")
    A(f"| 🔶 Supabase xavfsizlik | **{n_supa}** | {'⚠️ Tekshiring' if n_supa else '✅ OK'} |")
    A(f"| 🔵 Sintaksis xatosi | **{n_syntax}** | {'🚨 Xato bor' if n_syntax else '✅ OK'} |")
    A(f"| 🟡 Ishlatilmagan eksport | **{n_unused}** | {'⚠️ Tozalang' if n_unused else '✅ OK'} |")
    A("")
    A("---")
    A("")

    # ── Faza holati ─────────────────────────────
    A("## 🚀 Faza Holati")
    A("")
    A("| Faza | Modul | Fayl | Holat |")
    A("|---|---|---|:---:|")

    name_to_file = {f["name"]: f for f in files}
    for key, (faza_name, desc) in FAZA_MAP.items():
        fi = name_to_file.get(key)
        if fi:
            icon  = "✅" if fi["active"] else "❌"
            link  = _obsidian_link(fi["path"])
            size  = f"{fi['size'] / KB:.1f} KB"
            a_dat = analyses.get(fi["path"], {})
            n_err = len(a_dat.get("broken", [])) + len(a_dat.get("supabase", [])) + len(a_dat.get("syntax", []))
            err_s = f" 🔴{n_err}" if n_err else ""
            A(f"| {faza_name} | {desc} | {link} `{size}` | {icon}{err_s} |")
        else:
            A(f"| {faza_name} | {desc} | `{key}.tsx` | ❓ Topilmadi |")

    A("")
    A("---")
    A("")

    # ── Fayl holati jadvali ─────────────────────
    A("## 📋 Barcha Fayllar (1 KB Qoidasi)")
    A("")
    A("| Holat | Fayl | Hajm | Xatolar |")
    A("|:---:|---|---:|:---:|")

    for f in files:
        icon   = "✅" if f["active"] else "❌"
        link   = _obsidian_link(f["path"])
        rel    = f["rel"].replace("\\", "/")
        size_s = f"{f['size'] / KB:.1f} KB"
        a      = analyses.get(f["path"], {})
        n_err  = len(a.get("broken", [])) + len(a.get("supabase", [])) + len(a.get("syntax", []))
        err_s  = f"🔴 {n_err}" if n_err else "✓"
        A(f"| {icon} | {link} | {size_s} | {err_s} |")

    A("")
    A("---")
    A("")

    # ── Import topologiyasi (Obsidian Graf) ──────
    A("## 🕸️ Import Topologiyasi")
    A("")
    A("> [!tip] Obsidian Graf ko'rinishi")
    A("> `[[A]] → [[B]]` ko'rinishidagi linklar Obsidian Graf sahifasida bog'lanish sifatida ko'rinadi.")
    A("")

    # Papkalar bo'yicha guruhlash
    dir_groups = {}
    for f in files:
        if not f["active"]:
            continue
        rel_dir = os.path.dirname(f["rel"]).replace("\\", "/") or "root"
        dir_groups.setdefault(rel_dir, []).append(f)

    for dir_name in sorted(dir_groups):
        A(f"### `📁 {dir_name}/`")
        A("")
        for f in dir_groups[dir_name]:
            src_link = _obsidian_link(f["path"])
            a        = analyses.get(f["path"], {})
            imports  = a.get("imports", [])
            broken   = a.get("broken", [])

            if imports:
                dep_links = ", ".join(_obsidian_link(i) for i in imports[:10])
                A(f"- {src_link} → {dep_links}")
            else:
                A(f"- {src_link}")

            for b in broken:
                A(f"  - ❌ Broken: `{b}`")

        A("")

    A("---")
    A("")

    # ── Xatolar bo'limi ─────────────────────────
    A("## 🔴 Xatolar va Muammolar")
    A("")

    # Broken imports
    A("### 🔴 Broken Import'lar")
    A("")
    broken_files = {p: a for p, a in analyses.items() if a.get("broken")}
    if broken_files:
        for fpath, a in broken_files.items():
            link = _obsidian_link(fpath)
            A(f"> **{link}**")
            for b in a["broken"]:
                A(f"> - ❌ `{b}` → fayl topilmadi")
            A("")
    else:
        A("> ✅ Hamma importlar to'g'ri. Broken import topilmadi.")
        A("")

    # Supabase
    A("### 🔶 Supabase Xavfsizlik")
    A("")
    supa_files = {p: a for p, a in analyses.items() if a.get("supabase")}
    if supa_files:
        for fpath, a in supa_files.items():
            link = _obsidian_link(fpath)
            A(f"> **{link}**")
            for s in a["supabase"][:CONFIG["max_issues_per_file"]]:
                A(f"> - ⚠️ `{s}`")
            A("")
    else:
        A("> ✅ Barcha Supabase so'rovlari try-catch ichida.")
        A("")

    # Sintaksis
    A("### 🔵 Sintaksis Xatolari")
    A("")
    syntax_files = {p: a for p, a in analyses.items() if a.get("syntax")}
    if syntax_files:
        for fpath, a in syntax_files.items():
            link = _obsidian_link(fpath)
            A(f"> **{link}**")
            for s in a["syntax"][:CONFIG["max_issues_per_file"]]:
                A(f"> - 🔵 `{s}`")
            A("")
    else:
        A("> ✅ Qavslar balansi barcha fayllarda to'g'ri.")
        A("")

    A("---")
    A("")

    # ── Ogohlantirishlar ─────────────────────────
    A("## ⚠️ Ogohlantirishlar")
    A("")
    A("### 🟡 Ishlatilmagan Eksportlar")
    A("")
    if unused_exports:
        A("> [!warning] Bu eksportlar boshqa fayllarda import qilinmagan.")
        A("> Ehtimol ular ishlatiladi, lekin tekshirib ko'ring.")
        A("")
        for fpath, names in list(unused_exports.items())[:CONFIG["max_unused_show"]]:
            link = _obsidian_link(fpath)
            A(f"**{link}**")
            for name in names[:8]:
                A(f"- 🟡 `export {name}` → import topilmadi")
            A("")
    else:
        A("> ✅ Barcha eksportlar loyihaning boshqa joyida ishlatilgan.")
        A("")

    A("---")
    A("")

    # ── Tezkor ishlatish qo'llanmasi ─────────────
    A("## 🛠️ Skriptni Ishlatish")
    A("")
    A("```batch")
    A("rem Admin panel papkasiga o'ting")
    A(r"cd D:\GitHub\orhun-ai\admin-panel")
    A("")
    A("rem Skriptni ishga tushiring")
    A("python generate_topology.py")
    A("")
    A("rem Boshqa papka uchun:")
    A(r"python generate_topology.py D:\boshqa\papka")
    A("```")
    A("")
    A("---")
    A("")
    A(f"*⚡ Avtomatik yaratildi: `generate_topology.py` | {now}*")

    return "\n".join(md)


# ══════════════════════════════════════════════════════════
#  10. ASOSIY DASTUR
# ══════════════════════════════════════════════════════════
def main():
    # Encoding
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except AttributeError:
        pass

    # Loyiha root'ini aniqlash
    root = sys.argv[1] if len(sys.argv) > 1 else CONFIG["project_root"]
    root = os.path.abspath(root)

    if not os.path.isdir(root):
        out(_c(f"\n  ✗ XATO: '{root}' papkasi topilmadi!", _R, _BD))
        out(_c(f"  Ishlatish: python generate_topology.py [papka_yo'li]", _DM))
        sys.exit(1)

    src_root    = os.path.join(root, "src")
    output_path = os.path.join(root, CONFIG["output_md"])

    # 1. Fayllarni skanerlash
    out(_c("\n  🔍 Fayllar skanerlanmoqda...", _Y))
    files = scan_files(root)
    if not files:
        out(_c("  ✗ Hech qanday .ts/.tsx fayl topilmadi!", _R))
        sys.exit(1)
    out(_c(f"  ✅ {len(files)} ta fayl topildi "
           f"({sum(1 for f in files if f['active'])} faol, "
           f"{sum(1 for f in files if not f['active'])} placeholder)", _G))

    # 2. Eksportlarni yig'ish
    out(_c("  📦 Eksportlar yig'ilmoqda...", _Y))
    all_exports = collect_all_exports(files)

    # 3. Har fayl uchun tahlil
    out(_c("  🔬 Tahlil boshlanmoqda...", _Y))
    analyses = {}
    n = len(files)
    for i, f in enumerate(files, 1):
        progress(i, n)
        analyses[f["path"]] = analyze_file(f, src_root)
    out()  # Progress bar'dan keyin yangi qator

    # 4. Ishlatilmagan eksportlar
    out(_c("  🔗 Ishlatilmagan eksportlar aniqlanmoqda...", _Y))
    unused = find_unused_exports(all_exports, files)
    out(_c(f"  ✅ Barcha tahlillar yakunlandi!", _G))

    # 5. CMD hisobot
    print_cmd_report(files, analyses, unused, root)

    # 6. Markdown yozish
    out(_c("  📝 Project_Context.md yozilmoqda...", _Y))
    md_text = generate_obsidian_md(files, analyses, unused, root)

    try:
        with open(output_path, 'w', encoding='utf-8') as fh:
            fh.write(md_text)
        out(_c(f"  ✅ Saqlandi: {output_path}", _G, _BD))
    except OSError as e:
        out(_c(f"  ✗ Saqlashda xato: {e}", _R, _BD))
        sys.exit(1)

    # 7. JSON chiqarish (ixtiyoriy)
    json_path = os.path.join(root, "topology_data.json")
    try:
        summary = {
            "generated_at": datetime.now().isoformat(),
            "total_files": len(files),
            "active_files": sum(1 for f in files if f["active"]),
            "placeholder_files": sum(1 for f in files if not f["active"]),
            "broken_imports": sum(len(a["broken"]) for a in analyses.values()),
            "supabase_issues": sum(len(a["supabase"]) for a in analyses.values()),
            "syntax_issues": sum(len(a["syntax"]) for a in analyses.values()),
            "unused_exports": sum(len(v) for v in unused.values()),
            "files": [
                {
                    "name":   f["name"],
                    "rel":    f["rel"].replace("\\", "/"),
                    "size":   f["size"],
                    "active": f["active"],
                    "issues": {
                        "broken":   analyses[f["path"]]["broken"],
                        "supabase": analyses[f["path"]]["supabase"][:3],
                        "syntax":   analyses[f["path"]]["syntax"][:3],
                    }
                }
                for f in files
            ]
        }
        with open(json_path, 'w', encoding='utf-8') as fh:
            json.dump(summary, fh, ensure_ascii=False, indent=2)
        out(_c(f"  ✅ JSON:  {json_path}", _G))
    except Exception:
        pass  # JSON ixtiyoriy

    out()


if __name__ == "__main__":
    main()
