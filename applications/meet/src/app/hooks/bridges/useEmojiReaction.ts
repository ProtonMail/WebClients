import { useRoomContext } from '@livekit/components-react';
import { c } from 'ttag';

import useNotifications from '@proton/components/hooks/useNotifications';
import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';
import { useMeetDispatch } from '@proton/meet/store/hooks';
import { uint8ArrayToString } from '@proton/shared/lib/helpers/encoding';

import { useMLSContext } from '../../contexts/MLSContext';
import { PublishableDataTypes } from '../../types';
import { dispatchTimedReaction } from '../../utils/dispatchTimedReaction';

export const EMOJI_REACTIONS = ['👍', '👎', '👏'] as const;
export type EmojiReaction = (typeof EMOJI_REACTIONS)[number];

export const useEmojiReaction = () => {
    const room = useRoomContext();
    const dispatch = useMeetDispatch();
    const { reportMeetError } = useMeetErrorReporting();
    const notifications = useNotifications();
    const mls = useMLSContext();

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

    const sendEmojiReaction = async (emoji: EmojiReaction) => {
        if (!room || !mls) {
            return false;
        }

        let encryptedMessage: Uint8Array<ArrayBuffer> | undefined;

        try {
            encryptedMessage = (await mls.encryptMessage(emoji)) as Uint8Array<ArrayBuffer>;
        } catch (error) {
            handleError('Failed to encrypt emoji reaction');
            return false;
        }

        const message = {
            id: `${room.localParticipant.identity}-${Date.now()}`,
            message: uint8ArrayToString(encryptedMessage as Uint8Array<ArrayBuffer>),
            timestamp: Date.now(),
            type: PublishableDataTypes.EmojiReaction,
        };

        const encodedMessage = new TextEncoder().encode(JSON.stringify(message));

        try {
            await room.localParticipant.publishData(encodedMessage, {
                topic: PublishableDataTypes.EmojiReaction,
                reliable: false,
            });
        } catch (error) {
            handleError('Failed to send emoji reaction');
            return false;
        }

        dispatchTimedReaction(dispatch, room.localParticipant.identity, emoji);

        return true;
    };

    return sendEmojiReaction;
};
