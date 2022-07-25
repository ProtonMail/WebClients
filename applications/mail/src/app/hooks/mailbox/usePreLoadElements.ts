import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { useApi } from '@proton/components/hooks';

import { findMessageToExpand } from '../../helpers/message/messageExpandable';
import { load as loadConversation } from '../../logic/conversations/conversationsActions';
import { useGetConversation } from '../conversation/useConversation';
import { useInitializeMessage } from '../message/useInitializeMessage';

const NUM_ELEMENT_TO_PRELOADED = 5;

const usePreLoadElements = (elementIDs: string[], isConversation: boolean, labelID: string) => {
    const api = useApi();
    const dispatch = useDispatch();
    const firstElementIDs = elementIDs.slice(0, NUM_ELEMENT_TO_PRELOADED);
    const initialize = useInitializeMessage();
    const getConversation = useGetConversation();

    useEffect(() => {
        const preload = async () => {
            try {
                await Promise.all(
                    firstElementIDs.map(async (ID) => {
                        await dispatch(loadConversation({ api, conversationID: ID, messageID: undefined }));
                        const conversation = getConversation(ID);
                        const message = findMessageToExpand(labelID, conversation?.Messages);

                        if (message) {
                            return initialize(message.ID, labelID);
                        }
                    })
                );
            } catch {
                // ignore
            }
        };

        if (isConversation && firstElementIDs.length > 0) {
            void preload();
        }
    }, [elementIDs, isConversation]);
};

export default usePreLoadElements;
