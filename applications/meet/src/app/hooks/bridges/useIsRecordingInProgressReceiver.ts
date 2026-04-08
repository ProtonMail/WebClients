import { useCallback, useEffect, useRef } from 'react';

import { useRoomContext } from '@livekit/components-react';
import type { App } from '@proton-meet/proton-meet-core';
import { RoomEvent } from 'livekit-client';
import type { Participant, RemoteParticipant } from 'livekit-client';

import { useMeetDispatch, useMeetSelector, useMeetStore } from '@proton/meet/store/hooks';
import { selectParticipantsMap } from '@proton/meet/store/slices/meetingInfo';
import {
    addParticipantRecording,
    removeParticipantRecording,
    setIsRecording,
} from '@proton/meet/store/slices/recordingStatusSlice';
import type { ParticipantEntity } from '@proton/meet/types/types';
import { stringToUint8Array } from '@proton/shared/lib/helpers/encoding';
import { useFlag } from '@proton/unleash/useFlag';

import { PublishableDataTypes, RecordingStatus } from '../../types';
import { isValidMessageString } from '../../utils/isValidMessageString';

export const useIsRecordingInProgressReceiver = (mls: App) => {
    const isMeetMultipleRecordingEnabled = useFlag('MeetMultipleRecording');

    const store = useMeetStore();
    const dispatch = useMeetDispatch();
    const room = useRoomContext();

    const participantsMap = useMeetSelector(selectParticipantsMap);
    const participantsMapRef = useRef(participantsMap);
    participantsMapRef.current = participantsMap;

    const waitForParticipant = useCallback(
        (identity: string, timeoutMs = 10_000): Promise<ParticipantEntity | undefined> => {
            const current = store.getState().meetingInfo.participantsMap[identity];
            if (current) {
                return Promise.resolve(current);
            }

            return new Promise((resolve) => {
                let timeout: NodeJS.Timeout;

                const unsubscribe = store.subscribe(() => {
                    const participant = store.getState().meetingInfo.participantsMap[identity];
                    if (participant) {
                        clearTimeout(timeout);
                        unsubscribe();
                        resolve(participant);
                    }
                });

                timeout = setTimeout(() => {
                    unsubscribe();
                    resolve(undefined);
                }, timeoutMs);
            });
        },
        [store]
    );

    const handleDataReceive = useCallback(
        // This is the actual typing LiveKit uses for the payload
        async (
            // eslint-disable-next-line @protontech/enforce-uint8array-arraybuffer/enforce-uint8array-arraybuffer
            payload: Uint8Array,
            participant?: RemoteParticipant
        ) => {
            if (!participant || !payload) {
                return;
            }

            // Remove with MeetMultipleRecording ff cleanup
            if (!isMeetMultipleRecordingEnabled) {
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

                    dispatch(setIsRecording(decodedMessage.message === RecordingStatus.Started));
                } catch (error) {
                    // eslint-disable-next-line no-console
                    console.error('Error handling chat message:', error);
                }

                return;
            }

            // Wait for the participant to be fetched
            const senderParticipant = await waitForParticipant(participant.identity);

            // Only allow messages sent by admins or hosts
            if (!senderParticipant?.IsAdmin || !senderParticipant?.IsHost) {
                return;
            }

            try {
                const decoded = JSON.parse(new TextDecoder().decode(payload));
                const decrypted = await mls.decryptMessage(stringToUint8Array(decoded.message));
                const decryptedMessage = decrypted?.message ?? '';

                if (
                    !isValidMessageString(decryptedMessage) ||
                    decryptedMessage.length === 0 ||
                    decryptedMessage.length > 50000
                ) {
                    return;
                }

                const parsed = JSON.parse(decryptedMessage);

                if (decoded.type !== PublishableDataTypes.RecordingStatus) {
                    return;
                }

                if (parsed.status === RecordingStatus.Started) {
                    dispatch(addParticipantRecording(participant.identity));
                }

                if (parsed.status === RecordingStatus.Stopped) {
                    dispatch(removeParticipantRecording(participant.identity));
                }
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error('Error handling recording status message', error);
            }
        },
        []
    );

    const handleParticipantDisconnected = useCallback(
        (participant: Participant) => {
            dispatch(removeParticipantRecording(participant.identity));
        },
        [dispatch]
    );

    useEffect(() => {
        if (!room) {
            return;
        }

        room.on(RoomEvent.DataReceived, handleDataReceive);
        if (isMeetMultipleRecordingEnabled) {
            room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
        }

        return () => {
            room.off(RoomEvent.DataReceived, handleDataReceive);
            if (isMeetMultipleRecordingEnabled) {
                room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
            }
        };
    }, [room, handleDataReceive]);
};
