import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { FeatureCode } from '@proton/components/containers';
import { useApi, useFeature } from '@proton/components/hooks';

import { findMessageToExpand } from '../../helpers/message/messageExpandable';
import { load as loadConversation } from '../../logic/conversations/conversationsActions';
import { initialize as initializeMessage } from '../../logic/messages/read/messagesReadActions';
import { useGetConversation } from '../conversation/useConversation';
import { useGetMessage } from '../message/useMessage';

const usePreLoadElements = (elementIDs: string[], isConversation: boolean, labelID: string) => {
    const api = useApi();
    const dispatch = useDispatch();
    const { feature } = useFeature(FeatureCode.NumberOfPreloadedConversations);
    const firstElementIDs = elementIDs.slice(0, feature?.Value || 0);
    const getConversation = useGetConversation();
    const getMessage = useGetMessage();

    useEffect(() => {
        const preload = async () => {
            try {
                await Promise.all(
                    firstElementIDs.map(async (ID) => {
                        const cachedConversation = getConversation(ID);

                        if (!cachedConversation) {
                            await dispatch(loadConversation({ api, conversationID: ID, messageID: undefined }));
                            const conversation = getConversation(ID);
                            const messageToExpand = findMessageToExpand(labelID, conversation?.Messages);

                            if (messageToExpand) {
                                const cachedMessage = getMessage(messageToExpand.ID);
                                // If not yet in cache, we set it
                                if (!cachedMessage?.messageDocument?.initialized) {
                                    const messageState = { localID: messageToExpand.ID, data: messageToExpand };
                                    await dispatch(initializeMessage(messageState));
                                }
                            }
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
    }, [firstElementIDs.join(' '), isConversation, labelID]); // firstElementIDs.join(' ') makes this dependency stable
};

export default usePreLoadElements;
