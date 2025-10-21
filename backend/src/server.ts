// backend/src/server.ts
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import connectDB from "./db";
import boardRoutes from "./routes/boardRoutes";
import listRoutes from "./routes/listRoutes";
import cardRoutes from "./routes/cardRoutes";

dotenv.config();

// MongoDB接続
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/boards", boardRoutes);
app.use("/api/lists", listRoutes);
app.use("/api/cards", cardRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
