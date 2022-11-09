import { useCallback } from 'react';

import { c, msgid } from 'ttag';

import { useApi, useEventManager, useLabels, useNotifications } from '@proton/components';
import { labelConversations, unlabelConversations } from '@proton/shared/lib/api/conversations';
import { undoActions } from '@proton/shared/lib/api/mailUndoActions';
import { labelMessages, unlabelMessages } from '@proton/shared/lib/api/messages';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import isTruthy from '@proton/utils/isTruthy';

import UndoActionNotification from '../../components/notifications/UndoActionNotification';
import { SUCCESS_NOTIFICATION_EXPIRATION } from '../../constants';
import { isMessage as testIsMessage } from '../../helpers/elements';
import { backendActionFinished, backendActionStarted } from '../../logic/elements/elementsActions';
import { useAppDispatch } from '../../logic/store';
import { Element } from '../../models/element';
import { useOptimisticApplyLabels } from '../optimistic/useOptimisticApplyLabels';
import { useCreateFilters } from './useCreateFilters';

const getNotificationTextStarred = (isMessage: boolean, elementsCount: number) => {
    if (isMessage) {
        if (elementsCount === 1) {
            return c('Success').t`Message marked as Starred.`;
        }
        return c('Success').ngettext(
            msgid`${elementsCount} message marked as Starred.`,
            `${elementsCount} messages marked as Starred.`,
            elementsCount
        );
    }

    if (elementsCount === 1) {
        return c('Success').t`Conversation marked as Starred.`;
    }
    return c('Success').ngettext(
        msgid`${elementsCount} conversation marked as Starred.`,
        `${elementsCount} conversations marked as Starred.`,
        elementsCount
    );
};

const getNotificationTextRemoved = (isMessage: boolean, elementsCount: number, labelName: string) => {
    if (isMessage) {
        if (elementsCount === 1) {
            return c('Success').t`Message removed from ${labelName}.`;
        }
        return c('Success').ngettext(
            msgid`${elementsCount} message removed from ${labelName}.`,
            `${elementsCount} messages removed from ${labelName}.`,
            elementsCount
        );
    }

    if (elementsCount === 1) {
        return c('Success').t`Conversation removed from ${labelName}.`;
    }
    return c('Success').ngettext(
        msgid`${elementsCount} conversation removed from ${labelName}.`,
        `${elementsCount} conversations removed from ${labelName}.`,
        elementsCount
    );
};

const getNotificationTextAdded = (isMessage: boolean, elementsCount: number, labelName: string) => {
    if (isMessage) {
        if (elementsCount === 1) {
            return c('Success').t`Message added to ${labelName}.`;
        }
        return c('Success').ngettext(
            msgid`${elementsCount} message added to ${labelName}.`,
            `${elementsCount} messages added to ${labelName}.`,
            elementsCount
        );
    }

    if (elementsCount === 1) {
        return c('Success').t`Conversation added to ${labelName}.`;
    }
    return c('Success').ngettext(
        msgid`${elementsCount} conversation added to ${labelName}.`,
        `${elementsCount} conversations added to ${labelName}.`,
        elementsCount
    );
};

export const useApplyLabels = () => {
    const api = useApi();
    const { call, stop, start } = useEventManager();
    const { createNotification } = useNotifications();
    const [labels = []] = useLabels();
    const optimisticApplyLabels = useOptimisticApplyLabels();
    const dispatch = useAppDispatch();
    const { getFilterActions } = useCreateFilters();

    const applyLabels = useCallback(
        async (
            elements: Element[],
            changes: { [labelID: string]: boolean },
            createFilters: boolean,
            silent = false,
            selectedLabelIDs: string[] = []
        ) => {
            if (!elements.length) {
                return;
            }

            let undoing = false;

            const isMessage = testIsMessage(elements[0]);
            const labelAction = isMessage ? labelMessages : labelConversations;
            const unlabelAction = isMessage ? unlabelMessages : unlabelConversations;
            const changesKeys = Object.keys(changes);
            const elementIDs = elements.map((element) => element.ID);
            const rollbacks = {} as { [labelID: string]: () => void };

            const { doCreateFilters, undoCreateFilters } = getFilterActions();

            const handleDo = async () => {
                let tokens = [];
                try {
                    // Stop the event manager to prevent race conditions
                    stop();
                    dispatch(backendActionStarted());
                    [tokens] = await Promise.all([
                        Promise.all(
                            changesKeys.map(async (LabelID) => {
                                rollbacks[LabelID] = optimisticApplyLabels(elements, { [LabelID]: changes[LabelID] });
                                try {
                                    const action = changes[LabelID] ? labelAction : unlabelAction;
                                    const { UndoToken } = await api<{ UndoToken: { Token: string } }>(
                                        action({ LabelID, IDs: elementIDs })
                                    );
                                    return UndoToken.Token;
                                } catch (error: any) {
                                    rollbacks[LabelID]();
                                    throw error;
                                }
                            })
                        ),
                        createFilters ? doCreateFilters(elements, selectedLabelIDs, false) : undefined,
                    ]);
                } finally {
                    dispatch(backendActionFinished());
                    if (!undoing) {
                        start();
                        await call();
                    }
                }
                return tokens;
            };

            // No await ==> optimistic
            const promise = handleDo();

            const handleUndo = async () => {
                try {
                    undoing = true;
                    const tokens = await promise;
                    // Stop the event manager to prevent race conditions
                    stop();
                    Object.values(rollbacks).forEach((rollback) => rollback());
                    const filteredTokens = tokens.filter(isTruthy);

                    await Promise.all([
                        Promise.all(filteredTokens.map((token) => api(undoActions(token)))),
                        createFilters ? undoCreateFilters() : undefined,
                    ]);
                } finally {
                    start();
                    await call();
                }
            };

            let notificationText = c('Success').t`Labels applied.`;

            const elementsCount = elementIDs.length;

            if (changesKeys.length === 1) {
                const labelName = labels.filter((l) => l.ID === changesKeys[0])[0]?.Name;

                if (changesKeys[0] === MAILBOX_LABEL_IDS.STARRED) {
                    notificationText = getNotificationTextStarred(isMessage, elementsCount);
                } else if (!Object.values(changes)[0]) {
                    notificationText = getNotificationTextRemoved(isMessage, elementsCount, labelName);
                } else {
                    notificationText = getNotificationTextAdded(isMessage, elementsCount, labelName);
                }
            }

            if (!silent) {
                createNotification({
                    text: <UndoActionNotification onUndo={handleUndo}>{notificationText}</UndoActionNotification>,
                    expiration: SUCCESS_NOTIFICATION_EXPIRATION,
                });
            }
        },
        [labels]
    );

    return applyLabels;
};
