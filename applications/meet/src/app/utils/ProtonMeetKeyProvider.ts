import { BaseKeyProvider, importKey } from 'livekit-client';

import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';

function getKeyIndex(epoch: bigint, keyringSize: number) {
    if (keyringSize <= 0) {
        return 0;
    }

    const ringSize = BigInt(keyringSize);
    return Number(epoch % ringSize);
}

export class ProtonMeetKeyProvider extends BaseKeyProvider {
    constructor() {
        super({
            sharedKey: true,
            ratchetWindowSize: 0,
            failureTolerance: -1,
            keyringSize: 256,
        });
    }

    async setKeyWithEpoch(base64Key: string, epoch: bigint) {
        const bytes = base64StringToUint8Array(base64Key);
        // We must use PBKDF2 even though we already have strong cryptographic material,
        // because the WebRTC C library only supports PBKDF2. Without it, mobile clients
        // would not be able to decrypt frames sent from the web.
        const material = await importKey(bytes.buffer, 'PBKDF2', 'derive');
        const index = getKeyIndex(epoch, this.getOptions().keyringSize);
        this.onSetEncryptionKey(material, undefined, index);
    }
}
