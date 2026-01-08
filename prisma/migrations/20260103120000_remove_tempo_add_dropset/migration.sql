-- AlterTable: Remove tempo column from strength_exercises
ALTER TABLE "strength_exercises" DROP COLUMN IF EXISTS "tempo";

-- AlterTable: Add isDropSet column to exercise_sets
ALTER TABLE "exercise_sets" ADD COLUMN IF NOT EXISTS "isDropSet" BOOLEAN NOT NULL DEFAULT false;

