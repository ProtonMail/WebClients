import React, { useCallback } from 'react';
import { c, msgid } from 'ttag';
import { useApi, useNotifications, useEventManager, useLabels } from 'react-components';
import { labelMessages, unlabelMessages } from 'proton-shared/lib/api/messages';
import { labelConversations, unlabelConversations } from 'proton-shared/lib/api/conversations';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';

import UndoButton from '../components/notifications/UndoButton';
import { isMessage as testIsMessage } from '../helpers/elements';
import { Element } from '../models/element';
import { useOptimisticApplyLabels } from './optimistic/useOptimisticApplyLabels';

const EXPIRATION = 7500;

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
                            } else {
                                return await api(unlabelAction({ LabelID, IDs: elementIDs }));
                            }
                        } catch (error) {
                            rollbacks[LabelID]();
                            throw error;
                        }
                    })
                );

                await call();
            };

            // No await ==> optimistic
            handleDo();

            let notificationText = c('Success').t`Labels applied.`;

            if (changesKeys.length === 1) {
                const labelName = labels.filter((l) => l.ID === changesKeys[0])[0]?.Name;

                if (changesKeys[0] === MAILBOX_LABEL_IDS.STARRED) {
                    notificationText = isMessage
                        ? c('Success').ngettext(
                              msgid`Message marked as Starred.`,
                              `${elementIDs.length} messages marked as Starred.`,
                              elementIDs.length
                          )
                        : c('Success').ngettext(
                              msgid`Conversation marked as Starred.`,
                              `${elementIDs.length} conversations marked as Starred.`,
                              elementIDs.length
                          );
                } else {
                    if (!Object.values(changes)[0]) {
                        notificationText = isMessage
                            ? c('Success').ngettext(
                                  msgid`Message removed from ${labelName}.`,
                                  `${elementIDs.length} messages removed from ${labelName}.`,
                                  elementIDs.length
                              )
                            : c('Success').ngettext(
                                  msgid`Conversation removed from ${labelName}.`,
                                  `${elementIDs.length} conversations removed from ${labelName}.`,
                                  elementIDs.length
                              );
                    } else {
                        notificationText = isMessage
                            ? c('Success').ngettext(
                                  msgid`Message added to ${labelName}.`,
                                  `${elementIDs.length} messages added to ${labelName}.`,
                                  elementIDs.length
                              )
                            : c('Success').ngettext(
                                  msgid`Conversation added to ${labelName}.`,
                                  `${elementIDs.length} conversations added to ${labelName}.`,
                                  elementIDs.length
                              );
                    }
                }
            }

            if (!silent) {
                createNotification({
                    text: notificationText,
                    expiration: EXPIRATION
                });
            }
        },
        []
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
                ? MAILBOX_LABEL_IDS.ALL_MAIL !== fromLabelID
                : ![
                      ...labelIDs,
                      MAILBOX_LABEL_IDS.ALL_DRAFTS,
                      MAILBOX_LABEL_IDS.DRAFTS,
                      MAILBOX_LABEL_IDS.ALL_SENT,
                      MAILBOX_LABEL_IDS.SENT,
                      MAILBOX_LABEL_IDS.STARRED,
                      MAILBOX_LABEL_IDS.ALL_MAIL
                  ].includes(fromLabelID);
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
            handleDo();

            const notificationText = isMessage
                ? c('Success').ngettext(
                      msgid`Message moved to ${folderName}.`,
                      `${elementIDs.length} messages moved to ${folderName}.`,
                      elementIDs.length
                  )
                : c('Success').ngettext(
                      msgid`Conversation moved to ${folderName}.`,
                      `${elementIDs.length} conversations moved to ${folderName}.`,
                      elementIDs.length
                  );

            if (!silent) {
                createNotification({
                    text: (
                        <>
                            <span className="mr1">{notificationText}</span>
                            {canUndo ? <UndoButton onUndo={handleUndo} /> : null}
                        </>
                    ),
                    expiration: EXPIRATION
                });
            }
        },
        []
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
