import type { RoomOptions } from 'livekit-client';
import { ExternalE2EEKeyProvider } from 'livekit-client';

const keyProvider = new ExternalE2EEKeyProvider();

const worker = new Worker(new URL('livekit-client/e2ee-worker', import.meta.url));

export const getE2EEOptions = async (roomKey: string): Promise<RoomOptions> => {
    await keyProvider.setKey(roomKey);

    return {
        e2ee: {
            keyProvider,
            worker,
        },
    };
};
