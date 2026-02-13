import { useFolders, useLabels } from '@proton/mail/store/labels/hooks';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import type { Folder, Label } from '@proton/shared/lib/interfaces';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';
import { VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';

import { isElementMessage } from 'proton-mail/helpers/elements';
import { useGetConversation } from 'proton-mail/hooks/conversation/useConversation';
import { useRouterNavigation } from 'proton-mail/router/hooks/useRouterNavigation';
import { params } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

import {
    getOpenedElementUpdated,
    hasReadItemsAfterAction,
    hasRemainingItemAfterAction,
    moveOutApplyLabelAction,
    moveOutMarkAsAction,
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
            moveOutStarAction(sourceLabelID, props.removeLabel, handleBack);
            break;
        case MOVE_BACK_ACTION_TYPES.PERMANENT_DELETE:
            moveOutPermanentDeleteAction(handleBack);
            break;
        case MOVE_BACK_ACTION_TYPES.MARK_AS:
            moveOutMarkAsAction(handleBack);
            break;
    }
};

export const useMoveBackAction = () => {
    const [labels = []] = useLabels();
    const [folders = []] = useFolders();
    const [mailSettings] = useMailSettings();

    const getConversation = useGetConversation();

    const { labelID: sourceLabelID, elementID } = useMailSelector(params);
    const conversationMode = mailSettings.ViewMode === VIEW_MODE.GROUP;
    const navigation = useRouterNavigation({ labelID: sourceLabelID });

    const handleOnBackMoveAction = (props: ActionProps) => {
        if (!elementID) {
            return;
        }

        // If the element that is currently opened is part of the selection to update, we need to move out. Else we don't need to
        const openedElementMoved = getOpenedElementUpdated(props.elements, conversationMode, elementID);

        if (
            !openedElementMoved ||
            (props.type === MOVE_BACK_ACTION_TYPES.MARK_AS && props.status === MARK_AS_STATUS.READ)
        ) {
            return;
        }

        // Selection contains messages only
        if (isElementMessage(props.elements[0])) {
            // in message mode
            if (!conversationMode) {
                executeCallback({ sourceLabelID, props, handleBack: navigation.handleBack, labels, folders });
            } else {
                /* If we are in conversation mode
                 * - If doing a mark as action, if all items will be unread after the action, we need to move out
                 * - Else we need to check that no item will remain in the current location after moving the current one. If there are items remaining, do not move out.
                 */
                const conversationID = (openedElementMoved as Message).ConversationID;
                const conversationFromState = getConversation(conversationID);

                if (props.type === MOVE_BACK_ACTION_TYPES.MARK_AS) {
                    const hasReadItems = hasReadItemsAfterAction(conversationFromState);

                    if (hasReadItems) {
                        return;
                    }
                } else {
                    const hasRemainingItem = hasRemainingItemAfterAction(
                        props.elements[0] as Message,
                        sourceLabelID,
                        conversationFromState
                    );

                    if (hasRemainingItem) {
                        return;
                    }
                }

                executeCallback({ sourceLabelID, props, handleBack: navigation.handleBack, labels, folders });
            }
        } else {
            executeCallback({ sourceLabelID, props, handleBack: navigation.handleBack, labels, folders });
        }
    };
    return handleOnBackMoveAction;
};
