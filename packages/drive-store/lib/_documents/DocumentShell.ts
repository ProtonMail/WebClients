import { SessionKey } from '@proton/crypto';

export type DocumentShell = {
    volumeId: string;
    linkId: string;
    shareId: string;
    sessionKey: SessionKey;
};
