"use client";

import { useRef, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import Chat from "@/components/Chat";
import { v4 as uuidv4 } from "uuid";
import { FirebaseSignaling } from "@/lib/firebaseSignaling";
import VideoControls from "@/components/VideoControls";

const VideoCall = () => {
  const { id: conferenceId }: { id: string } = useParams();
  const router = useRouter();
  const signaling = new FirebaseSignaling();
  const participantId = useRef(uuidv4());

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);

  const ICE_SERVERS = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
    // Add TURN servers here if available
  ];

  const [connected, setConnected] = useState<boolean>(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>("New");

  const [videoOptions, setVideoOptions] = useState<{ [key: string]: boolean }>({
    videoEnabled: true,
    audioEnabled: true,
    chatEnabled: false,
  });

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.ontrack = (event) => {
      console.log("Received remote track", event.track.kind);
      setRemoteStream(event.streams[0]);
    };

    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        await signaling.sendIceCandidate(
          conferenceId,
          event.candidate.toJSON()
        );
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", pc.iceConnectionState);
      setConnectionStatus(pc.iceConnectionState);

      if (
        pc.iceConnectionState === "connected" ||
        pc.iceConnectionState === "completed"
      ) {
        setConnected(true);
      } else if (
        pc.iceConnectionState === "failed" ||
        pc.iceConnectionState === "disconnected" ||
        pc.iceConnectionState === "closed"
      ) {
        setConnected(false);
        // Implement reconnection logic here
        handleReconnection();
      }
    };

    return pc;
  };

  const handleReconnection = async () => {
    console.log("Attempting to reconnect...");
    if (peerConnection.current) {
      peerConnection.current.close();
    }
    peerConnection.current = createPeerConnection();
    await setUpVideoFeeds();
    await startVideoCall();
  };

  const startVideoCall = async () => {
    try {
      const participantCount = await signaling.getParticipantCount(
        conferenceId
      );
      if (!peerConnection.current) {
        peerConnection.current = createPeerConnection();
        await setUpVideoFeeds();
      }
      await addListeners(participantCount);
      await signaling.addParticipant(conferenceId, participantId.current);

      if (participantCount === 0) {
        await handleOffer();
      } else {
        await handleAnswer();
      }

      console.log("Participant has joined the meeting.");
    } catch (error) {
      console.error("Failed to join the meeting.", error);
      setConnectionStatus("Failed to connect");
    }
  };

  const handleOffer = async () => {
    if (!peerConnection.current) return;
    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);
    await signaling.sendOffer(conferenceId, {
      sdp: offer.sdp,
      type: offer.type,
    });
  };

  const handleAnswer = async () => {
    if (!peerConnection.current) return;
    const offer = await signaling.getOffer(conferenceId);
    await peerConnection.current.setRemoteDescription(
      new RTCSessionDescription(offer)
    );
    const answer = await peerConnection.current.createAnswer();
    await peerConnection.current.setLocalDescription(answer);
    await signaling.sendAnswer(conferenceId, {
      sdp: answer.sdp,
      type: answer.type,
    });
  };

  const addListeners = async (participantCount: number) => {
    if (!peerConnection.current) return;

    const iceCandidates: RTCIceCandidate[] = [];

    signaling.listenForIceCandidates(conferenceId, (candidate) => {
      const iceCandidate = new RTCIceCandidate(candidate);
      if (peerConnection.current?.remoteDescription) {
        peerConnection.current.addIceCandidate(iceCandidate);
      } else {
        iceCandidates.push(iceCandidate);
      }
    });

    if (participantCount === 0) {
      signaling.listenForSessionDescription(
        conferenceId,
        async (offer) => {
          console.log("Received offer", offer);
        },
        async (answer) => {
          console.log("Received answer", answer);
          if (
            peerConnection.current &&
            !peerConnection.current.currentRemoteDescription
          ) {
            await peerConnection.current.setRemoteDescription(
              new RTCSessionDescription(answer)
            );
            iceCandidates.forEach((candidate) =>
              peerConnection.current?.addIceCandidate(candidate)
            );
          }
          console.log("Connection established.");
        }
      );
    }
  };

  const setUpVideoFeeds = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      stream.getTracks().forEach((track) => {
        peerConnection.current?.addTrack(track, stream);
      });
    } catch (error) {
      console.error("Error accessing media devices.", error);
      // Implement user-friendly error handling here
    }
  };

  const handleDisconnect = async () => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    if (localVideoRef.current?.srcObject) {
      (localVideoRef.current.srcObject as MediaStream)
        .getTracks()
        .forEach((track) => track.stop());
    }

    setRemoteStream(null);

    await signaling.removeParticipant(conferenceId, participantId.current);

    const participantCount = await signaling.getParticipantCount(conferenceId);

    if (participantCount === 0) {
      await signaling.removeAnswer(conferenceId);
      await signaling.removeOffer(conferenceId);
      // You might also clear any ICE candidates here
    }

    setConnected(false);
    router.push("/");
    console.log("Participant has left the meeting.");
  };

  const handleVideoToggle = () => {
    const videoTrack = (
      localVideoRef.current?.srcObject as MediaStream
    )?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setVideoOptions({ ...videoOptions, videoEnabled: videoTrack.enabled });
    }
  };

  const handleAudioToggle = () => {
    const audioTrack = (
      localVideoRef.current?.srcObject as MediaStream
    )?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setVideoOptions({ ...videoOptions, audioEnabled: audioTrack.enabled });
    }
  };

  const handleChatToggle = () => {
    setVideoOptions({
      ...videoOptions,
      chatEnabled: !videoOptions.chatEnabled,
    });
  };

  return (
    <main className="mx-auto w-fit">
      {!connected && (
        <button
          onClick={startVideoCall}
          className="text-white rounded-md bg-red-300 my-3 p-2"
        >
          Join Meeting Room
        </button>
      )}
      <div className="text-white">Connection Status: {connectionStatus}</div>
      <div className="flex lg:flex-col">
        <header className="text-2xl font-semibold font-[family-name:var(--font-geist-sans)] lg:block hidden">
          Suchit Meet
        </header>
        <div className="flex flex-col bg-gray-950 min-h-screen lg:min-h-fit">
          <div className="flex flex-col lg:flex-row gap-y-10 lg:gap-x-10 px-16 py-10 relative h-full lg:h-auto">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-80 max-h-64 flex-shrink-0 rounded-md transform scale-x-[-1]"
            ></video>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-80 flex-shrink-0 rounded-md transform scale-x-[-1]"
            ></video>
          </div>
          <div className="flex justify-center space-x-3 mb-2">
            <VideoControls
              videoOptions={videoOptions}
              handleAudioToggle={handleAudioToggle}
              handleChatToggle={handleChatToggle}
              handleVideoToggle={handleVideoToggle}
              handleDisconnect={handleDisconnect}
            />
          </div>
        </div>
        <div className="min-h-screen lg:min-h-fit">
          {videoOptions.chatEnabled && <Chat />}
        </div>
      </div>
    </main>
  );
};

export default VideoCall;
