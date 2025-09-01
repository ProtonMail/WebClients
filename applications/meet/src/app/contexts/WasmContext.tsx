import { createContext, useContext } from 'react';

import type { App } from '@proton-meet/proton-meet-core';

interface WasmContextValue {
    wasmApp: App | null;
}

export const WasmContext = createContext<WasmContextValue | undefined>(undefined);

export const useWasmApp = (): App | null => {
    const context = useContext(WasmContext);
    if (context === undefined) {
        throw new Error('useWasmApp must be used within a WasmProvider');
    }

    return context.wasmApp;
};
