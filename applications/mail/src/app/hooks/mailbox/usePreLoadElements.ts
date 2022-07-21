import { useEffect } from 'react';

import { MAILBOX_IDENTIFIERS } from '@proton/shared/lib/constants';

import { useGetConversation } from '../conversation/useConversation';
import { useGetMessage } from '../message/useMessage';

const NUM_ELEMENT_TO_PRE_LOADED = 5;

const usePreLoadElements = (elementIDs: string[], labelID: string, isConversation: boolean) => {
    const getMessage = useGetMessage();
    const getConversation = useGetConversation();
    const firstElementIDs = elementIDs.slice(0, NUM_ELEMENT_TO_PRE_LOADED);

    useEffect(() => {
        const preload = async () => {
            try {
                await Promise.all(
                    firstElementIDs.map(async (ID) => {
                        if (isConversation) {
                            return getConversation(ID);
                        }
                        return getMessage(ID);
                    })
                );
            } catch {
                // ignore
            }
        };

        if (firstElementIDs.length > 0 && labelID === MAILBOX_IDENTIFIERS.inbox) {
            void preload();
        }
    }, [elementIDs, isConversation]);
};

export default usePreLoadElements;
