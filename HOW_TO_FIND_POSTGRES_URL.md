# Mistä löydän Postgres URL:n Vercelissä?

## Vaihe 1: Mene Storage-osioon

1. Avaa Vercel Dashboard: https://vercel.com/dashboard
2. Vasemmalla puolella on **"Storage"** -linkki (tai ikoni)
3. Klikkaa sitä

## Vaihe 2: Valitse Postgres-tietokanta

1. Näet listan tietokannoista
2. Jos et ole vielä luonut Postgres-tietokantaa:
   - Klikkaa **"Create Database"**
   - Valitse **"Postgres"**
   - Anna nimi: `training-calendar-db`
   - Region: `Frankfurt (fra1)`
   - Plan: **Hobby** (ilmainen)
   - Klikkaa **"Create"**

3. Jos tietokanta on jo olemassa:
   - Klikkaa tietokantaa (esim. `training-calendar-db`)

## Vaihe 3: Kopioi POSTGRES_URL

1. Tietokannan sivulla näet useita välilehtiä
2. Klikkaa **".env.local"** -välilehteä
3. Näet muuttujia, esim:
   ```
   POSTGRES_URL="postgresql://user:password@host:5432/database?sslmode=require"
   ```
4. **Kopioi koko arvo** (koko merkkijono lainausmerkeillä tai ilman)
5. Tämä on se URL jonka tarvitset!

## Vaihe 4: Liitä se projektiin

1. Mene takaisin projektiin (Vercel Dashboard → Projekti)
2. **Settings** → **Environment Variables**
3. Etsi `DATABASE_URL` rivi
4. Klikkaa **Edit** (tai muokkaa arvoa)
5. **Liitä** kopioimasi POSTGRES_URL arvo
6. Tallenna

## Vaihtoehtoinen tapa (jos et näe .env.local -välilehteä)

1. Tietokannan sivulla näet **"Connection String"** tai **"URL"** -kentän
2. Kopioi se sieltä
3. Liitä se `DATABASE_URL` -muuttujaan

## Tärkeää

- URL näyttää suunnilleen tältä:
  ```
  postgresql://default:xxxxx@ep-xxxxx.region.aws.neon.tech:5432/verceldb?sslmode=require
  ```
- Älä jaa tätä URL:ia julkisesti - se sisältää salasanan!
- Varmista että URL on kokonaan `DATABASE_URL` -kentässä

