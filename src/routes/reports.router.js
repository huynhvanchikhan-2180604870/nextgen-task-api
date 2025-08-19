import { Router } from "express";
import { burndown, overview } from "../controllers/report.controller.js";
import { auth } from "../middleware/auth.js";

const router = Router();
router.get("/overview", auth, overview);
router.get("/burndown", auth, burndown);

export default router;
