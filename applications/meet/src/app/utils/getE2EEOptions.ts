import type { RoomOptions } from '@proton-meet/livekit-client';
import { ExternalE2EEKeyProvider } from '@proton-meet/livekit-client';

const keyProvider = new ExternalE2EEKeyProvider();

const worker = new Worker(new URL('@proton-meet/livekit-client/e2ee-worker', import.meta.url));

export const getE2EEOptions = async (roomKey: string, epoch?: bigint): Promise<RoomOptions> => {
    await keyProvider.setKey(roomKey, epoch);

    return {
        e2ee: {
            keyProvider,
            worker,
        },
    };
};
