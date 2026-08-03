# Ținta Supabase

Acest director conține baza completă pentru publicarea pe Netlify. Migrarea SQL
creează datele magazinului, operațiunile tranzacționale pentru stoc, lista
administratorilor și bucketul fotografiilor.

Migrarea nu se aplică automat în versiunea găzduită curent. La transfer:

1. se creează proiectul Supabase al proprietarului;
2. se rulează migrarea din `migrations`;
3. se adaugă emailul administratorului în `public.admin_users`;
4. se configurează variabilele din `.env.example`;
5. backupul JSON din Admin este importat direct din secțiunea Infrastructură;
6. se testează catalogul, stocul și o comandă înainte de schimbarea adresei.

Adaptorul runtime selectează automat Supabase când variabilele lui sunt
configurate. Fără ele, versiunea publicată prin Sites continuă să folosească
D1 și R2, astfel încât aceeași sursă rămâne portabilă.

Cheia `SUPABASE_SERVICE_ROLE_KEY` se folosește exclusiv pe server și nu trebuie
expusă niciodată în codul trimis browserului.
