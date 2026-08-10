# V1.15.1 — Corecții teme, colecții și layout

Această actualizare se aplică peste V1.15 și nu modifică datele din Supabase.

## Instalare

1. Copiază în rădăcina repository-ului folderele și fișierele din arhivă.
2. Acceptă înlocuirea fișierelor existente.
3. Rulează:

```bash
git add .
git commit -m "fix: sync themes collections and account layout"
git push
```

Nu sunt necesare migrări SQL sau variabile Netlify noi.

## Test rapid după deploy

1. Alege pe rând o temă din Admin (de exemplu Standard, Primăvară și Iarnă).
2. Verifică fundalul coșului lateral, checkoutul, pagina Povestea noastră și cardul de bun venit din Cont.
3. Din meniul Colecții, deschide 8 Martie, apoi Valentine’s Day fără să părăsești pagina Lumânări.
4. Confirmă că URL-ul și eticheta „Temă” se actualizează de fiecare dată.
5. Pentru o colecție fără produse, confirmă mesajul „Colecția ... este în pregătire”.
6. Verifică în Cont că rolul și butoanele sunt așezate vertical.
7. Verifică în Admin că „Vezi magazinul” și „Ieșire din cont” apar pe rânduri separate.

## Fișiere modificate

- `app/components/catalog-browser.tsx`
- `app/lumanari/page.tsx`
- `app/globals.css`
- `package.json`
- `package-lock.json`
