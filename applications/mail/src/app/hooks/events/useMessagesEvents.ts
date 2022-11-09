import { useSubscribeEventManager } from '@proton/components';

import { event } from '../../logic/messages/read/messagesReadActions';
import { useAppDispatch } from '../../logic/store';
import { Event } from '../../models/event';
import { useGetMessage } from '../message/useMessage';

export const useMessagesEvents = () => {
    const dispatch = useAppDispatch();
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
