// frontend/src/app/register/page.tsx
"use client";
import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  // ✅ すでにログインしているユーザーがアクセスしたら / にリダイレクト
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        router.push("/"); // ログイン済みならトップへ
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert("登録成功！ログインしました 🎉");
      router.push("/"); // ✅ 登録直後に自動でログイン・遷移
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
        <p className="mb-4">すでにログイン中: {user.email}</p>
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
      <h1 className="text-2xl font-bold mb-4">新規登録</h1>
      <form onSubmit={handleRegister} className="flex flex-col gap-3 w-64">
        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 rounded-lg"
        />
        <input
          type="password"
          placeholder="パスワード（6文字以上）"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 rounded-lg"
        />
        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded-lg"
        >
          登録
        </button>
        <p className="text-sm text-center">
          すでにアカウントをお持ちの方は{" "}
          <Link href="/login" className="text-blue-600">
            ログイン
          </Link>
        </p>
      </form>
    </div>
  );
}
