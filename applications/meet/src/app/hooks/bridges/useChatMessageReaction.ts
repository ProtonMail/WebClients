import { useRoomContext } from '@livekit/components-react';
import { c } from 'ttag';

import useNotifications from '@proton/components/hooks/useNotifications';
import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';
import { useMeetDispatch } from '@proton/meet/store/hooks';
import { addChatMessageReaction } from '@proton/meet/store/slices/meetingState';
import { uint8ArrayToString } from '@proton/shared/lib/helpers/encoding';

import { useMLSContext } from '../../contexts/MLSContext';
import { PublishableDataTypes } from '../../types';

export const useChatMessageReaction = () => {
    const room = useRoomContext();
    const dispatch = useMeetDispatch();
    const { reportMeetError } = useMeetErrorReporting();
    const notifications = useNotifications();
    const mls = useMLSContext();

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

    const sendReaction = async (messageId: string, emoji: string) => {
        if (!room || !mls) {
            return false;
        }

        const payload = JSON.stringify({ messageId, emoji });

        let encryptedMessage: Uint8Array<ArrayBuffer> | undefined;
        try {
            encryptedMessage = (await mls.encryptMessage(payload)) as Uint8Array<ArrayBuffer>;
        } catch {
            handleError('Failed to encrypt chat message reaction');
            return false;
        }

        const envelope = {
            id: `${room.localParticipant.identity}-${Date.now()}`,
            message: uint8ArrayToString(encryptedMessage as Uint8Array<ArrayBuffer>),
            timestamp: Date.now(),
            type: PublishableDataTypes.ChatMessageReaction,
        };

        try {
            await room.localParticipant.publishData(new TextEncoder().encode(JSON.stringify(envelope)), {
                topic: PublishableDataTypes.ChatMessageReaction,
                reliable: true,
            });
        } catch {
            handleError('Failed to send chat message reaction');
            return false;
        }

        dispatch(
            addChatMessageReaction({
                messageId,
                emoji,
                identity: room.localParticipant.identity,
            })
        );

        return true;
    };

    return sendReaction;
};
