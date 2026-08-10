"use server";

import { createClient } from "@/app/utils/supabase-server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email dan password wajib diisi." };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.log("=== DEBUG SUPABASE ERROR ===");
    console.log("Pesan Error Asli:", error.message);
    console.log("Status Code:", error.status);
    console.log("============================");

    return { error: "Email atau password salah." };
  }

  redirect("/");
}
