"use client";

import { VideoCameraIcon } from "@heroicons/react/16/solid";
import { useRouter } from "next/navigation";
import { doc, collection, setDoc } from "firebase/firestore";
import { firestore } from "@/db/firebase";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const createCallAndRedirect = async () => {
    setLoading(true);

    try {
      // Create a new call document in Firebase
      const callDoc = doc(collection(firestore, "calls"));
      const conferenceId = callDoc.id;

      // Initialize the call document with empty fields
      await setDoc(callDoc, {
        offer: null,
        answer: null,
        type: "created",
      });

      // Redirect to the video call page with the conferenceId
      router.push(`/video-call/${conferenceId}`);
    } catch (error) {
      console.error("Error creating call:", error);
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <button
          onClick={createCallAndRedirect}
          className="rounded-md px-5 py-2 text-white bg-slate-500 flex items-center"
          disabled={loading}
        >
          <VideoCameraIcon className="text-white size-8 mr-3" />
          {loading ? "Starting..." : "Create Conference Room"}
        </button>
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center"></footer>
    </div>
  );
}
