// src/routes/boardRoutes.ts
import express from "express";
import Board from "../models/Board";

const router = express.Router();

// ✅ GET: すべてのボードを取得
router.get("/", async (req, res) => {
  try {
    const boards = await Board.find();
    res.json(boards);
  } catch (error) {
    res.status(500).json({ message: "Error fetching boards", error });
  }
});

// ✅ POST: 新しいボードを作成
router.post("/", async (req, res) => {
  try {
    const { title, createdBy } = req.body;
    const newBoard = new Board({ title, createdBy });
    await newBoard.save();
    res.status(201).json(newBoard);
  } catch (error) {
    res.status(500).json({ message: "Error creating board", error });
  }
});

export default router;
