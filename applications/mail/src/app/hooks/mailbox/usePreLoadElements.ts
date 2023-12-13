import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { unwrapResult } from '@reduxjs/toolkit';

import { FeatureCode } from '@proton/components/containers';
import { useFeature } from '@proton/components/hooks';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';

import { isConversation } from 'proton-mail/helpers/elements';
import { allConversations } from 'proton-mail/logic/conversations/conversationsSelectors';
import { Element } from 'proton-mail/models/element';

import { findMessageToExpand } from '../../helpers/message/messageExpandable';
import { load } from '../../logic/conversations/conversationsActions';
import { initialize } from '../../logic/messages/read/messagesReadActions';
import { useAppDispatch } from '../../logic/store';

interface Props {
    elements: Element[];
    labelID: string;
    loading: boolean;
}

const usePreLoadElements = ({ elements, labelID, loading }: Props) => {
    const dispatch = useAppDispatch();
    const { feature: preloadedConversations } = useFeature<number>(FeatureCode.NumberOfPreloadedConversations);
    const { feature: electronPreloadAmount } = useFeature<number>(FeatureCode.ElectronConvPreloadAmount);

    // We ensure that there is a value and that it does't impacts API calls
    const defaultPreload = preloadedConversations?.Value || 0;
    const electronPreload = electronPreloadAmount?.Value || 0;

    // We increase the preloaded conversations for the electron app
    const numberOfPreloadedConversations = isElectronApp() ? electronPreload : defaultPreload;
    const firstElements = elements.slice(0, numberOfPreloadedConversations);
    const conversations = useSelector(allConversations);

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
