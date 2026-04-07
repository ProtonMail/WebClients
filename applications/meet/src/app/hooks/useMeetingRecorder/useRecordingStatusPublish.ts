import { useEffect } from 'react';

import { useRoomContext } from '@livekit/components-react';
import type { Participant } from 'livekit-client';

import { uint8ArrayToString } from '@proton/shared/lib/helpers/encoding';
import { useFlag } from '@proton/unleash/useFlag';

import { useMLSContext } from '../../contexts/MLSContext';
import { PublishableDataTypes, RecordingStatus } from '../../types';

export const useRecordingStatusPublish = (status: RecordingStatus) => {
    const isMeetMultipleRecordingEnabled = useFlag('MeetMultipleRecording');

    const room = useRoomContext();
    const mls = useMLSContext();

    const publishRecordingStatus = async (status: RecordingStatus, targetParticipantIdentity?: string) => {
        if (!isMeetMultipleRecordingEnabled) {
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

            return;
        }

        if (!mls || !room) {
            return;
        }

        const encryptedMessage = (await mls.encryptMessage(JSON.stringify({ status }))) as Uint8Array<ArrayBuffer>;

        const envelope = {
            id: `${room.localParticipant.identity}-${Date.now()}`,
            message: uint8ArrayToString(encryptedMessage),
            timestamp: Date.now(),
            type: PublishableDataTypes.RecordingStatus,
            version: 1,
        };

        const encodedMessage = new TextEncoder().encode(JSON.stringify(envelope));

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
