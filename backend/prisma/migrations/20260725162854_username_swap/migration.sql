/*
  Warnings:

  - You are about to drop the column `email` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[username]` on the table `User` will be added.
  - Added the required column `username` to the `User` table.

  Existing rows are backfilled with a placeholder username derived from id,
  since there's no email data to carry over. Update these manually after migrating.
*/

-- DropIndex
DROP INDEX "User_email_key";

-- AlterTable: add as nullable first so existing rows don't block this step
ALTER TABLE "User" ADD COLUMN "username" TEXT;

-- Backfill: give existing rows a placeholder so NOT NULL can be applied
UPDATE "User" SET "username" = 'admin_' || "id" WHERE "username" IS NULL;

-- AlterTable: now that every row has a value, enforce NOT NULL and drop email
ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;
ALTER TABLE "User" DROP COLUMN "email";

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");