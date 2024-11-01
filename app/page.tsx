"use client";

import { VideoCameraIcon } from "@heroicons/react/24/solid";
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
      const callDoc = doc(collection(firestore, "calls"));
      const conferenceId = callDoc.id;

      await setDoc(callDoc, {
        offer: null,
        answer: null,
        type: "created",
      });

      router.push(`/video-call/${conferenceId}`);
    } catch (error) {
      console.error("Error creating call:", error);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-600 to-indigo-800 p-8 sm:p-20 text-white font-[family-name:var(--font-geist-sans)]">
      <header className="flex flex-col items-center text-center mb-16 space-y-4">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Welcome to Suchit Meet
        </h1>
        <p className="text-lg max-w-lg text-gray-300">
          Seamlessly connect with friends, family, or colleagues from anywhere.
          Start a secure video conference with a single click.
        </p>
      </header>

      <main className="flex flex-col gap-8 items-center">
        <button
          onClick={createCallAndRedirect}
          className="rounded-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white text-lg font-semibold flex items-center transition-all duration-300 ease-in-out"
          disabled={loading}
        >
          <VideoCameraIcon className="text-white h-6 w-6 mr-3" />
          {loading ? "Starting..." : "Create Conference Room"}
        </button>
        {loading && (
          <p className="text-sm text-gray-300">
            Setting up your room, please wait...
          </p>
        )}
      </main>

      <footer className="mt-16 flex gap-4 flex-wrap items-center justify-center text-gray-400">
        <p>© {new Date().getFullYear()} Suchit Meets. All rights reserved.</p>
      </footer>
    </div>
  );
}
