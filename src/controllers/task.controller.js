import mongoose from "mongoose";
import { canAdminProject } from "../middleware/rbac.js";
import Project from "../models/project.model.js";
import Task from "../models/task.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isObjectId, pick } from "../utils/validate.js";

const myProjectIds = async (userId) => {
  const projects = await Project.find({ "members.user": userId }).select("_id");
  return projects.map((p) => p._id);
};

export const listTasks = asyncHandler(async (req, res) => {
  const {
    scope, // all|mine
    project,
    status,
    assignee,
    tag,
    q,
    overdue,
    dueFrom,
    dueTo,
    page = 1,
    limit = 20,
    sort = "-updatedAt",
  } = req.query;

  let filter = {};
  if (scope === "all") {
    // (Optional) bạn có thể kiểm tra role global ở đây nếu muốn
  } else {
    const ids = await myProjectIds(req.user.id);
    filter.project = { $in: ids };
  }

  if (project && isObjectId(project))
    filter.project = new mongoose.Types.ObjectId(project);
  if (status) filter.status = status;
  if (assignee && isObjectId(assignee)) filter.assignee = assignee;
  if (tag) filter.tags = tag;
  if (q) filter.$text = { $search: q };
  if (overdue === "1") filter.dueDate = { $lt: new Date(), $ne: null };
  if (dueFrom || dueTo) {
    filter.dueDate = filter.dueDate || {};
    if (dueFrom) filter.dueDate.$gte = new Date(dueFrom);
    if (dueTo) filter.dueDate.$lte = new Date(dueTo);
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    Task.find(filter)
      .populate("assignee", "name email")
      .populate("reporter", "name email")
      .sort(sort)
      .skip(skip)
      .limit(Number(limit)),
    Task.countDocuments(filter),
  ]);

  res.json({
    items,
    total,
    page: Number(page),
    pageSize: Number(limit),
    pages: Math.ceil(total / Number(limit)),
  });
});

export const createTask = asyncHandler(async (req, res) => {
  const body = req.body || {};
  if (!isObjectId(body.project))
    return res.status(400).json({ message: "Invalid project" });
  if (!body.title)
    return res.status(400).json({ message: "Title is required" });

  const project = await Project.findOne({
    _id: body.project,
    "members.user": req.user.id,
  });
  if (!project)
    return res.status(403).json({ message: "No access to project" });

  const payload = pick(body, [
    "project",
    "title",
    "description",
    "status",
    "priority",
    "progress",
    "startDate",
    "dueDate",
    "assignee",
    "reporter",
    "tags",
    "checklist",
    "subtasks",
    "watchers",
  ]);

  const task = await Task.create({
    ...payload,
    reporter: payload.reporter || req.user.id,
    activityLog: [
      { actor: req.user.id, action: "created", meta: { title: payload.title } },
    ],
  });

  res.status(201).json(task);
});

export const updateTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isObjectId(id)) return res.status(400).json({ message: "Invalid id" });

  const task = await Task.findById(id);
  if (!task) return res.status(404).json({ message: "Task not found" });

  const project = await Project.findOne({
    _id: task.project,
    "members.user": req.user.id,
  });
  if (!project)
    return res.status(403).json({ message: "No access to project" });

  const before = {
    status: task.status,
    progress: task.progress,
    assignee: task.assignee,
    title: task.title,
  };

  const fields = pick(req.body, [
    "title",
    "description",
    "status",
    "priority",
    "progress",
    "startDate",
    "dueDate",
    "assignee",
    "tags",
    "checklist",
    "subtasks",
    "watchers",
  ]);

  Object.assign(task, fields);
  await task.save();

  const changes = {};
  ["status", "progress", "assignee", "title"].forEach((k) => {
    if (
      req.body[k] !== undefined &&
      String(before[k]) !== String(req.body[k])
    ) {
      changes[k] = { from: before[k], to: req.body[k] };
    }
  });
  if (Object.keys(changes).length) {
    task.activityLog.push({
      actor: req.user.id,
      action: "updated",
      meta: changes,
    });
    await task.save();
  }

  res.json(task);
});

export const deleteTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isObjectId(id)) return res.status(400).json({ message: "Invalid id" });

  const task = await Task.findById(id);
  if (!task) return res.status(404).json({ message: "Task not found" });

  const project = await Project.findOne({
    _id: task.project,
    "members.user": req.user.id,
  });
  if (!project)
    return res.status(403).json({ message: "No access to project" });

  await Task.deleteOne({ _id: id });
  res.json({ ok: true });
});

export const addComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content, mentions } = req.body || {};
  if (!isObjectId(id)) return res.status(400).json({ message: "Invalid id" });
  if (!content) return res.status(400).json({ message: "Content is required" });

  const task = await Task.findById(id);
  if (!task) return res.status(404).json({ message: "Task not found" });

  const project = await Project.findOne({
    _id: task.project,
    "members.user": req.user.id,
  });
  if (!project)
    return res.status(403).json({ message: "No access to project" });

  task.comments.push({
    author: req.user.id,
    content,
    mentions: mentions || [],
  });
  task.activityLog.push({ actor: req.user.id, action: "commented", meta: {} });
  await task.save();

  const populated = await Task.findById(id)
    .populate("comments.author", "name email")
    .populate("assignee", "name email")
    .populate("reporter", "name email");

  res.json(populated);
});

export const assignTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { assignee } = req.body;
  if (!isObjectId(id) || !isObjectId(assignee))
    return res.status(400).json({ message: "Invalid id" });

  const task = await Task.findById(id);
  if (!task) return res.status(404).json({ message: "Task not found" });

  const project = await Project.findById(task.project);
  if (!project) return res.status(404).json({ message: "Project not found" });

  if (!canAdminProject(project, req.user.id))
    return res.status(403).json({ message: "Forbidden" });

  const isMember = project.members.some(
    (m) => String(m.user) === String(assignee)
  );
  if (!isMember)
    return res.status(400).json({ message: "Assignee not in project" });

  const before = task.assignee;
  task.assignee = assignee;
  task.activityLog.push({
    actor: req.user.id,
    action: "assigned",
    meta: { from: before, to: assignee },
  });
  await task.save();

  const populated = await Task.findById(id).populate("assignee", "name email");
  res.json(populated);
});
