// firebaseSignaling.ts (Firebase-specific implementation)
import { firestore } from "@/db/firebase";
import {
  doc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
} from "firebase/firestore";
import { Signaling } from "./signaling";

export class FirebaseSignaling implements Signaling {
  listenForOffer(
    conferenceId: string,
    onOffer: (offer: RTCSessionDescriptionInit) => void
  ): void {
    const callDoc = doc(firestore, "calls", conferenceId);
    onSnapshot(callDoc, (snapshot) => {
      const data = snapshot.data();
      if (data?.offer) onOffer(data.offer);
    });
  }

  listenForAnswer(
    conferenceId: string,
    onAnswer: (answer: RTCSessionDescriptionInit) => void
  ): void {
    const callDoc = doc(firestore, "calls", conferenceId);
    onSnapshot(callDoc, (snapshot) => {
      const data = snapshot.data();
      if (data?.answer) onAnswer(data.answer);
    });
  }

  listenForIceCandidates(
    conferenceId: string,
    onCandidate: (candidate: RTCIceCandidateInit) => void
  ): void {
    const callDoc = doc(firestore, "calls", conferenceId);
    onSnapshot(callDoc, (snapshot) => {
      const data = snapshot.data();
      if (data?.offerCandidates) {
        data.offerCandidates.forEach((candidate: RTCIceCandidateInit) =>
          onCandidate(candidate)
        );
      }
      if (data?.answerCandidates) {
        data.answerCandidates.forEach((candidate: RTCIceCandidateInit) =>
          onCandidate(candidate)
        );
      }
    });
  }

  async sendOffer(
    conferenceId: string,
    offer: RTCSessionDescriptionInit
  ): Promise<void> {
    const callDoc = doc(firestore, "calls", conferenceId);
    await updateDoc(callDoc, { offer });
  }

  async sendAnswer(
    conferenceId: string,
    answer: RTCSessionDescriptionInit
  ): Promise<void> {
    const callDoc = doc(firestore, "calls", conferenceId);
    await updateDoc(callDoc, { answer });
  }

  async sendIceCandidate(
    conferenceId: string,
    candidate: RTCIceCandidateInit,
    isAnswer: boolean
  ): Promise<void> {
    const callDoc = doc(firestore, "calls", conferenceId);
    const field = isAnswer ? "answerCandidates" : "offerCandidates";
    await updateDoc(callDoc, { [field]: arrayUnion(candidate) });
  }

  async addParticipant(
    conferenceId: string,
    participantId: string
  ): Promise<void> {
    const callDoc = doc(firestore, "calls", conferenceId);
    await updateDoc(callDoc, {
      participants: arrayUnion(participantId),
    });
  }

  async removeParticipant(
    conferenceId: string,
    participantId: string
  ): Promise<void> {
    const callDoc = doc(firestore, "calls", conferenceId);
    await updateDoc(callDoc, {
      participants: arrayRemove(participantId),
    });
  }

  async getParticipantCount(conferenceId: string): Promise<number> {
    const callDoc = doc(firestore, "calls", conferenceId);
    const snapshot = await getDoc(callDoc);
    const data = snapshot.data();
    return data?.participants?.length || 0;
  }

  async removeAnswer(conferenceId: string): Promise<void> {
    const callDoc = doc(firestore, "calls", conferenceId);
    await updateDoc(callDoc, { answer: null });
  }

  async removeOffer(conferenceId: string): Promise<void> {
    const callDoc = doc(firestore, "calls", conferenceId);
    await updateDoc(callDoc, { offer: null });
  }

  async removeIceCandidates(conferenceId: string): Promise<void> {
    const callDoc = doc(firestore, "calls", conferenceId);
    await updateDoc(callDoc, { offerCandidates: [], answerCandidates: [] });
  }
}
