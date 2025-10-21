// src/routes/listRoutes.ts
import express from "express";
import List from "../models/List";

const router = express.Router();

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
