import { useCallback } from 'react';

import { useRoomContext } from '@livekit/components-react';

import { PublishableDataTypes } from '../types';

export const usePublishRaiseHand = () => {
    const room = useRoomContext();

    const publish = useCallback(
        async (raised: boolean, destinationIdentities?: string[]) => {
            if (!room) {
                return;
            }

            const message = {
                raised,
                type: PublishableDataTypes.RaiseHand,
                timestamp: Date.now(),
            };

            const encodedMessage = new TextEncoder().encode(JSON.stringify(message));

            await room.localParticipant.publishData(encodedMessage, {
                topic: PublishableDataTypes.RaiseHand,
                reliable: true,
                destinationIdentities,
            });
        },
        [room]
    );

    return publish;
};
