// src/models/List.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IList extends Document {
  title: string;
  boardId: mongoose.Types.ObjectId;
  position: number;
}

const listSchema = new Schema<IList>({
  title: { type: String, required: true },
  boardId: { type: Schema.Types.ObjectId, ref: "Board", required: true },
  position: { type: Number, default: 0 },
});

export default mongoose.model<IList>("List", listSchema);
