"use client";

import { useEffect, useRef, useState } from "react";
import { firestore } from "@/db/firebase";
import { doc, onSnapshot, updateDoc, arrayUnion } from "firebase/firestore";
import { useParams } from "next/navigation";

const Chat = () => {
  const { id: conferenceId }: { id: string } = useParams();
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const messagesRef = doc(firestore, "calls", conferenceId);

    const unsubscribe = onSnapshot(messagesRef, (snapshot) => {
      const data = snapshot.data();
      if (data?.messages) {
        setMessages(data.messages);
      }
    });

    return () => unsubscribe();
  }, [conferenceId]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      const messagesRef = doc(firestore, "calls", conferenceId);
      await updateDoc(messagesRef, {
        messages: arrayUnion(input.trim()),
      });
      setInput("");
    }
  };

  useEffect(() => {
    // Scroll to the bottom of the chat when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="bg-card rounded-lg shadow-lg overflow-hidden flex flex-col bg-slate-900 text-white">
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-lg font-semibold">Chat</h2>
      </div>
      <div className="flex-grow p-4 lg:min-h-44">
        {messages.map((message) => (
          <div key={message} className={`mb-4`}>
            <span>{message}</span>
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage} className="p-4 border-t border-slate-700">
        <div className="flex space-x-2">
          <input
            className="w-full bg-slate-800 text-white rounded-md p-2"
            type="text"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="rounded-md bg-slate-700 px-2">
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;
