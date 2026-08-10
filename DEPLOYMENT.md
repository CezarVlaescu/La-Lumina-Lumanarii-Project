# Publicare pe Netlify + Supabase

Acest ghid mută magazinul în conturile proprietarului fără a pierde catalogul,
comenzile, setările sau fotografiile încărcate.

## 1. Creează proiectul Supabase

1. Creează un proiect nou în Supabase.
2. Deschide SQL Editor și rulează, în această ordine, fișierele:
   - `supabase/migrations/202607290001_initial_store.sql`;
   - `supabase/migrations/202607300001_customer_accounts.sql`.
3. În Authentication → Users creează utilizatorul administrator și confirmă-i
   adresa de email.
4. În SQL Editor autorizează același email:

```sql
insert into public.admin_users (email)
values ('emailul-tau@exemplu.ro')
on conflict (email) do nothing;
```

Din Project Settings → API păstrează:

- Project URL;
- cheia `anon`;
- cheia `service_role` — secretă, folosită numai în variabilele Netlify.

## 2. Creează repository-ul și site-ul Netlify

1. Dezarhivează proiectul și încarcă-l într-un repository GitHub privat.
2. În Netlify alege Add new site → Import an existing project.
3. Selectează repository-ul. Configurația din `netlify.toml` completează
   comanda de build.
4. În Site configuration → Environment variables adaugă:

```text
NEXT_PUBLIC_SITE_URL=https://numele-site-ului.netlify.app
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ADMIN_SESSION_SECRET=...
ACCOUNT_SESSION_SECRET=...
```

Generează `ADMIN_SESSION_SECRET` local, fără să-l trimiți în chat:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Generează în același mod o valoare diferită pentru
`ACCOUNT_SESSION_SECRET`.

Variabilele Resend și Stripe pot rămâne goale până când serviciile sunt
activate. Nu prefixa cheia `service_role` sau secretele Stripe/Resend cu
`NEXT_PUBLIC_`.

Configurația completă pentru Resend, URL-urile de redirect și șabloanele
românești Supabase se află în `EMAIL_SETUP.md`. Domeniul și emailurile pot fi
activate ulterior; lipsa variabilelor Resend nu blochează salvarea comenzilor
sau a mesajelor din Contact.

## 3. Mută datele existente

1. În magazinul actual deschide Admin → Infrastructură.
2. Descarcă backupul JSON și păstrează-l privat: poate conține date personale.
3. După prima publicare Netlify, intră la `/admin` cu utilizatorul Supabase.
4. În Admin → Infrastructură alege backupul, verifică sumarul și confirmă
   restaurarea.
5. Reîncarcă Admin și verifică produsele, stocul, comenzile, livrarea, datele
   juridice și Hero & teme. Backupurile V2 includ și membrii plus adresele
   salvate; un backup V1 rămâne compatibil și se importă fără aceste tabele.

Importul acceptă atât backupurile D1/R2, cât și backupurile create ulterior în
Supabase. Fotografiile incluse sunt mutate în bucketul `product-media`.

## 4. Testul de lansare

Înainte de a distribui adresa:

1. completează datele firmei și toate produsele publicate;
2. testează o comandă ramburs cu un produs disponibil;
3. anulează comanda de test și verifică revenirea stocului;
4. verifică formularul de contact;
5. testează hero-ul pe desktop și telefon;
6. creează un cont Membru, salvează o adresă și verifică istoricul comenzilor;
7. autentifică utilizatorul din `admin_users` și verifică butonul
   „Panou de administrare” din meniul contului;
8. conectează Stripe numai cu cheile de test și webhookul
   `https://numele-site-ului.netlify.app/api/payments/stripe/webhook`;
9. activează Resend după verificarea unui domeniu propriu.

Subdomeniul gratuit `netlify.app` poate fi folosit pentru lansarea inițială.
Domeniul propriu se poate conecta ulterior fără schimbarea aplicației.
