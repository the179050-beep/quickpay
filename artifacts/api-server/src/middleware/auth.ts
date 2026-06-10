import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "../lib/dash-secret";

export function requireDashAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const auth = req.headers.authorization ?? "";
  const queryToken =
    typeof req.query["token"] === "string" ? req.query["token"] : null;
  const raw = auth.startsWith("Bearer ") ? auth.slice(7) : (queryToken ?? "");

  if (!raw) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    jwt.verify(raw, getJwtSecret());
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}
