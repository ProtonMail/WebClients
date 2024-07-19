import { useSubscribeEventManager } from '@proton/components';

import { useMailDispatch } from 'proton-mail/store/hooks';

import type { Event } from '../../models/event';
import { event } from '../../store/messages/read/messagesReadActions';
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
