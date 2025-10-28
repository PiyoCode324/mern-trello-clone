// frontend/src/app/board/[id]/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DroppableProvided,
  DroppableStateSnapshot,
  DraggableProvided,
  DraggableStateSnapshot,
} from "@hello-pangea/dnd";
import { auth } from "@/lib/firebase";
import { api } from "@/lib/api"; // apiモジュールが適切に定義されていることを前提とします

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // refs to avoid unwanted repeated fetches / track last fetched board
  const lastFetchedBoardIdRef = useRef<string | null>(null);
  const isFetchingRef = useRef(false);

  // --- 認証 --- (listen for auth change; set user)
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
      // If user becomes available and we haven't fetched for this board yet, fetch
      if (
        u &&
        lastFetchedBoardIdRef.current !== boardId &&
        !isFetchingRef.current
      ) {
        fetchBoardData().catch((e) => {
          console.error("fetchBoardData after auth change failed:", e);
        });
      }
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  // --- データ取得関数（再利用できるよう外に定義） ---
  const fetchBoardData = async () => {
    // avoid concurrent fetches
    if (isFetchingRef.current) return;
    if (!auth.currentUser) return; // require authenticated user
    isFetchingRef.current = true;
    try {
      const [boardData, listsData, cardsData] = await Promise.all([
        api.getBoard(boardId),
        api.getLists(boardId),
        api.getCards(boardId),
      ]);
      setBoard(boardData);
      setLists(listsData.sort((a: List, b: List) => a.position - b.position));
      setCards(cardsData.sort((a: Card, b: Card) => a.position - b.position));
      lastFetchedBoardIdRef.current = boardId;
    } catch (error: any) {
      console.error("Fetch error:", error);
      setErrorMessage("ボードデータの取得に失敗しました");
    } finally {
      isFetchingRef.current = false;
    }
  };

  // 初回または boardId が変わったときに取得。user がまだ null の場合は auth.onAuthStateChanged 側で取得される。
  useEffect(() => {
    if (!auth.currentUser) return;
    fetchBoardData().catch((e) => {
      console.error("fetchBoardData on boardId change failed:", e);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  // --- リスト操作 ---
  const handleAddList = async () => {
    if (!newListTitle.trim()) return;
    try {
      const newList = await api.createList({
        title: newListTitle,
        boardId,
        // position は現在のリストの数（末尾）
        position: lists.length,
      });
      setLists([...lists, newList]);
      setNewListTitle("");
    } catch (error: any) {
      setErrorMessage(error?.message || "リスト作成に失敗しました");
    }
  };

  const handleEditList = async () => {
    if (!editingList) return;
    try {
      const updatedList = await api.updateList(editingList._id, editingList);
      setLists(lists.map((l) => (l._id === updatedList._id ? updatedList : l)));
      setEditingList(null);
    } catch (error: any) {
      setErrorMessage(error?.message || "リスト更新に失敗しました");
    }
  };

  const handleDeleteList = async (listId: string) => {
    try {
      await api.deleteList(listId);
      setLists(lists.filter((l) => l._id !== listId));
      setCards(cards.filter((c) => c.listId !== listId));
      if (editingList?._id === listId) setEditingList(null);
    } catch (error: any) {
      setErrorMessage(error?.message || "リスト削除に失敗しました");
    }
  };

  // --- カード操作 ---
  const handleAddCard = async () => {
    if (!newCardTitle.trim() || !selectedListId) return;
    try {
      const newCard = await api.createCard({
        title: newCardTitle,
        listId: selectedListId,
        // position は現在のリスト内のカードの数（末尾）
        position: cards.filter((c) => c.listId === selectedListId).length,
      });
      setCards([...cards, newCard]);
      setNewCardTitle("");
      setSelectedListId(null);
    } catch (error: any) {
      setErrorMessage(error?.message || "カード作成に失敗しました");
    }
  };

  const handleEditCard = async () => {
    if (!editingCard) return;
    try {
      const updatedCard = await api.updateCard(editingCard._id, editingCard);
      setCards(cards.map((c) => (c._id === updatedCard._id ? updatedCard : c)));
      setEditingCard(null);
    } catch (error: any) {
      setErrorMessage(error?.message || "カード更新に失敗しました");
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      await api.deleteCard(cardId);
      setCards(cards.filter((c) => c._id !== cardId));
      if (editingCard?._id === cardId) setEditingCard(null);
    } catch (error: any) {
      setErrorMessage(error?.message || "カード削除に失敗しました");
    }
  };

  // --- ドラッグ＆ドロップ（キー重複エラー対策の修正適用）---
  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId, type } = result;
    if (!destination) return;

    // リストの並び替え (変更なし)
    if (type === "list") {
      const newLists = Array.from(lists);
      const [movedList] = newLists.splice(source.index, 1);
      newLists.splice(destination.index, 0, movedList);
      const reorderedLists = newLists.map((l, i) => ({ ...l, position: i }));
      setLists(reorderedLists);

      try {
        await api.reorderLists({
          reorderedLists: reorderedLists.map(({ _id, position }) => ({
            _id,
            position,
          })),
        });
      } catch (err) {
        console.error("List reorder failed:", err);
      }
      return;
    }

    // カードの並び替え・移動（★キー重複エラー対策の修正適用★）
    const draggedCard = cards.find((c) => c._id === draggableId);
    if (!draggedCard) return;

    // 1. 全カードをリストIDごとに分類 (最新のStateに基づいて並び替え済みの配列を取得)
    const cardsByList: Record<string, Card[]> = lists.reduce((acc, list) => {
      acc[list._id] = cards
        .filter((c) => c.listId === list._id)
        .sort((a, b) => a.position - b.position);
      return acc;
    }, {} as Record<string, Card[]>);

    // 2. 移動元/移動先のカード配列を取得（参照が同じにならないようにクローンを作成）
    const sourceListCards = Array.from(cardsByList[source.droppableId] || []);
    const destListCards =
      source.droppableId === destination.droppableId
        ? sourceListCards // 同一リスト移動の場合、sourceListCardsへの変更はdestListCardsにも反映される
        : Array.from(cardsByList[destination.droppableId] || []);

    // 3. 移動元のリストからカードを削除
    const [movedCard] = sourceListCards.splice(source.index, 1);

    // 4. 移動先のリストにカードを追加し、listIdを更新
    // 元のmovedCardを参照しないようにクローンを作成し、listIdを更新
    const newMovedCard: Card = {
      ...movedCard,
      listId: destination.droppableId,
    };
    destListCards.splice(destination.index, 0, newMovedCard);

    // 5. 新しい position を計算し、更新対象のカードリストを作成
    const reorderedSource = sourceListCards.map((c, i) => ({
      ...c,
      position: i,
    }));
    const reorderedDest = destListCards.map((c, i) => ({ ...c, position: i }));

    // 6. 最終配列の結合（★重複排除のために、フィルタリングと結合を採用★）
    // 移動元と移動先に関係のないカードをフィルタリング
    const otherCards = cards.filter(
      (c) =>
        c.listId !== source.droppableId && c.listId !== destination.droppableId
    );

    // 更新されたリストのカードをまとめる (sourceListCardsとdestListCardsの要素を結合。destListCardsは常に新しいpositionを持つため、これら２つを結合すればOK)
    const updatedLists = [
      ...reorderedSource,
      ...(source.droppableId !== destination.droppableId ? reorderedDest : []), // 移動元と移動先が異なる場合のみreorderedDestを追加
    ];

    // 最終配列に反映 (otherCards + updatedLists)
    const finalCards = otherCards
      .concat(updatedLists)
      .sort((a, b) => a.position - b.position); // positionで確実にソート

    // Optimistic UI update
    setCards(finalCards);

    // 7. 変更のあったカードだけをサーバーに送信 (★重複排除のためにMapを使用★)
    const cardsToSendMap = new Map<
      string,
      Pick<Card, "_id" | "listId" | "position">
    >();

    // reorderedSourceとreorderedDestの両方のカードを含める
    [...reorderedSource, ...reorderedDest].forEach((card) => {
      // 同じIDのカードが複数存在しないようにMapで上書き
      cardsToSendMap.set(card._id, {
        _id: card._id,
        listId: card.listId,
        position: card.position,
      });
    });

    const changedCards = Array.from(cardsToSendMap.values());

    if (changedCards.length === 0) return;

    try {
      await api.reorderCards({ reorderedCards: changedCards });
      // サーバーの最終結果を確実に反映
      await fetchBoardData();
    } catch (error) {
      console.error("Card reorder failed:", error);
      // エラー時はサーバーの状態に合わせて再取得
      await fetchBoardData().catch((e) =>
        console.error("fetch after reorder failure failed:", e)
      );
    }
  };

  return (
    <div className="p-6 min-h-screen bg-neutral-100">
      <h1 className="text-3xl font-bold mb-6">
        {board?.title || "Loading..."}
      </h1>

      {errorMessage && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50">
          {errorMessage}
        </div>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="all-lists" direction="horizontal" type="list">
          {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
            <div
              className="flex gap-4 overflow-x-auto pb-4"
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {lists.map((list: List, listIndex: number) => (
                <Draggable
                  key={list._id}
                  draggableId={list._id}
                  index={listIndex}
                >
                  {(
                    provided: DraggableProvided,
                    snapshot: DraggableStateSnapshot
                  ) => (
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
                          x
                        </button>
                      </div>

                      <Droppable droppableId={list._id} type="card">
                        {(
                          provided: DroppableProvided,
                          snapshot: DroppableStateSnapshot
                        ) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`space-y-2 min-h-20 transition-colors ${
                              snapshot.isDraggingOver
                                ? "bg-blue-50 rounded-lg"
                                : ""
                            }`}
                          >
                            {cards
                              .filter((c) => c.listId === list._id)
                              .sort((a, b) => a.position - b.position)
                              .map((card: Card, cardIndex: number) => (
                                <Draggable
                                  key={card._id}
                                  draggableId={card._id}
                                  index={cardIndex}
                                >
                                  {(
                                    provided: DraggableProvided,
                                    snapshot: DraggableStateSnapshot
                                  ) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className={`bg-gray-50 p-2 rounded-md shadow-sm cursor-grab active:cursor-grabbing transition-all duration-150 ${
                                        snapshot.isDragging
                                          ? "opacity-70 scale-95 rotate-1 shadow-lg"
                                          : "hover:bg-gray-100"
                                      }`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingCard(card);
                                      }}
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

      {/* --- モーダル --- */}
      {editingCard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
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
              className="border p-2 rounded w-full mb-2 h-24"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
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
