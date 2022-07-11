import { useCallback } from 'react';
import { c } from 'ttag';
import unique from '@proton/utils/unique';
import isTruthy from '@proton/utils/isTruthy';
import { canonizeEmail } from '@proton/shared/lib/helpers/email';
import { InlineLinkButton, useAppLink } from '@proton/components/components';
import { createDefaultLabelsFilter } from '@proton/components/containers/filters/utils';
import { useNotifications, useFilters, useApi, useLabels, useFolders } from '@proton/components';
import { addTreeFilter, deleteFilter } from '@proton/shared/lib/api/filters';
import { Label } from '@proton/shared/lib/interfaces';
import { Folder } from '@proton/shared/lib/interfaces/Folder';
import { APPS } from '@proton/shared/lib/constants';
import { Filter } from '@proton/components/containers/filters/interfaces';
import { getSenders, isMessage as testIsMessage } from '../../helpers/elements';
import { Element } from '../../models/element';

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
    const [labels = []] = useLabels();
    const [folders = []] = useFolders();

    return useCallback(() => {
        let createdFilters: Filter[] = [];
        let notificationID: number | undefined;

        const doCreateFilters = async (elements: Element[], labelIDs: string[], isFolder: boolean) => {
            const senders = unique(
                elements
                    .flatMap((element) => getSenders(element))
                    .map((recipient) => recipient?.Address)
                    .filter(isTruthy)
                    .map((email) => canonizeEmail(email))
            );

            const usedLabels: (Label | Folder)[] = isFolder ? folders : labels;
            const appliedLabels = labelIDs
                .map((labelID) => usedLabels.find((label) => label.ID === labelID))
                .filter(isTruthy);
            const newFilters = createDefaultLabelsFilter(senders, appliedLabels, filters);

            const results = await Promise.all(
                newFilters.map((filter) => api<{ Filter: Filter }>(addTreeFilter(filter)))
            );
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
                        <span className="mr1">{notificationText}</span>
                        <InlineLinkButton
                            onClick={() => {
                                appLink('/mail/filters', APPS.PROTONACCOUNT);
                            }}
                        >
                            {c('Action').t`Edit`}
                        </InlineLinkButton>
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

        return { doCreateFilters, undoCreateFilters };
    }, [filters, labels, folders]);
};
