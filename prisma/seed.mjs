import { PrismaClient } from "@prisma/client";
import { readFile } from "node:fs/promises";

const prisma = new PrismaClient();
const data = JSON.parse(await readFile(new URL("../app/data/migration-data.json", import.meta.url), "utf8"));
const forceUpdate = process.env.FORCE_SEED === "true";

const slugByName = {
  兰亭: "lanting",
  花晨: "huachen",
  玲珑: "linglong",
  燕云: "yanyun",
};

function migrationStatus(record) {
  if (record.建议盟 === "候补") return "RESERVE";
  return record.当前盟 === record.建议盟 ? "STAY" : "MOVE";
}

function sixTotal(record) {
  const values = [record.步兵防御, record.步兵生命, record.骑兵攻击, record.骑兵破坏, record.弓兵攻击, record.弓兵破坏];
  return values.every(Number.isFinite) ? values.reduce((sum, value) => sum + value, 0) : null;
}

try {
  const allianceIds = new Map();
  for (const alliance of data.alliances) {
    const row = await prisma.alliance.upsert({
      where: { slug: slugByName[alliance.alliance] },
      create: {
        name: alliance.alliance,
        slug: slugByName[alliance.alliance],
        roleLabel: alliance.role,
        color: alliance.color,
        capacity: 100,
        targetCapacity: alliance.targetCount,
        sortOrder: alliance.order,
      },
      update: forceUpdate ? {
        name: alliance.alliance,
        roleLabel: alliance.role,
        color: alliance.color,
        capacity: 100,
        targetCapacity: alliance.targetCount,
        sortOrder: alliance.order,
        deletedAt: null,
        status: "ACTIVE",
      } : {},
    });
    allianceIds.set(alliance.alliance, row.id);
  }

  for (const record of data.records) {
    const payload = {
      name: record.成员名称,
      currentAllianceId: allianceIds.get(record.当前盟),
      targetAllianceId: record.建议盟 === "候补" ? null : allianceIds.get(record.建议盟),
      migrationStatus: migrationStatus(record),
      migrationAction: record.迁盟动作,
      previousSuggestion: record.旧表建议,
      originalPreference: record.原意向,
      maxRallyBonus: record.最高集结加成,
      nationalRallyBonus: record.国家队集结加成,
      infantryDefense: record.步兵防御,
      infantryHealth: record.步兵生命,
      cavalryAttack: record.骑兵攻击,
      cavalryDestruction: record.骑兵破坏,
      archerAttack: record.弓兵攻击,
      archerDestruction: record.弓兵破坏,
      sixDimensionTotal: sixTotal(record),
      totalMerit: BigInt(record.总功勋 || 0),
      strength: BigInt(record.实力 || 0),
      power: BigInt(record.战力 || 0),
      weeklyMerit: BigInt(record.周功勋 || 0),
      weeklyDonation: BigInt(record.周捐献 || 0),
      furnaceLevel: record.火炉等级 || null,
      rankLevel: record.阶级 || null,
      battleScore: record.战斗评分 || 0,
      battleRank: record.战斗排名 || 0,
      allocationReason: record.分配理由 || null,
      matchNote: record.匹配备注 || null,
      deletedAt: null,
    };
    await prisma.allianceMember.upsert({
      where: { externalNo: record.编号 },
      create: { externalNo: record.编号, ...payload },
      update: forceUpdate ? payload : {},
    });
  }

  await prisma.systemSetting.upsert({
    where: { key: "bootstrap" },
    create: { key: "bootstrap", value: { completed: false } },
    update: {},
  });
  await prisma.systemSetting.upsert({
    where: { key: "data_version" },
    create: { key: "data_version", value: { version: "2026-08-02", sourceCount: data.records.length } },
    update: { value: { version: "2026-08-02", sourceCount: data.records.length } },
  });

  const [alliances, members] = await Promise.all([
    prisma.alliance.count({ where: { deletedAt: null } }),
    prisma.allianceMember.count({ where: { deletedAt: null } }),
  ]);
  console.log(`Seed complete: ${alliances} alliances, ${members} members.`);
} finally {
  await prisma.$disconnect();
}
