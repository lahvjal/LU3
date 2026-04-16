import { redirect } from "next/navigation";
import { getUserContext } from "@/lib/auth/user-context";

export default async function WardsRoutePage() {
  const userContext = await getUserContext();
  if (!userContext.isLeader) {
    redirect("/");
  }
  return null;
}
