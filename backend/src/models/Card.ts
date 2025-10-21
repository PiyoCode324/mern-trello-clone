// src/models/Card.ts
import mongoose, { Schema, Document } from "mongoose";

export interface ICard extends Document {
  title: string;
  description?: string;
  listId: mongoose.Types.ObjectId;
  position: number;
}

const cardSchema = new Schema<ICard>({
  title: { type: String, required: true },
  description: { type: String },
  listId: { type: Schema.Types.ObjectId, ref: "List", required: true },
  position: { type: Number, default: 0 },
});

export default mongoose.model<ICard>("Card", cardSchema);
