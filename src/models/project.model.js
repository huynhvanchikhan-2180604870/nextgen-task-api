import mongoose from "mongoose";

const memberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: {
      type: String,
      enum: ["owner", "admin", "member", "viewer"],
      default: "member",
    },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    key: {
      type: String,
      required: true,
      uppercase: true,
      unique: true,
      trim: true,
    },
    description: { type: String, default: "" },
    columns: {
      type: [String],
      default: ["Todo", "In Progress", "Review", "Done"],
    },
    members: { type: [memberSchema], default: [] },
  },
  { timestamps: true }
);

projectSchema.index({ name: "text", key: "text" });

export default mongoose.model("projects", projectSchema);
