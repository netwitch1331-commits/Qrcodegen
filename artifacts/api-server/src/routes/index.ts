import { Router, type IRouter } from "express";
import healthRouter from "./health";
import qrcodesRouter from "./qrcodes";

const router: IRouter = Router();

router.use(healthRouter);
router.use(qrcodesRouter);

export default router;
