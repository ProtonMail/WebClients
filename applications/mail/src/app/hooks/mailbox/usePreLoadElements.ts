import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { unwrapResult } from '@reduxjs/toolkit';

import { FeatureCode } from '@proton/components/containers';
import { useFeature } from '@proton/components/hooks';

import { isConversation } from 'proton-mail/helpers/elements';
import { Element } from 'proton-mail/models/element';

import { findMessageToExpand } from '../../helpers/message/messageExpandable';
import { load } from '../../logic/conversations/conversationsActions';
import { initialize } from '../../logic/messages/read/messagesReadActions';
import { RootState, useAppDispatch } from '../../logic/store';

interface Props {
    elements: Element[];
    labelID: string;
    loading: boolean;
}

const usePreLoadElements = ({ elements, labelID, loading }: Props) => {
    const dispatch = useAppDispatch();
    const { feature } = useFeature(FeatureCode.NumberOfPreloadedConversations);
    const numberOfPreloadedConversations = feature?.Value || 0;
    const firstElements = elements.slice(0, numberOfPreloadedConversations);
    const conversationIDs = useSelector((state: RootState) => Object.keys(state.conversations));
    const isAllConversation = elements.every((element) => isConversation(element));

    useEffect(() => {
        const preload = async () => {
            try {
                await Promise.all(
                    firstElements.map(async ({ ID }) => {
                        const conversationAlreadyCached = conversationIDs.includes(ID);

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
