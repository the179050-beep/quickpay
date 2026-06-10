import type { Response } from "express";

interface SseClient {
  id: string;
  res: Response;
}

export const sseClients = new Set<SseClient>();

export function broadcastSSE(event: string, data: unknown) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.res.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}
