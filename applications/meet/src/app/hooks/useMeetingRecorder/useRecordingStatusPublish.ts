import { useEffect } from 'react';

import { useRoomContext } from '@livekit/components-react';
import type { Participant } from 'livekit-client';

import { PublishableDataTypes, RecordingStatus } from '../../types';

export const useRecordingStatusPublish = (status: RecordingStatus) => {
    const room = useRoomContext();

    const publishRecordingStatus = async (status: RecordingStatus, targetParticipantIdentity?: string) => {
        const message = {
            message: status,
            targetParticipantIdentity,
            timestamp: Date.now(),
            type: PublishableDataTypes.RecordingStatus,
        };

        const encodedMessage = new TextEncoder().encode(JSON.stringify(message));

        await room.localParticipant.publishData(encodedMessage, {
            reliable: true,
            destinationIdentities: targetParticipantIdentity ? [targetParticipantIdentity] : undefined,
        });
    };

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
    }, [status, room]);

    return publishRecordingStatus;
};
