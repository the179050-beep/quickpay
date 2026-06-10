import { Router, type IRouter } from "express";
import healthRouter from "./health";
import paymentRecordsRouter from "./payment-records";
import banksRouter from "./banks";
import dashRouter from "./dash";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/payment-records", paymentRecordsRouter);
router.use("/banks", banksRouter);
router.use("/dash", dashRouter);

export default router;
