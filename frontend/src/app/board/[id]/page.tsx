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
  const [editingList, setEditingList] = useState<List | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchBoardData = async () => {
      try {
        const [boardRes, listsRes, cardsRes] = await Promise.all([
          fetch(`http://localhost:5000/api/boards/${boardId}`),
          fetch(`http://localhost:5000/api/lists?boardId=${boardId}`),
          fetch(`http://localhost:5000/api/cards?boardId=${boardId}`),
        ]);

        const boardData = await boardRes.json();
        const listsData = await listsRes.json();
        const cardsData = await cardsRes.json();

        setBoard(boardData);
        setLists(listsData.sort((a: List, b: List) => a.position - b.position));
        setCards(cardsData.sort((a: Card, b: Card) => a.position - b.position));
      } catch (error) {
        console.error("Fetch error:", error);
      }
    };

    fetchBoardData();
  }, [boardId, user]);

  const handleAddList = async () => {
    if (!newListTitle.trim()) return;
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

  const handleEditList = async () => {
    if (!editingList) return;
    try {
      const res = await fetch(
        `http://localhost:5000/api/lists/${editingList._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editingList),
        }
      );
      const updatedList = await res.json();
      setLists(lists.map((l) => (l._id === updatedList._id ? updatedList : l)));
      setEditingList(null);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteList = async (listId: string) => {
    try {
      await fetch(`http://localhost:5000/api/lists/${listId}`, {
        method: "DELETE",
      });
      setLists(lists.filter((l) => l._id !== listId));
      setCards(cards.filter((c) => c.listId !== listId));
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddCard = async () => {
    if (!newCardTitle.trim() || !selectedListId) return;
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

  const handleDeleteCard = async (cardId: string) => {
    try {
      await fetch(`http://localhost:5000/api/cards/${cardId}`, {
        method: "DELETE",
      });
      setCards(cards.filter((c) => c._id !== cardId));
    } catch (error) {
      console.error(error);
    }
  };

  // ✅ 改良版: ドラッグ&ドロップ
  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId, type } = result;
    if (!destination) return;

    // リストの並び替え
    if (type === "list") {
      const newLists = Array.from(lists);
      const [movedList] = newLists.splice(source.index, 1);
      newLists.splice(destination.index, 0, movedList);
      const reorderedLists = newLists.map((l, i) => ({ ...l, position: i }));
      setLists(reorderedLists);

      try {
        await fetch(`http://localhost:5000/api/lists/reorder`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reorderedLists: reorderedLists.map(({ _id, position }) => ({
              _id,
              position,
            })),
          }),
        });
      } catch (err) {
        console.error("List reorder failed:", err);
      }
      return;
    }

    // カードの並び替え・移動
    const draggedCard = cards.find((c) => c._id === draggableId);
    if (!draggedCard) return;

    const updatedCards = Array.from(cards);
    const sourceListCards = updatedCards
      .filter((c) => c.listId === source.droppableId)
      .sort((a, b) => a.position - b.position);
    const destListCards = updatedCards
      .filter((c) => c.listId === destination.droppableId)
      .sort((a, b) => a.position - b.position);

    const [movedCard] = sourceListCards.splice(source.index, 1);
    movedCard.listId = destination.droppableId;
    destListCards.splice(destination.index, 0, movedCard);

    const reorderedSource = sourceListCards.map((c, i) => ({
      ...c,
      position: i,
    }));
    const reorderedDest = destListCards.map((c, i) => ({
      ...c,
      position: i,
    }));

    const finalCards = updatedCards.map((c) => {
      const s = reorderedSource.find((x) => x._id === c._id);
      const d = reorderedDest.find((x) => x._id === c._id);
      return s || d || c;
    });

    setCards(finalCards);

    // 変更のあったカードだけを送信
    const changedCards = [...reorderedSource, ...reorderedDest].map(
      ({ _id, listId, position }) => ({ _id, listId, position })
    );

    try {
      await fetch(`http://localhost:5000/api/cards/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reorderedCards: changedCards }),
      });
    } catch (error) {
      console.error("Card reorder failed:", error);
    }
  };

  return (
    <div className="p-6 min-h-screen bg-neutral-100">
      <h1 className="text-3xl font-bold mb-6">
        {board ? board.title : "Loading..."}
      </h1>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="all-lists" direction="horizontal" type="list">
          {(provided) => (
            <div
              className="flex gap-4 overflow-x-auto"
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {lists.map((list, listIndex) => (
                <Draggable
                  key={list._id}
                  draggableId={list._id}
                  index={listIndex}
                >
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="bg-white p-4 rounded-2xl shadow w-64 flex-shrink-0"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h2
                          className="font-bold cursor-pointer"
                          onClick={() => setEditingList(list)}
                        >
                          {list.title}
                        </h2>
                        <button
                          onClick={() => handleDeleteList(list._id)}
                          className="text-red-500 text-sm"
                        >
                          ✕
                        </button>
                      </div>

                      <Droppable droppableId={list._id} type="card">
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="space-y-2 min-h-[20px]"
                          >
                            {cards
                              .filter((c) => c.listId === list._id)
                              .sort((a, b) => a.position - b.position)
                              .map((card, cardIndex) => (
                                <Draggable
                                  key={card._id}
                                  draggableId={card._id}
                                  index={cardIndex}
                                >
                                  {(provided) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className="bg-gray-50 p-2 rounded-md shadow-sm hover:bg-gray-100 cursor-grab active:cursor-grabbing"
                                      onClick={() => setEditingCard(card)}
                                    >
                                      {card.title}
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>

                      <input
                        type="text"
                        spellCheck={false}
                        placeholder="カードを追加"
                        value={selectedListId === list._id ? newCardTitle : ""}
                        onChange={(e) => {
                          setSelectedListId(list._id);
                          setNewCardTitle(e.target.value);
                        }}
                        className="border p-1 rounded w-full mb-1 text-sm"
                      />
                      <button
                        onClick={handleAddCard}
                        className="bg-blue-500 text-white text-sm px-2 py-1 rounded w-full"
                      >
                        Add Card
                      </button>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}

              <div className="bg-white p-4 rounded-lg shadow w-64 flex-shrink-0">
                <input
                  type="text"
                  spellCheck={false}
                  placeholder="新しいリスト名"
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  className="border p-2 rounded w-full mb-2 text-sm"
                />
                <button
                  onClick={handleAddList}
                  className="bg-green-500 text-white text-sm px-4 py-2 rounded w-full"
                >
                  Add List
                </button>
              </div>
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* ✅ 編集モーダル群 */}
      {editingCard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-4 rounded shadow w-96">
            <h3 className="text-xl font-bold mb-2">Edit Card</h3>
            <input
              type="text"
              spellCheck={false}
              value={editingCard.title}
              onChange={(e) =>
                setEditingCard({ ...editingCard, title: e.target.value })
              }
              className="border p-2 rounded w-full mb-2"
            />
            <textarea
              value={editingCard.description || ""}
              onChange={(e) =>
                setEditingCard({ ...editingCard, description: e.target.value })
              }
              className="border p-2 rounded w-full mb-2"
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

      {editingList && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-4 rounded shadow w-96">
            <h3 className="text-xl font-bold mb-2">Edit List</h3>
            <input
              type="text"
              spellCheck={false}
              value={editingList.title}
              onChange={(e) =>
                setEditingList({ ...editingList, title: e.target.value })
              }
              className="border p-2 rounded w-full mb-2"
            />
            <div className="flex gap-2">
              <button
                onClick={handleEditList}
                className="bg-blue-500 text-white px-4 py-2 rounded flex-1"
              >
                Save
              </button>
              <button
                onClick={() => handleDeleteList(editingList._id)}
                className="bg-red-500 text-white px-4 py-2 rounded flex-1"
              >
                Delete
              </button>
              <button
                onClick={() => setEditingList(null)}
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
