import { useMemo } from 'react';

import { toMap } from '@proton/shared/lib/helpers/object';
import { normalize } from '@proton/shared/lib/helpers/string';
import type { ContactEmail, ContactFormatted } from '@proton/shared/lib/interfaces/contacts';
import type { SimpleMap } from '@proton/shared/lib/interfaces/utils';

import { useContactEmails, useContactGroups, useContacts } from '../../../hooks';
import useItemsSelection from '../../items/useItemsSelection';

interface Props {
    search?: string;
    contactID?: string;
    contactGroupID?: string;
}

const useContactList = ({ search, contactID, contactGroupID }: Props) => {
    const [contactEmails, loadingContactEmails] = useContactEmails();
    const [contacts = [], loadingContacts] = useContacts();
    const [contactGroups = [], loadingContactGroups] = useContactGroups();

    const normalizedSearch = normalize(search, true);

    const { contactGroupName, totalContactsInGroup } = useMemo<{
        contactGroupName?: string;
        totalContactsInGroup?: number;
    }>(() => {
        if (!contactGroups.length || !contactGroupID) {
            return Object.create(null);
        }
        const contactGroup = contactGroups.find(({ ID }) => ID === contactGroupID);
        return {
            contactGroupName: contactGroup?.Name,
            totalContactsInGroup: contacts.filter(({ LabelIDs = [] }) => LabelIDs.includes(contactGroupID)).length,
        };
    }, [contacts, contactGroups, contactGroupID]);

    const contactEmailsMap = useMemo(() => {
        if (!Array.isArray(contactEmails)) {
            return {};
        }
        return contactEmails.reduce<SimpleMap<ContactEmail[]>>((acc, contactEmail) => {
            const { ContactID } = contactEmail;
            if (!acc[ContactID]) {
                acc[ContactID] = [];
            }
            (acc[ContactID] as ContactEmail[]).push(contactEmail);
            return acc;
        }, Object.create(null));
    }, [contactEmails]);

    const contactGroupsMap = useMemo(() => toMap(contactGroups), [contactGroups]);

    const filteredContacts = useMemo(() => {
        if (!Array.isArray(contacts)) {
            return [];
        }
        return contacts.filter(({ Name, ID, LabelIDs }) => {
            const emails = contactEmailsMap[ID]
                ? (contactEmailsMap[ID] as ContactEmail[]).map(({ Email }) => Email).join(' ')
                : '';
            const searchFilter = normalizedSearch.length
                ? normalize(`${Name} ${emails}`, true).includes(normalizedSearch)
                : true;

            const groupFilter = contactGroupID ? LabelIDs.includes(contactGroupID) : true;

            return searchFilter && groupFilter;
        });
    }, [contacts, contactGroupID, normalizedSearch, contactEmailsMap]);

    const formattedContacts = useMemo<ContactFormatted[]>(() => {
        return filteredContacts.map((contact) => {
            const { ID } = contact;
            return {
                ...contact,
                emails: (contactEmailsMap[ID] || []).map(({ Email }) => Email),
            };
        });
    }, [filteredContacts, contactEmailsMap]);

    const contactIDs = useMemo(() => formattedContacts.map((contact) => contact.ID), [formattedContacts]);

    const {
        checkedIDs,
        selectedIDs,
        handleCheck,
        handleCheckAll,
        handleCheckOne,
        handleCheckOnlyOne,
        handleCheckRange,
    } = useItemsSelection({ activeID: contactID, allIDs: contactIDs, resetDependencies: [contactID, contactGroupID] });

    const hasCheckedAllFiltered = useMemo(() => {
        const filteredContactsLength = filteredContacts.length;
        const checkedIDsLength = checkedIDs.length;
        return !!filteredContactsLength && checkedIDsLength === filteredContactsLength;
    }, [filteredContacts, checkedIDs]);

    const loading = loadingContacts || loadingContactEmails || loadingContactGroups;

    return {
        loading,
        checkedIDs,
        selectedIDs,
        handleCheck,
        handleCheckAll,
        handleCheckOne,
        handleCheckOnlyOne,
        handleCheckRange,
        contactEmailsMap,
        contactGroupName,
        contactGroupsMap,
        totalContactsInGroup,
        formattedContacts,
        filteredContacts,
        contacts,
        contactGroups,
        hasCheckedAllFiltered,
    };
};

export default useContactList;
