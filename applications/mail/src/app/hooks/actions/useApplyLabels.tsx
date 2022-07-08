import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { c, msgid } from 'ttag';
import { useApi, useNotifications, useEventManager, useLabels, FilterUtils, useFilters } from '@proton/components';
import { labelMessages, unlabelMessages } from '@proton/shared/lib/api/messages';
import { labelConversations, unlabelConversations } from '@proton/shared/lib/api/conversations';
import { undoActions } from '@proton/shared/lib/api/mailUndoActions';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import isTruthy from '@proton/utils/isTruthy';
import unique from '@proton/utils/unique';
import { canonizeEmail } from '@proton/shared/lib/helpers/email';
import { addTreeFilter } from '@proton/shared/lib/api/filters';
import UndoActionNotification from '../../components/notifications/UndoActionNotification';
import { getSenders, isMessage as testIsMessage } from '../../helpers/elements';
import { Element } from '../../models/element';
import { useOptimisticApplyLabels } from '../optimistic/useOptimisticApplyLabels';
import { SUCCESS_NOTIFICATION_EXPIRATION } from '../../constants';
import { backendActionFinished, backendActionStarted } from '../../logic/elements/elementsActions';

const { createDefaultLabelsFilter } = FilterUtils;

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

const getNotificationTextFilters = (isMessage: boolean, senders: string[], labels: string[]) => {
    let notificationText: string;
    const sendersList = senders.join(', ');
    const labelsList = labels.join(', ');

    if (isMessage) {
        notificationText = c('Success').t`Messages from ${sendersList} will be labelled as ${labelsList}`;
    } else {
        notificationText = c('Success').t`Conversations from ${sendersList} will be labelled as ${labelsList}`;
    }

    return notificationText;
};

export const useApplyLabels = () => {
    const api = useApi();
    const { call, stop, start } = useEventManager();
    const { createNotification } = useNotifications();
    const [labels = []] = useLabels();
    const [filters = []] = useFilters();
    const optimisticApplyLabels = useOptimisticApplyLabels();
    const dispatch = useDispatch();

    const doCreateFilters = async (elements: Element[], labelIDs: string[]) => {
        const senders = unique(
            elements
                .flatMap((element) => getSenders(element))
                .map((recipient) => recipient?.Address)
                .filter(isTruthy)
                .map((email) => canonizeEmail(email))
        );
        const appliedLabels = labelIDs.map((labelID) => labels.find((label) => label.ID === labelID)).filter(isTruthy);
        const newFilters = createDefaultLabelsFilter(senders, appliedLabels, filters);
        await Promise.all(newFilters.map((filter) => api(addTreeFilter(filter as any))));
        createNotification({
            text: getNotificationTextFilters(
                testIsMessage(elements[0]),
                senders,
                appliedLabels.map((label) => label.Name)
            ),
        });
    };

    const applyLabels = useCallback(
        async (
            elements: Element[],
            changes: { [labelID: string]: boolean },
            createFilters: boolean,
            silent = false
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

            const handleDo = async () => {
                let tokens = [];
                try {
                    // Stop the event manager to prevent race conditions
                    stop();
                    dispatch(backendActionStarted());
                    tokens = await Promise.all(
                        changesKeys.map(async (LabelID) => {
                            rollbacks[LabelID] = optimisticApplyLabels(elements, { [LabelID]: changes[LabelID] });
                            try {
                                const action = changes[LabelID] ? labelAction : unlabelAction;
                                const { UndoToken } = await api(action({ LabelID, IDs: elementIDs }));
                                return UndoToken.Token;
                            } catch (error: any) {
                                rollbacks[LabelID]();
                                throw error;
                            }
                        })
                    );
                    if (createFilters) {
                        await doCreateFilters(
                            elements,
                            changesKeys.filter((labelID) => changes[labelID])
                        );
                    }
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
                    await Promise.all(filteredTokens.map((token) => api(undoActions(token))));
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
