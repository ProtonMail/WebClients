import { useCallback, useMemo } from 'react';

import { c } from 'ttag';

import {
    NotificationButton,
    createDefaultLabelsFilter,
    useAddresses,
    useApi,
    useAppLink,
    useFilters,
    useNotifications,
} from '@proton/components';
import type { Filter } from '@proton/components';
import { useGetFolders, useGetLabels } from '@proton/components/hooks/useCategories';
import { addTreeFilter, deleteFilter } from '@proton/shared/lib/api/filters';
import { APPS, MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { canonicalizeEmail } from '@proton/shared/lib/helpers/email';
import type { Label } from '@proton/shared/lib/interfaces';
import type { Folder } from '@proton/shared/lib/interfaces/Folder';
import diff from '@proton/utils/diff';
import isTruthy from '@proton/utils/isTruthy';
import unique from '@proton/utils/unique';

import { getSenders, isMessage as testIsMessage } from '../../helpers/elements';
import { getFolderName } from '../../helpers/labels';
import type { Element } from '../../models/element';

const { INBOX, TRASH, SPAM, ARCHIVE } = MAILBOX_LABEL_IDS;
const DEFAULT_FOLDERS: Folder[] = [
    {
        ID: INBOX,
        Name: getFolderName(INBOX),
    } as Folder,
    {
        ID: TRASH,
        Name: getFolderName(TRASH),
    } as Folder,
    {
        ID: SPAM,
        Name: getFolderName(SPAM),
    } as Folder,
    {
        ID: ARCHIVE,
        Name: getFolderName(ARCHIVE),
    } as Folder,
];

const getNotificationTextFolder = (isMessage: boolean, senders: string[], folder: string) => {
    let notificationText: string;
    const sendersList = senders.join(', ');

    if (isMessage) {
        notificationText = c('Success').t`Messages from ${sendersList} will be moved to ${folder}`;
    } else {
        notificationText = c('Success').t`Conversations from ${sendersList} will be moved to ${folder}`;
    }

    return notificationText;
};

const getNotificationTextLabels = (isMessage: boolean, senders: string[], labels: string[]) => {
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

export const useCreateFilters = () => {
    const { createNotification, hideNotification } = useNotifications();
    const [filters = []] = useFilters();
    const api = useApi();
    const appLink = useAppLink();
    const getLabels = useGetLabels();
    const getFolders = useGetFolders();
    const [addresses = []] = useAddresses();

    const ownAddresses = useMemo(() => {
        return addresses.map((address) => canonicalizeEmail(address.Email));
    }, [addresses]);

    const getSendersToFilter = useCallback(
        (elements: Element[]) => {
            const allSenderAddresses = unique(
                elements
                    .flatMap((element) => getSenders(element))
                    .map((recipient) => recipient?.Address)
                    .filter(isTruthy)
                    .map((email) => canonicalizeEmail(email))
            );
            const senders = diff(allSenderAddresses, ownAddresses);
            return senders;
        },
        [ownAddresses]
    );

    const getFilterActions = useCallback(() => {
        let createdFilters: Filter[] = [];
        let notificationID: number | undefined;

        const doCreateFilters = async (elements: Element[], labelIDs: string[], isFolder: boolean) => {
            const senders = getSendersToFilter(elements);

            let usedLabels: (Label | Folder)[] = [];
            if (isFolder) {
                usedLabels = (await getFolders()) || [];
                usedLabels = [...usedLabels, ...DEFAULT_FOLDERS];
            } else {
                usedLabels = (await getLabels()) || [];
            }

            const appliedLabels = labelIDs
                .map((labelID) => usedLabels.find((label) => label.ID === labelID))
                .filter(isTruthy);

            const newFilters = createDefaultLabelsFilter(senders, appliedLabels, filters);

            let results;
            try {
                results = await Promise.all(
                    newFilters.map((filter) =>
                        api<{ Filter: Filter }>(addTreeFilter(filter, isFolder ? 'AutoFolder' : 'AutoLabel'))
                    )
                );
            } catch (e) {
                console.error('Error creating filter', e);
                return;
            }
            createdFilters = results.map((result) => result.Filter);

            const isMessage = testIsMessage(elements[0]);
            const notificationText = isFolder
                ? getNotificationTextFolder(isMessage, senders, appliedLabels[0].Name)
                : getNotificationTextLabels(
                      isMessage,
                      senders,
                      appliedLabels.map((label) => label.Name)
                  );

            notificationID = createNotification({
                text: (
                    <>
                        <span>{notificationText}</span>
                        <NotificationButton
                            onClick={() => {
                                appLink('/mail/filters', APPS.PROTONACCOUNT);
                            }}
                        >
                            {c('Action').t`Edit`}
                        </NotificationButton>
                    </>
                ),
            });
        };

        const undoCreateFilters = async () => {
            if (notificationID !== undefined) {
                hideNotification(notificationID);
            }
            return Promise.all(createdFilters.map((filter) => api(deleteFilter(filter.ID))));
        };

        return { getSendersToFilter, doCreateFilters, undoCreateFilters };
    }, [filters, getSendersToFilter]);

    return { getSendersToFilter, getFilterActions };
};
