import { BaseKeyProvider, createKeyMaterialFromString } from 'livekit-client';

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

    async setKeyWithEpoch(key: string, epoch: bigint) {
        const material = await createKeyMaterialFromString(key as string);
        const index = getKeyIndex(epoch, this.getOptions().keyringSize);
        this.onSetEncryptionKey(material, undefined, index);
    }
}
