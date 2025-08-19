import Project from "../models/project.model.js";
import Task from "../models/task.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const myProjectIds = async (userId, scope, projectId) => {
  if (projectId) return [projectId];
  if (scope === "all") {
    // (Optional) thêm kiểm tra global admin tại đây nếu bạn có khái niệm global admin.
    const all = await Project.find({}).select("_id");
    return all.map((p) => p._id);
  }
  const projects = await Project.find({ "members.user": userId }).select("_id");
  return projects.map((p) => p._id);
};

export const overview = asyncHandler(async (req, res) => {
  const { scope = "mine", project, days = 30 } = req.query;
  const ids = await myProjectIds(req.user.id, scope, project);

  const filter = { project: { $in: ids } };
  const now = new Date();
  const soon = new Date();
  soon.setDate(now.getDate() + 7);

  const [
    total,
    byStatusAgg,
    byPriorityAgg,
    overdue,
    dueSoon,
    progressAvgAgg,
    byAssigneeAgg,
    completionTrendAgg,
  ] = await Promise.all([
    Task.countDocuments(filter),
    Task.aggregate([
      { $match: filter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Task.aggregate([
      { $match: filter },
      { $group: { _id: "$priority", count: { $sum: 1 } } },
    ]),
    Task.countDocuments({
      ...filter,
      dueDate: { $lt: now, $ne: null },
      status: { $ne: "done" },
    }),
    Task.countDocuments({ ...filter, dueDate: { $gte: now, $lte: soon } }),
    Task.aggregate([
      { $match: filter },
      { $group: { _id: null, avg: { $avg: "$progress" } } },
    ]),
    Task.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$assignee",
          todo: { $sum: { $cond: [{ $eq: ["$status", "todo"] }, 1, 0] } },
          in_progress: {
            $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] },
          },
          review: { $sum: { $cond: [{ $eq: ["$status", "review"] }, 1, 0] } },
          done: { $sum: { $cond: [{ $eq: ["$status", "done"] }, 1, 0] } },
        },
      },
    ]),
    // completion trend: count tasks whose latest status is done with updatedAt in last N days
    Task.aggregate([
      {
        $match: {
          ...filter,
          status: "done",
          updatedAt: { $gte: new Date(Date.now() - Number(days) * 86400000) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
          done: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const byStatus = Object.fromEntries(byStatusAgg.map((x) => [x._id, x.count]));
  const byPriority = Object.fromEntries(
    byPriorityAgg.map((x) => [x._id, x.count])
  );
  const progressAvg = progressAvgAgg[0]?.avg ?? 0;
  const byAssignee = byAssigneeAgg.map((x) => ({
    user: x._id, // frontend có thể gọi /users/:id để lấy tên/email
    todo: x.todo,
    in_progress: x.in_progress,
    review: x.review,
    done: x.done,
  }));
  const completionTrend = completionTrendAgg.map((x) => ({
    date: x._id,
    done: x.done,
  }));

  res.json({
    total,
    byStatus,
    byPriority,
    overdue,
    dueSoon,
    progressAvg,
    byAssignee,
    completionTrend,
  });
});

export const burndown = asyncHandler(async (req, res) => {
  const { project, start, end } = req.query;
  if (!project || !start || !end)
    return res.status(400).json({ message: "project, start, end required" });

  const startDate = new Date(start);
  const endDate = new Date(end);

  // Tính remaining = tổng task chưa done đến mỗi ngày
  // Cách đơn giản: lấy snapshot mỗi ngày dựa vào due/status hiện tại (xấp xỉ)
  const allTasks = await Task.find({ project }).select(
    "status createdAt updatedAt"
  );

  const dayMs = 86400000;
  const series = [];
  for (let t = startDate.getTime(); t <= endDate.getTime(); t += dayMs) {
    const d = new Date(t);
    const remaining = allTasks.filter((task) => task.status !== "done").length; // xấp xỉ
    series.push({ date: d.toISOString().slice(0, 10), remaining });
  }

  res.json({
    project,
    start: startDate.toISOString().slice(0, 10),
    end: endDate.toISOString().slice(0, 10),
    series,
  });
});
