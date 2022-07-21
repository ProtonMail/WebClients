import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { useApi } from '@proton/components/hooks';

import { load as loadConversation } from '../../logic/conversations/conversationsActions';
import { useGetMessage } from '../message/useMessage';

const NUM_ELEMENT_TO_PRELOADED = 5;

const usePreloadElements = (elementIDs: string[], isConversation: boolean) => {
    // TODO review logic to preload messages
    const api = useApi();
    const dispatch = useDispatch();
    const getMessage = useGetMessage();
    const firstElementIDs = elementIDs.slice(0, NUM_ELEMENT_TO_PRELOADED);

    useEffect(() => {
        const preload = async () => {
            try {
                const elements = await Promise.all(
                    firstElementIDs.map(async (ID) => {
                        if (isConversation) {
                            return dispatch(loadConversation({ api, conversationID: ID, messageID: undefined }));
                        }
                        return getMessage(ID);
                    })
                );
                console.log(elements);
            } catch {
                // ignore
            }
        };

        if (firstElementIDs.length > 0) {
            void preload();
        }
    }, [elementIDs, isConversation]);
};

export default usePreloadElements;
