-- CreateTable
CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Helsinki',
    "sex" TEXT NOT NULL DEFAULT 'male',
    "heightCm" INTEGER NOT NULL DEFAULT 183,
    "weightKg" DOUBLE PRECISION NOT NULL DEFAULT 89.0,
    "goalWeightKg" DOUBLE PRECISION NOT NULL DEFAULT 80.0,
    "runFrequency" INTEGER NOT NULL DEFAULT 3,
    "swimFrequency" INTEGER NOT NULL DEFAULT 1,
    "strengthFrequency" INTEGER NOT NULL DEFAULT 3,
    "restDay" TEXT NOT NULL DEFAULT 'saturday',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "day_plans" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "day_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "dayPlanId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "plannedRpe" INTEGER,
    "plannedDuration" INTEGER,
    "plannedNotes" TEXT,
    "completedRpe" INTEGER,
    "completedDuration" INTEGER,
    "completedNotes" TEXT,
    "kneePainScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strength_exercises" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sets" INTEGER,
    "reps" INTEGER,
    "load" DOUBLE PRECISION,
    "restTime" INTEGER,
    "tempo" TEXT,
    "rpe" INTEGER,
    "notes" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "strength_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "run_details" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "plannedKm" DOUBLE PRECISION,
    "completedKm" DOUBLE PRECISION,
    "elevationGain" INTEGER,
    "surface" TEXT,
    "avgHeartRate" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "run_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "swim_details" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "plannedMeters" INTEGER,
    "completedMeters" INTEGER,
    "sets" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "swim_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pain_logs" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "kneePain" INTEGER NOT NULL,
    "otherPain" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pain_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weight_logs" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weight_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "day_plans_date_key" ON "day_plans"("date");

-- CreateIndex
CREATE INDEX "sessions_dayPlanId_idx" ON "sessions"("dayPlanId");

-- CreateIndex
CREATE INDEX "sessions_type_idx" ON "sessions"("type");

-- CreateIndex
CREATE INDEX "sessions_status_idx" ON "sessions"("status");

-- CreateIndex
CREATE INDEX "strength_exercises_sessionId_idx" ON "strength_exercises"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "run_details_sessionId_key" ON "run_details"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "swim_details_sessionId_key" ON "swim_details"("sessionId");

-- CreateIndex
CREATE INDEX "pain_logs_date_idx" ON "pain_logs"("date");

-- CreateIndex
CREATE INDEX "weight_logs_date_idx" ON "weight_logs"("date");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_dayPlanId_fkey" FOREIGN KEY ("dayPlanId") REFERENCES "day_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strength_exercises" ADD CONSTRAINT "strength_exercises_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "run_details" ADD CONSTRAINT "run_details_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swim_details" ADD CONSTRAINT "swim_details_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

