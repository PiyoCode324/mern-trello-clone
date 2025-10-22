// frontend/src/app/board/create/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateBoardPage() {
  const [title, setTitle] = useState("");
  const router = useRouter();

  const handleCreateBoard = () => {
    if (!title.trim()) return;

    // 仮のID生成：スペースをハイフンにして小文字化
    const boardId = title.trim().toLowerCase().replace(/\s+/g, "-");

    // /board/[id] に遷移
    router.push(`/board/${boardId}`);
  };

  return (
    <div className="p-6 min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-4">新しいボードを作成</h1>
      <input
        type="text"
        placeholder="ボードタイトル"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border p-2 rounded w-64 mb-4"
      />
      <button
        onClick={handleCreateBoard}
        className="bg-green-500 text-white px-4 py-2 rounded w-64"
      >
        作成
      </button>
    </div>
  );
}
