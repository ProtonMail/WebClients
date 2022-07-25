import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { useApi } from '@proton/components/hooks';

import { load as loadConversation } from '../../logic/conversations/conversationsActions';

const NUM_ELEMENT_TO_PRELOADED = 5;

const usePreloadElements = (elementIDs: string[], isConversation: boolean) => {
    const api = useApi();
    const dispatch = useDispatch();
    const firstElementIDs = elementIDs.slice(0, NUM_ELEMENT_TO_PRELOADED);

    useEffect(() => {
        const preload = async () => {
            try {
                await Promise.all(
                    firstElementIDs.map(async (ID) => {
                        return dispatch(loadConversation({ api, conversationID: ID, messageID: undefined }));
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

export default usePreloadElements;
