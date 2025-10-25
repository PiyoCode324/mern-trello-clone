// frontend/src/app/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, logout } from "@/lib/firebase"; // logout 関数を firebase.ts に作る
import { onAuthStateChanged, signOut } from "firebase/auth";

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
        fetchBoards(currentUser.uid);
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, []);

  // ボード一覧取得（自分のUIDで絞り込み）
  const fetchBoards = async (uid: string) => {
    try {
      const res = await fetch("http://localhost:5000/api/boards");
      const data: Board[] = await res.json();
      // 自分のボードだけ取得
      const myBoards = data.filter((b) => b.createdBy === uid);
      setBoards(
        myBoards.sort(
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
    if (!newBoardTitle.trim() || !user) return;
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

  // ログアウト処理
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Workspaces</h1>
        <div className="flex items-center gap-4">
          {user && (
            <>
              <span className="text-gray-600 text-sm">
                Logged in as: <strong>{user.email}</strong>
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>

      {/* Starred Boards (ダミー表示) */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Starred Boards</h2>
        <p className="text-gray-500 text-sm">
          お気に入りのボードがここに表示されます。
        </p>
      </section>

      {/* My Boards セクション */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">My Boards</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {boards.map((board) => (
            <div
              key={board._id}
              onClick={() => router.push(`/board/${board._id}`)}
              className="p-6 bg-white rounded-lg shadow hover:shadow-md cursor-pointer transition"
            >
              <h3 className="font-medium text-gray-800">{board.title}</h3>
            </div>
          ))}

          {/* Create New Board */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="p-6 bg-gray-200 rounded-lg hover:bg-gray-300 flex items-center justify-center text-gray-600 font-medium transition"
          >
            + Create new board
          </button>
        </div>
      </section>

      {/* モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow w-96">
            <h2 className="text-xl font-bold mb-4">Create New Board</h2>

            <input
              type="text"
              placeholder="ボード名を入力"
              value={newBoardTitle}
              onChange={(e) => setNewBoardTitle(e.target.value)}
              className="border p-2 rounded w-full mb-4"
            />

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBoard}
                className="px-4 py-2 rounded bg-green-500 hover:bg-green-600 text-white"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
