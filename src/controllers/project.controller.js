import { canAdminProject } from "../middleware/rbac.js";
import Project from "../models/project.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isObjectId } from "../utils/validate.js";

export const createProject = asyncHandler(async (req, res) => {
  const { name, key, description, columns } = req.body;
  if (!name || !key)
    return res.status(400).json({ message: "Missing name/key" });

  const project = await Project.create({
    name,
    key,
    description,
    columns: columns?.length ? columns : undefined,
    members: [{ user: req.user.id, role: "owner" }],
  });
  res.status(201).json(project);
});

export const listMyProjects = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const text = q ? { $text: { $search: q } } : {};
  const projects = await Project.find({
    ...text,
    "members.user": req.user.id,
  }).sort({ updatedAt: -1 });
  res.json(projects);
});

export const getProject = asyncHandler(async (req, res) => {
  if (!isObjectId(req.params.id))
    return res.status(400).json({ message: "Invalid id" });
  const project = await Project.findOne({
    _id: req.params.id,
    "members.user": req.user.id,
  });
  if (!project) return res.status(404).json({ message: "Project not found" });
  res.json(project);
});

export const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: "Project not found" });
  if (!canAdminProject(project, req.user.id))
    return res.status(403).json({ message: "Forbidden" });

  ["name", "description", "columns"].forEach((k) => {
    if (req.body[k] !== undefined) project[k] = req.body[k];
  });
  await project.save();
  res.json(project);
});

export const addOrUpdateMember = asyncHandler(async (req, res) => {
  const { userId, role } = req.body;
  if (!isObjectId(req.params.id) || !isObjectId(userId))
    return res.status(400).json({ message: "Invalid id" });

  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: "Project not found" });
  if (!canAdminProject(project, req.user.id))
    return res.status(403).json({ message: "Forbidden" });

  const idx = project.members.findIndex(
    (m) => String(m.user) === String(userId)
  );
  if (idx >= 0) project.members[idx].role = role || project.members[idx].role;
  else project.members.push({ user: userId, role: role || "member" });

  await project.save();
  res.json(project.members);
});

export const removeMember = asyncHandler(async (req, res) => {
  const { id, userId } = req.params;

  const project = await Project.findById(id);
  if (!project) return res.status(404).json({ message: "Project not found" });
  if (!canAdminProject(project, req.user.id))
    return res.status(403).json({ message: "Forbidden" });

  const member = project.members.find((m) => String(m.user) === String(userId));
  if (member?.role === "owner")
    return res.status(400).json({ message: "Cannot remove owner" });

  project.members = project.members.filter(
    (m) => String(m.user) !== String(userId)
  );
  await project.save();
  res.json(project.members);
});
