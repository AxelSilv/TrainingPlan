# Autentikoinnin asennusohjeet

## ✅ Tehty jo:
- NextAuth ja paketit asennettu
- Prisma schema päivitetty
- API-reitit päivitetty käyttämään userId:tä
- Migraatio luotu ja ajettu Neonissa
- Kirjautumis- ja rekisteröintisivut luotu

## 🔧 Mitä pitää tehdä manuaalisesti:

### 1. Lisää NEXTAUTH_SECRET Verceliin

NextAuth tarvitsee salaisen avaimen session-hallintaan.

**Vaihe 1: Luo salainen avain**

Aja tämä komento paikallisesti (tai käytä mitä tahansa satunnaista merkkijonoa):

```bash
openssl rand -base64 32
```

Tai käytä online-generaattoria: https://generate-secret.vercel.app/32

**Vaihe 2: Lisää se Verceliin**

1. Mene Vercel Dashboard: https://vercel.com/dashboard
2. Klikkaa projektia
3. **Settings** → **Environment Variables**
4. Klikkaa **"Add New"**
5. Täytä:
   - **Key**: `NEXTAUTH_SECRET`
   - **Value**: Liitä generoimasi salainen avain
   - **Environment**: ☑ Production, ☑ Preview, ☑ Development
6. Klikkaa **"Save"**

**Vaihe 3: Lisää NEXTAUTH_URL (vapaaehtoinen, mutta suositeltu)**

1. Samassa Environment Variables -osiossa
2. Klikkaa **"Add New"**
3. Täytä:
   - **Key**: `NEXTAUTH_URL`
   - **Value**: `https://your-app-name.vercel.app` (korvaa oikealla Vercel-URL:llä)
   - **Environment**: ☑ Production
   - Preview ja Development: `http://localhost:3000`
4. Klikkaa **"Save"**

### 2. Redeploy Vercelissä

1. Mene projektiin Vercel Dashboardissa
2. **Deployments** -välilehti
3. Klikkaa viimeisintä deploymentia
4. Klikkaa **"Redeploy"**
5. Odota että deploy valmistuu

### 3. Testaa autentikointi

1. Mene sovellukseen (Vercel URL)
2. Sinun pitäisi nähdä kirjautumissivu (`/auth/signin`)
3. Klikkaa **"Sign up"** -linkkiä
4. Luo uusi käyttäjätili:
   - Nimi
   - Email
   - Salasana (vähintään 8 merkkiä)
5. Sinun pitäisi kirjautua automaattisesti sisään
6. Tarkista että kalenteri näkyy

## 📝 Huomioita:

- **Olemassa oleva data**: Jos sinulla on jo dataa tietokannassa (esim. seed-ajettu), se on liitetty "default-user" -käyttäjään migraatiossa
- **Uudet käyttäjät**: Jokainen uusi käyttäjä saa oman tyhjän kalenterin
- **Remember me**: "Remember me" -toiminto pidennetään session-aikaa 1 vuoteen

## 🐛 Jos tulee ongelmia:

### "Invalid credentials"
- Tarkista että NEXTAUTH_SECRET on lisätty Verceliin
- Tarkista että redeploy on tehty

### "Unauthorized" virheet
- Tarkista että middleware.ts on oikein
- Tarkista että NEXTAUTH_SECRET on oikein

### Tietokantavirheet
- Tarkista että migraatio on ajettu Neonissa
- Tarkista että DATABASE_URL on oikein Vercelissä

