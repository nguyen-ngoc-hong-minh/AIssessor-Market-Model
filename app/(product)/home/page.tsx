import type { Metadata } from "next";
import { SignedInHome } from "@/components/signed-in-home";

export const metadata: Metadata = { title: "Home" };

export default function SignedInHomePage() {
  return <SignedInHome />;
}
