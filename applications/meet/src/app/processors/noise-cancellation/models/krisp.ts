import { KrispNoiseFilter, isKrispNoiseFilterSupported } from '@livekit/krisp-noise-filter';
import type { Room } from 'livekit-client';

import type { NoiseCancellationModel } from '../types';

const LIVEKIT_CLOUD_EDITION = 1;

const isBrowserSupported = isKrispNoiseFilterSupported();

const isRoomInLivekitCloud = (room: Room) => room.serverInfo?.edition === LIVEKIT_CLOUD_EDITION;

/** Only licensed for LiveKit Cloud rooms, so it stays gated on the server edition. */
export const createKrispModel = (room: Room, debugLogs: boolean): NoiseCancellationModel => ({
    id: 'krisp',
    isSupported: () => isBrowserSupported && isRoomInLivekitCloud(room),
    isNative: false,
    createProcessor: () => KrispNoiseFilter({ debugLogs }),
});
