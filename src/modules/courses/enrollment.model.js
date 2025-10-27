import mongoose from "mongoose";
const { Schema, Types } = mongoose;

const EnrollmentSchema = new Schema(
  {
    courseId: { type: Types.ObjectId, ref: "Course", required: true, index: true },
    studentId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    completedContentIds: [{ type: Types.ObjectId, ref: "Content" }],
    lastAccessAt: { type: Date },
  },
  { timestamps: true }
);

// Un alumno no puede inscribirse dos veces al mismo curso
EnrollmentSchema.index({ courseId: 1, studentId: 1 }, { unique: true });

export default mongoose.model("Enrollment", EnrollmentSchema);
