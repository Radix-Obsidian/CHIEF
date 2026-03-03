import { redirect } from "next/navigation";

export default function Home() {
  // TODO: Check auth state, redirect to /inbox if authenticated, /login if not
  redirect("/login");
}
