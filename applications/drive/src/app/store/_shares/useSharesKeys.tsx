import { createContext, useContext } from 'react';

import type { PrivateKeyReference, SessionKey } from '@proton/crypto';

type SharesKeys = {
    [shareId: string]: ShareKeys;
};

export type ShareKeys = {
    privateKey: PrivateKeyReference;
    sessionKey?: SessionKey;
};

/**
 * SharesKeys provides a simple storage to cache share keys.
 * Ideally, there should be only one instance in the whole app.
 */
export class SharesKeysStorage {
    private keys: SharesKeys;

    constructor() {
        this.keys = {};
    }

    get(shareId: string): ShareKeys | undefined {
        return this.keys[shareId];
    }

    set(shareId: string, privateKey: PrivateKeyReference, sessionKey?: SessionKey) {
        this.keys[shareId] = {
            privateKey,
            sessionKey,
        };
    }
}

const SharesKeysContext = createContext<SharesKeysStorage | null>(null);

export function SharesKeysProvider({ children }: { children: React.ReactNode }) {
    const value = new SharesKeysStorage();
    return <SharesKeysContext.Provider value={value}>{children}</SharesKeysContext.Provider>;
}

export default function useSharesKeys() {
    const state = useContext(SharesKeysContext);
    if (!state) {
        throw new Error('Trying to use uninitialized SharesKeysProvider');
    }
    return state;
}
