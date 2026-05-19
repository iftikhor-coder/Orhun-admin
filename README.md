# Orhun AI — Admin Panel

Desktop admin panel (Electron + React + Vite + Supabase). Vercel'dagi
frontend bilan bir xil DB'ga ulanadi. Faqat `profiles.is_admin = true`
boʻlgan foydalanuvchilar kira oladi.

---

## 🚀 Tezkor boshlash

### 1. Kerakli vositalar

- **Node.js** ≥ 18 ([node-version-manager](https://github.com/coreybutler/nvm-windows) tavsiya)
- **npm** ≥ 9 (Node bilan birga)
- **Git**

### 2. Oʻrnatish

```bash
cd D:\Documents\GitHub\orhun-ai\admin-panel
npm install
```

### 3. Environment sozlash

```bash
# Windows
copy .env.example .env
# macOS / Linux
cp .env.example .env
```

`.env` faylini oching va Supabase URL + anon key'ni toʻldiring (frontend bilan
bir xil qiymatlar — `D:\GitHub\orhun-ai\frontend\.env.local` dan koʻchiring).

### 4. Ishga tushirish (dev rejimi)

```bash
npm run dev
```

Electron oynasi avtomatik ochiladi. Vite dev server `http://localhost:5180`
da ishlaydi, Electron undan yuklaydi. Hot reload yoqilgan.

### 5. Production build

```bash
# Windows .exe installer
npm run dist:win

# macOS .dmg
npm run dist:mac

# Linux .AppImage
npm run dist:linux
```

Natijada `release/` papkasida installer paydo boʻladi.

---

## 📁 Loyiha strukturasi

```
admin-panel/
├── electron/                    Electron main + preload
│   ├── main.ts                  oyna yaratish, security, IPC
│   └── preload.ts               renderer ↔ main bridge
├── src/
│   ├── components/
│   │   ├── admin-layout.tsx     sidebar + content wrapper
│   │   ├── sidebar.tsx          navigatsiya, qizil ADMIN badge
│   │   ├── protected-route.tsx  auth + is_admin tekshiruvi
│   │   └── ui/
│   │       ├── page-header.tsx
│   │       ├── stat-card.tsx
│   │       └── placeholder-page.tsx
│   ├── lib/
│   │   ├── supabase.ts          Supabase client
│   │   ├── auth.ts              Zustand auth store
│   │   ├── api.ts               Python REST API helper
│   │   └── utils.ts             cn, formatDate, timeAgo
│   ├── routes/
│   │   ├── login.tsx            ✅ tayyor
│   │   ├── dashboard.tsx        🔵 Faza 1 (skelet)
│   │   ├── users.tsx            🟡 Faza 2 (placeholder)
│   │   ├── notifications.tsx    🟢 Faza 3 (placeholder)
│   │   ├── subscriptions.tsx    🟣 Faza 4 (placeholder)
│   │   ├── songs.tsx            🔴 Faza 5 (placeholder)
│   │   ├── genres.tsx           🟠 Faza 6 (placeholder)
│   │   └── analytics.tsx        🌟 Faza 7 (placeholder)
│   ├── styles/globals.css       Tailwind + global stillar
│   ├── App.tsx                  Router
│   ├── main.tsx                 React entry
│   └── vite-env.d.ts            TS types
├── public/                      static assets
├── .env.example                 environment shabloni
├── electron-builder.json        package.json ichiga integratsiyalashtirilgan
├── index.html                   Vite entry HTML
├── package.json                 bogʻliqliklar + scripts
├── tailwind.config.ts           Tailwind: gold + midnight + admin
├── tsconfig.json                TypeScript
└── vite.config.ts               Vite + Electron plugin
```

---

## 🛡️ Xavfsizlik

- **`contextIsolation: true`** — renderer Node API'larga toʻgʻridan-toʻgʻri kira olmaydi
- **`nodeIntegration: false`** — XSS hujumlari uchun yopilgan
- **`sandbox: true`** — renderer alohida process'da
- **CSP header** — `index.html` da; faqat Supabase va Python API'ga ruxsat
- **is_admin tekshiruv** — login'da + har bir route'da (ProtectedRoute)
- **Tashqi havolalar** — default browser'da ochiladi (in-app emas)

---

## 🎨 Dizayn tizimi

| Komponent | Rang | Maqsad |
|---|---|---|
| Fon | `midnight-950` (#060b1a) | Asosiy fon |
| Matn | `gold-100` (#fff0d4) | Asosiy matn |
| Aksent | `gold-400` (#f5b342) | Tugmalar, ikonkalar |
| Admin zone | `admin-500` (#ef4444) | Qizil — destruktiv amallar |
| Warning | `amber-400` | Ehtiyot bilan amallar |
| Success | `emerald-400` | Muvaffaqiyatli amallar |

Shrift: **Inter** (UI), **Cinzel** (logo), **JetBrains Mono** (kod).

---

## 📋 Bajarilishi kerak (TZ asosida)

- [x] Faza 0 — Skelet (route, auth, layout, dashboard)
- [ ] **Faza 1** — Dashboard real ma'lumotlar
- [ ] **Faza 2** — Users (jadval, harita, actions)
- [ ] **Faza 3** — Notifications broadcast
- [ ] **Faza 4** — Subscription tariflari
- [ ] **Faza 5** — Songs moderatsiyasi
- [ ] **Faza 6** — Genres
- [ ] **Faza 7** — Analytics + multi-account detector

---

## 🐛 Tez-tez uchraydigan muammolar

**Q: `npm run dev` ishlamayapti, "port 5180 in use" xatosi.**
A: `vite.config.ts` da `strictPort: true` — port band boʻlsa, exit qiladi.
Boshqa portga oʻzgartiring yoki band qilgan jarayonni toʻxtating.

**Q: "Sizda admin huquqi yoʻq" xatosi.**
A: Supabase'da oʻz hisobingiz uchun `profiles.is_admin = true` qiling:
```sql
UPDATE profiles SET is_admin = true WHERE email = 'your@email.com';
```

**Q: Electron oyna ochilmayapti.**
A: Avval `npm run build` orqali tekshiring. TypeScript xatolari boʻlsa,
ularni tuzating.

**Q: Python API chaqiriqlari ishlamayapti.**
A: `.env` da `VITE_PYTHON_API_URL` toʻldirilganligini tekshiring.
Faza 7 dan oldin bu yoʻq boʻlishi normal — boshqa boʻlimlar bemalol ishlaydi.

---

## 📞 Aloqa

Loyiha egasi: Orhun AI
DB host: Supabase
Frontend: orhun-ai.vercel.app
