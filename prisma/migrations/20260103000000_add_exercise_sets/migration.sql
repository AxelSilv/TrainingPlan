-- AlterTable
ALTER TABLE "strength_exercises" DROP COLUMN "sets",
DROP COLUMN "reps",
DROP COLUMN "load",
DROP COLUMN "rpe";

-- CreateTable
CREATE TABLE "exercise_sets" (
    "id" TEXT NOT NULL,
    "strengthExerciseId" TEXT NOT NULL,
    "setNumber" INTEGER NOT NULL,
    "reps" INTEGER,
    "load" DOUBLE PRECISION,
    "rpe" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercise_sets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exercise_sets_strengthExerciseId_idx" ON "exercise_sets"("strengthExerciseId");

-- AddForeignKey
ALTER TABLE "exercise_sets" ADD CONSTRAINT "exercise_sets_strengthExerciseId_fkey" FOREIGN KEY ("strengthExerciseId") REFERENCES "strength_exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

