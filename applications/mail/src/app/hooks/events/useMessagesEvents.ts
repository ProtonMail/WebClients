import { useSubscribeEventManager } from '@proton/components/hooks/useHandler';
import { event } from '@proton/mail-message/store/messages/read/messagesReadActions';

import type { Event } from '../../models/event';
import { useMailDispatch } from '../../store/hooks';
import { useGetMessage } from '../message/useMessage';

export const useMessagesEvents = () => {
    const dispatch = useMailDispatch();
    const getMessage = useGetMessage();

    useSubscribeEventManager(async ({ Messages }: Event) => {
        if (!Array.isArray(Messages)) {
            return;
        }

        for (const MessageEvent of Messages) {
            const currentValue = getMessage(MessageEvent.ID);

            // Ignore updates for non-fetched messages.
            if (!currentValue) {
                continue;
            }

            dispatch(event(MessageEvent));
        }
    });
};
