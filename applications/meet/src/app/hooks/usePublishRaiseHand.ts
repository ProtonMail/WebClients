import { useCallback } from 'react';

import { useRoomContext } from '@livekit/components-react';

import { uint8ArrayToString } from '@proton/shared/lib/helpers/encoding';
import { useFlag } from '@proton/unleash/useFlag';

import { useMeetCoreClient } from '../contexts/MeetCoreClientContext';
import { PublishableDataTypes } from '../types';

export const usePublishRaiseHand = () => {
    const isAdminLowerHandEnabled = useFlag('MeetAdminLowerHand');

    const room = useRoomContext();
    const meetCoreClient = useMeetCoreClient();

    const publish = useCallback(
        async (raised: boolean, destinationIdentities?: string[]) => {
            if (!room) {
                return;
            }

            const encryptedMessage = await meetCoreClient.encryptMessage(JSON.stringify({ raised }));

            const envelope = {
                id: `${room.localParticipant.identity}-${Date.now()}`,
                message: uint8ArrayToString(encryptedMessage),
                timestamp: Date.now(),
                type: PublishableDataTypes.RaiseHand,
                version: 1,
            };

            await room.localParticipant.publishData(new TextEncoder().encode(JSON.stringify(envelope)), {
                topic: PublishableDataTypes.RaiseHand,
                reliable: true,
                destinationIdentities,
            });
        },
        [room, meetCoreClient]
    );

    const adminPublishLowerHand = useCallback(
        async (identity: string, destinationIdentities?: string[]) => {
            if (!room || !isAdminLowerHandEnabled) {
                return;
            }

            const encryptedMessage = await meetCoreClient.encryptMessage(JSON.stringify({ identity }));

            const envelope = {
                id: `${identity}-${Date.now()}`,
                message: uint8ArrayToString(encryptedMessage),
                timestamp: Date.now(),
                type: PublishableDataTypes.LowerHandAdmin,
                version: 1,
            };

            await room.localParticipant.publishData(new TextEncoder().encode(JSON.stringify(envelope)), {
                topic: PublishableDataTypes.LowerHandAdmin,
                reliable: true,
                destinationIdentities,
            });
        },
        [isAdminLowerHandEnabled, room, meetCoreClient]
    );

    return { publish, adminPublishLowerHand };
};
