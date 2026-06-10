import { Router } from "express";
import { db } from "@workspace/db";
import { paymentRecordsTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";

const router = Router();

// SSE clients registry
const sseClients = new Set<{
  id: string;
  res: import("express").Response;
}>();

export function broadcastSSE(event: string, data: unknown) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((client) => {
    try {
      client.res.write(payload);
    } catch {
      sseClients.delete(client);
    }
  });
}

// GET /api/payment-records/stream  — SSE
router.get("/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders();

  const client = { id: Math.random().toString(36).slice(2), res };
  sseClients.add(client);
  req.log?.info({ clientId: client.id }, "SSE client connected");

  const keepalive = setInterval(() => {
    try {
      res.write(": keepalive\n\n");
    } catch {
      sseClients.delete(client);
      clearInterval(keepalive);
    }
  }, 25000);

  req.on("close", () => {
    sseClients.delete(client);
    clearInterval(keepalive);
    req.log?.info({ clientId: client.id }, "SSE client disconnected");
  });
});

// GET /api/payment-records
router.get("/", async (req, res) => {
  try {
    const records = await db
      .select()
      .from(paymentRecordsTable)
      .orderBy(desc(paymentRecordsTable.created_date))
      .limit(200);
    res.json(records);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch payment records");
    res.status(500).json({ error: "Failed to fetch records" });
  }
});

// POST /api/payment-records
router.post("/", async (req, res) => {
  try {
    const [record] = await db
      .insert(paymentRecordsTable)
      .values(req.body)
      .returning();
    broadcastSSE("create", { id: record.id, data: record });
    res.status(201).json(record);
  } catch (err) {
    req.log.error({ err }, "Failed to create payment record");
    res.status(500).json({ error: "Failed to create record" });
  }
});

// PUT /api/payment-records/:id
router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    const [record] = await db
      .update(paymentRecordsTable)
      .set(req.body)
      .where(eq(paymentRecordsTable.id, id))
      .returning();
    if (!record) {
      res.status(404).json({ error: "Record not found" });
      return;
    }
    broadcastSSE("update", { id: record.id, data: record });
    res.json(record);
  } catch (err) {
    req.log.error({ err }, "Failed to update payment record");
    res.status(500).json({ error: "Failed to update record" });
  }
});

// DELETE /api/payment-records/:id
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params["id"] as string, 10);
    const [record] = await db
      .delete(paymentRecordsTable)
      .where(eq(paymentRecordsTable.id, id))
      .returning();
    if (!record) {
      res.status(404).json({ error: "Record not found" });
      return;
    }
    broadcastSSE("delete", { id: record.id });
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete payment record");
    res.status(500).json({ error: "Failed to delete record" });
  }
});

export default router;
