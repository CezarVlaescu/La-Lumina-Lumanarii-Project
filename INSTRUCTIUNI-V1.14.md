# La Lumina Lumânării — actualizare diferențială V1.14

Acest pachet se aplică peste repository-ul V1.13 care este deja conectat la
Netlify și peste care a fost adăugat logo-ul. Nu conține catalogul, imaginile
produselor, comenzile ori secretele proiectului.

## Instalare

1. Deschide arhiva și copiază toate fișierele și folderele în rădăcina
   repository-ului.
2. Confirmă înlocuirea fișierelor cu același nume.
3. Nu șterge celelalte fișiere din repository.
4. Rulează opțional local:

   ```bash
   npm ci
   npm run typecheck
   npm run lint
   npm run build:netlify
   ```

5. Fă `commit` și `push`; Netlify va publica actualizarea automat.

Nu trebuie rulată nicio migrare SQL și nu trebuie schimbate acum variabilele
Netlify. Resend poate rămâne neconfigurat până la cumpărarea domeniului.

## Fișiere noi

- `EMAIL_SETUP.md`
- `app/lib/email-template.ts`
- `app/lib/contact-email-template.ts`
- `app/lib/contact-email-service.ts`
- `supabase/email-templates/confirm-signup.html`
- `supabase/email-templates/reset-password.html`

## Fișiere înlocuite

- `.env.example`
- `DEPLOYMENT.md`
- `README.md`
- `package.json`
- `package-lock.json`
- `app/api/account/auth/register/route.ts`
- `app/api/contact/route.ts`
- `app/components/account-auth-form.tsx`
- `app/cont/autentificare/page.tsx`
- `app/lib/account-auth.ts`
- `app/lib/contact-repository.ts`
- `app/lib/order-email-service.ts`
- `app/lib/order-email-templates.ts`
- `app/lib/request-security.ts`
- `app/lib/site-config.ts`

## Logica introdusă

- emailurile de comandă folosesc logo-ul și butoane spre Cont/Admin;
- notificarea Administratorului are `Reply-To` setat la emailul clientului;
- formularul Contact trimite o notificare Resend după salvarea mesajului;
- o eroare sau lipsa configurării Resend nu anulează datele deja salvate;
- confirmarea contului redirecționează la pagina de autentificare cu un mesaj
  clar de succes;
- erorile Supabase sunt citite din `error_description`, `message`, `msg`,
  `error` sau `code`;
- validarea `Origin` acceptă URL-ul public configurat și URL-ul Netlify;
- URL-ul implicit al magazinului este adresa actuală Netlify;
- sunt incluse șabloanele românești Supabase pentru confirmare și resetare.
