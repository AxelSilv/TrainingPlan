# Mobile Setup - iPhone

## Vaihtoehto 1: PWA (Progressive Web App) - Paras kokemus

### Asennus iPhone:lla:

1. **Avaa sovellus selaimessa:**
   - Varmista että puhelin ja tietokone ovat samassa WiFi-verkossa
   - Tietokoneen IP-osoite: `ifconfig | grep "inet " | grep -v 127.0.0.1`
   - Avaa puhelimen Safari: `http://[Tietokoneen-IP]:3000`
   - Esim: `http://192.168.1.100:3000`

2. **Lisää kotinäytölle:**
   - Safari → Jaa-nappi (neliö nuolella ylös)
   - "Lisää kotinäytölle"
   - Nimi: "Training Calendar"
   - Valmis! Sovellus toimii nyt kuin natiivi appi

### Tärkeää:
- Sovellus toimii offline-tilassa (tietokanta on SQLite, joten se on lokaali)
- Voit käyttää sitä ilman selainpalkkia (standalone mode)
- Toimii kuin natiivi sovellus

## Vaihtoehto 2: Julkinen deploy (Vercel/Netlify)

Jos haluat käyttää sitä missä tahansa ilman samaa WiFi-verkkoa:

1. **Deploy Verceliin:**
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Tai käytä ngrok testaamiseen:**
   ```bash
   npx ngrok http 3000
   ```
   Käytä ngrokin antamaa URL:ia puhelimessa

## Vaihtoehto 3: Suora selain (ei PWA)

Voit käyttää sovellusta suoraan Safari:ssa ilman asennusta:
- Avaa `http://[IP]:3000` Safari:ssa
- Toimii normaalisti, mutta ei standalone-tilassa

## Suositus

**PWA (Vaihtoehto 1)** on paras kokemus:
- Toimii kuin natiivi appi
- Ei selainpalkkia
- Nopea käyttö
- Offline-tuki

