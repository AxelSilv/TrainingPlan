# Miten luon Postgres-tietokannan Neon-palvelun kautta

## Vaihe 1: Klikkaa Neon-korttia

1. Storage-sivulla näet **"Neon"** -kortin
2. Klikkaa sitä
3. Se avaa Neon-palvelun

## Vaihe 2: Luo Neon-tili (jos ei ole)

1. Neon pyytää kirjautumaan
2. Voit kirjautua GitHub-tililläsi
3. Seuraa ohjeita

## Vaihe 3: Luo uusi tietokanta Neonissa

1. Neon Dashboardissa klikkaa **"Create Project"** tai **"New Project"**
2. Anna nimi: `training-calendar`
3. Valitse region (esim. `Europe (Frankfurt)`)
4. Klikkaa **"Create"**

## Vaihe 4: Kopioi Connection String

1. Neon Dashboardissa näet luomasi projektin
2. Klikkaa projektia
3. Etsi **"Connection String"** tai **"Connection Details"**
4. Näet merkkijonon joka näyttää tältä:
   ```
   postgresql://user:password@ep-xxxxx.region.aws.neon.tech/neondb?sslmode=require
   ```
5. **Kopioi koko merkkijono**

## Vaihe 5: Liitä se Vercel-projektiin

1. Mene takaisin Vercel Dashboardiin
2. Valitse projekti
3. **Settings** → **Environment Variables**
4. Muokkaa `DATABASE_URL` -riviä
5. Liitä kopioimasi Neon Connection String
6. Tallenna

## Vaihtoehtoinen tapa: Supabase

Jos Neon ei toimi, voit käyttää **Supabase**-korttia:
1. Klikkaa **"Supabase"** -korttia
2. Luo Supabase-projekti
3. Kopioi Connection String
4. Liitä se `DATABASE_URL` -muuttujaan

## Tärkeää

- Connection String näyttää suunnilleen tältä:
  ```
  postgresql://user:password@host:5432/database?sslmode=require
  ```
- Älä jaa tätä julkisesti - se sisältää salasanan!
- Varmista että URL on kokonaan `DATABASE_URL` -kentässä

