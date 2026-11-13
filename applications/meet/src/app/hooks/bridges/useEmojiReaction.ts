import { useEffect, useState } from 'react';

import { useRoomContext } from '@livekit/components-react';
import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';
import { useMeetDispatch } from '@proton/meet/store/hooks';
import { clearActiveReaction } from '@proton/meet/store/slices/chatAndReactionsSlice';
import { TelemetryMeetActionsEvents, sendMeetActionsEvent } from '@proton/meet/telemetry/meetTelemetry';
import { uint8ArrayToBinaryString } from '@proton/shared/lib/helpers/encoding';

import { useMeetCoreClient } from '../../contexts/MeetCoreClientContext';
import { PublishableDataTypes } from '../../types';
import { dispatchTimedReaction } from '../../utils/dispatchTimedReaction';
import type { MeetCoreClient } from '../../wasm/MeetCoreClient';
import { MeetCoreRestartedError } from '../../wasm/meetCoreStallRecovery';

const availableEmojiReactionsRequests = new WeakMap<MeetCoreClient, Promise<string[]>>();

const getAvailableEmojiReactions = (meetCoreClient: MeetCoreClient) => {
    const existingRequest = availableEmojiReactionsRequests.get(meetCoreClient);
    if (existingRequest) {
        return existingRequest;
    }

    const request = meetCoreClient.getAvailableEmojiReactions();
    availableEmojiReactionsRequests.set(meetCoreClient, request);
    request.catch(() => availableEmojiReactionsRequests.delete(meetCoreClient));
    return request;
};

export const useAvailableEmojiReactions = () => {
    const meetCoreClient = useMeetCoreClient();
    const { reportMeetError } = useMeetErrorReporting();
    const [emojiReactions, setEmojiReactions] = useState<string[]>([]);

    useEffect(() => {
        let cancelled = false;

        getAvailableEmojiReactions(meetCoreClient)
            .then((available) => {
                if (!cancelled) {
                    setEmojiReactions(available);
                }
            })
            .catch((error: unknown) => {
                if (!(error instanceof MeetCoreRestartedError)) {
                    reportMeetError('Failed to load the available emoji reactions', error);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [meetCoreClient, reportMeetError]);

    return emojiReactions;
};

export const useEmojiReaction = () => {
    const room = useRoomContext();
    const dispatch = useMeetDispatch();
    const { reportMeetError } = useMeetErrorReporting();
    const notifications = useNotifications();
    const meetCoreClient = useMeetCoreClient();

    const handleError = (errorCause: string) => {
        reportMeetError('Failed to send emoji reaction', {
            level: 'error',
            context: {
                errorCause,
            },
        });

        notifications.createNotification({
            type: 'error',
            text: c('Error').t`Failed to send emoji reaction. Please try again.`,
        });
    };

    const sendEmojiReaction = async (emoji: string) => {
        if (!room) {
            return false;
        }

        let isValid: boolean;

        try {
            isValid = await meetCoreClient.isValidEmojiReaction(emoji);
        } catch {
            handleError('Failed to validate emoji reaction');
            return false;
        }

        if (!isValid) {
            reportMeetError('Emoji reaction rejected by meet-core', { level: 'error' });
            return false;
        }

        const identity = room.localParticipant.identity;

        // Optimistic update: show the reaction immediately
        const timestamp = dispatchTimedReaction(dispatch, identity, emoji);

        let encryptedMessage: Uint8Array<ArrayBuffer> | undefined;

        try {
            encryptedMessage = await meetCoreClient.encryptMessage(emoji);
        } catch (error) {
            dispatch(clearActiveReaction({ identity, timestamp }));
            handleError('Failed to encrypt emoji reaction');
            return false;
        }

        const message = {
            id: `${identity}-${Date.now()}`,
            message: uint8ArrayToBinaryString(encryptedMessage),
            timestamp: Date.now(),
            type: PublishableDataTypes.EmojiReaction,
            version: 1,
        };

        const encodedMessage = new TextEncoder().encode(JSON.stringify(message));

        try {
            await room.localParticipant.publishData(encodedMessage, {
                topic: PublishableDataTypes.EmojiReaction,
                reliable: false,
            });
        } catch (error) {
            dispatch(clearActiveReaction({ identity, timestamp }));
            handleError('Failed to send emoji reaction');
            return false;
        }

        sendMeetActionsEvent(TelemetryMeetActionsEvents.emoji_reaction_sent);

        return true;
    };

    return sendEmojiReaction;
};
