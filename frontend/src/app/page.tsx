// front/src/app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

interface Board {
  _id: string;
  title: string;
  createdBy: string;
  createdAt: string;
}

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState("");

  // ログイン状態の保持
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchBoards();
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, []);

  // ボード一覧取得
  const fetchBoards = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/boards");
      const data: Board[] = await res.json();
      // 最近作成順にソート
      setBoards(
        data.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
    } catch (error) {
      console.error(error);
    }
  };

  // ボード作成
  const handleCreateBoard = async () => {
    if (!newBoardTitle) return;
    try {
      const res = await fetch("http://localhost:5000/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newBoardTitle, createdBy: user.uid }),
      });
      const newBoard = await res.json();
      setBoards([newBoard, ...boards]);
      setNewBoardTitle("");
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">ホーム</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg"
        >
          Switch Board
        </button>
      </div>

      {/* ボード一覧 */}
      <div className="grid grid-cols-3 gap-4">
        {boards.map((board) => (
          <div
            key={board._id}
            className="p-4 bg-white rounded shadow cursor-pointer hover:bg-gray-50"
            onClick={() => router.push(`/board/${board._id}`)}
          >
            {board.title}
          </div>
        ))}
      </div>

      {/* モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow w-96">
            <h2 className="text-xl font-bold mb-4">Switch Board</h2>
            <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
              {boards.map((board) => (
                <button
                  key={board._id}
                  className="w-full text-left p-2 rounded hover:bg-gray-100"
                  onClick={() => {
                    router.push(`/board/${board._id}`);
                    setIsModalOpen(false);
                  }}
                >
                  {board.title}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="新しいボード名"
                value={newBoardTitle}
                onChange={(e) => setNewBoardTitle(e.target.value)}
                className="flex-1 border p-2 rounded"
              />
              <button
                onClick={handleCreateBoard}
                className="bg-green-500 text-white px-4 py-2 rounded"
              >
                Create
              </button>
            </div>
            <button
              onClick={() => setIsModalOpen(false)}
              className="mt-4 text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
