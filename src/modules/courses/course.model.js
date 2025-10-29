import { Schema, model, Types } from "mongoose";

const OwnerSchema = new Schema(
  {
    _id: { type: Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true } // Agregar el rol
  },
  { _id: false }
);

const InstructorSchema = new Schema(
  {
    _id: { type: Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    role: { type: String, required: true }
  },
  { _id: false }
);

const CourseSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    category: { type: String, default: "General" },
    level: { 
      type: String, 
      enum: ["beginner", "intermediate", "advanced", "Principiante", "Intermedio", "Avanzado"], 
      default: "beginner" 
    },
    duration: { type: String, default: "Auto-guiado" },
    thumbnail: { type: String, default: "" },
    owner: {
      type: OwnerSchema,
      required: true,
    },
    instructors: [InstructorSchema], // Array de instructores
    contents: [{ // Mantener tu estructura existente
      name: String,
      path: String,
      size: Number
    }]
  },
  { timestamps: true }
);

export const Course = model("Course", CourseSchema);
export default Course;