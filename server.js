import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";

import { connectDB } from "./src/config/db.config.js";
import { errorHandler, notFound } from "./src/middleware/error.js";
import authRoutes from "./src/routes/auth.router.js";
import projectRoutes from "./src/routes/projects.router.js";
import reportRoutes from "./src/routes/reports.router.js";
import taskRoutes from "./src/routes/tasks.router.js";
import userRoutes from "./src/routes/users.router.js";

dotenv.config();
await connectDB();

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/", (req, res) => res.json({ ok: true, name: "Task Manager API" }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/reports", reportRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`API listening on http://localhost:${PORT}`)
);
