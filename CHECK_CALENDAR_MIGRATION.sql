-- Tarkista että Calendar-migraatio on valmis
-- Aja tämä Neon SQL Editorissa

-- 1. Tarkista että calendars-taulu on olemassa
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'calendars')
        THEN '✅ calendars-taulu on olemassa'
        ELSE '❌ calendars-taulu puuttuu'
    END AS status;

-- 2. Tarkista että calendarId-sarake on day_plans-taulussa
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'day_plans' AND column_name = 'calendarId'
        )
        THEN '✅ calendarId-sarake on olemassa'
        ELSE '❌ calendarId-sarake puuttuu'
    END AS status;

-- 3. Tarkista että foreign key constraints on olemassa
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'calendars_userId_fkey'
        )
        THEN '✅ calendars_userId_fkey on olemassa'
        ELSE '❌ calendars_userId_fkey puuttuu'
    END AS status;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'day_plans_calendarId_fkey'
        )
        THEN '✅ day_plans_calendarId_fkey on olemassa'
        ELSE '❌ day_plans_calendarId_fkey puuttuu'
    END AS status;

-- 4. Tarkista että indeksit on olemassa
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE indexname = 'calendars_userId_idx'
        )
        THEN '✅ calendars_userId_idx on olemassa'
        ELSE '❌ calendars_userId_idx puuttuu'
    END AS status;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE indexname = 'day_plans_calendarId_idx'
        )
        THEN '✅ day_plans_calendarId_idx on olemassa'
        ELSE '❌ day_plans_calendarId_idx puuttuu'
    END AS status;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE indexname = 'day_plans_userId_date_calendarId_key'
        )
        THEN '✅ day_plans_userId_date_calendarId_key on olemassa'
        ELSE '❌ day_plans_userId_date_calendarId_key puuttuu'
    END AS status;

