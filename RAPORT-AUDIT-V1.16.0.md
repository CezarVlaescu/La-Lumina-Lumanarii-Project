# Raport complet de audit — La Lumina Lumânării V1.16.0

Data auditului: 29 octombrie 2026  
Site analizat: `https://laluminalumanarii.netlify.app/`  
Bază de comparație: V1.15.2

## Concluzie

Structura magazinului, coșul, calculul livrării, protecția Admin și baza pentru
comenzi sunt solide. Problemele principale erau de publicare și încredere:
produse incomplete vizibile, recomandări greșite, texte tehnice expuse,
afirmații comerciale premature și SEO inconsistent.

V1.16.0 corectează aceste puncte. Codul trece ambele build-uri și toate cele 19
teste automate. Mai rămân de executat după deploy testele care creează date
reale în Supabase sau trimit emailuri.

## Probleme găsite și rezolvate

| Zonă | Problemă observată | Rezolvare V1.16.0 |
|---|---|---|
| Catalog | 17 produse fără date comerciale complete erau publice și indexabile | Produsele built-in incomplete devin draft implicit, iar orice produs incomplet este exclus din magazin, pagini de produs și sitemap |
| Produs disponibil | Greutatea apărea `350`, fără unitate | Valorile numerice sunt afișate automat cu `g` |
| Ghid | Răspunsurile de iarnă puteau recomanda „Turturele de Paște” | Recomandările folosesc sluguri explicite și numai produse publicabile |
| Ghid | Un singur produs nu permite o recomandare utilă | Ghidul intră în starea „în pregătire”, primește `noindex` și iese din sitemap până există minimum trei produse |
| Navigație | Linkul „Cadouri” trimitea la `gift=true`, filtru inexistent | Linkul duce la colecția de Crăciun |
| 404 | Pagina implicită era în engleză | 404 personalizat în română, cu `noindex` și căi de revenire |
| Coș | Mesaje cu gen gramatical greșit și singularul „1 disponibile” | Mesaje neutre și acord corect pentru stoc |
| Homepage | „Cele mai vândute” apărea fără vânzări | Se afișează doar când există vânzări reale; altfel apare „Alese din atelier” |
| Homepage | „Oferta săptămânii” apărea fără reducere | Oferta implicită este oprită; fără reducere se numește „Recomandarea săptămânii” |
| Promisiuni | Bannerul promitea ambalare cadou gratuită fără opțiune clară în checkout | Mesaj factual despre ambalarea atentă a comenzilor |
| Conținut | Mai multe texte sunau generic sau artificial | Paginile principale folosesc formulări directe despre produse, loturi, finisare, preț și stoc |
| Conținut tehnic | Publicul putea vedea referințe la Admin, roluri, Netlify sau Supabase | Explicațiile tehnice au fost eliminate din paginile publice |
| SEO | Colecții, Poveste și Îngrijire aveau canonice/titluri incomplete | Titluri, descrieri și canonical propriu pentru fiecare pagină |
| Legal | Paginile puteau afișa placeholder-e și indicații interne | Stări publice curate, fără paranteze tehnice sau instrucțiuni de administrare |
| Checkout | Comenzile inițiale trebuie să funcționeze cât timp profilul comerciantului este completat | Checkout-ul și API-ul rămân disponibile; profilul juridic este o recomandare de lansare, nu o blocare tehnică |
| Configurare | `.env.example` folosea un subdomeniu Netlify diferit de cel real | Exemplul folosește `laluminalumanarii.netlify.app` |

## Verificarea fluxurilor

### Catalog și coș

- ruta catalogului și ruta produsului complet răspund corect;
- produsele incomplete primesc 404 și nu apar în sitemap;
- prețul, greutatea și stocul produsului public sunt randate corect;
- limita de stoc, persistența coșului, sincronizarea între file și calculele de
  livrare fuseseră validate în auditul interfeței;
- textele de adăugare/eliminare și pluralizarea stocului sunt corectate.

### Comandă

Protecțiile verificate automat:

- cereri numai din aceeași origine;
- corp JSON și limită de 64 KB;
- rate limit de 8 încercări la 15 minute;
- validare pentru email, telefon, adresă, cod poștal, Easybox, cantități și
  acceptarea termenilor;
- identificator unic de checkout pentru prevenirea dublurilor;
- preț și stoc recitite pe server, nu preluate din browser;
- checkout disponibil și când profilul comerciantului este încă incomplet;
- răspuns clar când Stripe nu este activ.

O comandă ramburs reală nu a fost creată în timpul auditului local. După deploy,
testul final trebuie să confirme: salvarea comenzii, scăderea stocului,
vizibilitatea în Admin, confirmarea către client și revenirea stocului după
anulare.

### Autentificare

Protecțiile verificate automat:

- cereri numai din aceeași origine;
- limite de dimensiune și rate limiting separat pentru creare, login și resetare;
- email valid și parolă de minimum 10 caractere;
- mesaj de recuperare care nu dezvăluie dacă adresa există;
- cookie de sesiune `HttpOnly`, `SameSite=Lax` și `Secure` în producție;
- logout care nu permite redirect către un domeniu extern;
- Admin rămâne inaccesibil unui vizitator sau unui membru obișnuit.

Crearea contului, confirmarea emailului, loginul cu un cont Supabase real și
resetarea parolei trebuie verificate după deploy cu o adresă de test controlată.

### Contact

Protecțiile verificate automat:

- aceeași origine, JSON de maximum 16 KB și maximum 5 mesaje pe oră;
- validarea numelui, emailului, subiectului și mesajului;
- honeypot pentru trimiterea automată;
- erorile serviciului de email nu pierd mesajul deja salvat.

Trimiterea unui mesaj real nu a fost făcută în auditul local. După deploy trebuie
confirmate salvarea în Admin și notificarea Resend, dacă integrarea este activă.

## Verificări automate executate

| Verificare | Rezultat |
|---|---:|
| `npm run typecheck` | Trecut |
| `npm run lint` | Trecut |
| `npm run build:netlify` | Trecut |
| `npm run build` / Vinext | Trecut |
| Validare artefact Sites | Trecut |
| Teste Node pe HTML și API | 19/19 trecute |

Testele acoperă rutele publice, catalogul filtrat, 404, sitemap, canonical,
absența notelor tehnice publice, protecția Admin, validările checkout,
disponibilitatea checkout-ului, contactul, autentificarea, recuperarea parolei
și logoutul.

## Ce trebuie completat înainte de promovarea publică

1. Datele juridice reale din Admin → Date magazin. Acestea nu blochează
   comenzile inițiale, dar trebuie finalizate înainte de lansarea către public.
2. Pentru fiecare produs public: preț, fotografie, descriere, gramaj, timp de
   ardere și stoc; restul rămân draft.
3. Confirmarea tarifelor: în auditul live erau 25 lei la adresă, 15 lei la
   Easybox și gratuit de la 100 lei.
4. URL-ul real în `NEXT_PUBLIC_SITE_URL` și în redirecturile Supabase.
5. Resend pentru confirmări și notificări, dacă emailurile trebuie să plece la
   lansare.
6. Un cont Membru de test și un administrator autorizat.
7. O comandă ramburs de test, apoi anularea ei și verificarea stocului.
8. Stripe numai cu chei de test până când fluxul este verificat integral.

## Teste live rămase după deploy

Aceste acțiuni produc date sau emailuri și se fac numai controlat:

1. creare și confirmare cont de test;
2. login, logout și resetare parolă;
3. mesaj Contact cu subiectul și textul marcate clar `TEST`;
4. comandă ramburs marcată `TEST`, verificare Admin și email;
5. anularea comenzii și confirmarea revenirii stocului;
6. verificare vizuală desktop și mobil pe versiunea publicată;
7. opțional, o plată Stripe în modul test.

Aceste teste vor separa clar un defect de cod de o problemă de configurare
Netlify, Supabase, Resend sau Stripe.
