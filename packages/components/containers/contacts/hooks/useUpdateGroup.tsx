import { useCallback } from 'react';

import { c } from 'ttag';

import useApi from '@proton/components/hooks/useApi';
import useEventManager from '@proton/components/hooks/useEventManager';
import { addContacts, labelContactEmails, unLabelContactEmails } from '@proton/shared/lib/api/contacts';
import { createContactGroup, updateLabel } from '@proton/shared/lib/api/labels';
import { CATEGORIES, OVERWRITE } from '@proton/shared/lib/contacts/constants';
import { prepareVCardContacts } from '@proton/shared/lib/contacts/encrypt';
import { createContactPropertyUid } from '@proton/shared/lib/contacts/properties';
import type { Label } from '@proton/shared/lib/interfaces';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts';

import { useGetUserKeys, useNotifications } from '../../../hooks';

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
    const getUserKeys = useGetUserKeys();

    return useCallback(
        async ({ groupID, name, color, toAdd, toRemove, toCreate, onDelayedSave }: UpdateGroupOptions) => {
            // Update contact group
            const contactGroupParams = { Name: name, Color: color };
            const {
                Label: { ID: LabelID },
            } = await api<{ Label: Label }>(
                groupID ? updateLabel(groupID, contactGroupParams) : createContactGroup(contactGroupParams)
            );

            if (onDelayedSave) {
                onDelayedSave(LabelID);
            }

            // Create new contacts
            if (toCreate.length) {
                const vCardContacts = toCreate.map(({ Email }) => ({
                    fn: [{ field: 'fn', value: Email, uid: createContactPropertyUid() }],
                    email: [{ field: 'email', value: Email, group: 'item1', uid: createContactPropertyUid() }],
                    categories: [{ field: 'categories', value: name, group: 'item1', uid: createContactPropertyUid() }],
                }));
                const userKeys = await getUserKeys();
                const Contacts = await prepareVCardContacts(vCardContacts, userKeys[0]);
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
