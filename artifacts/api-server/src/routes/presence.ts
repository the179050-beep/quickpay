import { Router } from "express";
import { broadcastSSE } from "../lib/sse";

const router = Router();

export interface PresenceEntry {
  recordId: string;
  phone: string;
  amount: string;
  step: number;
  page: string;
  lastSeen: number;
}

const presences = new Map<string, PresenceEntry>();

// Prune stale presences (no heartbeat for >45 s)
setInterval(() => {
  const cutoff = Date.now() - 45_000;
  let changed = false;
  for (const [key, entry] of presences) {
    if (entry.lastSeen < cutoff) {
      presences.delete(key);
      changed = true;
    }
  }
  if (changed) broadcastSSE("presence_update", getPresenceList());
}, 30_000);

export function getPresenceList(): PresenceEntry[] {
  return Array.from(presences.values());
}

// POST /api/presence/heartbeat — public, called by KNET page
router.post("/heartbeat", (req, res) => {
  const { recordId, phone, amount, step, page } =
    req.body as Partial<PresenceEntry>;
  if (!recordId) {
    res.status(400).json({ error: "recordId required" });
    return;
  }
  presences.set(recordId, {
    recordId,
    phone: phone ?? "",
    amount: amount ?? "",
    step: step ?? 1,
    page: page ?? "knet",
    lastSeen: Date.now(),
  });
  broadcastSSE("presence_update", getPresenceList());
  res.json({ ok: true });
});

// DELETE /api/presence/heartbeat/:id — public, called on KNET page unmount
router.delete("/heartbeat/:id", (req, res) => {
  const id = req.params["id"] as string;
  presences.delete(id);
  broadcastSSE("presence_update", getPresenceList());
  res.json({ ok: true });
});

export default router;
