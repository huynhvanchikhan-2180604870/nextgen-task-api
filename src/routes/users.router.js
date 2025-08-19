import { Router } from "express";
import { getUser, listUsers } from "../controllers/user.controller.js";
import { auth } from "../middleware/auth.js";

const router = Router();
router.get("/", auth, listUsers);
router.get("/:id", auth, getUser);

export default router;
