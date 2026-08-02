import type { Member } from "../data";
import { migrationData as fallbackData } from "../data";
import { prisma } from "./prisma";
import { getRedis } from "./redis";

const CACHE_KEY = "public:migration-data:v1";

export async function getPublicMigrationData(): Promise<typeof fallbackData> {
  try {
    const redis = await getRedis();
    const cached = await redis.get(CACHE_KEY);
    if (cached) return JSON.parse(cached) as typeof fallbackData;
    const [alliances, rows] = await Promise.all([
      prisma.alliance.findMany({ where: { deletedAt: null, status: "ACTIVE" }, orderBy: { sortOrder: "asc" } }),
      prisma.allianceMember.findMany({ where: { deletedAt: null }, include: { currentAlliance: true, targetAlliance: true }, orderBy: { battleRank: "asc" } }),
    ]);
    if (!alliances.length || !rows.length) return fallbackData;
    const records = rows.map((row): Member => ({
      编号: row.externalNo ?? 0, 成员名称: row.name, 当前盟: row.currentAlliance.name as Member["当前盟"],
      建议盟: (row.migrationStatus === "RESERVE" ? "候补" : row.targetAlliance?.name) as Member["建议盟"],
      迁盟动作: row.migrationAction, 旧表建议: row.previousSuggestion, 原意向: row.originalPreference,
      最高集结加成: row.maxRallyBonus, 国家队集结加成: row.nationalRallyBonus,
      步兵防御: row.infantryDefense, 步兵生命: row.infantryHealth, 骑兵攻击: row.cavalryAttack,
      骑兵破坏: row.cavalryDestruction, 弓兵攻击: row.archerAttack, 弓兵破坏: row.archerDestruction,
      六维和: row.sixDimensionTotal, 总功勋: Number(row.totalMerit), 实力: Number(row.strength), 战力: Number(row.power),
      周功勋: Number(row.weeklyMerit), 周捐献: Number(row.weeklyDonation), 火炉等级: row.furnaceLevel ?? "", 阶级: row.rankLevel ?? 1,
      战斗评分: row.battleScore, 战斗排名: row.battleRank, 分配理由: row.allocationReason ?? "", 匹配备注: row.matchNote,
    }));
    const summaries = alliances.map((alliance) => {
      const current = rows.filter((row) => row.currentAllianceId === alliance.id);
      const target = rows.filter((row) => row.targetAllianceId === alliance.id && row.migrationStatus !== "RESERVE");
      const withSix = target.filter((row) => row.sixDimensionTotal !== null);
      const average = (values: number[]) => values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
      return {
        alliance: alliance.name as (typeof fallbackData.alliances)[number]["alliance"], order: alliance.sortOrder, role: alliance.roleLabel, color: alliance.color,
        currentCount: current.length, targetCount: target.length,
        incoming: target.filter((row) => row.currentAllianceId !== alliance.id).length,
        outgoing: current.filter((row) => row.targetAllianceId !== alliance.id).length,
        currentMerit: current.reduce((sum, row) => sum + Number(row.totalMerit), 0),
        targetMerit: target.reduce((sum, row) => sum + Number(row.totalMerit), 0),
        averageStrength: average(target.map((row) => Number(row.strength))), averagePower: average(target.map((row) => Number(row.power))),
        averageSix: withSix.length ? average(withSix.map((row) => row.sixDimensionTotal ?? 0)) : null,
      };
    });
    const result = {
      generatedAt: new Date().toISOString(), region: "973", alliances: summaries,
      stats: {
        total: rows.length,
        assigned: rows.filter((row) => row.migrationStatus !== "RESERVE" && row.targetAllianceId).length,
        moves: rows.filter((row) => row.migrationStatus === "MOVE").length,
        stays: rows.filter((row) => row.migrationStatus === "STAY").length,
        reserves: rows.filter((row) => row.migrationStatus === "RESERVE").length,
        sixMatched: rows.filter((row) => row.sixDimensionTotal !== null).length,
      }, records,
    } as typeof fallbackData;
    await redis.set(CACHE_KEY, JSON.stringify(result), { EX: 60 });
    return result;
  } catch {
    return fallbackData;
  }
}
