import * as XLSX from "xlsx";

interface ParsedMaintenanceRow {
  partName: string;
  partNumber?: string | null;
  aircraft?: string | null;
  status: string;
  orderDate?: Date | null;
  expectedDelivery?: Date | null;
  notes?: string | null;
}

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "number") {
    const date = XLSX.SSF.parse_date_code(value);
    return new Date(date.y, date.m - 1, date.d);
  }
  const parsed = new Date(String(value));
  return isNaN(parsed.getTime()) ? null : parsed;
}

export function parseExcel(buffer: Buffer): ParsedMaintenanceRow[] {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  return rows.map((row) => {
    const get = (keys: string[]): unknown =>
      keys.reduce<unknown>((val, key) => val ?? row[key], undefined);

    return {
      partName: String(get(["Part Name", "partName", "Part", "part_name", "Description"]) ?? "Unknown"),
      partNumber: (get(["Part Number", "partNumber", "Part #", "part_number"]) as string) ?? null,
      aircraft: (get(["Aircraft", "aircraft", "Tail #", "Tail Number", "tail_number"]) as string) ?? null,
      status: String(get(["Status", "status", "Order Status"]) ?? "Unknown"),
      orderDate: parseDate(get(["Order Date", "orderDate", "order_date", "Ordered"])),
      expectedDelivery: parseDate(get(["Expected Delivery", "expectedDelivery", "ETA", "Delivery Date", "expected_delivery"])),
      notes: (get(["Notes", "notes", "Comments", "Remarks"]) as string) ?? null,
    };
  });
}
