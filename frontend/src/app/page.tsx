// frontend/src/app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { api } from "@/lib/api";

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
  const [boardToDelete, setBoardToDelete] = useState<Board | null>(null);

  // ログイン状態の監視
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
  }, [router]);

  // ボード一覧取得
  const fetchBoards = async (uid: string) => {
    try {
      const data: Board[] = await api.getBoards(); // 一覧取得用に api 関数調整が必要
      const myBoards = data.filter((b) => b.createdBy === uid);
      setBoards(
        myBoards.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
    } catch (error) {
      console.error("Failed to fetch boards:", error);
    }
  };

  // ボード作成
  const handleCreateBoard = async () => {
    if (!newBoardTitle.trim() || !user) return;
    try {
      const newBoard = await api.createBoard({
        title: newBoardTitle,
        createdBy: user.uid,
      });
      setBoards([newBoard, ...boards]);
      setNewBoardTitle("");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to create board:", error);
    }
  };

  // ボード削除
  const handleDeleteBoard = async (board: Board) => {
    try {
      await api.deleteBoard(board._id);
      setBoards(boards.filter((b) => b._id !== board._id));
      setBoardToDelete(null);
    } catch (error) {
      console.error("Failed to delete board:", error);
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

      {/* My Boards */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">My Boards</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {boards.map((board) => (
            <div
              key={board._id}
              className="relative p-6 bg-white rounded-lg shadow hover:shadow-lg hover:-translate-y-1 transition-transform duration-200 cursor-pointer group"
              onClick={(e) => {
                const target = e.target as HTMLElement;
                if (!target.closest("button")) {
                  router.push(`/board/${board._id}`);
                }
              }}
            >
              <h3 className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                {board.title}
              </h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setBoardToDelete(board);
                }}
                className="absolute top-2 right-2 text-gray-400 hover:text-red-600 transition-colors font-bold"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            onClick={() => setIsModalOpen(true)}
            className="p-6 bg-gray-200 rounded-lg hover:bg-gray-300 flex items-center justify-center text-gray-600 font-medium transition"
          >
            + Create new board
          </button>
        </div>
      </section>

      {/* Create Board Modal */}
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

      {/* Delete Board Confirmation Modal */}
      {boardToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow w-96">
            <h2 className="text-xl font-bold mb-4">
              Delete Board "{boardToDelete.title}"?
            </h2>
            <p className="mb-4 text-gray-600">
              このボードを削除すると、リストやカードもすべて削除されます。
              本当に削除しますか？
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setBoardToDelete(null)}
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteBoard(boardToDelete)}
                className="px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
