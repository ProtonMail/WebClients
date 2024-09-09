import { createContext, useContext } from 'react';

import type { PrivateKeyReference, SessionKey } from '@proton/crypto';

type LinksKeysByShare = {
    [shareId: string]: {
        [linkId: string]: LinkKeys;
    };
};

type LinkKeys = FileLinkKeys & FolderLinkKeys;

type FileLinkKeys = {
    passphrase?: string;
    passphraseSessionKey?: SessionKey;
    privateKey?: PrivateKeyReference;
    sessionKey?: SessionKey;
};

type FolderLinkKeys = {
    passphrase?: string;
    passphraseSessionKey?: SessionKey;
    privateKey?: PrivateKeyReference;
    hashKey?: Uint8Array;
};

/**
 * LinksKeys provides a simple storage to cache link keys.
 * Ideally, there should be only one instance in the whole app.
 */
export class LinksKeys {
    private keys: LinksKeysByShare;

    constructor() {
        this.keys = {};
    }

    getPassphrase(shareId: string, linkId: string): string | undefined {
        return this.keys[shareId]?.[linkId]?.passphrase;
    }

    getPassphraseSessionKey(shareId: string, linkId: string): SessionKey | undefined {
        return this.keys[shareId]?.[linkId]?.passphraseSessionKey;
    }

    getPrivateKey(shareId: string, linkId: string): PrivateKeyReference | undefined {
        return this.keys[shareId]?.[linkId]?.privateKey;
    }

    getSessionKey(shareId: string, linkId: string): SessionKey | undefined {
        return this.keys[shareId]?.[linkId]?.sessionKey;
    }

    getHashKey(shareId: string, linkId: string): Uint8Array | undefined {
        return this.keys[shareId]?.[linkId]?.hashKey;
    }

    setPassphrase(shareId: string, linkId: string, passphrase: string) {
        this.setKey(shareId, linkId, (keys: LinkKeys) => {
            keys.passphrase = passphrase;
        });
    }

    setPassphraseSessionKey(shareId: string, linkId: string, sessionKey: SessionKey) {
        this.setKey(shareId, linkId, (keys: LinkKeys) => {
            keys.passphraseSessionKey = sessionKey;
        });
    }

    setPrivateKey(shareId: string, linkId: string, privateKey: PrivateKeyReference) {
        this.setKey(shareId, linkId, (keys: LinkKeys) => {
            keys.privateKey = privateKey;
        });
    }

    setSessionKey(shareId: string, linkId: string, sessionKey: SessionKey) {
        this.setKey(shareId, linkId, (keys: LinkKeys) => {
            keys.sessionKey = sessionKey;
        });
    }

    setHashKey(shareId: string, linkId: string, hashKey: Uint8Array) {
        this.setKey(shareId, linkId, (keys: LinkKeys) => {
            keys.hashKey = hashKey;
        });
    }

    private setKey(shareId: string, linkId: string, setter: (keys: LinkKeys) => void) {
        if (!this.keys[shareId]) {
            this.keys[shareId] = {};
        }
        if (!this.keys[shareId][linkId]) {
            this.keys[shareId][linkId] = {};
        }
        setter(this.keys[shareId][linkId]);
    }
}

const LinksKeysContext = createContext<LinksKeys | null>(null);

export function LinksKeysProvider({ children }: { children: React.ReactNode }) {
    const value = new LinksKeys();
    return <LinksKeysContext.Provider value={value}>{children}</LinksKeysContext.Provider>;
}

export default function useLinksKeys() {
    const state = useContext(LinksKeysContext);
    if (!state) {
        throw new Error('Trying to use uninitialized LinksKeysProvider');
    }
    return state;
}
