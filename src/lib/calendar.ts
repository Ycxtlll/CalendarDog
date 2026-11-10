/** 构建一个月的 6×7 网格（含跨月补位），返回 42 个日期 */
export function buildMonthGrid(
  year: number,
  month: number,
  weekStartMonday: boolean,
): Date[][] {
  const first = new Date(year, month - 1, 1);
  const offset = (first.getDay() - (weekStartMonday ? 1 : 0) + 7) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - offset);

  const rows: Date[][] = [];
  for (let r = 0; r < 6; r++) {
    const row: Date[] = [];
    for (let c = 0; c < 7; c++) {
      const d = new Date(start);
      d.setDate(start.getDate() + r * 7 + c);
      row.push(d);
    }
    rows.push(row);
  }
  return rows;
}
