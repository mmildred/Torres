import mongoose from "mongoose";
const { Schema, Types } = mongoose;

const ContentSchema = new Schema(
  {
    courseId: { type: Types.ObjectId, ref: "Course", required: true, index: true },
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: ["text", "link", "file"], required: true },
    text: { type: String, default: "" },       // si type=text
    url: { type: String, default: "" },        // si type=link
    filePath: { type: String, default: "" },   // si type=file
    order: { type: Number, default: 0, index: true },
    durationMinutes: { type: Number, default: 0 }, // para estimar progreso
  },
  { timestamps: true }
);

export default mongoose.model("Content", ContentSchema);
