import { createContext, useContext } from 'react';

import type { MeetCoreClient } from '../wasm/MeetCoreClient';

interface WasmContextValue {
    wasmApp: MeetCoreClient | null;
}

export const WasmContext = createContext<WasmContextValue | undefined>(undefined);

export const useWasmApp = (): MeetCoreClient | null => {
    const context = useContext(WasmContext);
    if (context === undefined) {
        throw new Error('useWasmApp must be used within a WasmProvider');
    }

    return context.wasmApp;
};
