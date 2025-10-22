// frontend/src/app/board/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";

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
  // URLにIDがなくてもデフォルト値を設定
  const boardId = Array.isArray(params.id)
    ? params.id[0]
    : params.id || "default-board";

  const [lists, setLists] = useState<List[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [newListTitle, setNewListTitle] = useState("");
  const [newCardTitle, setNewCardTitle] = useState("");
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [editingCard, setEditingCard] = useState<Card | null>(null);

  // モックデータで動作確認
  useEffect(() => {
    const mockLists: List[] = [
      { _id: "list1", title: "Todo", position: 0, boardId },
      { _id: "list2", title: "In Progress", position: 1, boardId },
      { _id: "list3", title: "Done", position: 2, boardId },
    ];
    const mockCards: Card[] = [
      { _id: "card1", title: "タスクA", listId: "list1", position: 0 },
      { _id: "card2", title: "タスクB", listId: "list1", position: 1 },
      { _id: "card3", title: "タスクC", listId: "list2", position: 0 },
    ];

    setLists(mockLists);
    setCards(mockCards);
  }, [boardId]);

  const handleAddList = () => {
    if (!newListTitle) return;
    const newList: List = {
      _id: `list${lists.length + 1}`,
      title: newListTitle,
      position: lists.length,
      boardId,
    };
    setLists([...lists, newList]);
    setNewListTitle("");
  };

  const handleAddCard = () => {
    if (!newCardTitle || !selectedListId) return;
    const newCard: Card = {
      _id: `card${cards.length + 1}`,
      title: newCardTitle,
      listId: selectedListId,
      position: cards.filter((c) => c.listId === selectedListId).length,
    };
    setCards([...cards, newCard]);
    setNewCardTitle("");
    setSelectedListId(null);
  };

  const handleDeleteCard = (cardId: string) => {
    setCards(cards.filter((c) => c._id !== cardId));
    setEditingCard(null);
  };

  const handleEditCard = () => {
    if (!editingCard) return;
    setCards(cards.map((c) => (c._id === editingCard._id ? editingCard : c)));
    setEditingCard(null);
  };

  const onDragEnd = (result: DropResult) => {
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
  };

  return (
    <div className="p-6 min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-4">Board: {boardId}</h1>
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
    </div>
  );
}
