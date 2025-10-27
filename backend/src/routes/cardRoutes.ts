// src/routes/cardRoutes.ts
import express from "express";
import Card from "../models/Card";
import List from "../models/List";

const router = express.Router();

// ✅ GET: listId または boardId に紐づくカードを取得
router.get("/", async (req, res) => {
  try {
    const { listId, boardId } = req.query;
    let query: any = {};

    if (listId) {
      query.listId = listId;
    } else if (boardId) {
      const lists = await List.find({ boardId: boardId as string }, { _id: 1 });
      const listIds = lists.map((list) => list._id);
      if (listIds.length === 0) return res.json([]);
      query.listId = { $in: listIds };
    } else {
      return res.status(400).json({ message: "listId or boardId is required" });
    }

    const cards = await Card.find(query).sort({ position: 1 });
    res.json(cards);
  } catch (error) {
    console.error("Error fetching cards:", error);
    res.status(500).json({ message: "Error fetching cards", error });
  }
});

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

// ✏️ PUT: カードを更新
router.put("/:id", async (req, res) => {
  try {
    const updatedCard = await Card.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updatedCard)
      return res.status(404).json({ message: "Card not found" });
    res.json(updatedCard);
  } catch (error) {
    res.status(500).json({ message: "Error updating card", error });
  }
});

// ❌ DELETE: カードを削除
router.delete("/:id", async (req, res) => {
  try {
    const deletedCard = await Card.findByIdAndDelete(req.params.id);
    if (!deletedCard)
      return res.status(404).json({ message: "Card not found" });
    res.json({ message: "Card deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting card", error });
  }
});

export default router;
