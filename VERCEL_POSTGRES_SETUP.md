# Tarkat ohjeet: POSTGRES_URL Verceliin

## Vaihe 1: Kopioi POSTGRES_URL

1. Neon Dashboardissa (tai missä palvelussa olet)
2. Etsi **"Connection String"** tai **"POSTGRES_URL"**
3. Kopioi **KOKO merkkijono** (alkaa `postgresql://...`)
4. Älä kopioi vain osaa - tarvitset koko URL:n!

Esimerkki oikeasta URL:sta:
```
postgresql://user:password@ep-xxxxx.region.aws.neon.tech/neondb?sslmode=require
```

## Vaihe 2: Mene Vercel-projektiin

1. Avaa Vercel Dashboard: https://vercel.com/dashboard
2. Klikkaa projektia (esim. `training-plan` tai `TrainingPlan`)

## Vaihe 3: Mene Environment Variables -osiin

1. Projektin sivulla klikkaa **"Settings"** (yläpalkissa)
2. Vasemmalla puolella on lista, klikkaa **"Environment Variables"**

## Vaihe 4: Muokkaa DATABASE_URL

1. Etsi `DATABASE_URL` -rivi listasta
2. Jos se on jo olemassa:
   - Klikkaa **Edit**-nappia (tai riviä)
   - Poista vanha arvo (esim. `POSTGRES_URL`)
   - Liitä kopioimasi POSTGRES_URL -arvo
   - Tallenna

3. Jos sitä ei ole:
   - Klikkaa **"Add New"** tai **"+"** -nappia
   - **Key**: Kirjoita `DATABASE_URL`
   - **Value**: Liitä kopioimasi POSTGRES_URL -arvo
   - Valitse ympäristöt: ☑ Production, ☑ Preview, ☑ Development
   - Klikkaa **"Save"**

## Vaihe 5: Tarkista

1. Varmista että `DATABASE_URL` -rivi näyttää tältä:
   ```
   Key: DATABASE_URL
   Value: postgresql://user:password@host:5432/database?sslmode=require
   ```
2. Varmista että kaikki ympäristöt on valittu (Production, Preview, Development)

## Vaihe 6: Deploy

1. Mene takaisin projektin pääsivulle
2. Klikkaa **"Deployments"** -välilehteä
3. Klikkaa **"Redeploy"** viimeisimmästä deploymentista
   - Tai odota että automaattinen deploy käynnistyy (jos GitHub-integraatio on päällä)

## Vaihe 7: Aja tietokanta-migraatiot

Kun deploy on valmis:

1. Asenna Vercel CLI (jos ei ole):
   ```bash
   npm install -g vercel
   ```

2. Hae ympäristömuuttujat:
   ```bash
   vercel env pull .env.local
   ```

3. Aja migraatiot:
   ```bash
   npx prisma migrate deploy
   ```

4. (Vapaaehtoinen) Täytä tietokanta alkuperäisellä datalla:
   ```bash
   npm run db:seed
   ```

## Ongelmatilanteet

**"Environment variable not found: DATABASE_URL"**
- Tarkista että `DATABASE_URL` on oikein Environment Variables -osiossa
- Varmista että kaikki ympäristöt on valittu

**"Connection refused"**
- Tarkista että POSTGRES_URL on oikein kopioitu (ei puuttuvia merkkejä)
- Tarkista että tietokanta on aktiivinen Neonissa

**"Migration failed"**
- Aja `vercel env pull .env.local` ensin
- Tarkista että Prisma Client on generoitu: `npx prisma generate`

