import {
  ChatBubbleLeftRightIcon,
  MicrophoneIcon,
  PhoneIcon,
  VideoCameraIcon,
} from "@heroicons/react/16/solid";
import React, { Fragment } from "react";

export default function VideoControls({
  videoOptions,
  handleVideoToggle,
  handleAudioToggle,
  handleChatToggle,
  handleDisconnect,
}: {
  videoOptions: { [key: string]: boolean };
  handleVideoToggle: () => void;
  handleAudioToggle: () => void;
  handleChatToggle: () => void;
  handleDisconnect: () => void;
}) {
  return (
    <Fragment>
      <button
        onClick={handleAudioToggle}
        className="rounded-full p-1 border border-slate-700 w-10 flex items-center justify-center"
      >
        <MicrophoneIcon
          className={`size-8 ${
            videoOptions.audioEnabled ? "text-white" : "text-red-500"
          }`}
        />
      </button>
      <button
        onClick={handleVideoToggle}
        className="rounded-full p-1 border border-slate-700 w-10 flex items-center justify-center"
      >
        <VideoCameraIcon
          className={`size-8 ${
            videoOptions.videoEnabled ? "text-white" : "text-red-500"
          }`}
        />
      </button>
      <button className="rounded-full p-1 border border-slate-700 w-10 flex items-center justify-center">
        <ChatBubbleLeftRightIcon
          onClick={handleChatToggle}
          className="size-8 text-white"
        />
      </button>
      <button className="rounded-full p-1 border border-slate-700 w-10 flex items-center justify-center bg-red-400">
        <PhoneIcon onClick={handleDisconnect} className="size-8 text-white" />
      </button>
    </Fragment>
  );
}
