import { useState, useRef, useEffect } from "react";
import { FirebaseSignaling } from "@/lib/firebaseSignaling";
import { v4 as uuidv4 } from "uuid";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

const ICE_SERVERS = [
  {
    urls: "stun:stun.relay.metered.ca:80",
  },
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun3.l.google.com:19302" },
  { urls: "stun:stun4.l.google.com:19302" },
  {
    urls: "turn:global.relay.metered.ca:80",
    username: "b0e07cdbd000e5aa7b547bf0",
    credential: "bXC9XyogFAsUZzJB",
  },
  {
    urls: "turn:global.relay.metered.ca:80?transport=tcp",
    username: "b0e07cdbd000e5aa7b547bf0",
    credential: "bXC9XyogFAsUZzJB",
  },
  {
    urls: "turn:global.relay.metered.ca:443",
    username: "b0e07cdbd000e5aa7b547bf0",
    credential: "bXC9XyogFAsUZzJB",
  },
  {
    urls: "turns:global.relay.metered.ca:443?transport=tcp",
    username: "b0e07cdbd000e5aa7b547bf0",
    credential: "bXC9XyogFAsUZzJB",
  },
  {
    urls: "turn:relay1.expressturn.com:3478",
    username: "efWQ2IFY44Y2AKGB8H",
    credential: "xJxLKAYwJ0PUB8x2",
  },
];

const useVideoCall = (conferenceId: string, router: AppRouterInstance) => {
  const signaling = new FirebaseSignaling();
  const participantId = useRef(uuidv4());

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);

  const [connected, setConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("New");
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [videoOptions, setVideoOptions] = useState({
    videoEnabled: true,
    audioEnabled: true,
    chatEnabled: false,
  });

  // Automatically connect to the call
  useEffect(() => {
    startVideoCall();
    // return () => {
    //   handleDisconnect(); // Cleanup on unmount
    // };
  }, []);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const createPeerConnection = async () => {
    const participantCount = await signaling.getParticipantCount(conferenceId);
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.ontrack = (event) => setRemoteStream(event.streams[0]);
    pc.onicecandidate = (event) => handleIceCandidate(event, participantCount);
    pc.oniceconnectionstatechange = () => handleConnectionStateChange(pc);

    return pc;
  };

  const handleIceCandidate = async (
    event: RTCPeerConnectionIceEvent,
    participantCount: number
  ) => {
    if (event.candidate) {
      await signaling.sendIceCandidate(
        conferenceId,
        event.candidate.toJSON(),
        participantCount === 0 ? "offer" : "answer"
      );
    }
  };

  const handleConnectionStateChange = (pc: RTCPeerConnection) => {
    setConnectionStatus(pc.iceConnectionState);
    if (["connected", "completed"].includes(pc.iceConnectionState)) {
      setConnected(true);
    } else if (
      ["failed", "disconnected", "closed"].includes(pc.iceConnectionState)
    ) {
      setConnected(false);
      handleReconnection();
    }
  };

  const handleReconnection = async () => {
    console.log("Attempting to reconnect...");
    if (peerConnection.current) {
      peerConnection.current.close();
    }
    peerConnection.current = await createPeerConnection();
    await setUpVideoFeeds();
    await startVideoCall();
  };

  const startVideoCall = async () => {
    try {
      const participantCount = await signaling.getParticipantCount(
        conferenceId
      );

      if (!peerConnection.current) {
        peerConnection.current = await createPeerConnection();
        await setUpVideoFeeds();
      }
      await addListeners(participantCount);
      await signaling.addParticipant(conferenceId, participantId.current);

      participantCount === 0 ? await handleOffer() : await handleAnswer();
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

    const bufferedCandidates = await signaling.getBufferedIceCandidates(
      conferenceId
    );
    for (const candidate of bufferedCandidates) {
      await peerConnection.current.addIceCandidate(
        new RTCIceCandidate(candidate)
      );
    }

    const answer = await peerConnection.current.createAnswer();
    await peerConnection.current.setLocalDescription(answer);
    await signaling.sendAnswer(conferenceId, {
      sdp: answer.sdp,
      type: answer.type,
    });
  };

  const addListeners = async (participantCount: number) => {
    if (!peerConnection.current) return;

    signaling.listenForIceCandidates(
      conferenceId,
      (candidate) => {
        const iceCandidate = new RTCIceCandidate(candidate);
        if (peerConnection.current?.currentRemoteDescription)
          peerConnection.current?.addIceCandidate(iceCandidate);
      },
      participantCount === 0 ? "offer" : "answer"
    );

    if (participantCount === 0) {
      signaling.listenForSessionDescription(
        conferenceId,
        (offer) => console.log("Received offer", offer),
        (answer) => handleAnswerDescription(answer)
      );
    }
  };

  const handleAnswerDescription = async (answer: RTCSessionDescriptionInit) => {
    if (
      peerConnection.current &&
      !peerConnection.current.currentRemoteDescription
    ) {
      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    }
    console.log("Connection established.");
  };

  const setUpVideoFeeds = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;

    stream.getTracks().forEach((track) => {
      peerConnection.current?.addTrack(track, stream);
    });
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

    setConnected(false);
    router.push("/");
    console.log("Disconnected from the meeting.");
  };

  const handleVideoToggle = () => {
    const videoTrack = (
      localVideoRef.current?.srcObject as MediaStream
    )?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setVideoOptions((options) => ({
        ...options,
        videoEnabled: videoTrack.enabled,
      }));
    }
  };

  const handleAudioToggle = () => {
    const audioTrack = (
      localVideoRef.current?.srcObject as MediaStream
    )?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setVideoOptions((options) => ({
        ...options,
        audioEnabled: audioTrack.enabled,
      }));
    }
  };

  const handleChatToggle = () => {
    setVideoOptions((options) => ({
      ...options,
      chatEnabled: !options.chatEnabled,
    }));
  };

  return {
    connected,
    connectionStatus,
    videoOptions,
    localVideoRef,
    remoteVideoRef,
    handleAudioToggle,
    handleChatToggle,
    handleVideoToggle,
    handleDisconnect,
  };
};

export default useVideoCall;
