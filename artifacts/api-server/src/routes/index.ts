import { Router, type IRouter } from "express";
import healthRouter from "./health";
import contactRouter from "./contact";
import authRouter from "./auth";
import aiRouter from "./ai";
import smsRouter from "./sms";
import invitationsRouter from "./invitations";
import pushRouter from "./push";
import supportRouter from "./support";
import staffRouter from "./staff";

const router: IRouter = Router();

router.use(healthRouter);
router.use(contactRouter);
router.use(authRouter);
router.use(aiRouter);
router.use(smsRouter);
router.use(invitationsRouter);
router.use(pushRouter);
router.use(supportRouter);
router.use(staffRouter);

export default router;
