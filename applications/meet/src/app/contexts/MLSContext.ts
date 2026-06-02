import { createContext, useContext } from 'react';

import type { MeetCoreClient } from '../wasm/MeetCoreClient';

interface MLSContextType {
    mls: MeetCoreClient | null;
}

export const MLSContext = createContext<MLSContextType>({
    mls: null,
});

export const useMLSContext = () => {
    const { mls } = useContext(MLSContext);

    return mls as MeetCoreClient;
};
