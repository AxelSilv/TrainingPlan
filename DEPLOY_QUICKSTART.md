# 🚀 Nopea Deploy Verceliin

## Vaiheet:

### 1. Asenna Vercel CLI
```bash
npm install -g vercel
vercel login
```

### 2. Luo Vercel Postgres
1. Mene https://vercel.com/dashboard
2. **Storage** → **Create Database** → **Postgres**
3. Nimi: `training-calendar-db`
4. Region: `Frankfurt (fra1)`
5. Plan: **Hobby** (ilmainen)

### 3. Deploy
```bash
vercel
```

Vastaa:
- Link existing? **N**
- Project name: **training-calendar**
- Directory: **./**

### 4. Yhdistä Postgres projektiin
1. Vercel Dashboard → Projekti → **Storage**
2. Klikkaa `training-calendar-db`
3. **.env.local** -välilehti → kopioi `POSTGRES_URL`
4. Projekti → **Settings** → **Environment Variables**
5. Lisää: `DATABASE_URL` = `POSTGRES_URL` arvo

### 5. Aja migraatiot
```bash
vercel env pull .env.local
npx prisma migrate deploy
```

### 6. Seed (vapaaehtoinen)
```bash
npm run db:seed
```

### 7. Valmis! 🎉
- Vercel antaa URL:n (esim. `training-calendar.vercel.app`)
- Avaa iPhone Safari → Lisää kotinäytölle
- Toimii nyt missä tahansa!

## Tulevat päivitykset:
```bash
vercel --prod
```

