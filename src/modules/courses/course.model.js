// src/models/course.model.ts
import e from "express";
import { Schema, model, Types } from "mongoose";

const OwnerSchema = new Schema(
  {
    _id: { type: Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const CourseSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    category: { type: String, default: "General" },
    level: { type: String, enum: ["Principiante", "Intermedio", "Avanzado"], default: "Principiante" },
    duration: { type: String, default: "Auto-guiado" },
    thumbnail: { type: String, default: "" },
    owner: {
      type: OwnerSchema,
      required: true, // <- Siempre debe existir
    },
  },
  { timestamps: true }
);

export const Course = model("Course", CourseSchema);
export default Course;