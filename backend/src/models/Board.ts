// src/models/Board.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IBoard extends Document {
  title: string;
  createdBy: string; // Firebase UIDなど
  createdAt: Date;
}

const boardSchema = new Schema<IBoard>({
  title: { type: String, required: true },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IBoard>("Board", boardSchema);
