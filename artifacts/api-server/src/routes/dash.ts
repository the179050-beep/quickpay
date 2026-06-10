import { Router } from "express";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "../lib/dash-secret";

const router = Router();

router.post("/unlock", (req, res) => {
  const secret = getJwtSecret(); // ensures DASH_PASSWORD is initialized in env
  const correct = process.env["DASH_PASSWORD"];
  const { password } = req.body as { password?: string };

  if (!password || password !== correct) {
    res.status(401).json({ ok: false });
    return;
  }

  const token = jwt.sign({ role: "admin" }, secret, { expiresIn: "24h" });
  res.json({ ok: true, token });
});

export default router;
