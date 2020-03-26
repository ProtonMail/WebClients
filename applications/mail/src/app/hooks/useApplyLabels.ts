import { useCallback } from 'react';
import { c, msgid } from 'ttag';
import { useApi, useNotifications, useEventManager } from 'react-components';
import { labelMessages, unlabelMessages } from 'proton-shared/lib/api/messages';
import { labelConversations, unlabelConversations } from 'proton-shared/lib/api/conversations';
import { Folder } from 'proton-shared/lib/interfaces/Folder';
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

    const moveToFolder = useCallback(async (isMessage: boolean, elementIDs: string[], folder?: Folder) => {
        const action = isMessage ? labelMessages : labelConversations;

        await api(action({ LabelID: folder?.ID, IDs: elementIDs }));
        await call();
        createNotification({
            text: isMessage
                ? c('Success').ngettext(
                      msgid`Message moved to ${folder?.Name}`,
                      `Messages moved to ${folder?.Name}`,
                      elementIDs.length
                  )
                : c('Success').ngettext(
                      msgid`Conversation moved to ${folder?.Name}`,
                      `Conversations moved to ${folder?.Name}`,
                      elementIDs.length
                  )
        });
    }, []);

    return moveToFolder;
};
