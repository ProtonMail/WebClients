import { useDispatch } from 'react-redux';
import { useSubscribeEventManager } from '@proton/components';
import { Event } from '../../models/event';
import { useGetMessage } from '../message/useMessage';
import { event } from '../../logic/messages/read/messagesReadActions';

export const useMessagesEvents = () => {
    const dispatch = useDispatch();
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
