import { useRoomContext } from '@livekit/components-react';
import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';
import { useMeetDispatch, useMeetStore } from '@proton/meet/store/hooks';
import {
    addChatMessageReaction,
    removeChatMessageReaction,
    selectChatReactionId,
    toggleChatMessageReaction,
} from '@proton/meet/store/slices/chatAndReactionsSlice';
import { uint8ArrayToBinaryString } from '@proton/shared/lib/helpers/encoding';
import { useFlag } from '@proton/unleash/useFlag';

import { useMeetCoreClient } from '../../contexts/MeetCoreClientContext';
import { PublishableDataTypes } from '../../types';

export const useChatMessageReaction = () => {
    const room = useRoomContext();
    const dispatch = useMeetDispatch();
    const store = useMeetStore();
    const { reportMeetError } = useMeetErrorReporting();
    const notifications = useNotifications();
    const meetCoreClient = useMeetCoreClient();

    const isNewChatHandling = useFlag('MeetNewChatHandling');

    const handleError = (errorCause: string) => {
        reportMeetError('Failed to send chat message reaction', {
            level: 'error',
            context: { errorCause },
        });

        notifications.createNotification({
            type: 'error',
            text: c('Error').t`Failed to send reaction. Please try again.`,
        });
    };

    const sendReactionNew = async (messageId: string, emoji: string) => {
        const identity = room.localParticipant.identity;

        // A reaction acts as a toggle: if we already reacted with this emoji we unreact,
        // referencing the original reaction event id (`replaces_id`).
        const existingReactionId = selectChatReactionId(store.getState(), messageId, emoji, identity);
        const isRemoving = existingReactionId !== undefined;

        try {
            const { payload, local_echo: localEcho } = isRemoving
                ? await meetCoreClient.composeChatUnreact(messageId, existingReactionId)
                : await meetCoreClient.composeChatReaction(messageId, emoji);

            try {
                await room.localParticipant.publishData(payload, { reliable: true });
            } catch {
                handleError('Failed to send chat message reaction');
                return false;
            }

            const action = isRemoving
                ? removeChatMessageReaction({ replacesId: existingReactionId, identity })
                : addChatMessageReaction({ reactionId: localEcho.id, messageId, emoji, identity });

            dispatch(action);

            return true;
        } catch {
            handleError(
                isRemoving ? 'Failed to compose chat message unreact' : 'Failed to compose chat message reaction'
            );
            return false;
        }
    };

    const sendReactionLegacy = async (messageId: string, emoji: string) => {
        const identity = room.localParticipant.identity;

        // Optimistic update: reflect the reaction immediately in the UI
        dispatch(toggleChatMessageReaction({ messageId, emoji, identity }));

        const payload = JSON.stringify({ messageId, emoji });

        let encryptedMessage: Uint8Array<ArrayBuffer> | undefined;
        try {
            encryptedMessage = await meetCoreClient.encryptMessage(payload);
        } catch {
            // Roll back the optimistic update (toggle removes it)
            dispatch(toggleChatMessageReaction({ messageId, emoji, identity }));
            handleError('Failed to encrypt chat message reaction');
            return false;
        }

        const envelope = {
            id: `${identity}-${Date.now()}`,
            message: uint8ArrayToBinaryString(encryptedMessage),
            timestamp: Date.now(),
            type: PublishableDataTypes.ChatMessageReaction,
            version: 1,
        };

        try {
            await room.localParticipant.publishData(new TextEncoder().encode(JSON.stringify(envelope)), {
                topic: PublishableDataTypes.ChatMessageReaction,
                reliable: true,
            });
        } catch {
            // Roll back the optimistic update (toggle removes it)
            dispatch(toggleChatMessageReaction({ messageId, emoji, identity }));
            handleError('Failed to send chat message reaction');
            return false;
        }

        return true;
    };

    const sendReaction = async (messageId: string, emoji: string) => {
        if (!room) {
            return false;
        }

        return isNewChatHandling ? sendReactionNew(messageId, emoji) : sendReactionLegacy(messageId, emoji);
    };

    return sendReaction;
};
