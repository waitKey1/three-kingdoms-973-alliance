import { prisma } from "./prisma";

type ScoreInput = {
  id: string;
  totalMerit: bigint;
  strength: bigint;
  power: bigint;
  sixDimensionTotal: number | null;
};

export function calculateScores(rows: ScoreInput[]) {
  const maxima = {
    merit: Math.max(...rows.map((row) => Number(row.totalMerit)), 1),
    strength: Math.max(...rows.map((row) => Number(row.strength)), 1),
    power: Math.max(...rows.map((row) => Number(row.power)), 1),
    six: Math.max(...rows.map((row) => row.sixDimensionTotal ?? 0), 1),
  };
  return rows.map((row) => {
    const hasSix = row.sixDimensionTotal !== null;
    const baseWeight = hasSix ? 1 : 0.9;
    const score = (
      Number(row.totalMerit) / maxima.merit * 0.4
      + Number(row.strength) / maxima.strength * 0.35
      + Number(row.power) / maxima.power * 0.15
      + (hasSix ? (row.sixDimensionTotal ?? 0) / maxima.six * 0.1 : 0)
    ) / baseWeight * 100;
    return { id: row.id, battleScore: Math.round(score * 10) / 10 };
  }).sort((a, b) => b.battleScore - a.battleScore || a.id.localeCompare(b.id));
}

export async function recalculateAllScores() {
  const members = await prisma.allianceMember.findMany({
    where: { deletedAt: null },
    select: { id: true, totalMerit: true, strength: true, power: true, sixDimensionTotal: true },
  });
  const scores = calculateScores(members);
  await prisma.$transaction(scores.map((row, index) => prisma.allianceMember.update({
    where: { id: row.id },
    data: { battleScore: row.battleScore, battleRank: index + 1 },
  })));
}

export function calculateSixTotal(input: Record<string, unknown>) {
  const keys = ["infantryDefense", "infantryHealth", "cavalryAttack", "cavalryDestruction", "archerAttack", "archerDestruction"];
  const values = keys.map((key) => input[key]);
  return values.every((value) => typeof value === "number") ? values.reduce<number>((sum, value) => sum + Number(value), 0) : null;
}
