import { Router } from "express";
import {
  addComment,
  assignTask,
  createTask,
  deleteTask,
  listTasks,
  updateTask,
} from "../controllers/task.controller.js";
import { auth } from "../middleware/auth.js";

const router = Router();
router.get("/", auth, listTasks);
router.post("/", auth, createTask);
router.put("/:id", auth, updateTask);
router.delete("/:id", auth, deleteTask);
router.post("/:id/comments", auth, addComment);
router.post("/:id/assign", auth, assignTask);

export default router;
