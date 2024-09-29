// firebaseSignaling.ts (Firebase-specific implementation)
import { firestore } from "@/db/firebase";
import {
  doc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
  addDoc,
  collection,
} from "firebase/firestore";
import { Signaling } from "./signaling";

export class FirebaseSignaling implements Signaling {
  getCallDoc(conferenceId: string) {
    return doc(firestore, "calls", conferenceId);
  }

  getOfferCandidates(conferenceId: string) {
    const callDoc = doc(firestore, "calls", conferenceId);
    return collection(callDoc, "offerCandidates");
  }

  getAnswerCandidates(conferenceId: string) {
    const callDoc = doc(firestore, "calls", conferenceId);
    return collection(callDoc, "answerCandidates");
  }

  listenForSessionDescription(
    conferenceId: string,
    onOffer: (offer: RTCSessionDescriptionInit) => void,
    onAnswer: (answer: RTCSessionDescriptionInit) => void
  ): void {
    const callDoc = doc(firestore, "calls", conferenceId);
    onSnapshot(callDoc, (snapshot) => {
      const data = snapshot.data();
      if (data?.offer) {
        onOffer(data.offer);
      }
      if (data?.answer) {
        onAnswer(data.answer);
      }
    });
  }

  async listenForIceCandidates(
    conferenceId: string,
    onCandidate: (candidate: RTCIceCandidateInit) => void
  ): Promise<void> {
    const callDoc = await getDoc(this.getCallDoc(conferenceId));
    const candidateType =
      callDoc?.data()?.type !== "offer"
        ? this.getAnswerCandidates(conferenceId)
        : this.getOfferCandidates(conferenceId);
    onSnapshot(candidateType, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          onCandidate(change.doc.data() as RTCIceCandidateInit);
        }
      });
    });
  }

  async sendOffer(
    conferenceId: string,
    offer: RTCSessionDescriptionInit
  ): Promise<void> {
    const callDoc = doc(firestore, "calls", conferenceId);
    await updateDoc(callDoc, { offer, type: "offer" });
  }

  async sendAnswer(
    conferenceId: string,
    answer: RTCSessionDescriptionInit
  ): Promise<void> {
    const callDoc = doc(firestore, "calls", conferenceId);
    await updateDoc(callDoc, { answer, type: "answer" });
  }

  async isOffer(conferenceId: string): Promise<boolean> {
    const callDoc = doc(firestore, "calls", conferenceId);
    const snapshot = await getDoc(callDoc);
    const data = snapshot.data();
    return data?.type === "offer";
  }

  async isWaiting(conferenceId: string): Promise<boolean> {
    const callDoc = doc(firestore, "calls", conferenceId);
    const snapshot = await getDoc(callDoc);
    const data = snapshot.data();
    return data?.type === "created";
  }

  async isAnswer(conferenceId: string): Promise<boolean> {
    const callDoc = doc(firestore, "calls", conferenceId);
    const snapshot = await getDoc(callDoc);
    const data = snapshot.data();
    return data?.type === "answer";
  }

  async sendIceCandidate(
    conferenceId: string,
    candidate: RTCIceCandidateInit
  ): Promise<void> {
    const callDoc = await getDoc(this.getCallDoc(conferenceId));
    const candidateType =
      callDoc?.data()?.type !== "offer"
        ? this.getAnswerCandidates(conferenceId)
        : this.getOfferCandidates(conferenceId);

    await addDoc(candidateType, candidate);
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

  async getParticipants(conferenceId: string): Promise<string[]> {
    const callDoc = doc(firestore, "calls", conferenceId);
    const snapshot = await getDoc(callDoc);
    const data = snapshot.data();
    return data?.participants || [];
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

  async getOffer(conferenceId: string): Promise<RTCSessionDescriptionInit> {
    const callDoc = doc(firestore, "calls", conferenceId);
    const snapshot = await getDoc(callDoc);
    const data = snapshot.data();
    return data?.offer;
  }

  async getAnswer(conferenceId: string): Promise<RTCSessionDescriptionInit> {
    const callDoc = doc(firestore, "calls", conferenceId);
    const snapshot = await getDoc(callDoc);
    const data = snapshot.data();
    return data?.answer;
  }
}
