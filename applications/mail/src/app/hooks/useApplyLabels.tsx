import React, { useCallback } from 'react';
import { c, msgid } from 'ttag';
import { useApi, useNotifications, useEventManager, useLabels } from 'react-components';
import { labelMessages, unlabelMessages } from 'proton-shared/lib/api/messages';
import { labelConversations, unlabelConversations } from 'proton-shared/lib/api/conversations';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';

import UndoButton from '../components/notifications/UndoButton';

const EXPIRATION = 7500;

export const useApplyLabels = () => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [labels = []] = useLabels();

    const applyLabels = useCallback(
        async (isMessage: boolean, elementIDs: string[], changes: { [labelID: string]: boolean }) => {
            const labelAction = isMessage ? labelMessages : labelConversations;
            const unlabelAction = isMessage ? unlabelMessages : unlabelConversations;
            const changesKeys = Object.keys(changes);

            const handleUndo = async () => {
                await Promise.all(
                    changesKeys.map((LabelID) => {
                        if (changes[LabelID]) {
                            return api(unlabelAction({ LabelID, IDs: elementIDs }));
                        } else {
                            return api(labelAction({ LabelID, IDs: elementIDs }));
                        }
                    })
                );

                await call();
            };

            await Promise.all(
                changesKeys.map((LabelID) => {
                    if (changes[LabelID]) {
                        return api(labelAction({ LabelID, IDs: elementIDs }));
                    } else {
                        return api(unlabelAction({ LabelID, IDs: elementIDs }));
                    }
                })
            );

            await call();

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
                                  msgid`Message added to ${labelName}`,
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

            createNotification({
                text: (
                    <>
                        {notificationText} <UndoButton onUndo={handleUndo} />
                    </>
                ),
                expiration: EXPIRATION
            });
        },
        []
    );

    return applyLabels;
};

export const useMoveToFolder = () => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();

    const moveToFolder = useCallback(
        async (isMessage: boolean, elementIDs: string[], folderID: string, folderName: string, fromLabelID: string) => {
            const action = isMessage ? labelMessages : labelConversations;

            const handleUndo = async () => {
                await api(action({ LabelID: fromLabelID, IDs: elementIDs }));
                await call();
            };

            await api(action({ LabelID: folderID, IDs: elementIDs }));
            await call();

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

            createNotification({
                text: (
                    <>
                        {notificationText} <UndoButton onUndo={handleUndo} />
                    </>
                ),
                expiration: EXPIRATION
            });
        },
        []
    );

    return moveToFolder;
};
