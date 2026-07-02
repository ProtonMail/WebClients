import { createContext, useContext } from 'react';

import type { MeetCoreClient } from '../wasm/MeetCoreClient';

type MeetCoreClientValue = MeetCoreClient | null;

export const MeetCoreClientContext = createContext<MeetCoreClientValue | undefined>(undefined);

export const useMeetCoreClient = (): MeetCoreClient => {
    const meetCoreClient = useContext(MeetCoreClientContext);

    if (meetCoreClient === undefined) {
        throw new Error('useMeetCoreClient must be used within a MeetCoreClientProvider');
    }

    if (meetCoreClient === null) {
        throw new Error('Meet Core Wasm App is not initialized');
    }

    return meetCoreClient;
};
