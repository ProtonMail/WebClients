import { useCallback } from 'react';
import { c } from 'ttag';
import { ContactEmail, ContactProperties } from '@proton/shared/lib/interfaces/contacts';
import { createContactGroup, updateLabel } from '@proton/shared/lib/api/labels';
import { addContacts, labelContactEmails, unLabelContactEmails } from '@proton/shared/lib/api/contacts';
import { prepareContacts } from '@proton/shared/lib/contacts/encrypt';
import { CATEGORIES, OVERWRITE } from '@proton/shared/lib/contacts/constants';
import { useApi, useEventManager, useNotifications, useUserKeys } from '../../hooks';

export type UpdateGroupOptions = {
    groupID: string | undefined;
    name: string;
    color: string;
    toAdd: ContactEmail[];
    toRemove: ContactEmail[];
    toCreate: ContactEmail[];
    onDelayedSave?: (groupID: string) => void;
};

const useUpdateGroup = () => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [userKeysList] = useUserKeys();

    return useCallback(
        async ({ groupID, name, color, toAdd, toRemove, toCreate, onDelayedSave }: UpdateGroupOptions) => {
            // Update contact group
            const contactGroupParams = { Name: name, Color: color };
            const {
                Label: { ID: LabelID },
            } = await api(groupID ? updateLabel(groupID, contactGroupParams) : createContactGroup(contactGroupParams));

            if (onDelayedSave) {
                onDelayedSave(LabelID);
            }

            // Create new contacts
            if (toCreate.length) {
                const properties: ContactProperties[] = toCreate.map(({ Email }) => [
                    { field: 'fn', value: Email },
                    { field: 'email', value: Email, group: 'item1' },
                    { field: 'categories', value: name, group: 'item1' },
                ]);
                const Contacts = await prepareContacts(properties, userKeysList[0]);
                await api(
                    addContacts({
                        Contacts,
                        Overwrite: OVERWRITE.THROW_ERROR_IF_CONFLICT,
                        Labels: CATEGORIES.INCLUDE,
                    })
                );
            }

            // Label and unlabel existing contact emails
            await Promise.all(
                [
                    toAdd.length && api(labelContactEmails({ LabelID, ContactEmailIDs: toAdd.map(({ ID }) => ID) })),
                    toRemove.length &&
                        api(unLabelContactEmails({ LabelID, ContactEmailIDs: toRemove.map(({ ID }) => ID) })),
                ].filter(Boolean)
            );
            await call();
            createNotification({
                text: groupID ? c('Notification').t`Contact group updated` : c('Notification').t`Contact group created`,
            });
        },
        []
    );
};

export default useUpdateGroup;
