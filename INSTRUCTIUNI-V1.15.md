# La Lumina Lumânării — actualizare diferențială V1.15

Această actualizare se aplică peste V1.14 deja publicată pe Netlify. Nu schimbă
schema Supabase, produsele, comenzile sau variabilele de mediu.

## Instalare

1. Copiază în rădăcina repository-ului conținutul folderului primit.
2. Acceptă înlocuirea fișierelor existente.
3. Rulează `git add .`, apoi commit și push.
4. Așteaptă ca ultimul deploy Netlify să apară `Published`.
5. Deschide site-ul într-o fereastră Incognito și parcurge testele de mai jos.

## Fișiere actualizate

- `app/components/store-provider.tsx`
- `app/components/site-shell.tsx`
- `app/components/cart-page-content.tsx`
- `app/components/product-detail.tsx`
- `app/components/checkout-form.tsx`
- `app/globals.css`
- `package.json`
- `package-lock.json`
- `README.md`

## Ce aduce V1.15

- cantitatea din coș nu mai poate depăși stocul real;
- adăugarea și eliminarea produselor oferă confirmare vizibilă;
- există buton explicit de eliminare din coș;
- coșul se sincronizează între filele aceluiași browser;
- nu mai apare fals starea „Coșul este gol” înainte de citirea coșului salvat;
- progres vizual până la livrarea gratuită;
- checkoutul păstrează identificatorul încercării la erori de rețea, prevenind
  comenzile duplicate la retry;
- mesajele de eroare sunt clare, primesc focus și pot fi găsite ușor pe mobil;
- validări mai bune pentru telefon, adresă, cod poștal și lungimea câmpurilor;
- confirmarea comenzii permite copierea numărului și accesul la istoricul din cont;
- coșul lateral se închide cu `Escape` și are controale mai accesibile.

## Test rapid după deploy

1. Adaugă un produs cu stoc 1 și verifică faptul că butonul `+` se dezactivează.
2. Elimină produsul și verifică mesajul de confirmare.
3. Adaugă din nou produsul, reîncarcă pagina și verifică păstrarea coșului.
4. Deschide site-ul într-o a doua filă și verifică sincronizarea coșului.
5. Completează checkoutul cu un telefon sau cod poștal invalid și verifică validarea.
6. Plasează o comandă ramburs și verifică numărul comenzii, stocul și Adminul.
7. Anulează comanda de test și confirmă revenirea stocului.

Resend, confirmarea emailului, Stripe Live și domeniul rămân dezactivate până la
etapa finală de lansare stabilită pentru proiect.
