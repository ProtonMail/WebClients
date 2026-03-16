import { useCallback } from 'react';

import { useRoomContext } from '@livekit/components-react';

import { uint8ArrayToString } from '@proton/shared/lib/helpers/encoding';

import { useMLSContext } from '../contexts/MLSContext';
import { PublishableDataTypes } from '../types';

export const usePublishRaiseHand = () => {
    const room = useRoomContext();
    const mls = useMLSContext();

    const publish = useCallback(
        async (raised: boolean, destinationIdentities?: string[]) => {
            if (!room || !mls) {
                return;
            }

            const encryptedMessage = (await mls.encryptMessage(JSON.stringify({ raised }))) as Uint8Array<ArrayBuffer>;

            const envelope = {
                id: `${room.localParticipant.identity}-${Date.now()}`,
                message: uint8ArrayToString(encryptedMessage),
                timestamp: Date.now(),
                type: PublishableDataTypes.RaiseHand,
            };

            await room.localParticipant.publishData(new TextEncoder().encode(JSON.stringify(envelope)), {
                topic: PublishableDataTypes.RaiseHand,
                reliable: true,
                destinationIdentities,
            });
        },
        [room, mls]
    );

    return publish;
};
