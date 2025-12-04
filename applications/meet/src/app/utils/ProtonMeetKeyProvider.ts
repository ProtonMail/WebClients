import { BaseKeyProvider, importKey } from 'livekit-client';

function getKeyIndex(epoch: bigint, keyringSize: number) {
    if (keyringSize <= 0) {
        return 0;
    }

    const ringSize = BigInt(keyringSize);
    return Number(epoch % ringSize);
}

export class ProtonMeetKeyProvider extends BaseKeyProvider {
    private currentEpoch: bigint | undefined;
    private currentKey: string | undefined;
    constructor() {
        super({
            sharedKey: true,
            ratchetWindowSize: 0,
            failureTolerance: 10,
            keyringSize: 256,
        });
    }

    async setKeyWithEpoch(base64Key: string, epoch: bigint) {
        const bytes = Uint8Array.fromBase64(base64Key);
        // We must use PBKDF2 even though we already have strong cryptographic material,
        // because the WebRTC C library only supports PBKDF2. Without it, mobile clients
        // would not be able to decrypt frames sent from the web.
        const material = await importKey(bytes.buffer, 'PBKDF2', 'derive');
        const index = getKeyIndex(epoch, this.getOptions().keyringSize);
        this.onSetEncryptionKey(material, undefined, index);
    }

    setCurrentKey(key: string) {
        this.currentKey = key;
    }

    setCurrentEpoch(epoch: bigint) {
        this.currentEpoch = epoch;
    }

    getCurrentKey(): string | undefined {
        return this.currentKey;
    }

    getCurrentEpoch(): bigint | undefined {
        return this.currentEpoch;
    }

    cleanCurrent() {
        this.currentEpoch = undefined;
        this.currentKey = undefined;
    }

    getKeychainIndexInformation() {
        return this.getKeys().map((keyInfo) => keyInfo.keyIndex);
    }
}
