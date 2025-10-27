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

// ✏️ PUT: リストを更新
router.put("/:id", async (req, res) => {
  try {
    const updatedList = await List.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updatedList)
      return res.status(404).json({ message: "List not found" });
    res.json(updatedList);
  } catch (error) {
    res.status(500).json({ message: "Error updating list", error });
  }
});

// ❌ DELETE: リストを削除
router.delete("/:id", async (req, res) => {
  try {
    const deletedList = await List.findByIdAndDelete(req.params.id);
    if (!deletedList)
      return res.status(404).json({ message: "List not found" });
    res.json({ message: "List deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting list", error });
  }
});

// 🔄 PATCH: リストの並び替え (position 更新)
router.patch("/reorder", async (req, res) => {
  try {
    const { reorderedLists } = req.body; // [{_id, position}, ...]
    const bulkOps = reorderedLists.map((list: any) => ({
      updateOne: {
        filter: { _id: list._id },
        update: { position: list.position },
      },
    }));

    await List.bulkWrite(bulkOps);
    res.json({ message: "Lists reordered successfully" });
  } catch (error) {
    console.error("Error reordering lists:", error);
    res.status(500).json({ message: "Error reordering lists", error });
  }
});

export default router;
