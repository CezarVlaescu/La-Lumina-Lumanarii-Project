# Activarea emailurilor și campaniilor — V1.16.4

Codul și șabloanele sunt pregătite, dar pot rămâne inactive până la cumpărarea
domeniului. Comenzile și formularul de contact continuă să funcționeze dacă
variabilele Resend nu sunt completate.

## Ce trimite aplicația

- confirmarea comenzii către client;
- notificarea comenzii noi către Administrator;
- actualizări către client când statusul comenzii se schimbă;
- notificare către Administrator pentru fiecare mesaj din Contact;
- abonări la newsletter păstrate în baza magazinului, cu consimțământ separat;
- campanii de sezon create ca draft, programate sau trimise din Admin;
- confirmarea contului și resetarea parolei prin Supabase Auth.

Notificările către Administratori folosesc adresa clientului în `Reply-To`,
astfel încât butonul Răspunde din aplicația de email răspunde direct clientului.
O eroare Resend nu anulează comanda sau mesajul deja salvat.

Formularul de newsletter funcționează și înainte de cumpărarea domeniului:
abonările se salvează local cu starea „de sincronizat”. Trimiterea campaniilor
rămâne inactivă până la configurarea Resend.

## 1. Variabile Netlify pentru Resend

După verificarea domeniului în Resend, completează în Netlify:

```text
RESEND_API_KEY=re_...
STORE_EMAIL_FROM=La Lumina Lumanarii <comenzi@domeniul-tau.ro>
STORE_NOTIFICATION_EMAIL=admin@domeniul-tau.ro,atelier@domeniul-tau.ro
STORE_MARKETING_EMAIL_FROM=La Lumina Lumanarii <povesti@domeniul-tau.ro>
```

`RESEND_API_KEY` trebuie marcată drept secretă. După salvare pornește un deploy
nou. Până atunci variabilele pot rămâne goale.

`STORE_NOTIFICATION_EMAIL` acceptă mai multe adrese separate prin virgulă sau
punct și virgulă. `STORE_MARKETING_EMAIL_FROM` este opțional; dacă lipsește,
campaniile folosesc `STORE_EMAIL_FROM`.

## 2. Segmentul și campaniile

După ce expeditorul este verificat în Resend:

1. intră în **Admin → Email & campanii**;
2. apasă **Creează segmentul**;
3. apasă **Sincronizează abonații**;
4. editează campania, salveaz-o întâi ca draft și verific-o în Resend;
5. programeaz-o sau trimite-o numai după confirmarea explicită.

Ora aleasă pentru programare este interpretată în fusul orar al browserului și
este convertită automat în formatul UTC cerut de serviciul de email.

Identificatorul segmentului este salvat automat în setările magazinului. Ca
alternativă, poate fi introdus în Netlify prin
`RESEND_MARKETING_SEGMENT_ID=seg_...`. Fiecare email de campanie conține linkul
de dezabonare gestionat de Resend.

## 3. URL-urile Supabase

În Authentication → URL Configuration setează:

```text
Site URL:
https://laluminalumanarii.netlify.app

Redirect URLs:
https://laluminalumanarii.netlify.app/cont/autentificare?confirmed=1
https://laluminalumanarii.netlify.app/cont/resetare-parola
```

Când conectezi domeniul propriu, înlocuiește adresa Netlify în Site URL,
Redirect URLs și `NEXT_PUBLIC_SITE_URL`.

## 4. Șabloanele Supabase

În Authentication → Email Templates:

1. la **Confirm signup**, setează subiectul
   `Confirmă-ți contul | La Lumina Lumânării` și copiază conținutul din
   `supabase/email-templates/confirm-signup.html`;
2. la **Reset password**, setează subiectul
   `Resetează parola | La Lumina Lumânării` și copiază conținutul din
   `supabase/email-templates/reset-password.html`;
3. salvează fiecare șablon;
4. după configurarea Custom SMTP, reactivează **Confirm email**.

Șabloanele folosesc variabilele Supabase `{{ .SiteURL }}`,
`{{ .ConfirmationURL }}`, `{{ .Email }}` și `{{ .Data.first_name }}`.

## 5. Test final

1. creează un cont Membru cu o adresă externă;
2. confirmă adresa și verifică mesajul de succes din pagina de autentificare;
3. solicită resetarea parolei;
4. plasează o comandă test și schimbă-i statusul;
5. trimite un mesaj din Contact și folosește Răspunde în notificarea primită;
6. verifică în Admin starea emailurilor comenzii și reîncearcă unul eșuat;
7. înscrie o adresă de test din footer, sincronizeaz-o, creează un draft de
   campanie și verifică linkul de dezabonare înainte de prima trimitere.
