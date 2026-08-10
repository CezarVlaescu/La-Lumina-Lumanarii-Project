# La Lumina Lumânării

Magazin online React pentru lumânări artizanale, construit în direcția vizuală
„Ritual nocturn”: mov închis, lumină caldă și accente aurii.

Versiunea curentă este **V1.15**. Include magazinul public, catalogul cu variante,
coșul persistent, checkout-ul cu ramburs și Stripe, administrarea comenzilor și
stocului, livrarea configurabilă, paginile legale, centrul de lansare, backupul
portabil, adaptorul Supabase și autentificarea Membru/Administrator. Homepage-ul
urmărește acum tema sezonieră activă, afișează colecția relevantă, cele mai
vândute produse și o ofertă săptămânală configurabilă din Admin. Reducerea
setată pentru ofertă este aplicată consecvent în catalog, coș și checkout.
Emailurile tranzacționale au acum identitatea vizuală a magazinului, acțiuni
directe, `Reply-To` către client și notificări pentru formularul Contact.
Șabloanele românești Supabase pentru confirmarea contului și resetarea parolei
sunt pregătite în `supabase/email-templates`; activarea este descrisă în
`EMAIL_SETUP.md`. Coșul și checkoutul verifică acum limitele reale de stoc,
afișează feedback clar, evită stările false înainte de încărcarea coșului și
păstrează aceeași încercare de checkout la erorile de rețea pentru a preveni
comenzile duplicate.

## Cerințe

- Node.js 22.13 sau mai nou
- npm

## Pornire locală

Comenzile sunt identice în PowerShell, Command Prompt, macOS și Linux:

```bash
npm install
npm run dev
```

Deschide adresa afișată în terminal, de regulă
`http://localhost:5173`. Pentru mediul identic cu Netlify poți folosi
`npm run dev:netlify`, care pornește de regulă la `http://localhost:3000`.

Fișierele `.openai/hosting.json` și `build/sites-vite-plugin.ts` fac parte din
configurația proiectului și nu trebuie șterse.

## Verificări

```bash
npm run lint
npm run typecheck
npm run build:local
npm run build:netlify
```

Scriptul `npm run build` este rezervat publicării prin Sites și include
validarea artefactului de producție.

## Versiuni

- **V0.1** — prototipul vizual
- **V0.2** — stabilizare React, Windows și responsive
- **V0.3** — produse și fotografii reale
- **V1.0** — admin securizat, stoc și comenzi ramburs
- **V1.1** — emailuri tranzacționale
- **V1.2** — Stripe Checkout în modul de test
- **V1.3** — Sameday la adresă și Easybox
- **V1.4** — legal, SEO și securitate
- **V1.5** — centrul de lansare
- **V1.6** — backup verificabil și portabilitatea datelor
- **V1.7** — audit final, coș sincronizat și verificări de lansare
- **V1.8** — Netlify + Supabase, autentificare proprie și teme hero programabile
- **V1.9** — conturi Membru/Administrator, adrese și istoricul comenzilor
- **V1.10** — stabilizare responsive, catalog și administrare pentru lansare
- **V1.11** — integrarea finală a conturilor și a temelor sezoniere
- **V1.12** — navigație colecții și aplicarea completă a paletei active
- **V1.13** — homepage dinamic, bestseller-uri și ofertă săptămânală din Admin
- **V1.14** — emailuri finisate, notificări Contact și șabloane Supabase Auth
- **V1.15** — coș, checkout și experiență mobilă finisate pentru testarea finală

Versiunea găzduită în Sites folosește D1 pentru date și R2 pentru imaginile
încărcate. Exportul din Admin păstrează catalogul complet și toate
înregistrările necesare mutării ulterioare în Supabase. Migrarea pregătită pentru
ținta Netlify se află în `supabase/migrations`.

Adaptorul selectează automat Supabase când variabilele din `.env.example` sunt
configurate; altfel păstrează D1/R2 pentru versiunea Sites. Pașii exacți de
transfer, creare a administratorului și import al backupului sunt în
`DEPLOYMENT.md`.
