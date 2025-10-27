import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },             // <-- NUEVO
    username: { type: String, required: true, trim: true, unique: true },
    email: { type: String, required: true, trim: true, unique: true },
    password: { type: String, required: true },
    role: {                                                         // <-- NUEVO
      type: String,
      enum: ["admin", "profesor", "alumno"],
      default: "alumno",
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
