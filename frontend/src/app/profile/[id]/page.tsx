"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import ProfileView from "@/components/members/ProfileView";

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id as string;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <ProfileView
        userId={userId}
        onBack={() => router.push("/?tab=members")}
      />
    </div>
  );
}
