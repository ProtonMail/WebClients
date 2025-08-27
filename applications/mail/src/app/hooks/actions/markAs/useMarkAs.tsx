import { useCallback } from 'react';

import { type Message } from '@proton/shared/lib/interfaces/mail/Message';
import { MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';
import useFlag from '@proton/unleash/useFlag';
import isTruthy from '@proton/utils/isTruthy';
import uniqueBy from '@proton/utils/uniqueBy';

import type { SOURCE_ACTION } from 'proton-mail/components/list/list-telemetry/useListTelemetry';
import useListTelemetry, {
    ACTION_TYPE,
    numberSelectionElements,
} from 'proton-mail/components/list/list-telemetry/useListTelemetry';
import { useMarkAllAs } from 'proton-mail/hooks/actions/markAs/useMarkAllAs';
import { useMarkSelectionAs } from 'proton-mail/hooks/actions/markAs/useMarkSelectionAs';
import { MOVE_BACK_ACTION_TYPES } from 'proton-mail/hooks/actions/moveBackAction/interfaces';
import { useMoveBackAction } from 'proton-mail/hooks/actions/moveBackAction/useMoveBackAction';
import { useGetConversationsByIDs } from 'proton-mail/hooks/conversation/useConversation';
import useIsEncryptedSearch from 'proton-mail/hooks/useIsEncryptedSearch';
import { useMailDispatch } from 'proton-mail/store/hooks';
import {
    markConversationsAsRead,
    markConversationsAsUnread,
    markMessagesAsRead,
    markMessagesAsUnread,
} from 'proton-mail/store/mailbox/mailboxActions';

import { isElementMessage } from '../../../helpers/elements';
import type { Element } from '../../../models/element';

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
    const markSelectionAs = useMarkSelectionAs();
    const { markAllAs, selectAllMarkModal } = useMarkAllAs();
    const mailboxOptimisticRefactoringEnabled = useFlag('MailboxOptimisticRefactoring');
    const dispatch = useMailDispatch();
    const isEncryptedSearch = useIsEncryptedSearch();
    const { sendSimpleActionReport } = useListTelemetry();
    const getConversationsByIDs = useGetConversationsByIDs();
    const handleOnBackMoveAction = useMoveBackAction();

    const markAs = useCallback(
        async ({ elements, labelID = '', status, silent, selectAll, onCheckAll, sourceAction }: MarkAsParams) => {
            if (!elements.length) {
                return;
            }

            const isMessage = isElementMessage(elements[0]); // All elements are of the same type
            const isRead = status === MARK_AS_STATUS.READ;

            if (selectAll) {
                await markAllAs({ isMessage, labelID, status, onCheckAll, sourceAction });
            } else {
                handleOnBackMoveAction({ type: MOVE_BACK_ACTION_TYPES.MARK_AS, elements, status });

                if (mailboxOptimisticRefactoringEnabled) {
                    if (isMessage) {
                        const conversations = uniqueBy(
                            getConversationsByIDs(elements.map((element) => (element as Message).ConversationID))
                                .filter(isTruthy)
                                .map((conversationState) => conversationState.Conversation),
                            (conversation) => conversation.ID
                        );

                        if (isRead) {
                            void dispatch(
                                markMessagesAsRead({
                                    elements,
                                    conversations,
                                    labelID,
                                    isEncryptedSearch,
                                    showSuccessNotification: !silent,
                                })
                            );
                        } else {
                            void dispatch(
                                markMessagesAsUnread({
                                    elements,
                                    conversations,
                                    labelID,
                                    isEncryptedSearch,
                                    showSuccessNotification: !silent,
                                })
                            );
                        }
                    } else {
                        if (isRead) {
                            void dispatch(
                                markConversationsAsRead({
                                    elements,
                                    labelID,
                                    isEncryptedSearch,
                                    showSuccessNotification: !silent,
                                })
                            );
                        } else {
                            void dispatch(
                                markConversationsAsUnread({
                                    elements,
                                    labelID,
                                    isEncryptedSearch,
                                    showSuccessNotification: !silent,
                                })
                            );
                        }
                    }
                } else {
                    void markSelectionAs({
                        elements,
                        labelID,
                        status,
                        silent,
                        isMessage,
                        sourceAction,
                    });
                }
            }

            sendSimpleActionReport({
                actionType: isRead ? ACTION_TYPE.MARK_AS_READ : ACTION_TYPE.MARK_AS_UNREAD,
                actionLocation: sourceAction,
                numberMessage: numberSelectionElements(elements.length),
            });
        },
        [markAllAs, markSelectionAs]
    );

    return { markAs, selectAllMarkModal };
};
