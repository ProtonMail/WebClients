import { useCallback, useEffect } from 'react';

import { useRoomContext } from '@livekit/components-react';
import type { Participant } from 'livekit-client';

import { uint8ArrayToBinaryString } from '@proton/shared/lib/helpers/encoding';

import { useMeetCoreClient } from '../../../contexts/MeetCoreClientContext';
import { PublishableDataTypes, RecordingStatus } from '../../../types';

export const useRecordingStatusPublish = (status: RecordingStatus) => {
    const room = useRoomContext();
    const meetCoreClient = useMeetCoreClient();

    const publishRecordingStatus = useCallback(
        async (status: RecordingStatus, targetParticipantIdentity?: string) => {
            if (!room) {
                return;
            }

            const encryptedMessage = await meetCoreClient.encryptMessage(JSON.stringify({ status }));
            const envelope = {
                id: `${room.localParticipant.identity}-${Date.now()}`,
                message: uint8ArrayToBinaryString(encryptedMessage),
                timestamp: Date.now(),
                type: PublishableDataTypes.RecordingStatus,
                version: 1,
            };

            const encodedMessage = new TextEncoder().encode(JSON.stringify(envelope));

            await room.localParticipant.publishData(encodedMessage, {
                reliable: true,
                destinationIdentities: targetParticipantIdentity ? [targetParticipantIdentity] : undefined,
            });
        },
        [meetCoreClient, room]
    );

    useEffect(() => {
        const handleParticipantConnected = (participant: Participant) => {
            if (status === RecordingStatus.Started) {
                void publishRecordingStatus(status, participant.identity);
            }
        };

        room.on('participantConnected', handleParticipantConnected);

        return () => {
            room.off('participantConnected', handleParticipantConnected);
        };
    }, [status, room, publishRecordingStatus]);

    return publishRecordingStatus;
};
