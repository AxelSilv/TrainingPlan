-- CreateTable: Calendars
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

-- AddForeignKey: Calendars -> Users
ALTER TABLE "calendars" ADD CONSTRAINT "calendars_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex: Calendars userId
CREATE INDEX IF NOT EXISTS "calendars_userId_idx" ON "calendars"("userId");

-- Add calendarId to day_plans (nullable first)
ALTER TABLE "day_plans" ADD COLUMN IF NOT EXISTS "calendarId" TEXT;

-- AddForeignKey: DayPlans -> Calendars
ALTER TABLE "day_plans" ADD CONSTRAINT "day_plans_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "calendars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex: DayPlans calendarId
CREATE INDEX IF NOT EXISTS "day_plans_calendarId_idx" ON "day_plans"("calendarId");

-- Drop old unique constraint and create new one with calendarId
DROP INDEX IF EXISTS "day_plans_userId_date_key";
CREATE UNIQUE INDEX IF NOT EXISTS "day_plans_userId_date_calendarId_key" ON "day_plans"("userId", "date", "calendarId");

