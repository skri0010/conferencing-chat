"use client";

import { createContext, ReactNode } from "react";

interface GlobalContextType {
  createPeerConnection: () => RTCPeerConnection;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

interface GlobalProviderProps {
  children: ReactNode;
}

export const GlobalProvider = ({ children }: GlobalProviderProps) => {
  const createPeerConnection = () => {
    const server = {
      iceServers: [
        {
          urls: [
            "stun:stun1.l.google.com:19302",
            "stun:stun2.l.google.com:19302",
          ],
        },
      ],
      iceCandidatePoolSize: 10,
    };
    return new RTCPeerConnection(server);
  };

  return (
    <GlobalContext.Provider value={{ createPeerConnection }}>
      {children}
    </GlobalContext.Provider>
  );
};

export default GlobalContext;
