# Testaa sovellus nyt!

## Vaihe 1: Löydä Vercel URL

1. Mene Vercel Dashboard: https://vercel.com/dashboard
2. Klikkaa projektia (esim. `training-plan` tai `TrainingPlan`)
3. **Deployments** -välilehdellä näet viimeisimmän deploymentin
4. Klikkaa deploymentia → Näet **"Visit"** -napin tai URL:n
5. URL näyttää suunnilleen: `https://training-plan-xxxxx.vercel.app`

## Vaihe 2: Testaa sovellus

1. Klikkaa URL:aa tai **"Visit"** -nappia
2. Sovelluksen pitäisi avautua
3. Tarkista:
   - ✅ Kalenteri näkyy
   - ✅ Voit navigoida eri viikkoihin
   - ✅ Dashboard-sivu toimii
   - ✅ Settings-sivu toimii
   - ✅ Nutrition-sivu toimii

## Vaihe 3: Jos näet virheen

### "Application error: a server-side exception has occurred"

Tämä tarkoittaa että:
- Migraatiot eivät ole vielä ajettu, TAI
- DATABASE_URL ei ole oikein

**Ratkaisu:**
1. Tarkista että migraatiot on ajettu Neonissa (jos et ole vielä tehnyt sitä)
2. Tarkista Vercel Dashboard → Settings → Environment Variables → `DATABASE_URL` on oikein
3. Klikkaa **"Redeploy"** viimeisimmästä deploymentista

### "PrismaClientInitializationError"

Tämä tarkoittaa että DATABASE_URL puuttuu tai on väärä.

**Ratkaisu:**
1. Vercel Dashboard → Settings → Environment Variables
2. Tarkista että `DATABASE_URL` on oikein
3. Varmista että kaikki ympäristöt on valittu (Production, Preview, Development)
4. Klikkaa **"Redeploy"**

## Vaihe 4: Jos kaikki toimii! 🎉

1. Kopioi URL (esim. `https://training-plan-xxxxx.vercel.app`)
2. Avaa se iPhone Safari:ssa
3. **Jaa** → **Lisää kotinäytölle**
4. Valmis! Toimii nyt missä tahansa, myös mobiilidatalla!

## Tarkista myös:

- Vercel Dashboard → Deployments → Viimeisin deployment → **"Functions"** -välilehti
- Tarkista että ei ole punaisia virheitä
- Jos on virheitä, ne näkyvät siellä

