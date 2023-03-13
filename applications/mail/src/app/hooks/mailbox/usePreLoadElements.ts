import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { unwrapResult } from '@reduxjs/toolkit';

import { FeatureCode } from '@proton/components/containers';
import { useApi, useFeature } from '@proton/components/hooks';

import { findMessageToExpand } from '../../helpers/message/messageExpandable';
import { load } from '../../logic/conversations/conversationsActions';
import { initialize } from '../../logic/messages/read/messagesReadActions';
import { RootState, useAppDispatch } from '../../logic/store';

const usePreLoadElements = (elementIDs: string[], isConversation: boolean, labelID: string) => {
    const normalApi = useApi();
    const dispatch = useAppDispatch();
    const { feature } = useFeature(FeatureCode.NumberOfPreloadedConversations);
    const numberOfPreloadedConversations = feature?.Value || 0;
    const firstElementIDs = elementIDs.slice(0, numberOfPreloadedConversations);
    const conversationIDs = useSelector((state: RootState) => Object.keys(state.conversations));
    const silentApi = <T>(config: any) => normalApi<T>({ ...config, silence: true });

    useEffect(() => {
        const preload = async () => {
            try {
                await Promise.all(
                    firstElementIDs.map(async (ID) => {
                        const conversationAlreadyCached = conversationIDs.includes(ID);

                        if (!conversationAlreadyCached) {
                            const resultAction = await dispatch(
                                load({ api: silentApi, conversationID: ID, messageID: undefined })
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

        if (isConversation && firstElementIDs.length > 0) {
            void preload();
        }
    }, [firstElementIDs.join(), isConversation, labelID]); // "firstElementIDs.join()" makes firstElementIDs dependency stable
};

export default usePreLoadElements;
