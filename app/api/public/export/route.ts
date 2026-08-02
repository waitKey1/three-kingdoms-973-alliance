import ExcelJS from "exceljs";
import { getPublicMigrationData } from "@/app/lib/server/public-data";

const columns = ["编号", "成员名称", "当前盟", "建议盟", "迁盟动作", "最高集结加成", "国家队集结加成", "步兵防御", "步兵生命", "骑兵攻击", "骑兵破坏", "弓兵攻击", "弓兵破坏", "六维和", "总功勋", "实力", "战力", "火炉等级", "阶级", "战斗评分", "战斗排名", "分配理由"] as const;

export async function GET() {
  const data = await getPublicMigrationData();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "973区管理系统";
  workbook.created = new Date();
  const overview = workbook.addWorksheet("分盟总览");
  overview.addRow(["盟", "定位", "当前人数", "目标人数", "迁入", "迁出", "目标总功勋", "平均实力", "平均战力", "平均六维"]);
  data.alliances.forEach((item) => overview.addRow([item.alliance, item.role, item.currentCount, item.targetCount, item.incoming, item.outgoing, item.targetMerit, item.averageStrength, item.averagePower, item.averageSix]));
  const addMemberSheet = (name: string, records: typeof data.records) => {
    const sheet = workbook.addWorksheet(name);
    sheet.columns = columns.map((column) => ({ header: column, key: column, width: column === "成员名称" || column === "分配理由" ? 28 : 14 }));
    records.forEach((record) => sheet.addRow(Object.fromEntries(columns.map((column) => [column, record[column]]))));
    sheet.views = [{ state: "frozen", ySplit: 1 }];
    sheet.autoFilter = { from: "A1", to: `V${Math.max(sheet.rowCount, 1)}` };
  };
  data.alliances.forEach((alliance) => addMemberSheet(alliance.alliance, data.records.filter((record) => record.建议盟 === alliance.alliance)));
  addMemberSheet("迁盟清单", data.records.filter((record) => record.迁盟动作 !== "留盟"));
  addMemberSheet("全区名册", data.records);
  workbook.eachSheet((sheet) => {
    const header = sheet.getRow(1);
    header.font = { bold: true, color: { argb: "FFFFFFFF" } };
    header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF123A45" } };
  });
  const buffer = await workbook.xlsx.writeBuffer();
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent("973实时迁盟分配表.xlsx")}`,
      "Cache-Control": "no-store",
    },
  });
}
