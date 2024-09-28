"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import Chat from "@/components/Chat";
import { v4 as uuidv4 } from "uuid";
import {
  ChatBubbleLeftRightIcon,
  MicrophoneIcon,
  PhoneIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/solid";
import { FirebaseSignaling } from "@/lib/firebaseSignaling";

const VideoCall = () => {
  const { id: conferenceId }: { id: string } = useParams();
  const router = useRouter();
  const signaling = new FirebaseSignaling();
  const participantId = useRef(uuidv4());

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const [connected, setConnected] = useState<boolean>(false);

  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [chatEnabled, setChatEnabled] = useState(true);

  useEffect(() => {
    const setupCall = async () => {
      await signaling.addParticipant(conferenceId, participantId.current);

      signaling.listenForOffer(conferenceId, (offer) => {
        if (!peerConnection.current) {
          handleOffer(offer);
        }
      });

      signaling.listenForAnswer(conferenceId, (answer) => {
        if (peerConnection.current) {
          if (peerConnection.current.signalingState === "stable") {
            console.log(
              "Already in stable state, cannot set answer as remote description."
            );
            return;
          } else {
            peerConnection.current.setRemoteDescription(
              new RTCSessionDescription(answer)
            );
          }
        }
      });

      signaling.listenForIceCandidates(conferenceId, (candidate) => {
        if (peerConnection.current?.remoteDescription) {
          peerConnection.current.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        }
      });
    };

    setupCall();
  }, [conferenceId]);

  const startVideoCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      peerConnection.current = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      stream.getTracks().forEach((track) => {
        peerConnection.current?.addTrack(track, stream);
      });

      peerConnection.current.onicecandidate = async (event) => {
        if (event.candidate) {
          await signaling.sendIceCandidate(
            conferenceId,
            event.candidate.toJSON(),
            false
          );
        }
      };

      peerConnection.current.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      if (!connected) {
        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);
        await signaling.sendOffer(conferenceId, {
          type: offer.type,
          sdp: offer.sdp,
        });
      }

      setConnected(true);
    } catch (error) {
      console.error("Error starting video call:", error);
    }
  };

  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    try {
      if (!peerConnection.current) {
        await startVideoCall();
      }

      if (peerConnection.current?.signalingState === "stable") {
        console.log(
          "Already in stable state, cannot set offer as remote description."
        );
        return;
      } else {
        console.log("offer from handle offer:", offer);
        await peerConnection.current?.setRemoteDescription(
          new RTCSessionDescription(offer)
        );
      }

      const answer = await peerConnection.current?.createAnswer();

      if (peerConnection.current?.signalingState === "have-remote-offer") {
        await peerConnection.current?.setLocalDescription(answer);
      }
      if (answer)
        await signaling.sendAnswer(conferenceId, {
          type: answer?.type,
          sdp: answer?.sdp,
        });
    } catch (error) {
      console.error("Error handling offer:", error);
    }
  };

  const handleVideoToggle = () => {
    const videoTrack = (
      localVideoRef.current?.srcObject as MediaStream
    )?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      videoTrack.stop();
      setVideoEnabled(videoTrack.enabled); // Update state for UI feedback
    }
  };

  const handleAudioToggle = () => {
    const audioTrack = (
      localVideoRef.current?.srcObject as MediaStream
    )?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setAudioEnabled(audioTrack.enabled); // Update state for UI feedback
    }
  };

  const handleDisconnect = async () => {
    if (peerConnection.current) {
      peerConnection.current.close();
    }

    await signaling.removeParticipant(conferenceId, participantId.current);
    const participantCount = await signaling.getParticipantCount(conferenceId);

    if (participantCount === 0) {
      // If no participants left, clear the call data
      await signaling.removeAnswer(conferenceId);
      // You might want to add more cleanup here, like removing offer, candidates, etc.
    } else {
      // If there are still participants, just remove this participant's answer
      peerConnection.current?.setRemoteDescription(
        new RTCSessionDescription({ type: "offer", sdp: "" })
      );
      peerConnection.current?.setLocalDescription(
        new RTCSessionDescription({ type: "answer", sdp: "" })
      );
      await signaling.removeAnswer(conferenceId);
    }

    setConnected(false);
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    setVideoEnabled(true);
    setAudioEnabled(true);

    // Redirect back to the home page
    router.push("/");
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
      <div className="flex lg:flex-col">
        <header className="text-2xl font-semibold font-[family-name:var(--font-geist-sans)] lg:block hidden">
          Suchit Meet
        </header>
        <div className="flex flex-col bg-gray-950">
          <div className="flex flex-col lg:flex-row gap-x-10 px-16 py-10 relative">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-80 flex-shrink-0 rounded-md"
            ></video>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-80 flex-shrink-0 rounded-md"
            ></video>
          </div>
          <div className="flex justify-center space-x-3 mb-2">
            <button
              onClick={handleAudioToggle}
              className="rounded-full p-1 border border-slate-700 w-10 flex items-center justify-center"
            >
              <MicrophoneIcon
                className={`size-8 ${
                  audioEnabled ? "text-white" : "text-red-500"
                }`}
              />
            </button>
            <button
              onClick={handleVideoToggle}
              className="rounded-full p-1 border border-slate-700 w-10 flex items-center justify-center"
            >
              <VideoCameraIcon
                className={`size-8 ${
                  videoEnabled ? "text-white" : "text-red-500"
                }`}
              />
            </button>
            <button className="rounded-full p-1 border border-slate-700 w-10 flex items-center justify-center">
              <ChatBubbleLeftRightIcon
                onClick={() => setChatEnabled(!chatEnabled)}
                className="size-8 text-white"
              />
            </button>
            <button
              onClick={handleDisconnect}
              className="rounded-full p-1 border border-slate-700 w-10 flex items-center justify-center bg-red-500"
            >
              <PhoneIcon className="size-8 text-white" />
            </button>
          </div>
        </div>
        <div className="">{chatEnabled && <Chat />}</div>
      </div>
    </main>
  );
};

export default VideoCall;
