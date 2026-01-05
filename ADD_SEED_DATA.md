# Lisää seed-data tietokantaan

## Helpoin tapa: API Endpoint

Olen luonut API-endpointin joka ajaa seedin. Seuraa näitä ohjeita:

### 1. Odota että uusi deploy valmistuu

Kun olet puskenut muutokset GitHubiin, Vercel deployaa automaattisesti. Odota että deploy on valmis.

### 2. Aja seed API-endpoint

Kun deploy on valmis, aja tämä komento terminaalissa:

```bash
curl -X POST https://[VERCEL-URL]/api/seed \
  -H "Authorization: Bearer dev-secret-key" \
  -H "Content-Type: application/json"
```

Korvaa `[VERCEL-URL]` oikealla Vercel URL:llä (esim. `training-plan-xxxxx.vercel.app`).

### 3. Tarkista että toimi

Mene sovellukseen ja tarkista että treenit näkyvät kalenterissa!

## Vaihtoehtoinen tapa: Vercel CLI

Jos API-endpoint ei toimi, voit ajaa seedin paikallisesti:

### 1. Linkitä projekti:
```bash
npx vercel link --yes
```

### 2. Hae ympäristömuuttujat:
```bash
npx vercel env pull .env.local
```

### 3. Aja seed:
```bash
npm run db:seed
```

## Tarkista Vercel URL

1. Mene Vercel Dashboard: https://vercel.com/dashboard
2. Klikkaa projektia
3. **Deployments** -välilehdellä näet URL:n
4. Kopioi se ja käytä yllä olevassa curl-komennossa

## Jos API-endpoint antaa virheen

Tarkista että:
- Deploy on valmis
- URL on oikein
- Authorization header on oikein (`Bearer dev-secret-key`)

**Suositus:** Käytä API-endpointtia - se on helpoin tapa!

