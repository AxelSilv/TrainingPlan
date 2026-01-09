-- CreateTable: Users
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Accounts
CREATE TABLE IF NOT EXISTS "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable: NextAuth Sessions (rename existing sessions table first)
ALTER TABLE IF EXISTS "sessions" RENAME TO "training_sessions_temp";

-- CreateTable: NextAuth Sessions
CREATE TABLE IF NOT EXISTS "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: VerificationTokens
CREATE TABLE IF NOT EXISTS "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex: Users email unique
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");

-- CreateIndex: Accounts provider unique
CREATE UNIQUE INDEX IF NOT EXISTS "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex: Sessions sessionToken unique
CREATE UNIQUE INDEX IF NOT EXISTS "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex: VerificationTokens unique
CREATE UNIQUE INDEX IF NOT EXISTS "verification_tokens_token_key" ON "verification_tokens"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- AddForeignKey: Accounts -> Users
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Sessions -> Users
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Rename training_sessions_temp back to training_sessions
ALTER TABLE IF EXISTS "training_sessions_temp" RENAME TO "training_sessions";

-- Add userId to day_plans (nullable first, then we'll update)
ALTER TABLE "day_plans" ADD COLUMN IF NOT EXISTS "userId" TEXT;

-- Add userId to user_settings (nullable first)
ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "userId" TEXT;

-- Add userId to pain_logs (nullable first)
ALTER TABLE "pain_logs" ADD COLUMN IF NOT EXISTS "userId" TEXT;

-- Add userId to weight_logs (nullable first)
ALTER TABLE "weight_logs" ADD COLUMN IF NOT EXISTS "userId" TEXT;

-- Create a default user for existing data
INSERT INTO "users" ("id", "email", "password", "name", "createdAt", "updatedAt")
VALUES ('default-user', 'default@example.com', '$2a$10$placeholder', 'Default User', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Update existing day_plans with default userId
UPDATE "day_plans" SET "userId" = 'default-user' WHERE "userId" IS NULL;

-- Update existing user_settings with default userId
UPDATE "user_settings" SET "userId" = 'default-user' WHERE "userId" IS NULL;

-- Make userId NOT NULL and add foreign keys
ALTER TABLE "day_plans" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "user_settings" ALTER COLUMN "userId" SET NOT NULL;

-- Add unique constraint for day_plans (userId, date)
CREATE UNIQUE INDEX IF NOT EXISTS "day_plans_userId_date_key" ON "day_plans"("userId", "date");

-- Add unique constraint for user_settings userId
CREATE UNIQUE INDEX IF NOT EXISTS "user_settings_userId_key" ON "user_settings"("userId");

-- Add indexes
CREATE INDEX IF NOT EXISTS "day_plans_userId_idx" ON "day_plans"("userId");
CREATE INDEX IF NOT EXISTS "pain_logs_userId_date_idx" ON "pain_logs"("userId", "date");
CREATE INDEX IF NOT EXISTS "weight_logs_userId_date_idx" ON "weight_logs"("userId", "date");

-- Add foreign keys
ALTER TABLE "day_plans" ADD CONSTRAINT "day_plans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

