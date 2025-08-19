import mongoose from "mongoose";

export const isObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const pick = (obj, keys) =>
  keys.reduce((acc, k) => {
    if (obj[k] !== undefined) acc[k] = obj[k];
    return acc;
  }, {});
