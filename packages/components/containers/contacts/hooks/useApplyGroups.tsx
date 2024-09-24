import { useCallback } from 'react';

import { c } from 'ttag';

import { useModalTwoStatic } from '@proton/components/components/modalTwo/useModalTwo';
import { labelContactEmails, unLabelContactEmails } from '@proton/shared/lib/api/contacts';
import { hasReachedContactGroupMembersLimit } from '@proton/shared/lib/contacts/helpers/contactGroup';
import type { Contact, ContactEmail } from '@proton/shared/lib/interfaces/contacts';

import {
    useApi,
    useContactEmails,
    useContactGroups,
    useContacts,
    useEventManager,
    useMailSettings,
    useNotifications,
} from '../../../hooks';
import ContactGroupLimitReachedModal from '../modals/ContactGroupLimitReachedModal';
import type { SelectEmailsProps } from '../modals/SelectEmailsModal';

/**
 * Collect contacts having multiple emails
 * Used for <SelectEmailsModal />
 */
export const collectContacts = (contactEmails: ContactEmail[] = [], contacts: Contact[]) => {
    return contactEmails.reduce(
        (acc, { ContactID }) => {
            acc.duplicate[ContactID] = (acc.duplicate[ContactID] || 0) + 1;

            if (acc.duplicate[ContactID] === 2) {
                const contact = contacts.find(({ ID }: { ID: string }) => ID === ContactID);
                if (contact) {
                    acc.contacts.push(contact);
                }
            }

            return acc;
        },
        {
            contacts: [] as Contact[],
            duplicate: Object.create(null),
        }
    );
};

/**
 * Returns a reusable action to apply or remove groups to a list of contact emails
 */
const useApplyGroups = (
    onLock?: (lock: boolean) => void,
    setLoading?: (loading: boolean) => void,
    onSelectEmails?: (props: SelectEmailsProps) => Promise<ContactEmail[]>
) => {
    const [mailSettings] = useMailSettings();
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const api = useApi();
    const contacts = useContacts()[0] || [];
    const userContactEmails = useContactEmails()[0] || [];
    const [groups = []] = useContactGroups();

    const [contactGroupLimitReachedModal, handleShowContactGroupLimitReachedModal] =
        useModalTwoStatic(ContactGroupLimitReachedModal);

    const applyGroups = useCallback(
        async (contactEmails: ContactEmail[], changes: { [groupID: string]: boolean }, preventNotification = false) => {
            const { contacts: collectedContacts } = collectContacts(contactEmails, contacts);

            // contact emails in contacts with only one email (and then, skipping the modal)
            const simpleEmails = contactEmails.filter(
                (contactEmail) => !collectedContacts.find((contact) => contactEmail.ContactID === contact.ID)
            );

            // contact emails in contacts with multiple email (and then, passing through the modal)
            let selectedEmails: ContactEmail[] = [];

            if (collectedContacts.length) {
                const groupIDs = Object.entries(changes)
                    .filter(([, isChecked]) => isChecked)
                    .map(([groupID]) => groupID);

                if (groupIDs.length) {
                    setLoading?.(false);
                    selectedEmails = (await onSelectEmails?.({ groupIDs, contacts: collectedContacts, onLock })) || [];
                    setLoading?.(true);
                }
            }

            // When removing a group, we remove it for all emails selected
            const listForRemoving = [...contactEmails];

            // When adding a group, we do it only for the selected ones
            const listForAdding = [...simpleEmails, ...selectedEmails];

            const groupEntries = Object.entries(changes);

            const cannotAddContactInGroupIDs: string[] = [];

            await Promise.all(
                groupEntries.map(([groupID, isChecked]) => {
                    const contactGroup = groups.find((group) => group.ID === groupID);
                    const contactGroupName = contactGroup?.Name;

                    if (isChecked) {
                        const groupExistingMembers =
                            groupID &&
                            userContactEmails.filter(({ LabelIDs = [] }: { LabelIDs: string[] }) =>
                                LabelIDs.includes(groupID)
                            );

                        const toLabel = listForAdding
                            .filter(({ LabelIDs = [] }) => !LabelIDs.includes(groupID))
                            .map(({ ID }) => ID);

                        if (!toLabel.length) {
                            return Promise.resolve();
                        }

                        // Cannot add more than 100 contacts in a contact group
                        const canAddContact = hasReachedContactGroupMembersLimit(
                            groupExistingMembers.length + toLabel.length,
                            mailSettings,
                            false
                        );

                        if (!canAddContact) {
                            cannotAddContactInGroupIDs.push(groupID);
                            return Promise.resolve();
                        }

                        if (!preventNotification && contactGroupName) {
                            const notificationText = c('Info').t`Contact assigned to group ${contactGroupName}`;
                            createNotification({ text: notificationText });
                        }
                        return api(labelContactEmails({ LabelID: groupID, ContactEmailIDs: toLabel }));
                    }

                    const toUnlabel = listForRemoving
                        .filter(({ LabelIDs = [] }) => LabelIDs.includes(groupID))
                        .map(({ ID }) => ID);

                    if (!toUnlabel.length) {
                        return Promise.resolve();
                    }

                    if (!preventNotification && contactGroupName) {
                        const notificationText = c('Info').t`Contact unassigned from group ${contactGroupName}`;
                        createNotification({ text: notificationText });
                    }

                    return api(unLabelContactEmails({ LabelID: groupID, ContactEmailIDs: toUnlabel }));
                })
            );

            if (cannotAddContactInGroupIDs.length > 0) {
                void handleShowContactGroupLimitReachedModal({ groupIDs: cannotAddContactInGroupIDs });
            }

            await call();
        },
        [contacts, userContactEmails]
    );

    return { applyGroups, contactGroupLimitReachedModal };
};

export default useApplyGroups;
