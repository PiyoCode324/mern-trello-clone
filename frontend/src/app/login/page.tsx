// frontend/src/app/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  // ✅ ページ読み込み時にログイン状態を確認
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        router.push("/"); // ログイン済みならリダイレクト
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe(); // クリーンアップ
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("ログイン成功！");
      router.push("/"); // ✅ ログイン後にトップページへ
    } catch (error: any) {
      alert(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-600">
        読み込み中...
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="mb-4">ログイン済みです: {user.email}</p>
        <button
          onClick={() => router.push("/")}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg"
        >
          ホームへ移動
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center mt-10">
      <h1 className="text-2xl font-bold mb-4">ログイン</h1>
      <form onSubmit={handleLogin} className="flex flex-col gap-3 w-64">
        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 rounded-lg"
        />
        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 rounded-lg"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded-lg"
        >
          ログイン
        </button>
        <p className="text-sm text-center">
          アカウントをお持ちでない方は{" "}
          <Link href="/register" className="text-blue-600">
            新規登録
          </Link>
        </p>
      </form>
    </div>
  );
}
