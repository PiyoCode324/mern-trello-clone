// src/routes/listRoutes.ts
import express from "express";
import List from "../models/List";

const router = express.Router();

// ✅ GET: boardId に紐づくリストを取得
router.get("/", async (req, res) => {
  try {
    const { boardId } = req.query;
    if (!boardId)
      return res.status(400).json({ message: "boardId is required" });

    const lists = await List.find({ boardId }).sort({ position: 1 });
    res.json(lists);
  } catch (error) {
    res.status(500).json({ message: "Error fetching lists", error });
  }
});

// ✅ POST: 新しいリストを作成
router.post("/", async (req, res) => {
  try {
    const { title, boardId, position } = req.body;
    const newList = new List({ title, boardId, position });
    await newList.save();
    res.status(201).json(newList);
  } catch (error) {
    res.status(500).json({ message: "Error creating list", error });
  }
});

export default router;
