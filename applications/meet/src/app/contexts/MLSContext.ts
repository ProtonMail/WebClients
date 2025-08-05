import { createContext, useContext } from 'react';

import type { App } from '@proton-meet/proton-meet-core';

interface MLSContextType {
    mls: App | null;
}

export const MLSContext = createContext<MLSContextType>({
    mls: null,
});

export const useMLSContext = () => {
    const { mls } = useContext(MLSContext);

    return mls as App;
};
