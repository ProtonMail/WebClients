import { useCallback } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { logger } from '@proton/logger';
import { useFolders, useLabels } from '@proton/mail/store/labels/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';
import isTruthy from '@proton/utils/isTruthy';
import uniqueBy from '@proton/utils/uniqueBy';

import type { SOURCE_ACTION } from '../../../components/list/list-telemetry/useListTelemetry';
import useListTelemetry, {
    ACTION_TYPE,
    numberSelectionElements,
} from '../../../components/list/list-telemetry/useListTelemetry';
import { isElementMessage } from '../../../helpers/elements';
import type { Element } from '../../../models/element';
import { useMailDispatch } from '../../../store/hooks';
import {
    markConversationsAsRead,
    markConversationsAsUnread,
    markMessagesAsRead,
    markMessagesAsUnread,
} from '../../../store/mailbox/mailboxActions';
import { useGetConversationsByIDs } from '../../conversation/useConversation';
import { MOVE_BACK_ACTION_TYPES } from '../moveBackAction/interfaces';
import { useMoveBackAction } from '../moveBackAction/useMoveBackAction';
import { useMarkAllAs } from './useMarkAllAs';

export interface MarkAsParams {
    elements: Element[];
    labelID?: string;
    status: MARK_AS_STATUS;
    silent: boolean;
    selectAll?: boolean;
    onCheckAll?: (check: boolean) => void;
    sourceAction: SOURCE_ACTION;
}
export const useMarkAs = () => {
    const { markAllAs, selectAllMarkModal } = useMarkAllAs();
    const dispatch = useMailDispatch();
    const { createNotification } = useNotifications();
    const { sendSimpleActionReport } = useListTelemetry();
    const getConversationsByIDs = useGetConversationsByIDs();
    const handleOnBackMoveAction = useMoveBackAction();
    const [folders = []] = useFolders();
    const [labels = []] = useLabels();

    const markAs = useCallback(
        async ({ elements, labelID = '', status, silent, selectAll, onCheckAll, sourceAction }: MarkAsParams) => {
            if (!elements.length) {
                return;
            }
            // Disable marking as read/unread in soft deleted folder
            if (labelID === MAILBOX_LABEL_IDS.SOFT_DELETED) {
                return createNotification({
                    text: c('Error').t`That action can't be performed on emails in this folder`,
                    type: 'error',
                });
            }

            const isMessage = isElementMessage(elements[0]); // All elements are of the same type
            const isRead = status === MARK_AS_STATUS.READ;

            if (selectAll) {
                await markAllAs({ isMessage, labelID, status, onCheckAll, sourceAction });
            } else {
                handleOnBackMoveAction({ type: MOVE_BACK_ACTION_TYPES.MARK_AS, elements, status });

                if (isMessage) {
                    const messages = elements.filter(isElementMessage);
                    const conversations = uniqueBy(
                        getConversationsByIDs(messages.map((message) => message.ConversationID))
                            .filter(isTruthy)
                            .map((conversationState) => conversationState.Conversation),
                        (conversation) => conversation.ID
                    );

                    logger.info(`Marking ${elements.length} message(s) as ${status}`);
                    if (isRead) {
                        void dispatch(
                            markMessagesAsRead({
                                messages,
                                conversations,
                                labelID,
                                showSuccessNotification: !silent,
                                folders,
                                labels,
                            })
                        );
                    } else {
                        void dispatch(
                            markMessagesAsUnread({
                                messages,
                                conversations,
                                labelID,
                                showSuccessNotification: !silent,
                                folders,
                                labels,
                            })
                        );
                    }
                } else {
                    logger.info(`Marking ${elements.length} conversation(s) as ${status}`);
                    if (isRead) {
                        void dispatch(
                            markConversationsAsRead({
                                conversations: elements,
                                labelID,
                                showSuccessNotification: !silent,
                            })
                        );
                    } else {
                        void dispatch(
                            markConversationsAsUnread({
                                conversations: elements,
                                labelID,
                                showSuccessNotification: !silent,
                            })
                        );
                    }
                }
            }

            sendSimpleActionReport({
                actionType: isRead ? ACTION_TYPE.MARK_AS_READ : ACTION_TYPE.MARK_AS_UNREAD,
                actionLocation: sourceAction,
                numberMessage: numberSelectionElements(elements.length),
            });
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-4C749E
        [markAllAs]
    );

    return { markAs, selectAllMarkModal };
};
