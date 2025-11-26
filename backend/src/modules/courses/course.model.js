// course.model.js - ACTUALIZADO
import { Schema, model, Types } from "mongoose";

const OwnerSchema = new Schema(
  {
    _id: { type: Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true }
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

const ContentSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['video', 'document', 'quiz', 'assignment', 'text'],
    required: true
  },
  description: {
    type: String,
    default: ""
  },
  // ✅ CAMPOS DE ARCHIVO AGREGADOS
  fileUrl: {
    type: String,
    default: ""
  },
  fileName: {
    type: String,
    default: ""
  },
  filePath: {
    type: String,
    default: ""
  },
  fileSize: {
    type: Number,
    default: 0
  },
  instructions: {
    type: String,
    default: ""
  },
  duration: {
    type: Number, 
    default: 0
  },
  order: {
    type: Number,
    default: 0
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

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
    // NUEVO: Campos para el período del curso
  hasEndDate: { type: Boolean, default: false },
  enrollmentEndDate: { type: Date }, // Fecha límite para inscripción
  courseEndDate: { type: Date }, // Fecha de cierre del curso
  isClosed: { type: Boolean, default: false }, // Si el curso ya cerró
    instructors: [InstructorSchema],
    contents: [ContentSchema], 
    isPublished: {
      type: Boolean,
      default: false
    },
    price: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

export const Course = model("Course", CourseSchema);
export default Course;