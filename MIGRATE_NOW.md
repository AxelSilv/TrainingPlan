# ⚠️ TÄRKEÄ: Aja migraatiot nyt!

## Vaihtoehto 1: Vercel Dashboard (Helpoin)

1. Mene Vercel Dashboard → Projekti → **Deployments**
2. Klikkaa viimeisintä deploymentia
3. Klikkaa **"Functions"** -välilehteä
4. Etsi **"View Function Logs"** tai **"Terminal"**
5. Jos Terminal on saatavilla, aja:
   ```bash
   npx prisma migrate deploy
   ```

**HUOM:** Vercel Dashboard ei aina tarjoa Terminalia. Jos et näe sitä, käytä Vaihtoehto 2.

## Vaihtoehto 2: Vercel CLI (Jos linkitys onnistuu)

### 1. Linkitä projekti:
```bash
npx vercel link --yes
```
Valitse oikea projekti kun kysytään.

### 2. Hae ympäristömuuttujat:
```bash
npx vercel env pull .env.local
```

### 3. Aja migraatiot:
```bash
npx prisma migrate deploy
```

### 4. (Vapaaehtoinen) Täytä tietokanta:
```bash
npm run db:seed
```

## Vaihtoehto 3: Neon Dashboard (Suoraan tietokantaan)

1. Mene Neon Dashboardiin
2. Valitse projektisi
3. Klikkaa **"SQL Editor"** -välilehteä
4. Kopioi migraatiotiedoston sisältö: `prisma/migrations/20260102230000_init/migration.sql`
5. Liitä se SQL Editoriin ja klikkaa **"Run"**

Tämä luo kaikki tietokantataulut suoraan!

## Tarkista että toimi:

Kun olet ajanut migraatiot, mene sovellukseen (Vercel antaa URL:n) ja tarkista että se toimii!

**Suositus:** Käytä Vaihtoehto 3 (Neon Dashboard) - se on nopein ja helpoin tapa!

