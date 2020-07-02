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
        async (isMessage: boolean, elementIDs: string[], changes: { [labelID: string]: boolean }, silent = false) => {
            const labelAction = isMessage ? labelMessages : labelConversations;
            const unlabelAction = isMessage ? unlabelMessages : unlabelConversations;
            const changesKeys = Object.keys(changes);

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

    const moveToFolder = useCallback(
        async (
            isMessage: boolean,
            elementIDs: string[],
            folderID: string,
            folderName: string,
            fromLabelID: string,
            silent = false
        ) => {
            const action = isMessage ? labelMessages : labelConversations;
            const canUndo = isMessage
                ? true
                : ![
                      ...labelIDs,
                      MAILBOX_LABEL_IDS.ALL_DRAFTS,
                      MAILBOX_LABEL_IDS.DRAFTS,
                      MAILBOX_LABEL_IDS.ALL_SENT,
                      MAILBOX_LABEL_IDS.SENT,
                      MAILBOX_LABEL_IDS.STARRED,
                      MAILBOX_LABEL_IDS.ALL_MAIL
                  ].includes(fromLabelID);
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

    const star = useCallback(async (isMessage: boolean, elementIDs: string[], value: boolean) => {
        const labelAction = isMessage ? labelMessages : labelConversations;
        const unlabelAction = isMessage ? unlabelMessages : unlabelConversations;
        const action = value ? labelAction : unlabelAction;

        await api(action({ LabelID: MAILBOX_LABEL_IDS.STARRED, IDs: elementIDs }));
        await call();
    }, []);

    return star;
};
