import React, { useCallback } from 'react';
import { c, msgid } from 'ttag';
import { useApi, useNotifications, useEventManager, useLabels, classnames } from 'react-components';
import { labelMessages, unlabelMessages } from 'proton-shared/lib/api/messages';
import { labelConversations, unlabelConversations } from 'proton-shared/lib/api/conversations';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';

import UndoButton from '../components/notifications/UndoButton';
import { isMessage as testIsMessage } from '../helpers/elements';
import { Element } from '../models/element';
import { useOptimisticApplyLabels } from './optimistic/useOptimisticApplyLabels';

const { ALL_MAIL, ALL_DRAFTS, ALL_SENT, DRAFTS, SENT, STARRED, SPAM, TRASH } = MAILBOX_LABEL_IDS;

const EXPIRATION = 7500;

const getNotificationTextStarred = (isMessage: boolean, elementsCount: number) => {
    if (isMessage) {
        if (elementsCount === 1) {
            return c('Success').t`Message marked as Starred`;
        }
        return c('Success').ngettext(
            msgid`${elementsCount} message marked as Starred.`,
            `${elementsCount} messages marked as Starred.`,
            elementsCount
        );
    }

    if (elementsCount === 1) {
        return c('Success').t`Conversation marked as Starred`;
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
            return c('Success').t`Message removed from ${labelName}`;
        }
        return c('Success').ngettext(
            msgid`${elementsCount} message removed from ${labelName}.`,
            `${elementsCount} messages removed from ${labelName}.`,
            elementsCount
        );
    }

    if (elementsCount === 1) {
        return c('Success').t`Conversation removed from ${labelName}`;
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
            return c('Success').t`Message added to ${labelName}`;
        }
        return c('Success').ngettext(
            msgid`${elementsCount} message added to ${labelName}.`,
            `${elementsCount} messages added to ${labelName}.`,
            elementsCount
        );
    }

    if (elementsCount === 1) {
        return c('Success').t`Conversation added to ${labelName}`;
    }
    return c('Success').ngettext(
        msgid`${elementsCount} conversation added to ${labelName}.`,
        `${elementsCount} conversations added to ${labelName}.`,
        elementsCount
    );
};

const getNotificationTextMoved = (
    isMessage: boolean,
    elementsCount: number,
    folderName: string,
    folderID?: string,
    fromLabelID?: string
) => {
    if (folderID === SPAM) {
        if (isMessage) {
            if (elementsCount === 1) {
                return c('Success').t`Message moved to spam and sender added to Block List.`;
            }
            return c('Success').ngettext(
                msgid`${elementsCount} message moved to spam and sender added to Block List.`,
                `${elementsCount} messages moved to spam and sender added to Block List.`,
                elementsCount
            );
        }
        if (elementsCount === 1) {
            return c('Success').t`Conversation moved to spam and sender added to Block List.`;
        }
        return c('Success').ngettext(
            msgid`${elementsCount} conversation moved to spam and sender added to Block List.`,
            `${elementsCount} conversations moved to spam and sender added to Block List.`,
            elementsCount
        );
    }

    if (fromLabelID === SPAM && folderID !== TRASH) {
        if (isMessage) {
            if (elementsCount === 1) {
                return c('Success').t`Message moved to ${folderName} and sender removed from Block List.`;
            }
            return c('Success').ngettext(
                msgid`${elementsCount} message moved to ${folderName} and sender removed from Block List.`,
                `${elementsCount} messages moved to ${folderName} and sender removed from Block List.`,
                elementsCount
            );
        }
        if (elementsCount === 1) {
            return c('Success').t`Conversation moved to ${folderName} and sender removed from Block List.`;
        }
        return c('Success').ngettext(
            msgid`${elementsCount} conversation moved to ${folderName} and sender removed from Block List.`,
            `${elementsCount} conversations moved to ${folderName} and sender removed from Block List.`,
            elementsCount
        );
    }

    if (isMessage) {
        if (elementsCount === 1) {
            return c('Success').t`Message moved to ${folderName}.`;
        }
        return c('Success').ngettext(
            msgid`${elementsCount} message moved to ${folderName}.`,
            `${elementsCount} messages moved to ${folderName}.`,
            elementsCount
        );
    }

    if (elementsCount === 1) {
        return c('Success').t`Conversation moved to ${folderName}.`;
    }
    return c('Success').ngettext(
        msgid`${elementsCount} conversation moved to ${folderName}.`,
        `${elementsCount} conversations moved to ${folderName}.`,
        elementsCount
    );
};

export const useApplyLabels = () => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [labels = []] = useLabels();
    const optimisticApplyLabels = useOptimisticApplyLabels();

    const applyLabels = useCallback(
        async (elements: Element[], changes: { [labelID: string]: boolean }, silent = false) => {
            if (!elements.length) {
                return;
            }

            const isMessage = testIsMessage(elements[0]);
            const labelAction = isMessage ? labelMessages : labelConversations;
            const unlabelAction = isMessage ? unlabelMessages : unlabelConversations;
            const changesKeys = Object.keys(changes);
            const elementIDs = elements.map((element) => element.ID);
            const rollbacks = {} as { [labelID: string]: () => void };

            const handleDo = async () => {
                await Promise.all(
                    changesKeys.map(async (LabelID) => {
                        rollbacks[LabelID] = optimisticApplyLabels(elements, { [LabelID]: changes[LabelID] });
                        try {
                            if (changes[LabelID]) {
                                return await api(labelAction({ LabelID, IDs: elementIDs }));
                            }
                            return await api(unlabelAction({ LabelID, IDs: elementIDs }));
                        } catch (error) {
                            rollbacks[LabelID]();
                            throw error;
                        }
                    })
                );

                await call();
            };

            // No await ==> optimistic
            void handleDo();

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
                    text: notificationText,
                    expiration: EXPIRATION,
                });
            }
        },
        [labels]
    );

    return applyLabels;
};

export const useMoveToFolder = () => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [labels = []] = useLabels();
    const labelIDs = labels.map(({ ID }) => ID);
    const optimisticApplyLabels = useOptimisticApplyLabels();

    const moveToFolder = useCallback(
        async (elements: Element[], folderID: string, folderName: string, fromLabelID: string, silent = false) => {
            if (!elements.length) {
                return;
            }

            const isMessage = testIsMessage(elements[0]);
            const action = isMessage ? labelMessages : labelConversations;
            const canUndo = isMessage
                ? !([ALL_MAIL, ALL_DRAFTS, ALL_SENT, SPAM] as string[]).includes(fromLabelID)
                : ![...labelIDs, ALL_DRAFTS, DRAFTS, ALL_SENT, SENT, STARRED, ALL_MAIL, SPAM].includes(fromLabelID);
            const elementIDs = elements.map((element) => element.ID);

            const rollback = optimisticApplyLabels(elements, { [folderID]: true }, true);

            const handleDo = async () => {
                try {
                    await api(action({ LabelID: folderID, IDs: elementIDs }));
                } catch (error) {
                    rollback();
                }
                await call();
            };

            const handleUndo = async () => {
                rollback();
                await api(action({ LabelID: fromLabelID, IDs: elementIDs }));
                await call();
            };

            // No await ==> optimistic
            void handleDo();

            const notificationText = getNotificationTextMoved(
                isMessage,
                elementIDs.length,
                folderName,
                folderID,
                fromLabelID
            );

            if (!silent) {
                createNotification({
                    text: (
                        <>
                            <span className={classnames([canUndo && 'mr1'])}>{notificationText}</span>
                            {canUndo ? <UndoButton onUndo={handleUndo} /> : null}
                        </>
                    ),
                    expiration: EXPIRATION,
                });
            }
        },
        [labels]
    );

    return moveToFolder;
};

export const useStar = () => {
    const api = useApi();
    const { call } = useEventManager();
    const optimisticApplyLabels = useOptimisticApplyLabels();

    const star = useCallback(async (elements: Element[], value: boolean) => {
        if (!elements.length) {
            return;
        }

        const isMessage = testIsMessage(elements[0]);
        const labelAction = isMessage ? labelMessages : labelConversations;
        const unlabelAction = isMessage ? unlabelMessages : unlabelConversations;
        const action = value ? labelAction : unlabelAction;

        const rollback = optimisticApplyLabels(elements, { [MAILBOX_LABEL_IDS.STARRED]: value });

        try {
            await api(action({ LabelID: MAILBOX_LABEL_IDS.STARRED, IDs: elements.map((element) => element.ID) }));
        } catch (error) {
            rollback();
            throw error;
        }
        await call();
    }, []);

    return star;
};
