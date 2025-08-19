import User from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listUsers = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const filter = q
    ? { $or: [{ name: new RegExp(q, "i") }, { email: new RegExp(q, "i") }] }
    : {};
  const users = await User.find(filter).select("_id name email role active");
  res.json(users);
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select(
    "_id name email role active"
  );
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});
