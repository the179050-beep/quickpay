import { Router } from "express";

const router = Router();

const DASH_PASSWORD = process.env["DASH_PASSWORD"] ?? "admin123";

router.post("/unlock", (req, res) => {
  const { password } = req.body as { password?: string };
  if (password === DASH_PASSWORD) {
    res.json({ ok: true });
  } else {
    res.status(401).json({ ok: false });
  }
});

export default router;
