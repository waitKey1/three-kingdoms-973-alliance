import rawData from "../data/migration-data.json";

export const ALLIANCE_SLUGS = {
  lanting: "兰亭",
  huachen: "花晨",
  linglong: "玲珑",
  yanyun: "燕云",
} as const;

export type AllianceName = (typeof ALLIANCE_SLUGS)[keyof typeof ALLIANCE_SLUGS];
export type AllianceSlug = keyof typeof ALLIANCE_SLUGS;

export type Member = {
  编号: number;
  成员名称: string;
  当前盟: AllianceName;
  建议盟: AllianceName | "候补";
  迁盟动作: string;
  旧表建议: string | null;
  原意向: string | null;
  最高集结加成: number | null;
  国家队集结加成: number | null;
  步兵防御: number | null;
  步兵生命: number | null;
  骑兵攻击: number | null;
  骑兵破坏: number | null;
  弓兵攻击: number | null;
  弓兵破坏: number | null;
  六维和: number | null;
  总功勋: number;
  实力: number;
  战力: number;
  周功勋: number;
  周捐献: number;
  火炉等级: string;
  阶级: number;
  战斗评分: number;
  战斗排名: number;
  分配理由: string;
  匹配备注: string | null;
};

export type AllianceSummary = {
  alliance: AllianceName;
  order: number;
  role: string;
  color: string;
  currentCount: number;
  targetCount: number;
  incoming: number;
  outgoing: number;
  currentMerit: number;
  targetMerit: number;
  averageStrength: number;
  averagePower: number;
  averageSix: number | null;
};

export const migrationData = rawData as unknown as {
  generatedAt: string;
  region: string;
  alliances: AllianceSummary[];
  stats: {
    total: number;
    assigned: number;
    moves: number;
    stays: number;
    reserves: number;
    sixMatched: number;
  };
  records: Member[];
};

export const allianceEntries = Object.entries(ALLIANCE_SLUGS) as [AllianceSlug, AllianceName][];

export function getAllianceSlug(name: AllianceName) {
  return allianceEntries.find(([, value]) => value === name)?.[0] ?? "lanting";
}

export function formatCompact(value: number) {
  if (value >= 100_000_000) return `${(value / 100_000_000).toFixed(1)}亿`;
  if (value >= 10_000) return `${(value / 10_000).toFixed(1)}万`;
  return value.toLocaleString("zh-CN");
}

export function formatNumber(value: number | null | undefined) {
  return value === null || value === undefined ? "—" : value.toLocaleString("zh-CN");
}
