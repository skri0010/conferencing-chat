"use client";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import Chat from "@/components/Chat";
import VideoControls from "@/components/VideoControls";
import useVideoCall from "@/hooks/useVideoCall";

const VideoCall = () => {
  const { id: conferenceId }: { id: string } = useParams();
  const router = useRouter();
  const {
    connected,
    connectionStatus,
    videoOptions,
    localVideoRef,
    remoteVideoRef,
    handleAudioToggle,
    handleChatToggle,
    handleVideoToggle,
    handleDisconnect,
  } = useVideoCall(conferenceId, router);

  return (
    <main className="flex flex-col mx-auto w-full lg:w-2/3 p-4 lg:p-8 bg-gray-950 min-h-screen">
      {connected && (
        <button
          onClick={() => router.push("/")}
          className="text-white rounded-md bg-purple-600 my-3 p-2 mx-auto w-full max-w-xs lg:max-w-sm"
        >
          Back to Homepage
        </button>
      )}
      <div className="text-white text-center my-2">
        Connection Status: {connectionStatus}
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-10 my-4">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full max-w-xs lg:max-w-sm h-auto rounded-md transform scale-x-[-1]"
        ></video>
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full max-w-xs lg:max-w-sm h-auto rounded-md transform scale-x-[-1] "
        ></video>
      </div>

      <div className="flex justify-center space-x-3 mb-4 lg:mb-2">
        <VideoControls
          videoOptions={videoOptions}
          handleAudioToggle={handleAudioToggle}
          handleChatToggle={handleChatToggle}
          handleVideoToggle={handleVideoToggle}
          handleDisconnect={handleDisconnect}
        />
      </div>

      <div className="w-full">{videoOptions.chatEnabled && <Chat />}</div>
    </main>
  );
};

export default VideoCall;
