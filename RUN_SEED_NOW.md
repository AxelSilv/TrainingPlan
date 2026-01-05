# Aja seed nyt!

## Vaihe 1: Luo .env.local tiedosto

Aja tämä komento Cursorin terminaalissa (korvaa `[CONNECTION_STRING]` kopioimallasi Connection Stringillä):

```bash
echo 'DATABASE_URL="[LIITÄ KOPIOIMASI CONNECTION STRING TÄHÄN]"' > .env.local
```

**Esimerkki:**
```bash
echo 'DATABASE_URL="postgresql://user:password@ep-xxxxx.region.aws.neon.tech/neondb?sslmode=require"' > .env.local
```

## Vaihe 2: Aja seed

```bash
npm run db:seed
```

Tämä täyttää Neon-tietokannan kaikilla treeneillä (2.1.2026 - 20.7.2026)!

## Vaihe 3: Tarkista että toimi

1. Mene sovellukseen (Vercel URL)
2. Tarkista että treenit näkyvät kalenterissa

## Jos tulee virheitä:

- Tarkista että Connection String on oikein (alkaa `postgresql://...`)
- Tarkista että tietokanta on aktiivinen Neonissa
- Tarkista että migraatiot on ajettu (ne pitäisi olla jo ajettu)

