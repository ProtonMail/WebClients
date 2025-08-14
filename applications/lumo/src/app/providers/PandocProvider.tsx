import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { PandocConverter } from '../lib/attachments/pandoc-wasm';

interface PandocContextValue {
    getInstance: () => Promise<PandocConverter>;
}

const PandocContext = createContext<PandocContextValue | null>(null);

export function PandocProvider({ children }: { children: React.ReactNode }) {
    const [instance, setInstance] = useState<PandocConverter | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (instance) {
                void instance.cleanup();
            }
        };
    }, [instance]);

    const contextValue = useMemo(
        () => ({
            getInstance: async () => {
                if (!instance) {
                    const newInstance = new PandocConverter();
                    await newInstance.ready;
                    setInstance(newInstance);
                    return newInstance;
                }
                return instance;
            },
        }),
        [instance]
    );

    return <PandocContext.Provider value={contextValue}>{children}</PandocContext.Provider>;
}

export function usePandoc() {
    const context = useContext(PandocContext);
    if (!context) throw new Error('usePandoc must be used within a PandocProvider');
    return context.getInstance;
}
