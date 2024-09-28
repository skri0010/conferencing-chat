// signaling.ts (abstraction for signaling mechanism)
export interface Signaling {
  listenForOffer(
    conferenceId: string,
    onOffer: (offer: RTCSessionDescriptionInit) => void
  ): void;
  listenForAnswer(
    conferenceId: string,
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
  sendIceCandidate(
    conferenceId: string,
    candidate: RTCIceCandidateInit,
    isAnswer: boolean
  ): Promise<void>;
  removeIceCandidates(conferenceId: string): Promise<void>;
  addParticipant(conferenceId: string, participantId: string): Promise<void>;
  removeParticipant(conferenceId: string, participantId: string): Promise<void>;
  getParticipantCount(conferenceId: string): Promise<number>;
  removeAnswer(conferenceId: string): Promise<void>;
}
