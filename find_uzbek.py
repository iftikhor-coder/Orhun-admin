import os
import re

ROOT = r"D:\GitHub\orhun-ai\admin-panel\src"
OUTPUT = r"D:\GitHub\orhun-ai\admin-panel\uzbek_texts.txt"

# Uzbekcha belgilari va so'zlar
UZ_PATTERNS = [
    r"'[^']*(?:ish|lar|lar|ni|ga|da|dan|ни|лар)[^']*'",
    r'"[^"]*(?:ish|lar|ni|ga|da|dan)[^"]*"',
]

# Qidiruv so'zlar — uzbekcha xarakterli
UZ_WORDS = [
    "Yangi", "Yangilash", "Saqlash", "Bekor", "Tahrirlash", "Qo'shish",
    "O'chirish", "Chiqish", "Kirish", "Foydalanuvchi", "Obuna", "Tarif",
    "Bildirishnoma", "Janr", "Qo'shiq", "Dashboard", "Holat", "Faol",
    "Yopiq", "Barchasi", "Hammasi", "Yuborish", "Qidiruv", "Hato",
    "Muvaffaqiyat", "Tarix", "Ko'rish", "Amallar", "Nom", "Slug",
    "ta foydalanuvchi", "saqlandi", "o'chirildi", "topilmadi", "yo'q",
    "kerak", "majburiy", "Yangilangan", "Yuborildi", "Tasdiqlash",
    "Ogohlantirish", "Eʼlon", "Credits", "Admin", "Sidebar", "Panel"
]

results = []

for dirpath, _, filenames in os.walk(ROOT):
    for fname in filenames:
        if not fname.endswith(('.tsx', '.ts')):
            continue
        fpath = os.path.join(dirpath, fname)
        with open(fpath, encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
        for i, line in enumerate(lines, 1):
            for word in UZ_WORDS:
                if word.lower() in line.lower():
                    rel = os.path.relpath(fpath, ROOT)
                    results.append(f"{rel}:{i}  →  {line.rstrip()}")
                    break

with open(OUTPUT, 'w', encoding='utf-8') as f:
    f.write(f"Jami: {len(results)} ta uzbekcha matn topildi\n")
    f.write("="*60 + "\n\n")
    f.write("\n".join(results))

print(f"✅ Tayyor! {len(results)} ta matn topildi → uzbek_texts.txt")