"use client";

import { useRouter } from "next/navigation";
import { PromptForm } from "@/components/admin/prompt-form";

export default function NewPromptPage() {
  const router = useRouter();
  return (
    <>
      <h1>Add prompt</h1>
      <PromptForm onSaved={(slug) => router.push(`/admin/prompts?created=${slug}`)} />
    </>
  );
}
