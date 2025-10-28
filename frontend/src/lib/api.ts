// frontend/src/lib/api.ts
import { auth } from "@/lib/firebase";

const BASE_URL = "http://localhost:5000/api";

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("未認証です。");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    window.location.href = "/login";
    return;
  }
  if (!res.ok) throw new Error(`Fetch error: ${res.statusText}`);
  return res.json();
}

export const api = {
  // Boards
  getBoards: () => fetchWithAuth(`${BASE_URL}/boards`),
  getBoard: (boardId: string) => fetchWithAuth(`${BASE_URL}/boards/${boardId}`),
  createBoard: (data: any) =>
    fetchWithAuth(`${BASE_URL}/boards`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteBoard: (id: string) =>
    fetchWithAuth(`${BASE_URL}/boards/${id}`, { method: "DELETE" }),

  // Lists
  getLists: (boardId: string) =>
    fetchWithAuth(`${BASE_URL}/lists?boardId=${boardId}`),
  createList: (data: any) =>
    fetchWithAuth(`${BASE_URL}/lists`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateList: (id: string, data: any) =>
    fetchWithAuth(`${BASE_URL}/lists/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteList: (id: string) =>
    fetchWithAuth(`${BASE_URL}/lists/${id}`, { method: "DELETE" }),
  reorderLists: (data: any) =>
    fetchWithAuth(`${BASE_URL}/lists/reorder`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Cards
  getCards: (boardId: string) =>
    fetchWithAuth(`${BASE_URL}/cards?boardId=${boardId}`),
  createCard: (data: any) =>
    fetchWithAuth(`${BASE_URL}/cards`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateCard: (id: string, data: any) =>
    fetchWithAuth(`${BASE_URL}/cards/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteCard: (id: string) =>
    fetchWithAuth(`${BASE_URL}/cards/${id}`, { method: "DELETE" }),
  reorderCards: (data: any) =>
    fetchWithAuth(`${BASE_URL}/cards/reorder`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};
