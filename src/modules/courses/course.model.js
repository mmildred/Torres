import mongoose from "mongoose";
const { Schema, Types } = mongoose;

const OwnerSchema = new Schema(
  {
    _id: { type: Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ["admin", "profesor"], required: true },
  },
  { _id: false }
);

const CourseSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    category: { type: String, default: "General" },
    level: { type: String, enum: ["Principiante", "Intermedio", "Avanzado"], default: "Principiante" },
    thumbnail: { type: String, default: "" },
    owner: { type: OwnerSchema, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Course", CourseSchema);