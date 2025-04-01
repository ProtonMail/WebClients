import { useCallback } from 'react';

import { useFolders, useLabels } from '@proton/mail/index';
import type { Folder, Label } from '@proton/shared/lib/interfaces';
import { type Message } from '@proton/shared/lib/interfaces/mail/Message';
import { VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';

import { isMessage } from 'proton-mail/helpers/elements';
import { useGetConversation } from 'proton-mail/hooks/conversation/useConversation';
import useMailModel from 'proton-mail/hooks/useMailModel';
import { useRouterNavigation } from 'proton-mail/router/hooks/useRouterNavigation';
import { params } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

import {
    getOpenedElementUpdated,
    hasRemainingItemAfterAction,
    moveOutApplyLabelAction,
    moveOutMoveAction,
    moveOutPermanentDeleteAction,
    moveOutStarAction,
} from './helpers';
import { type ActionProps, MOVE_BACK_ACTION_TYPES } from './interfaces';

interface CallbackProps {
    sourceLabelID: string;
    props: ActionProps;
    handleBack: () => void;
    labels?: Label[];
    folders?: Folder[];
}

const executeCallback = ({ sourceLabelID, props, handleBack, labels, folders }: CallbackProps) => {
    switch (props.type) {
        case MOVE_BACK_ACTION_TYPES.MOVE:
            moveOutMoveAction(sourceLabelID, props.destinationLabelID, handleBack, labels, folders);
            break;
        case MOVE_BACK_ACTION_TYPES.APPLY_LABEL:
            moveOutApplyLabelAction(sourceLabelID, props.changes, handleBack);
            break;
        case MOVE_BACK_ACTION_TYPES.STAR:
            moveOutStarAction(sourceLabelID, props.isUnstarringElement, handleBack);
            break;
        case MOVE_BACK_ACTION_TYPES.PERMANENT_DELETE:
            moveOutPermanentDeleteAction(handleBack);
            break;
    }
};

export const useMoveBackAction = () => {
    const [labels = []] = useLabels();
    const [folders = []] = useFolders();
    const mailSettings = useMailModel('MailSettings');

    const getConversation = useGetConversation();

    const { labelID: sourceLabelID, elementID } = useMailSelector(params);
    const conversationMode = mailSettings.ViewMode === VIEW_MODE.GROUP;
    const navigation = useRouterNavigation({ labelID: sourceLabelID });

    const handleOnBackMoveAction = useCallback(
        (props: ActionProps) => {
            if (!elementID) {
                return;
            }

            // If the element that is currently opened is part of the selection to update, we need to move out. Else we don't need to
            const openedElementMoved = getOpenedElementUpdated(props.elements, conversationMode, elementID);

            if (!openedElementMoved) {
                return;
            }

            // Selection contains messages only
            if (isMessage(props.elements[0])) {
                // in message mode
                if (!conversationMode) {
                    executeCallback({ sourceLabelID, props, handleBack: navigation.handleBack, labels, folders });
                } else {
                    // Else, if we are in conversation mode, it means we need to check that no item will remain in the current location after moving the current one. If there are items remaining, do not move out
                    const conversationID = (openedElementMoved as Message).ConversationID;
                    const conversationFromState = getConversation(conversationID);
                    const hasRemainingItem = hasRemainingItemAfterAction(sourceLabelID, conversationFromState);

                    if (hasRemainingItem) {
                        return;
                    }

                    executeCallback({ sourceLabelID, props, handleBack: navigation.handleBack, labels, folders });
                }
            } else {
                executeCallback({ sourceLabelID, props, handleBack: navigation.handleBack, labels, folders });
            }
        },
        [elementID, conversationMode, sourceLabelID, labels, folders]
    );

    return {
        handleOnBackMoveAction,
    };
};
