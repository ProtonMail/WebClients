import { useDispatch } from 'react-redux';
import { useSubscribeEventManager } from '@proton/components';
import { Event } from '../../models/event';
import { useGetMessage } from '../message/useMessage';
import { event } from '../../logic/messages/messagesActions';

export const useMessagesEvents = () => {
    const dispatch = useDispatch();
    const getMessage = useGetMessage();

    useSubscribeEventManager(async ({ Messages }: Event) => {
        if (!Array.isArray(Messages)) {
            return;
        }

        for (const MessageEvent of Messages) {
            // const localID = getLocalID(ID);
            const currentValue = getMessage(MessageEvent.ID);

            // Ignore updates for non-fetched messages.
            if (!currentValue) {
                continue;
            }
            dispatch(event(MessageEvent));
            // if (Action === EVENT_ACTIONS.DELETE) {
            //     // cache.delete(localID);
            //     dispatch({ type: 'messages/delete' });
            // }
            // if (Action === EVENT_ACTIONS.UPDATE_DRAFT || Action === EVENT_ACTIONS.UPDATE_FLAGS) {
            //     // const currentValue = cache.get(localID) as MessageState;
            //     const isSentDraft = isSent(Message);
            //     const isScheduled = isScheduledSend(Message);

            //     if (currentValue.data) {
            //         const MessageToUpdate = parseLabelIDsInEvent(
            //             currentValue.data,
            //             Message as Message & LabelIDsChanges
            //         );
            //         let removeBody: PartialMessageState = {};
            //         const flags: Partial<MessageState> = {};

            //         // Draft updates can contains body updates but will not contains it in the event
            //         // By removing the current body value in the cache, we will reload it next time we need it
            //         if (Action === EVENT_ACTIONS.UPDATE_DRAFT) {
            //             if (!currentValue.draftFlags?.sending) {
            //                 removeBody = {
            //                     ...currentValue.messageDocument,
            //                     ...{ initialized: undefined, data: { Body: undefined } },
            //                 };
            //             }

            //             if (isSentDraft && !isScheduled) {
            //                 flags.draftFlags = { ...flags.draftFlags, isSentDraft: true };
            //             }
            //         }

            //         // cache.set(localID, {
            //         //     ...currentValue,
            //         //     ...removeBody,
            //         //     ...flags,
            //         //     data: {
            //         //         ...currentValue.data,
            //         //         ...MessageToUpdate,
            //         //         ...removeBody.data,
            //         //     },
            //         // });
            //         dispatch({
            //             type: 'messages/update',
            //             payload: {
            //                 ...currentValue,
            //                 ...removeBody,
            //                 ...flags,
            //                 data: {
            //                     ...currentValue.data,
            //                     ...MessageToUpdate,
            //                     ...removeBody.data,
            //                 },
            //             },
            //         });
            //     }
            // }
        }
    });
};
