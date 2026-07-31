import { createContext, useContext, useMemo } from 'react';

export interface WaitingRoomContextValues {
    isWaitingRoomHost: boolean;
    // Host actions
    admitRequest: (requestId: string) => Promise<void>;
    rejectRequest: (requestId: string, participantUid: string) => Promise<void>;
    admitAll: () => Promise<void>;
    toggleWaitingRoom: (newValue?: boolean) => Promise<void>;
    toggleWaitingRoomPrejoin: (newValue?: boolean) => Promise<void>;
    // Guest admission actions
    leaveWaitingRoom: () => void;
    retryWaitingRoom: () => void;
}

export const defaultValues: WaitingRoomContextValues = {
    isWaitingRoomHost: false,
    admitRequest: async () => {},
    rejectRequest: async () => {},
    admitAll: async () => {},
    toggleWaitingRoom: async () => {},
    toggleWaitingRoomPrejoin: async () => {},
    leaveWaitingRoom: () => {},
    retryWaitingRoom: () => {},
};

export const WaitingRoomContext = createContext<WaitingRoomContextValues>(defaultValues);

interface WaitingRoomProviderProps extends WaitingRoomContextValues {
    children: React.ReactNode;
}

export const WaitingRoomProvider = ({
    children,
    isWaitingRoomHost,
    admitRequest,
    rejectRequest,
    admitAll,
    toggleWaitingRoom,
    toggleWaitingRoomPrejoin,
    leaveWaitingRoom,
    retryWaitingRoom,
}: WaitingRoomProviderProps) => {
    const value = useMemo(() => {
        return {
            isWaitingRoomHost,
            admitRequest,
            rejectRequest,
            admitAll,
            toggleWaitingRoom,
            toggleWaitingRoomPrejoin,
            leaveWaitingRoom,
            retryWaitingRoom,
        };
    }, [
        isWaitingRoomHost,
        admitRequest,
        rejectRequest,
        admitAll,
        toggleWaitingRoom,
        toggleWaitingRoomPrejoin,
        leaveWaitingRoom,
        retryWaitingRoom,
    ]);

    return <WaitingRoomContext.Provider value={value}>{children}</WaitingRoomContext.Provider>;
};

export const useWaitingRoomContext = () => {
    return useContext(WaitingRoomContext);
};
