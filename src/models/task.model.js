import mongoose from "mongoose";

const checklistItemSchema = new mongoose.Schema(
  { text: String, done: { type: Boolean, default: false } },
  { _id: false }
);

const subtaskSchema = new mongoose.Schema(
  { title: String, done: { type: Boolean, default: false } },
  { _id: false }
);

const commentSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: { type: String, required: true },
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const activitySchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true },
    meta: { type: Object, default: {} },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const taskSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: ["todo", "in_progress", "review", "done"],
      default: "todo",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    startDate: { type: Date, default: null },
    dueDate: { type: Date, default: null },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    tags: [{ type: String }],
    checklist: [checklistItemSchema],
    subtasks: [subtaskSchema],
    comments: [commentSchema],
    watchers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    activityLog: [activitySchema],
  },
  { timestamps: true }
);

taskSchema.index({ title: "text", description: "text", tags: 1 });

export default mongoose.model("tasks", taskSchema);
