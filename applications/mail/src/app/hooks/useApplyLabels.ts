import { useCallback } from 'react';
import { c, msgid } from 'ttag';
import { useApi, useNotifications, useEventManager } from 'react-components';
import { labelMessages, unlabelMessages } from 'proton-shared/lib/api/messages';
import { labelConversations, unlabelConversations } from 'proton-shared/lib/api/conversations';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';

export const useApplyLabels = () => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();

    const applyLabels = useCallback(
        async (isMessage: boolean, elementIDs: string[], changes: { [labelID: string]: boolean }) => {
            const labelAction = isMessage ? labelMessages : labelConversations;
            const unlabelAction = isMessage ? unlabelMessages : unlabelConversations;

            await Promise.all(
                Object.keys(changes).map((LabelID) => {
                    if (changes[LabelID]) {
                        return api(labelAction({ LabelID, IDs: elementIDs }));
                    } else {
                        return api(unlabelAction({ LabelID, IDs: elementIDs }));
                    }
                })
            );

            await call();

            if (Object.keys(changes).length === 1 && changes[MAILBOX_LABEL_IDS.STARRED]) {
                createNotification({ text: c('Success').t`Elements starred` });
            } else {
                createNotification({ text: c('Success').t`Label applied` });
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

    const moveToFolder = useCallback(
        async (isMessage: boolean, elementIDs: string[], folderID: string, folderName: string) => {
            const action = isMessage ? labelMessages : labelConversations;

            await api(action({ LabelID: folderID, IDs: elementIDs }));
            await call();
            createNotification({
                text: isMessage
                    ? c('Success').ngettext(
                          msgid`Message moved to ${folderName}`,
                          `Messages moved to ${folderName}`,
                          elementIDs.length
                      )
                    : c('Success').ngettext(
                          msgid`Conversation moved to ${folderName}`,
                          `Conversations moved to ${folderName}`,
                          elementIDs.length
                      )
            });
        },
        []
    );

    return moveToFolder;
};
