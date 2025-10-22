// frontend/src/types/index.d.ts

export interface Board {
  _id: string;
  title: string;
  createdBy: string;
  createdAt: string;
}

export interface List {
  _id: string;
  title: string;
  boardId: string; // ここを追加
  position: number;
}

export interface Card {
  _id: string;
  title: string;
  description?: string;
  listId: string;
  position: number;
}
