import { useEffect } from 'react';

import { unwrapResult } from '@reduxjs/toolkit';

import { FeatureCode } from '@proton/components';
import { useFeature } from '@proton/components/hooks';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';

import { isConversation } from 'proton-mail/helpers/elements';
import type { Element } from 'proton-mail/models/element';
import { allConversations } from 'proton-mail/store/conversations/conversationsSelectors';
import { useMailDispatch, useMailSelector } from 'proton-mail/store/hooks';

import { findMessageToExpand } from '../../helpers/message/messageExpandable';
import { load } from '../../store/conversations/conversationsActions';
import { initialize } from '../../store/messages/read/messagesReadActions';

interface Props {
    elements: Element[];
    labelID: string;
    loading: boolean;
}

const usePreLoadElements = ({ elements, labelID, loading }: Props) => {
    const dispatch = useMailDispatch();
    const { feature: preloadedConversations } = useFeature<number>(FeatureCode.NumberOfPreloadedConversations);
    const { feature: electronPreloadAmount } = useFeature<number>(FeatureCode.ElectronConvPreloadAmount);

    // We ensure that there is a value and that it does't impacts API calls
    const defaultPreload = preloadedConversations?.Value || 0;
    const electronPreload = electronPreloadAmount?.Value || 0;

    // We increase the preloaded conversations for the electron app
    const numberOfPreloadedConversations = isElectronMail ? electronPreload : defaultPreload;
    const firstElements = elements.slice(0, numberOfPreloadedConversations);
    const conversations = useMailSelector(allConversations);

    const isAllConversation = elements.every((element) => isConversation(element));

    useEffect(() => {
        const conversationsIDs = conversations.map((item) => item?.Conversation.ID);
        const preload = async () => {
            try {
                await Promise.all(
                    firstElements.map(async ({ ID }) => {
                        const conversationAlreadyCached = conversationsIDs.includes(ID);

                        if (!conversationAlreadyCached) {
                            const resultAction = await dispatch(
                                load({ silentFetch: true, conversationID: ID, messageID: undefined })
                            );
                            const conversationResult = await unwrapResult(resultAction);
                            const { Messages } = conversationResult;
                            const messageToExpand = findMessageToExpand(labelID, Messages);

                            if (messageToExpand) {
                                dispatch(initialize({ localID: messageToExpand.ID, data: messageToExpand }));
                            }
                        }
                    })
                );
            } catch {
                // ignore
            }
        };

        if (!loading && firstElements.length > 0 && isAllConversation) {
            void preload();
        }
    }, [firstElements.join(), labelID, loading]); // "firstElementIDs.join()" makes firstElementIDs dependency stable
};

export default usePreLoadElements;
