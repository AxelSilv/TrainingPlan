# Lisää seed-data tietokantaan

## Vaihtoehto 1: Neon Dashboard (Helpoin)

1. Mene Neon Dashboardiin
2. Valitse projektisi
3. Klikkaa **"SQL Editor"** -välilehteä
4. Avaa tiedosto: `prisma/seed.ts`
5. Kopioi seed-koodi ja muunna se SQL:ksi, TAI
6. Käytä Prisma Studioa paikallisesti ja kopioi data

**HUOM:** Tämä on hankalaa, koska seed.ts käyttää TypeScriptia. Parempi tapa on Vaihtoehto 2.

## Vaihtoehto 2: Vercel CLI (Suositeltu)

### 1. Linkitä projekti (jos ei ole linkitetty):
```bash
npx vercel link --yes
```
Valitse oikea projekti kun kysytään.

### 2. Hae ympäristömuuttujat:
```bash
npx vercel env pull .env.local
```

### 3. Aja seed:
```bash
npm run db:seed
```

## Vaihtoehto 3: API Endpoint (Automaattinen)

Voimme luoda API-endpointin joka ajaa seedin. Tämä on helppoa, mutta vaatii koodimuutoksen.

## Vaihtoehto 4: Prisma Studio (Visuaalinen)

1. Hae ympäristömuuttujat:
   ```bash
   npx vercel env pull .env.local
   ```

2. Avaa Prisma Studio:
   ```bash
   npm run db:studio
   ```

3. Lisää data manuaalisesti Prisma Studion kautta

**Suositus:** Käytä Vaihtoehto 2 (Vercel CLI) - se on nopein tapa!

