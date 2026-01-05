# ⚠️ TÄRKEÄ: Aja migraatiot nyt!

Build onnistui, mutta sovellus ei toimi koska tietokantatauluja ei ole vielä luotu.

## Nopeat ohjeet:

### 1. Asenna Vercel CLI (jos ei ole):
```bash
npm install -g vercel
```

### 2. Kirjaudu sisään:
```bash
vercel login
```

### 3. Hae ympäristömuuttujat:
```bash
cd /Users/axelsilvast/Documents/CursorProjektit
vercel env pull .env.local
```

### 4. Aja migraatiot:
```bash
npx prisma migrate deploy
```

### 5. (Vapaaehtoinen) Täytä tietokanta alkuperäisellä datalla:
```bash
npm run db:seed
```

## Jos Vercel CLI ei toimi:

1. Tarkista että `DATABASE_URL` on oikein Vercel Dashboardissa
2. Odota että uusi deploy valmistuu (migraatiotiedosto on nyt GitHubissa)
3. Kokeile sovellusta uudelleen

**HUOM:** Migraatiot eivät aja automaattisesti Vercelissä. Ne pitää ajaa manuaalisesti CLI:llä.

## Tarkista että toimi:

Kun olet ajanut migraatiot, mene sovellukseen (Vercel antaa URL:n) ja tarkista että se toimii!

