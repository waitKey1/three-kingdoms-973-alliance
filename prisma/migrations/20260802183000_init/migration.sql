-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('REGION_ADMIN', 'ALLIANCE_ADMIN', 'ALLIANCE_MEMBER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "AllianceStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MigrationStatus" AS ENUM ('STAY', 'MOVE', 'RESERVE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "displayName" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'ALLIANCE_MEMBER',
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "allianceId" TEXT,
    "memberId" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alliance" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "roleLabel" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 100,
    "targetCapacity" INTEGER NOT NULL DEFAULT 97,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "AllianceStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Alliance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AllianceMember" (
    "id" TEXT NOT NULL,
    "externalNo" INTEGER,
    "name" TEXT NOT NULL,
    "currentAllianceId" TEXT NOT NULL,
    "targetAllianceId" TEXT,
    "migrationStatus" "MigrationStatus" NOT NULL DEFAULT 'STAY',
    "migrationAction" TEXT NOT NULL,
    "previousSuggestion" TEXT,
    "originalPreference" TEXT,
    "maxRallyBonus" DOUBLE PRECISION,
    "nationalRallyBonus" DOUBLE PRECISION,
    "infantryDefense" INTEGER,
    "infantryHealth" INTEGER,
    "cavalryAttack" INTEGER,
    "cavalryDestruction" INTEGER,
    "archerAttack" INTEGER,
    "archerDestruction" INTEGER,
    "sixDimensionTotal" INTEGER,
    "totalMerit" BIGINT NOT NULL DEFAULT 0,
    "strength" BIGINT NOT NULL DEFAULT 0,
    "power" BIGINT NOT NULL DEFAULT 0,
    "weeklyMerit" BIGINT NOT NULL DEFAULT 0,
    "weeklyDonation" BIGINT NOT NULL DEFAULT 0,
    "furnaceLevel" TEXT,
    "rankLevel" INTEGER,
    "battleScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "battleRank" INTEGER NOT NULL DEFAULT 0,
    "allocationReason" TEXT,
    "matchNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "AllianceMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberClaim" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "allianceId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'PENDING',
    "reviewerId" TEXT,
    "rejectionReason" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "allianceId" TEXT,
    "beforeData" JSONB,
    "afterData" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_memberId_key" ON "User"("memberId");

-- CreateIndex
CREATE INDEX "User_allianceId_status_idx" ON "User"("allianceId", "status");

-- CreateIndex
CREATE INDEX "User_role_status_idx" ON "User"("role", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Alliance_name_key" ON "Alliance"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Alliance_slug_key" ON "Alliance"("slug");

-- CreateIndex
CREATE INDEX "Alliance_status_sortOrder_idx" ON "Alliance"("status", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "AllianceMember_externalNo_key" ON "AllianceMember"("externalNo");

-- CreateIndex
CREATE INDEX "AllianceMember_name_idx" ON "AllianceMember"("name");

-- CreateIndex
CREATE INDEX "AllianceMember_currentAllianceId_deletedAt_idx" ON "AllianceMember"("currentAllianceId", "deletedAt");

-- CreateIndex
CREATE INDEX "AllianceMember_targetAllianceId_migrationStatus_deletedAt_idx" ON "AllianceMember"("targetAllianceId", "migrationStatus", "deletedAt");

-- CreateIndex
CREATE INDEX "AllianceMember_battleRank_idx" ON "AllianceMember"("battleRank");

-- CreateIndex
CREATE INDEX "MemberClaim_allianceId_status_createdAt_idx" ON "MemberClaim"("allianceId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "MemberClaim_userId_status_idx" ON "MemberClaim"("userId", "status");

-- CreateIndex
CREATE INDEX "MemberClaim_memberId_status_idx" ON "MemberClaim"("memberId", "status");

-- CreateIndex
CREATE INDEX "AuditLog_allianceId_createdAt_idx" ON "AuditLog"("allianceId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_allianceId_fkey" FOREIGN KEY ("allianceId") REFERENCES "Alliance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "AllianceMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllianceMember" ADD CONSTRAINT "AllianceMember_currentAllianceId_fkey" FOREIGN KEY ("currentAllianceId") REFERENCES "Alliance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllianceMember" ADD CONSTRAINT "AllianceMember_targetAllianceId_fkey" FOREIGN KEY ("targetAllianceId") REFERENCES "Alliance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberClaim" ADD CONSTRAINT "MemberClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberClaim" ADD CONSTRAINT "MemberClaim_allianceId_fkey" FOREIGN KEY ("allianceId") REFERENCES "Alliance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberClaim" ADD CONSTRAINT "MemberClaim_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "AllianceMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberClaim" ADD CONSTRAINT "MemberClaim_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_allianceId_fkey" FOREIGN KEY ("allianceId") REFERENCES "Alliance"("id") ON DELETE SET NULL ON UPDATE CASCADE;
