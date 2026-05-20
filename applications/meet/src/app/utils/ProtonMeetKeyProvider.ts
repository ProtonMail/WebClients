import { BaseKeyProvider, importKey } from 'livekit-client';

type ImportedKey = Awaited<ReturnType<typeof importKey>>;

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
    private installedEpochsByIndex = new Map<number, { epoch: bigint; material: ImportedKey }>();
    private activeEpoch: { epoch: bigint; index: number } | undefined;

    constructor() {
        super({
            sharedKey: true,
            ratchetWindowSize: 0,
            failureTolerance: -1,
            keyringSize: 256,
        });
    }

    async setKeyWithEpoch(base64Key: string, epoch: bigint) {
        const index = getKeyIndex(epoch, this.getOptions().keyringSize);
        const installedEpoch = this.installedEpochsByIndex.get(index);

        if (installedEpoch?.epoch === epoch) {
            // if this exact epoch/index is already the active encryption key, do not do anything
            if (this.activeEpoch?.epoch === epoch && this.activeEpoch.index === index) {
                return false;
            }

            // we already have the key material cached, but it is not currently active, so import it directly
            this.onSetEncryptionKey(installedEpoch.material, undefined, index);
            this.activeEpoch = { epoch, index };

            return true;
        }

        const bytes = Uint8Array.fromBase64(base64Key);
        // We must use PBKDF2 even though we already have strong cryptographic material,
        // because the WebRTC C library only supports PBKDF2. Without it, mobile clients
        // would not be able to decrypt frames sent from the web.
        const material = await importKey(bytes.buffer, 'PBKDF2', 'derive');
        this.onSetEncryptionKey(material, undefined, index);
        this.installedEpochsByIndex.set(index, { epoch, material });
        this.activeEpoch = { epoch, index };

        return true;
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
        this.installedEpochsByIndex.clear();
        this.activeEpoch = undefined;
    }

    getKeychainIndexInformation() {
        return this.getKeys()
            .filter((keyInfo) => !!keyInfo.key)
            .map((keyInfo) => keyInfo.keyIndex);
    }
}
