// src/routes/cardRoutes.ts
import express from "express";
import Card from "../models/Card";

const router = express.Router();

// ✅ POST: 新しいカードを作成
router.post("/", async (req, res) => {
  try {
    const { title, description, listId, position } = req.body;
    const newCard = new Card({ title, description, listId, position });
    await newCard.save();
    res.status(201).json(newCard);
  } catch (error) {
    res.status(500).json({ message: "Error creating card", error });
  }
});

// ✅ PUT: カードを更新
router.put("/:id", async (req, res) => {
  try {
    const updatedCard = await Card.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updatedCard);
  } catch (error) {
    res.status(500).json({ message: "Error updating card", error });
  }
});

// ✅ DELETE: カードを削除
router.delete("/:id", async (req, res) => {
  try {
    await Card.findByIdAndDelete(req.params.id);
    res.json({ message: "Card deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting card", error });
  }
});

export default router;
