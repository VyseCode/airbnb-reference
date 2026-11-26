import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AuthForm } from "@/components/AuthForm";

export const metadata = { title: "Join" };

export default async function RegisterPage() {
  if (await getSession()) redirect("/explore");
  return <AuthForm mode="register" />;
}
