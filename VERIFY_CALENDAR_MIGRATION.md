# Tarkista Calendar-migraatio

## Migraation tila

Migraatio näyttää toimivan oikein - se skipaa jo olemassa olevat objektit. Tarkista että seuraavat objektit on luotu:

### 1. Tarkista Neon SQL Editorissa:

```sql
-- Tarkista että calendars-taulut on olemassa
SELECT * FROM calendars LIMIT 1;

-- Tarkista että calendarId-sarake on day_plans-taulussa
SELECT calendarId FROM day_plans LIMIT 1;

-- Tarkista että indeksit on olemassa
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('calendars', 'day_plans') 
AND indexname LIKE '%calendar%';
```

### 2. Jos kaikki on olemassa, migraatio on valmis!

Varoitukset ovat normaaleja - ne tarkoittavat että objektit on jo luotu aiemmin, mikä on hyvä asia.

### 3. Jos jotain puuttuu, aja puuttuvat osat:

```sql
-- Jos calendars-taulu puuttuu:
CREATE TABLE IF NOT EXISTS "calendars" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "goals" TEXT,
    "activities" TEXT,
    "frequency" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "calendars_pkey" PRIMARY KEY ("id")
);

-- Jos foreign key puuttuu:
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'calendars_userId_fkey'
    ) THEN
        ALTER TABLE "calendars" ADD CONSTRAINT "calendars_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Jos calendarId-sarake puuttuu:
ALTER TABLE "day_plans" ADD COLUMN IF NOT EXISTS "calendarId" TEXT;

-- Jos foreign key puuttuu:
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'day_plans_calendarId_fkey'
    ) THEN
        ALTER TABLE "day_plans" ADD CONSTRAINT "day_plans_calendarId_fkey" 
        FOREIGN KEY ("calendarId") REFERENCES "calendars"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Indeksit:
CREATE INDEX IF NOT EXISTS "calendars_userId_idx" ON "calendars"("userId");
CREATE INDEX IF NOT EXISTS "day_plans_calendarId_idx" ON "day_plans"("calendarId");
CREATE UNIQUE INDEX IF NOT EXISTS "day_plans_userId_date_calendarId_key" ON "day_plans"("userId", "date", "calendarId");
```

## Seuraavat askeleet

1. Tarkista että kaikki objektit on olemassa (käytä yllä olevia SQL-komentoja)
2. Jos kaikki on olemassa, migraatio on valmis!
3. Testaa sovellusta: klikkaa "New Calendar" -nappia ja kokeile AI Chatia

