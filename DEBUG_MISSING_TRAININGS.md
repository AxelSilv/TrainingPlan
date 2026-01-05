# Miksi treenit eivät näy?

## Ongelma

Seed ajettiin Neon-tietokantaan, mutta treenit eivät näy Vercel-sovelluksessa.

## Mahdolliset syyt:

### 1. DATABASE_URL ei ole oikein Vercelissä

Vercel-sovellus käyttää DATABASE_URL:ia Environment Variables -osiosta. Jos se on eri kuin mihin seed ajettiin, treenit eivät näy.

**Tarkista:**
1. Vercel Dashboard → Projekti → Settings → Environment Variables
2. Tarkista että `DATABASE_URL` on sama kuin mihin seed ajettiin
3. Connection String pitäisi olla: `postgresql://neondb_owner:npg_6CZhvAVLJzQ4@ep-mute-mountain-ag71bklk-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`

### 2. Tietokantayhteys ei toimi

Tarkista konsolissa onko tietokantavirheitä:
- F12 → Console
- Etsi virheitä jotka liittyvät "database", "prisma", tai "connection"

### 3. API-reitit eivät toimi

Tarkista Network-välilehti:
- F12 → Network
- Päivitä sivu
- Etsi `/api/calendar/week` -pyyntö
- Tarkista onko se onnistunut (200) vai epäonnistunut (500, 401, jne.)

## Ratkaisu:

### Vaihe 1: Tarkista DATABASE_URL Vercelissä

1. Mene Vercel Dashboard: https://vercel.com/dashboard
2. Klikkaa projektia
3. Settings → Environment Variables
4. Tarkista että `DATABASE_URL` on:
   ```
   postgresql://neondb_owner:npg_6CZhvAVLJzQ4@ep-mute-mountain-ag71bklk-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   ```
5. Jos se on eri, muokkaa se oikeaksi
6. Klikkaa **"Redeploy"** viimeisimmästä deploymentista

### Vaihe 2: Tarkista Network-välilehti

1. F12 → Network
2. Päivitä sivu
3. Etsi `/api/calendar/week` -pyyntö
4. Klikkaa sitä ja tarkista:
   - **Status**: Pitäisi olla 200 (onnistunut)
   - **Response**: Pitäisi näkyä JSON-dataa
   - Jos status on 500 tai muu, siellä on virhe

### Vaihe 3: Tarkista konsoli

1. F12 → Console
2. Etsi virheitä jotka liittyvät tietokantaan
3. Jos näet "PrismaClientInitializationError", DATABASE_URL on väärä

## Nopea testi:

Voit testata tietokantayhteyttä suoraan:

1. Mene sovellukseen
2. F12 → Console
3. Kirjoita: `fetch('/api/calendar/week?weekStart=2026-01-02&weekEnd=2026-01-08').then(r => r.json()).then(console.log)`
4. Tarkista mitä tulee - jos näet dataa, yhteys toimii

