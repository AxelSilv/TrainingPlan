# Lisää seed-data Neon Dashboardin kautta

Koska Vercel vaatii autentikoinnin, helpoin tapa on ajaa seed Neon Dashboardissa.

## Vaihe 1: Mene Neon Dashboardiin

1. Avaa Neon Dashboard (missä luoit tietokannan)
2. Valitse projektisi
3. Klikkaa **"SQL Editor"** -välilehteä

## Vaihe 2: Aja seed paikallisesti (Suositeltu)

Koska seed.ts käyttää TypeScriptia ja Prisma Clientia, helpoin tapa on ajaa se paikallisesti käyttäen Neon-tietokantaa:

### 1. Hae DATABASE_URL Neonista:

1. Neon Dashboard → Projekti → **Connection Details**
2. Kopioi **Connection String** (alkaa `postgresql://...`)

### 2. Luo .env.local tiedosto:

```bash
echo 'DATABASE_URL="[LIITÄ KOPIOIMASI CONNECTION STRING TÄHÄN]"' > .env.local
```

### 3. Aja seed:

```bash
npm run db:seed
```

Tämä täyttää tietokannan kaikilla treeneillä!

## Vaihtoehtoinen tapa: API-endpoint ilman suojelua

Voimme myös poistaa deployment protection API-endpointista, mutta se ei ole turvallista. Parempi on käyttää yllä olevaa tapaa.

**Suositus:** Käytä paikallista seed-ajoa Neon-tietokantaan - se on helpoin ja turvallisin tapa!

