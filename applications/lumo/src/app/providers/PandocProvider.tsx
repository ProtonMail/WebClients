import { createContext, useContext, useEffect, useRef } from 'react';

import { PandocConverter } from '../lib/attachments/pandoc-wasm';

interface PandocContextValue {
    getInstance: () => Promise<PandocConverter>;
}

const PandocContext = createContext<PandocContextValue | null>(null);

export function PandocProvider({ children }: { children: React.ReactNode }) {
    const instanceRef = useRef<PandocConverter | null>(null);
    // Track if we're currently initializing to prevent race conditions
    const initializingPromiseRef = useRef<Promise<PandocConverter> | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (instanceRef.current) {
                void instanceRef.current.cleanup();
            }
        };
    }, []);

    const getInstance = async (): Promise<PandocConverter> => {
        // If already initialized, return it
        if (instanceRef.current) {
            return instanceRef.current;
        }

        // If currently initializing, wait for that initialization to complete
        if (initializingPromiseRef.current) {
            return initializingPromiseRef.current;
        }

        // Start new initialization
        const initPromise = (async () => {
            const newInstance = new PandocConverter();
            await newInstance.ready;
            instanceRef.current = newInstance;
            // Clear the initializing promise once done
            initializingPromiseRef.current = null;
            return newInstance;
        })();

        // Store the promise so concurrent calls can wait for it
        initializingPromiseRef.current = initPromise;

        return initPromise;
    };

    return (
        <PandocContext.Provider value={{ getInstance }}>
            {children}
        </PandocContext.Provider>
    );
}

export function usePandoc() {
    const context = useContext(PandocContext);
    if (!context) throw new Error('usePandoc must be used within a PandocProvider');
    return context.getInstance;
}
