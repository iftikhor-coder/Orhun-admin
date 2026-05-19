---
tags:
  - admin-panel
  - topology
  - auto-generated
date: 2026-05-18
updated: 2026-05-18 06:51:31
health: "🔴 30 muammo"
---

# 🗂️ Orhun AI Admin Panel — Loyiha Topologiyasi

> [!info] Avtomatik yaratilgan
> Ushbu fayl `generate_topology.py` tomonidan yaratiladi.  
> **Oxirgi yangilanish:** `2026-05-18 06:51:31`  
> **Loyiha holati:** 🔴 30 muammo topildi

---

## 📊 Umumiy Statistika

| Ko'rsatkich | Qiymat | Holat |
|---|:---:|---|
| 📁 Jami fayllar | **39** | — |
| ✅ Amalga oshirilgan (>1 KB) | **38** | OK |
| ❌ Placeholder (≤1 KB) | **1** | ⚠️ Diqqat |
| 🔴 Broken Import | **0** | ✅ OK |
| 🔶 Supabase xavfsizlik | **16** | ⚠️ Tekshiring |
| 🔵 Sintaksis xatosi | **14** | 🚨 Xato bor |
| 🟡 Ishlatilmagan eksport | **13** | ⚠️ Tozalang |

---

## 🚀 Faza Holati

| Faza | Modul | Fayl | Holat |
|---|---|---|:---:|
| Faza 1 | Dashboard | [[dashboard]] `14.8 KB` | ✅ |
| Faza 2 | Foydalanuvchilar | [[users]] `10.4 KB` | ✅ |
| Faza 3 | Broadcast | [[notifications]] `23.5 KB` | ✅ 🔴4 |
| Faza 4 | Obuna tariflari | [[subscriptions]] `17.3 KB` | ✅ 🔴2 |
| Faza 5 | Qo'shiqlar moderatsiyasi | [[songs]] `14.7 KB` | ✅ |
| Faza 6 | Janrlar | [[genres]] `16.0 KB` | ✅ 🔴4 |
| Faza 7 | Analitika | [[analytics]] `2.4 KB` | ✅ |

---

## 📋 Barcha Fayllar (1 KB Qoidasi)

| Holat | Fayl | Hajm | Xatolar |
|:---:|---|---:|:---:|
| ✅ | [[main]] | 3.8 KB | ✓ |
| ✅ | [[preload]] | 1.7 KB | ✓ |
| ✅ | [[secure-storage]] | 7.3 KB | ✓ |
| ✅ | [[App]] | 2.5 KB | ✓ |
| ✅ | [[admin-layout]] | 1.1 KB | ✓ |
| ✅ | [[feedback-tab]] | 13.1 KB | ✓ |
| ✅ | [[multi-account-tab]] | 15.2 KB | ✓ |
| ✅ | [[overview-charts]] | 17.4 KB | ✓ |
| ✅ | [[genre-editor-modal]] | 13.4 KB | 🔴 4 |
| ✅ | [[preview-card]] | 4.4 KB | ✓ |
| ✅ | [[protected-route]] | 1.8 KB | ✓ |
| ✅ | [[sidebar]] | 3.8 KB | ✓ |
| ✅ | [[song-details-modal]] | 23.3 KB | 🔴 5 |
| ✅ | [[plan-editor-modal]] | 18.5 KB | 🔴 1 |
| ✅ | [[badge]] | 1.1 KB | ✓ |
| ✅ | [[modal]] | 2.9 KB | ✓ |
| ✅ | [[page-header]] | 1.0 KB | ✓ |
| ✅ | [[placeholder-page]] | 1.9 KB | ✓ |
| ✅ | [[stat-card]] | 2.8 KB | ✓ |
| ✅ | [[user-details-modal]] | 26.1 KB | 🔴 6 |
| ✅ | [[api]] | 1.6 KB | ✓ |
| ✅ | [[auth]] | 6.8 KB | ✓ |
| ✅ | [[local-auth]] | 3.5 KB | ✓ |
| ✅ | [[supabase]] | 1.0 KB | ✓ |
| ✅ | [[utils]] | 1.4 KB | ✓ |
| ❌ | [[main]] | 0.4 KB | ✓ |
| ✅ | [[analytics]] | 2.4 KB | ✓ |
| ✅ | [[dashboard]] | 14.8 KB | ✓ |
| ✅ | [[genres]] | 16.0 KB | 🔴 4 |
| ✅ | [[login]] | 6.2 KB | 🔴 2 |
| ✅ | [[notifications]] | 23.5 KB | 🔴 4 |
| ✅ | [[pin-login]] | 6.4 KB | ✓ |
| ✅ | [[pin-setup]] | 7.1 KB | 🔴 2 |
| ✅ | [[songs]] | 14.7 KB | ✓ |
| ✅ | [[subscriptions]] | 17.3 KB | 🔴 2 |
| ✅ | [[users]] | 10.4 KB | ✓ |
| ✅ | [[vite-env.d]] | 1.1 KB | ✓ |
| ✅ | [[tailwind.config]] | 2.4 KB | ✓ |
| ✅ | [[vite.config]] | 1.3 KB | ✓ |

---

## 🕸️ Import Topologiyasi

> [!tip] Obsidian Graf ko'rinishi
> `[[A]] → [[B]]` ko'rinishidagi linklar Obsidian Graf sahifasida bog'lanish sifatida ko'rinadi.

### `📁 electron/`

- [[main]] → [[secure-storage]]
- [[preload]]
- [[secure-storage]]

### `📁 root/`

- [[tailwind.config]]
- [[vite.config]]

### `📁 src/`

- [[App]] → [[auth]], [[local-auth]], [[admin-layout]], [[protected-route]], [[login]], [[pin-setup]], [[pin-login]], [[dashboard]], [[users]], [[songs]]
- [[vite-env.d]]

### `📁 src/components/`

- [[admin-layout]] → [[sidebar]]
- [[protected-route]] → [[auth]], [[local-auth]]
- [[sidebar]] → [[auth]], [[utils]]

### `📁 src/components/analytics/`

- [[feedback-tab]] → [[supabase]], [[modal]], [[badge]], [[utils]]
- [[multi-account-tab]] → [[supabase]], [[modal]], [[badge]], [[utils]]
- [[overview-charts]] → [[supabase]], [[utils]]

### `📁 src/components/genres/`

- [[genre-editor-modal]] → [[supabase]], [[modal]], [[badge]], [[utils]]

### `📁 src/components/notifications/`

- [[preview-card]] → [[utils]]

### `📁 src/components/songs/`

- [[song-details-modal]] → [[supabase]], [[modal]], [[badge]], [[utils]]

### `📁 src/components/subscriptions/`

- [[plan-editor-modal]] → [[supabase]], [[modal]], [[badge]], [[utils]]

### `📁 src/components/ui/`

- [[badge]] → [[utils]]
- [[modal]] → [[utils]]
- [[page-header]]
- [[placeholder-page]] → [[page-header]]
- [[stat-card]] → [[utils]]

### `📁 src/components/users/`

- [[user-details-modal]] → [[supabase]], [[auth]], [[modal]], [[badge]], [[utils]]

### `📁 src/lib/`

- [[api]] → [[supabase]]
- [[auth]] → [[supabase]]
- [[local-auth]]
- [[supabase]]
- [[utils]]

### `📁 src/routes/`

- [[analytics]] → [[page-header]], [[overview-charts]], [[multi-account-tab]], [[feedback-tab]], [[utils]]
- [[dashboard]] → [[supabase]], [[page-header]], [[stat-card]], [[utils]]
- [[genres]] → [[supabase]], [[page-header]], [[badge]], [[modal]], [[genre-editor-modal]], [[utils]]
- [[login]] → [[auth]], [[local-auth]], [[utils]]
- [[notifications]] → [[supabase]], [[page-header]], [[badge]], [[modal]], [[preview-card]], [[utils]]
- [[pin-login]] → [[auth]], [[local-auth]], [[pin-setup]], [[utils]]
- [[pin-setup]] → [[auth]], [[local-auth]], [[utils]]
- [[songs]] → [[supabase]], [[page-header]], [[badge]], [[song-details-modal]], [[utils]]
- [[subscriptions]] → [[supabase]], [[page-header]], [[badge]], [[modal]], [[plan-editor-modal]], [[utils]]
- [[users]] → [[supabase]], [[page-header]], [[badge]], [[user-details-modal]], [[utils]]

---

## 🔴 Xatolar va Muammolar

### 🔴 Broken Import'lar

> ✅ Hamma importlar to'g'ri. Broken import topilmadi.

### 🔶 Supabase Xavfsizlik

> **[[genre-editor-modal]]**
> - ⚠️ `Qator 100: supabase.from() → try-catch yoki .catch() ichida emas`
> - ⚠️ `Qator 101: supabase.from() → try-catch yoki .catch() ichida emas`

> **[[song-details-modal]]**
> - ⚠️ `Qator 494: supabase.rpc() → try-catch yoki .catch() ichida emas`
> - ⚠️ `Qator 520: supabase.rpc() → try-catch yoki .catch() ichida emas`
> - ⚠️ `Qator 550: supabase.rpc() → try-catch yoki .catch() ichida emas`

> **[[plan-editor-modal]]**
> - ⚠️ `Qator 173: supabase.from() → try-catch yoki .catch() ichida emas`

> **[[user-details-modal]]**
> - ⚠️ `Qator 512: supabase.rpc() → try-catch yoki .catch() ichida emas`
> - ⚠️ `Qator 537: supabase.rpc() → try-catch yoki .catch() ichida emas`
> - ⚠️ `Qator 562: supabase.rpc() → try-catch yoki .catch() ichida emas`
> - ⚠️ `Qator 584: supabase.rpc() → try-catch yoki .catch() ichida emas`

> **[[genres]]**
> - ⚠️ `Qator 83: supabase.from() → try-catch yoki .catch() ichida emas`
> - ⚠️ `Qator 93: supabase.from() → try-catch yoki .catch() ichida emas`
> - ⚠️ `Qator 126: supabase.rpc() → try-catch yoki .catch() ichida emas`

> **[[notifications]]**
> - ⚠️ `Qator 85: supabase.rpc() → try-catch yoki .catch() ichida emas`
> - ⚠️ `Qator 121: supabase.rpc() → try-catch yoki .catch() ichida emas`

> **[[subscriptions]]**
> - ⚠️ `Qator 122: supabase.from() → try-catch yoki .catch() ichida emas`

### 🔵 Sintaksis Xatolari

> **[[genre-editor-modal]]**
> - 🔵 `'(' yopilmagan (1 ta, qatorlar: [109])`
> - 🔵 `'{' yopilmagan (1 ta, qatorlar: [62])`

> **[[song-details-modal]]**
> - 🔵 `'(' yopilmagan (3 ta, qatorlar: [102, 198, 357])`
> - 🔵 `'{' yopilmagan (4 ta, qatorlar: [101, 198, 319])`

> **[[user-details-modal]]**
> - 🔵 `'(' yopilmagan (1 ta, qatorlar: [274])`
> - 🔵 `'{' yopilmagan (1 ta, qatorlar: [208])`

> **[[genres]]**
> - 🔵 `'{' yopilmagan (1 ta, qatorlar: [22])`

> **[[login]]**
> - 🔵 `'(' yopilmagan (1 ta, qatorlar: [70])`
> - 🔵 `'{' yopilmagan (1 ta, qatorlar: [8])`

> **[[notifications]]**
> - 🔵 `'(' yopilmagan (1 ta, qatorlar: [156])`
> - 🔵 `'{' yopilmagan (1 ta, qatorlar: [56])`

> **[[pin-setup]]**
> - 🔵 `'(' yopilmagan (2 ta, qatorlar: [51, 115])`
> - 🔵 `'{' yopilmagan (2 ta, qatorlar: [15, 108])`

> **[[subscriptions]]**
> - 🔵 `Qator 317: ortiqcha '}' (juftisiz yopuvchi)`

---

## ⚠️ Ogohlantirishlar

### 🟡 Ishlatilmagan Eksportlar

> [!warning] Bu eksportlar boshqa fayllarda import qilinmagan.
> Ehtimol ular ishlatiladi, lekin tekshirib ko'ring.

**[[App]]**
- 🟡 `export App` → import topilmadi

**[[genre-editor-modal]]**
- 🟡 `export emptyGenre` → import topilmadi

**[[song-details-modal]]**
- 🟡 `export AdminSongRow` → import topilmadi
- 🟡 `export SongDetailsModal` → import topilmadi

**[[plan-editor-modal]]**
- 🟡 `export emptyPlan` → import topilmadi
- 🟡 `export PlanEditorModal` → import topilmadi
- 🟡 `export PlanFeature` → import topilmadi
- 🟡 `export SubscriptionPlan` → import topilmadi

**[[placeholder-page]]**
- 🟡 `export PlaceholderPage` → import topilmadi

**[[user-details-modal]]**
- 🟡 `export UserDetailsModal` → import topilmadi
- 🟡 `export AdminUserRow` → import topilmadi

**[[api]]**
- 🟡 `export ApiError` → import topilmadi

**[[auth]]**
- 🟡 `export AdminProfile` → import topilmadi

---

## 🛠️ Skriptni Ishlatish

```batch
rem Admin panel papkasiga o'ting
cd D:\GitHub\orhun-ai\admin-panel

rem Skriptni ishga tushiring
python generate_topology.py

rem Boshqa papka uchun:
python generate_topology.py D:\boshqa\papka
```

---

*⚡ Avtomatik yaratildi: `generate_topology.py` | 2026-05-18 06:51:31*