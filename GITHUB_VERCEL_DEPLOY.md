# 🚀 Deploy GitHub → Vercel

## Vaiheet:

### 1. Vercel Dashboard
1. Mene https://vercel.com/dashboard
2. Klikkaa **Add New...** → **Project**
3. **Import Git Repository**
4. Valitse **GitHub** ja anna lupa
5. Etsi ja valitse **AxelSilv/TrainingPlan**
6. Klikkaa **Import**

### 2. Konfiguroi projekti
Vercel tunnistaa Next.js:n automaattisesti. Tarkista:
- **Framework Preset**: Next.js (automaattinen)
- **Root Directory**: `./` (oletus)
- **Build Command**: `npm run build` (oletus)
- **Output Directory**: `.next` (oletus)

### 3. Luo Vercel Postgres
**ENNEN deployausta:**
1. Vercel Dashboard → **Storage** (vasemmalla)
2. **Create Database** → **Postgres**
3. Nimi: `training-calendar-db`
4. Region: `Frankfurt (fra1)`
5. Plan: **Hobby** (ilmainen)
6. Klikkaa **Create**

### 4. Yhdistä Postgres projektiin
1. **Storage** → Klikkaa `training-calendar-db`
2. **.env.local** -välilehti
3. Kopioi `POSTGRES_URL` arvo
4. Mene takaisin projektiin → **Settings** → **Environment Variables**
5. Lisää uusi muuttuja:
   - **Name**: `DATABASE_URL`
   - **Value**: Liitä `POSTGRES_URL` arvo
   - **Environment**: Production, Preview, Development (valitse kaikki)
6. **Save**

### 5. Deploy
1. Projekti → **Deployments**
2. Klikkaa viimeisintä deploymentia
3. **Redeploy** (jos tarvitsee)
4. Tai Vercel deployaa automaattisesti kun painat **Deploy** ensimmäisellä kerralla

### 6. Aja tietokanta-migraatiot
Kun deploy on valmis:
1. Vercel Dashboard → Projekti → **Deployments**
2. Klikkaa viimeisintä deploymentia
3. **Functions** -välilehti → **View Function Logs**
4. Tai käytä Vercel CLI:

```bash
vercel env pull .env.local
npx prisma migrate deploy
```

**Tai käytä Vercel Dashboardin Terminal:**
1. Projekti → **Deployments** → Viimeisin deployment
2. **Settings** → **Functions** → **Terminal** (jos saatavilla)
3. Tai käytä paikallista CLI:tä yllä olevilla komennoilla

### 7. Seed-tietokanta (vapaaehtoinen)
```bash
vercel env pull .env.local
npm run db:seed
```

### 8. Automaattinen deploy
Nyt jokainen push GitHubiin deployaa automaattisesti Verceliin! 🎉

## Mobiilikäyttö

Kun deploy on valmis:
1. Vercel antaa URL:n (esim. `training-plan.vercel.app`)
2. Avaa iPhone Safari → Mene URL:aan
3. **Jaa** → **Lisää kotinäytölle**
4. Valmis! Toimii nyt missä tahansa, myös mobiilidatalla

## Tulevat päivitykset

1. Tee muutokset koodiin
2. `git add .`
3. `git commit -m "Your message"`
4. `git push`
5. Vercel deployaa automaattisesti! ✨

## Ongelmatilanteet

**"Prisma Client not generated"**
- Tarkista että `postinstall` script on package.json:ssa (jo lisätty)

**"Migration failed"**
- Tarkista että `DATABASE_URL` on oikein Environment Variables -osiossa
- Aja migraatiot manuaalisesti: `npx prisma migrate deploy`

**"Database connection error"**
- Tarkista että Postgres on luotu ja yhdistetty projektiin
- Tarkista että `DATABASE_URL` on oikein

**"Build failed"**
- Tarkista Vercel Dashboard → Deployments → Build Logs
- Varmista että kaikki riippuvuudet on package.json:ssa

