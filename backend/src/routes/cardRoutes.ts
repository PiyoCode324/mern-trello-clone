// src/routes/cardRoutes.ts
import express from "express";
import Card from "../models/Card";
import List from "../models/List"; // 👈 List モデルをインポート

const router = express.Router();

// ✅ GET: listId または boardId に紐づくカードを取得 (修正箇所)
router.get("/", async (req, res) => {
  try {
    const { listId, boardId } = req.query;

    let query: any = {};

    if (listId) {
      // listId が指定された場合 (既存のロジック)
      query.listId = listId;
    } else if (boardId) {
      // boardId が指定された場合 (新規ロジック)
      // 1. boardId に紐づく全てのリストIDを取得
      const lists = await List.find({ boardId: boardId as string }, { _id: 1 });
      const listIds = lists.map((list) => list._id);

      // 2. 取得したリストIDのいずれかに紐づくカードを検索
      query.listId = { $in: listIds };

      if (listIds.length === 0) {
        // リストがない場合はカードもなし
        return res.json([]);
      }
    } else {
      // listId も boardId もない場合は 400 Bad Request を返す
      return res.status(400).json({ message: "listId or boardId is required" });
    }

    // 検索実行
    const cards = await Card.find(query).sort({ position: 1 });
    res.json(cards);
  } catch (error) {
    // ログに出力してデバッグしやすくする
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
