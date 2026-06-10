import { Router, type IRouter } from "express";
import healthRouter from "./health";
import paymentRecordsRouter from "./payment-records";
import banksRouter from "./banks";
import dashRouter from "./dash";
import presenceRouter, { getPresenceList } from "./presence";
import { requireDashAuth } from "../middleware/auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/payment-records", paymentRecordsRouter);
router.use("/banks", banksRouter);
router.use("/dash", dashRouter);
router.use("/presence", presenceRouter);

// GET /api/presence — admin only, returns current online visitors
router.get("/presence", requireDashAuth, (_req, res) => {
  res.json(getPresenceList());
});

export default router;
