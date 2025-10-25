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

// ✅ GET: ID指定でボードを取得
router.get("/:id", async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: "Board not found" });
    res.json(board);
  } catch (error) {
    res.status(500).json({ message: "Error fetching board", error });
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
