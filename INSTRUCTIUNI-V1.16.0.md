# La Lumina Lumânării — actualizare diferențială V1.16.0

Actualizarea se aplică peste V1.15.2. Corectează problemele găsite în auditul
site-ului public și adaugă teste pentru catalog, checkout, autentificare și
formularul de contact.

## Instalare

1. Fă un backup al repository-ului și al datelor din Admin.
2. Copiază în rădăcina repository-ului toate fișierele din arhivă.
3. Acceptă înlocuirea fișierelor existente.
4. Rulează:

```bash
npm ci
npm run typecheck
npm run lint
npm run build:netlify
npm test
```

5. Dacă toate comenzile se termină fără erori, publică prin commit și push:

```bash
git add .
git commit -m "fix: stabilize storefront and pre-launch flows"
git push
```

Nu sunt necesare migrări SQL și nu au fost adăugate variabile de mediu noi.
Fișierul `.env.example` corectează doar adresa Netlify folosită ca exemplu.

## Checkout și datele comerciantului

Checkout-ul și API-ul de comenzi rămân disponibile chiar dacă profilul
comerciantului nu este încă complet. Astfel pot fi primite comenzile controlate
de la prieteni și familie în perioada de început.

Datele de mai jos rămân vizibile în centrul de lansare și trebuie completate în
Admin → Date magazin înainte de promovarea magazinului către publicul larg:

- denumirea juridică;
- CUI/CIF;
- numărul Registrului Comerțului;
- sediul social;
- adresa pentru retur;
- emailul de contact;
- telefonul;
- mențiunea despre preț și TVA.

Lipsa lor nu blochează tehnic o comandă. Protecțiile pentru stoc, preț,
validarea datelor, termenii acceptați, rata cererilor și comenzile duplicate
rămân active.

## Catalog

Produsele built-in fără preț, descriere, fotografie, gramaj sau timp de ardere
pornesc ca draft. Orice produs incomplet este exclus din catalog, sitemap și
paginile indexabile, inclusiv dacă o înregistrare veche a rămas „publicată” în
baza de date. Produsul „Brăduț Alb Perlat” are și în fallback-ul local datele
observate pe site: 20 lei, 350 g, aproximativ 24 ore și stoc 1.

Înainte să publici alt produs, completează toate datele și verifică stocul.

## Test după deploy

Fără să creezi încă date reale, verifică:

1. `/`, `/lumanari`, `/colectii`, `/poveste`, `/ingrijire`, `/contact`;
2. un URL inexistent — trebuie să apară 404 în română;
3. că numai produsele complete apar în catalog;
4. că „Brăduț Alb Perlat” afișează `350 g`;
5. că `/ghid-parfum` rămâne în pregătire până există minimum trei produse;
6. adaugă produsul în coș și verifică faptul că `/checkout` se deschide chiar
   dacă profilul comerciantului este încă incomplet.

Testele care creează efectiv date trebuie făcute controlat: un cont de test, un
mesaj Contact marcat ca test și o comandă ramburs de test. Comanda scade stocul;
anuleaz-o apoi din Admin și verifică revenirea stocului.

## Rezultatul verificărilor din pachet

- TypeScript: trecut;
- ESLint: trecut;
- build Next.js/Netlify: trecut;
- build Vinext/Sites și validarea artefactului: trecut;
- teste automate: 19 trecute din 19.

Raportul detaliat este în `RAPORT-AUDIT-V1.16.0.md`.
