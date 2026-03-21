import { Router, type IRouter } from "express";
import { db, qrCodesTable, scanEventsTable } from "@workspace/db";
import { eq, desc, asc, ilike, sql } from "drizzle-orm";
import {
  CreateQrCodeBody,
  UpdateQrCodeBody,
  ListQrCodesQueryParams,
  GetQrCodeParams,
  UpdateQrCodeParams,
  DeleteQrCodeParams,
  RecordScanParams,
  RecordScanBody,
  GetQrCodeAnalyticsParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/qrcodes", async (req, res) => {
  const query = ListQrCodesQueryParams.parse(req.query);
  const { sortBy = "createdAt", order = "desc", search } = query;

  const orderFn = order === "asc" ? asc : desc;

  let results = db
    .select()
    .from(qrCodesTable)
    .$dynamic();

  if (search) {
    results = results.where(ilike(qrCodesTable.name, `%${search}%`));
  }

  const columnMap: Record<string, typeof qrCodesTable.createdAt | typeof qrCodesTable.name | typeof qrCodesTable.scans> = {
    createdAt: qrCodesTable.createdAt,
    name: qrCodesTable.name,
    scans: qrCodesTable.scans,
  };

  const sortColumn = columnMap[sortBy] ?? qrCodesTable.createdAt;
  results = results.orderBy(orderFn(sortColumn));

  const data = await results;
  const total = data.length;

  res.json({ data, total });
});

router.post("/qrcodes", async (req, res) => {
  const body = CreateQrCodeBody.parse(req.body);

  const [created] = await db
    .insert(qrCodesTable)
    .values({
      name: body.name,
      type: body.type,
      content: body.content,
      style: (body.style ?? {}) as Record<string, unknown>,
      isDynamic: body.isDynamic ?? false,
    })
    .returning();

  res.status(201).json(created);
});

router.get("/qrcodes/:id", async (req, res) => {
  const { id } = GetQrCodeParams.parse(req.params);

  const [qrCode] = await db
    .select()
    .from(qrCodesTable)
    .where(eq(qrCodesTable.id, id));

  if (!qrCode) {
    res.status(404).json({ error: "not_found", message: "QR code not found" });
    return;
  }

  res.json(qrCode);
});

router.patch("/qrcodes/:id", async (req, res) => {
  const { id } = UpdateQrCodeParams.parse(req.params);
  const body = UpdateQrCodeBody.parse(req.body);

  const existing = await db
    .select()
    .from(qrCodesTable)
    .where(eq(qrCodesTable.id, id));

  if (!existing[0]) {
    res.status(404).json({ error: "not_found", message: "QR code not found" });
    return;
  }

  const updateData: Partial<typeof qrCodesTable.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (body.name !== undefined) updateData.name = body.name;
  if (body.content !== undefined) updateData.content = body.content;
  if (body.style !== undefined) updateData.style = body.style as Record<string, unknown>;

  const [updated] = await db
    .update(qrCodesTable)
    .set(updateData)
    .where(eq(qrCodesTable.id, id))
    .returning();

  res.json(updated);
});

router.delete("/qrcodes/:id", async (req, res) => {
  const { id } = DeleteQrCodeParams.parse(req.params);

  const existing = await db
    .select()
    .from(qrCodesTable)
    .where(eq(qrCodesTable.id, id));

  if (!existing[0]) {
    res.status(404).json({ error: "not_found", message: "QR code not found" });
    return;
  }

  await db.delete(qrCodesTable).where(eq(qrCodesTable.id, id));
  res.status(204).send();
});

router.post("/qrcodes/:id/scan", async (req, res) => {
  const { id } = RecordScanParams.parse(req.params);
  const body = RecordScanBody.parse(req.body);

  const existing = await db
    .select()
    .from(qrCodesTable)
    .where(eq(qrCodesTable.id, id));

  if (!existing[0]) {
    res.status(404).json({ error: "not_found", message: "QR code not found" });
    return;
  }

  await db
    .update(qrCodesTable)
    .set({ scans: sql`${qrCodesTable.scans} + 1` })
    .where(eq(qrCodesTable.id, id));

  const [scanEvent] = await db
    .insert(scanEventsTable)
    .values({
      qrCodeId: id,
      geo: body.geo,
      device: body.device,
      userAgent: body.userAgent,
    })
    .returning();

  res.json(scanEvent);
});

router.get("/qrcodes/:id/analytics", async (req, res) => {
  const { id } = GetQrCodeAnalyticsParams.parse(req.params);

  const existing = await db
    .select()
    .from(qrCodesTable)
    .where(eq(qrCodesTable.id, id));

  if (!existing[0]) {
    res.status(404).json({ error: "not_found", message: "QR code not found" });
    return;
  }

  const totalScans = existing[0].scans;

  const scansByDayRaw = await db.execute(sql`
    SELECT DATE(scanned_at) as date, COUNT(*)::int as count
    FROM scan_events
    WHERE qr_code_id = ${id}
    GROUP BY DATE(scanned_at)
    ORDER BY DATE(scanned_at) ASC
  `);

  const scansByDeviceRaw = await db.execute(sql`
    SELECT COALESCE(device, 'unknown') as device, COUNT(*)::int as count
    FROM scan_events
    WHERE qr_code_id = ${id}
    GROUP BY device
    ORDER BY count DESC
  `);

  const scansByGeoRaw = await db.execute(sql`
    SELECT COALESCE(geo, 'unknown') as geo, COUNT(*)::int as count
    FROM scan_events
    WHERE qr_code_id = ${id}
    GROUP BY geo
    ORDER BY count DESC
    LIMIT 10
  `);

  res.json({
    totalScans,
    scansByDay: (scansByDayRaw as { date: string; count: number }[]).map((r) => ({
      date: String(r.date),
      count: Number(r.count),
    })),
    scansByDevice: (scansByDeviceRaw as { device: string; count: number }[]).map((r) => ({
      device: String(r.device),
      count: Number(r.count),
    })),
    scansByGeo: (scansByGeoRaw as { geo: string; count: number }[]).map((r) => ({
      geo: String(r.geo),
      count: Number(r.count),
    })),
  });
});

export default router;
