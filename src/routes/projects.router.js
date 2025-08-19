import { Router } from "express";
import {
  addOrUpdateMember,
  createProject,
  getProject,
  listMyProjects,
  removeMember,
  updateProject,
} from "../controllers/project.controller.js";
import { auth } from "../middleware/auth.js";

const router = Router();
router.post("/", auth, createProject);
router.get("/", auth, listMyProjects);
router.get("/:id", auth, getProject);
router.put("/:id", auth, updateProject);
router.post("/:id/members", auth, addOrUpdateMember);
router.delete("/:id/members/:userId", auth, removeMember);

export default router;
