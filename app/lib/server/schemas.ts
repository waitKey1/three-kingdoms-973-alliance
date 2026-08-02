import { z } from "zod";

export const phoneSchema = z.string().trim().regex(/^1[3-9]\d{9}$/, "请输入正确的中国大陆手机号");
export const smsRequestSchema = z.object({
  phone: phoneSchema,
  purpose: z.enum(["LOGIN", "SETUP"]).default("LOGIN"),
  bootstrapToken: z.string().optional(),
});
export const smsVerifySchema = smsRequestSchema.extend({ code: z.string().regex(/^\d{6}$/, "验证码为6位数字") });

export const allianceInputSchema = z.object({
  name: z.string().trim().min(1).max(30),
  slug: z.string().trim().regex(/^[a-z0-9-]+$/).max(40),
  roleLabel: z.string().trim().min(1).max(40),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  capacity: z.number().int().min(97).max(100).default(100),
  targetCapacity: z.number().int().min(95).max(97),
  sortOrder: z.number().int().min(0).max(999),
});

const nullableInt = z.number().int().nonnegative().nullable().optional();
const nullableNumber = z.number().nonnegative().nullable().optional();
export const memberInputSchema = z.object({
  externalNo: z.number().int().positive().nullable().optional(),
  name: z.string().trim().min(1).max(50),
  currentAllianceId: z.string().uuid(),
  targetAllianceId: z.string().uuid().nullable().optional(),
  migrationStatus: z.enum(["STAY", "MOVE", "RESERVE"]),
  migrationAction: z.string().trim().min(1).max(100),
  previousSuggestion: z.string().max(50).nullable().optional(),
  originalPreference: z.string().max(100).nullable().optional(),
  maxRallyBonus: nullableNumber,
  nationalRallyBonus: nullableNumber,
  infantryDefense: nullableInt,
  infantryHealth: nullableInt,
  cavalryAttack: nullableInt,
  cavalryDestruction: nullableInt,
  archerAttack: nullableInt,
  archerDestruction: nullableInt,
  totalMerit: z.coerce.bigint().nonnegative().optional(),
  strength: z.coerce.bigint().nonnegative().optional(),
  power: z.coerce.bigint().nonnegative().optional(),
  weeklyMerit: z.coerce.bigint().nonnegative().optional(),
  weeklyDonation: z.coerce.bigint().nonnegative().optional(),
  furnaceLevel: z.string().max(50).nullable().optional(),
  rankLevel: z.number().int().min(1).max(5).nullable().optional(),
  allocationReason: z.string().max(500).nullable().optional(),
  matchNote: z.string().max(500).nullable().optional(),
});

export const claimInputSchema = z.object({ allianceId: z.string().uuid(), memberId: z.string().uuid() });
export const claimReviewSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  rejectionReason: z.string().trim().min(2).max(300).optional(),
});

export const userUpdateSchema = z.object({
  displayName: z.string().trim().min(1).max(40).nullable().optional(),
  role: z.enum(["REGION_ADMIN", "ALLIANCE_ADMIN", "ALLIANCE_MEMBER"]).optional(),
  status: z.enum(["PENDING", "ACTIVE", "DISABLED"]).optional(),
  allianceId: z.string().uuid().nullable().optional(),
  revokeSessions: z.boolean().optional(),
});
