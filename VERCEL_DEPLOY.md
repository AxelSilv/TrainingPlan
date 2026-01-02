# Vercel Deploy - Ohjeet

## 1. Vercel-tili ja CLI

Asenna Vercel CLI:
```bash
npm install -g vercel
```

Kirjaudu sisään:
```bash
vercel login
```

## 2. Luo Vercel Postgres -tietokanta

1. Mene [Vercel Dashboard](https://vercel.com/dashboard)
2. Valitse projekti (tai luo uusi)
3. Mene **Storage** -välilehteen
4. Klikkaa **Create Database** → **Postgres**
5. Valitse:
   - **Name**: `training-calendar-db`
   - **Region**: `Frankfurt (fra1)` (lähin Suomeen)
   - **Plan**: Hobby (ilmainen)

## 3. Yhdistä tietokanta projektiin

1. Vercel Dashboard → Projekti → **Storage**
2. Klikkaa luomaasi Postgres-tietokantaa
3. Klikkaa **.env.local** -välilehteä
4. Kopioi `POSTGRES_URL` -muuttuja
5. Lisää se Vercel-projektin **Environment Variables** -osiossa nimellä `DATABASE_URL`

Tai käytä Vercel CLI:tä:
```bash
vercel env add DATABASE_URL
# Liitä POSTGRES_URL arvo kun kysytään
```

## 4. Deploy

### Ensimmäinen deploy:
```bash
vercel
```

Seuraa ohjeita:
- Linkitä olemassa oleva projekti? **N**
- Projektin nimi? **training-calendar** (tai haluamasi)
- Minkä hakemiston deployata? **./** (nykyinen)
- Override settings? **N**

### Tulevat deployt:
```bash
vercel --prod
```

## 5. Tietokanta-migraatiot

Kun deploy on valmis, aja migraatiot:
```bash
vercel env pull .env.local  # Hae ympäristömuuttujat
npx prisma migrate deploy   # Aja migraatiot
```

Tai käytä Vercel Dashboardin **Deployments** -välilehteä ja aja komento deployauksen yhteydessä.

## 6. Seed-tietokanta (vapaaehtoinen)

Jos haluat täyttää tietokannan alkuperäisellä datalla:
```bash
vercel env pull .env.local
npm run db:seed
```

## 7. Päivitä Prisma Client

Jos muutat Prisma-schemaa:
```bash
npx prisma migrate dev --name your_migration_name
git add .
git commit -m "Database migration"
vercel --prod
```

## 8. Mobiilikäyttö

Kun deploy on valmis:
1. Vercel antaa sinulle URL:n (esim. `training-calendar.vercel.app`)
2. Avaa se iPhone Safari:ssa
3. Lisää kotinäytölle (Jaa → Lisää kotinäytölle)
4. Valmis! Toimii nyt missä tahansa, myös mobiilidatalla

## Vinkit

- **Automaattinen deploy**: Yhdistä GitHub-repo Verceliin → automaattinen deploy jokaisesta pushista
- **Environment variables**: Vercel asettaa `DATABASE_URL` automaattisesti jos Postgres on yhdistetty projektiin
- **Build errors**: Tarkista Vercel Dashboard → Deployments → Build Logs

## Ongelmatilanteet

**"Prisma Client not generated"**
- Lisää `"postinstall": "prisma generate"` package.json:ään (jo lisätty)

**"Migration failed"**
- Tarkista että `DATABASE_URL` on oikein Vercel Dashboardissa
- Aja `vercel env pull .env.local` ja testaa paikallisesti

**"Database connection error"**
- Tarkista että Postgres on luotu ja yhdistetty projektiin
- Tarkista että `DATABASE_URL` on oikein Environment Variables -osiossa

