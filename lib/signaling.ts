// signaling.ts (abstraction for signaling mechanism)
export interface Signaling {
  listenForSessionDescription(
    conferenceId: string,
    onOffer: (offer: RTCSessionDescriptionInit) => void,
    onAnswer: (answer: RTCSessionDescriptionInit) => void
  ): void;
  listenForIceCandidates(
    conferenceId: string,
    onCandidate: (candidate: RTCIceCandidateInit) => void
  ): void;
  sendOffer(
    conferenceId: string,
    offer: RTCSessionDescriptionInit
  ): Promise<void>;
  removeOffer(conferenceId: string): Promise<void>;
  sendAnswer(
    conferenceId: string,
    answer: RTCSessionDescriptionInit
  ): Promise<void>;
  isOffer(conferenceId: string): Promise<boolean>;
  isAnswer(conferenceId: string): Promise<boolean>;
  isWaiting(conferenceId: string): Promise<boolean>;
  sendIceCandidate(
    conferenceId: string,
    candidate: RTCIceCandidateInit
  ): Promise<void>;
  removeIceCandidates(conferenceId: string): Promise<void>;
  addParticipant(conferenceId: string, participantId: string): Promise<void>;
  removeParticipant(conferenceId: string, participantId: string): Promise<void>;
  getParticipantCount(conferenceId: string): Promise<number>;
  removeAnswer(conferenceId: string): Promise<void>;
}
