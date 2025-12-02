import { useCallback, useEffect, useState } from 'react';

import { useRoomContext } from '@livekit/components-react';
import type { RemoteParticipant } from 'livekit-client';

import { PublishableDataTypes, RecordingStatus } from '../../types';
import { isValidMessageString } from '../../utils/isValidMessageString';

export const useIsRecordingInProgress = () => {
    const [isRecording, setIsRecording] = useState(false);

    const room = useRoomContext();

    const handleDataReceive = useCallback(
        // This is the actual typing LiveKit uses for the payload
        // eslint-disable-next-line @protontech/enforce-uint8array-arraybuffer/enforce-uint8array-arraybuffer
        async (payload: Uint8Array, participant?: RemoteParticipant) => {
            if (!participant || !payload) {
                return;
            }

            try {
                const decodedPayload = new TextDecoder().decode(payload);

                if (
                    !isValidMessageString(decodedPayload) ||
                    decodedPayload.length === 0 ||
                    decodedPayload.length > 50000
                ) {
                    return;
                }

                const decodedMessage = JSON.parse(decodedPayload);

                if (decodedMessage.type !== PublishableDataTypes.RecordingStatus) {
                    return;
                }

                setIsRecording(decodedMessage.message === RecordingStatus.Started);
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error('Error handling chat message:', error);
            }
        },
        [setIsRecording]
    );

    useEffect(() => {
        if (!room) {
            return;
        }

        room.on('dataReceived', handleDataReceive);

        return () => {
            room.off('dataReceived', handleDataReceive);
        };
    }, [room, handleDataReceive]);

    return isRecording;
};
