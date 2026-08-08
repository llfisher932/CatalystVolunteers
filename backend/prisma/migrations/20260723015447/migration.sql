-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'DISAPPROVED', 'INACTIVE');

-- CreateTable
CREATE TABLE "Volunteer" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT,
    "homePhone" TEXT,
    "workPhone" TEXT,
    "cellPhone" TEXT,
    "educationalBackground" TEXT,
    "currentLicenses" TEXT,
    "skills" TEXT[],
    "availability" TEXT,
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "emergencyName" TEXT,
    "emergencyHomePhone" TEXT,
    "emergencyWorkPhone" TEXT,
    "emergencyEmail" TEXT,
    "emergencyAddress" TEXT,
    "driversLicenseOnFile" BOOLEAN NOT NULL DEFAULT false,
    "socialSecurityOnFile" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Volunteer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Volunteer_username_key" ON "Volunteer"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Volunteer_email_key" ON "Volunteer"("email");
