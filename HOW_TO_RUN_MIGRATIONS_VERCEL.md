# Miten ajat tietokanta-migraatiot Vercelissä

## Ongelma
Build onnistui, mutta sovellus antaa virheen: "Application error: a server-side exception has occurred"

Tämä tarkoittaa että tietokanta-migraatiot eivät ole vielä ajettu.

## Ratkaisu: Aja migraatiot Vercelissä

### Vaihtoehto 1: Vercel CLI (Suositus)

1. Asenna Vercel CLI (jos ei ole):
   ```bash
   npm install -g vercel
   ```

2. Kirjaudu sisään:
   ```bash
   vercel login
   ```

3. Hae ympäristömuuttujat:
   ```bash
   vercel env pull .env.local
   ```

4. Aja migraatiot:
   ```bash
   npx prisma migrate deploy
   ```

5. (Vapaaehtoinen) Täytä tietokanta alkuperäisellä datalla:
   ```bash
   npm run db:seed
   ```

### Vaihtoehto 2: Vercel Dashboard (Jos CLI ei toimi)

1. Mene Vercel Dashboard → Projekti → **Deployments**
2. Klikkaa viimeisintä deploymentia
3. Etsi **"Functions"** tai **"Logs"** -välilehti
4. Tarkista virhelokit

**HUOM:** Vercel Dashboard ei suoraan aja migraatioita. Paras tapa on käyttää CLI:tä.

### Vaihtoehto 3: Post-deploy hook (Automaattinen)

Voimme lisätä post-deploy hookin joka ajaa migraatiot automaattisesti. Tämä vaatii `package.json` -muutoksen:

```json
{
  "scripts": {
    "postdeploy": "prisma migrate deploy"
  }
}
```

Mutta tämä ei toimi Vercelissä suoraan. Paras tapa on käyttää CLI:tä.

## Tarkista että migraatiot onnistuivat

Kun olet ajanut migraatiot, tarkista:

1. Mene Vercel Dashboard → Projekti → **Deployments**
2. Klikkaa viimeisintä deploymentia
3. Klikkaa sovellusta (URL)
4. Jos kaikki on oikein, sovellus pitäisi toimia!

## Jos migraatiot epäonnistuvat

1. Tarkista että `DATABASE_URL` on oikein Environment Variables -osiossa
2. Tarkista että tietokanta on aktiivinen Neonissa
3. Tarkista virhelokit: `vercel logs`

