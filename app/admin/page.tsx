"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowLeft, Warning, SignIn } from "@phosphor-icons/react";
import { login } from "../login/action";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await login(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  return (
    <main className="flex flex-col min-h-screen items-center justify-center bg-[#f8f9fa] px-6 py-10 text-black selection:bg-black selection:text-white">
      <Link
        href="/"
        className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border-2 border-black bg-white px-4 py-2 text-sm font-black uppercase tracking-wider text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <ArrowLeft size={18} weight="bold" />
        Kembali ke Dashboard
      </Link>
      <div className="w-full max-w-md rounded-2xl border-4 border-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="mb-8">
          <h1 className="text-4xl font-black tracking-tighter uppercase">Login Admin</h1>
          <p className="mt-1 text-base font-bold text-gray-600">
            Masuk ke panel Smart Home sebagai pemilik
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border-2 border-black bg-[#ff6b6b] p-3 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Warning size={24} weight="bold" className="shrink-0" />
            <p className="text-sm font-bold">{error}</p>
          </div>
        )}

        <form action={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-bold uppercase tracking-wider">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="admin@netbeans.com"
              className="rounded-lg border-2 border-black bg-gray-50 px-4 py-3 font-medium outline-none transition-shadow focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-bold uppercase tracking-wider">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="rounded-lg border-2 border-black bg-gray-50 px-4 py-3 font-medium outline-none transition-shadow focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-4 border-black bg-[#4dabf7] px-6 py-4 text-lg font-black uppercase tracking-wider text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            {isPending ? (
              "Memproses..."
            ) : (
              <>
                Masuk <SignIn size={24} weight="bold" />
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
