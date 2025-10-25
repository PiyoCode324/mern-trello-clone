// frontend/src/app/board/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { auth } from "@/lib/firebase";

interface Board {
  _id: string;
  title: string;
  createdBy: string;
  createdAt: string;
}

interface List {
  _id: string;
  title: string;
  position: number;
  boardId: string;
}

interface Card {
  _id: string;
  title: string;
  description?: string;
  listId: string;
  position: number;
}

export default function BoardPage() {
  const params = useParams();
  const boardId = Array.isArray(params.id)
    ? params.id[0]
    : params.id || "default-board";

  const [user, setUser] = useState(auth.currentUser);
  const [board, setBoard] = useState<Board | null>(null);
  const [lists, setLists] = useState<List[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [newListTitle, setNewListTitle] = useState("");
  const [newCardTitle, setNewCardTitle] = useState("");
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [editingCard, setEditingCard] = useState<Card | null>(null);

  // Firebase Auth 状態監視
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsubscribe();
  }, []);

  // ボードデータ取得
  useEffect(() => {
    if (!user) return;

    const fetchBoardData = async () => {
      try {
        console.log("Fetching board:", boardId);

        // ボード
        const boardRes = await fetch(
          `http://localhost:5000/api/boards/${boardId}`
        );
        if (!boardRes.ok)
          throw new Error(`Board fetch failed: ${boardRes.status}`);
        const boardData: Board = await boardRes.json();
        setBoard(boardData);

        // リスト
        const listsRes = await fetch(
          `http://localhost:5000/api/lists?boardId=${boardId}`
        );
        if (!listsRes.ok)
          throw new Error(`Lists fetch failed: ${listsRes.status}`);
        const listsData: List[] | any = await listsRes.json();
        if (!Array.isArray(listsData)) {
          console.error("Lists API did not return an array:", listsData);
          setLists([]);
        } else {
          setLists(listsData.sort((a, b) => a.position - b.position));
        }

        // カード
        const cardsRes = await fetch(
          `http://localhost:5000/api/cards?boardId=${boardId}`
        );
        if (!cardsRes.ok)
          throw new Error(`Cards fetch failed: ${cardsRes.status}`);
        const cardsData: Card[] | any = await cardsRes.json();
        if (!Array.isArray(cardsData)) {
          console.error("Cards API did not return an array:", cardsData);
          setCards([]);
        } else {
          setCards(cardsData.sort((a, b) => a.position - b.position));
        }
      } catch (error) {
        console.error("Fetch error:", error);
      }
    };

    fetchBoardData();
  }, [boardId, user]);

  // リスト追加
  const handleAddList = async () => {
    if (!newListTitle) return;
    try {
      const res = await fetch("http://localhost:5000/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newListTitle,
          boardId,
          position: lists.length,
        }),
      });
      const newList = await res.json();
      setLists([...lists, newList]);
      setNewListTitle("");
    } catch (error) {
      console.error(error);
    }
  };

  // カード追加
  const handleAddCard = async () => {
    if (!newCardTitle || !selectedListId) return;
    try {
      const res = await fetch("http://localhost:5000/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newCardTitle,
          listId: selectedListId,
          position: cards.filter((c) => c.listId === selectedListId).length,
        }),
      });
      const newCard = await res.json();
      setCards([...cards, newCard]);
      setNewCardTitle("");
      setSelectedListId(null);
    } catch (error) {
      console.error(error);
    }
  };

  // カード編集
  const handleEditCard = async () => {
    if (!editingCard) return;
    try {
      const res = await fetch(
        `http://localhost:5000/api/cards/${editingCard._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editingCard),
        }
      );
      const updatedCard = await res.json();
      setCards(cards.map((c) => (c._id === updatedCard._id ? updatedCard : c)));
      setEditingCard(null);
    } catch (error) {
      console.error(error);
    }
  };

  // カード削除
  const handleDeleteCard = async (cardId: string) => {
    try {
      await fetch(`http://localhost:5000/api/cards/${cardId}`, {
        method: "DELETE",
      });
      setCards(cards.filter((c) => c._id !== cardId));
      setEditingCard(null);
    } catch (error) {
      console.error(error);
    }
  };

  // ドラッグ＆ドロップ
  const onDragEnd = async (result: DropResult) => {
    const { destination, draggableId } = result;
    if (!destination) return;

    const card = cards.find((c) => c._id === draggableId);
    if (!card) return;

    const updatedCard = {
      ...card,
      listId: destination.droppableId,
      position: destination.index,
    };

    setCards((prev) => {
      const filtered = prev.filter((c) => c._id !== draggableId);
      filtered.push(updatedCard);
      return filtered;
    });

    try {
      await fetch(`http://localhost:5000/api/cards/${draggableId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedCard),
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-4">
        {board ? board.title : "Loading..."}
      </h1>

      <div className="flex gap-4 overflow-x-auto">
        <DragDropContext onDragEnd={onDragEnd}>
          {lists.map((list) => (
            <Droppable key={list._id} droppableId={list._id}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="bg-white p-4 rounded shadow w-64 flex-shrink-0"
                >
                  <h2 className="font-bold mb-2">{list.title}</h2>

                  {cards
                    .filter((c) => c.listId === list._id)
                    .sort((a, b) => a.position - b.position)
                    .map((card, index) => (
                      <Draggable
                        key={card._id}
                        draggableId={card._id}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="bg-gray-50 p-2 rounded mb-2 shadow cursor-pointer"
                            onClick={() => setEditingCard(card)}
                          >
                            {card.title}
                          </div>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}

                  <input
                    type="text"
                    placeholder="カード追加"
                    value={selectedListId === list._id ? newCardTitle : ""}
                    onChange={(e) => {
                      setSelectedListId(list._id);
                      setNewCardTitle(e.target.value);
                    }}
                    className="border p-1 rounded w-full mb-1"
                    spellCheck={false}
                    data-ms-editor={undefined}
                  />
                  <button
                    onClick={handleAddCard}
                    className="bg-blue-500 text-white px-2 py-1 rounded w-full"
                  >
                    Add Card
                  </button>
                </div>
              )}
            </Droppable>
          ))}

          <div className="bg-white p-4 rounded shadow w-64 flex-shrink-0">
            <input
              type="text"
              placeholder="新しいリスト"
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
              className="border p-2 rounded w-full mb-2"
              spellCheck={false}
              data-ms-editor={undefined}
            />
            <button
              onClick={handleAddList}
              className="bg-green-500 text-white px-4 py-2 rounded w-full"
            >
              Add List
            </button>
          </div>
        </DragDropContext>
      </div>

      {editingCard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-4 rounded shadow w-96">
            <h3 className="text-xl font-bold mb-2">Edit Card</h3>
            <input
              type="text"
              value={editingCard.title}
              onChange={(e) =>
                setEditingCard({ ...editingCard, title: e.target.value })
              }
              className="border p-2 rounded w-full mb-2"
              spellCheck={false}
              data-ms-editor={undefined}
            />
            <textarea
              value={editingCard.description || ""}
              onChange={(e) =>
                setEditingCard({ ...editingCard, description: e.target.value })
              }
              className="border p-2 rounded w-full mb-2"
              spellCheck={false}
              data-ms-editor={undefined}
            />
            <div className="flex gap-2">
              <button
                onClick={handleEditCard}
                className="bg-blue-500 text-white px-4 py-2 rounded flex-1"
              >
                Save
              </button>
              <button
                onClick={() => handleDeleteCard(editingCard._id)}
                className="bg-red-500 text-white px-4 py-2 rounded flex-1"
              >
                Delete
              </button>
              <button
                onClick={() => setEditingCard(null)}
                className="bg-gray-300 px-4 py-2 rounded flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
