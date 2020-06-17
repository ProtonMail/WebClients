import { useMemo, useState } from 'react';
import { Contact, ContactGroup, ContactEmail } from 'proton-shared/lib/interfaces/contacts';
import { normalize } from 'proton-shared/lib/helpers/string';
import { toMap } from 'proton-shared/lib/helpers/object';

interface Props {
    search?: string;
    contactGroupID?: string;
    contactGroups?: ContactGroup[];
    contacts: Contact[];
    contactEmails: ContactEmail[];
}

interface ContactEmailsMap {
    [contactID: string]: ContactEmail[];
}

const useContactList = ({ search, contactGroupID, contactGroups, contacts, contactEmails }: Props) => {
    const [checkedContacts, setCheckedContacts] = useState(Object.create(null));
    const normalizedSearch = normalize(search);
    const contactGroupsMap = useMemo(() => toMap(contactGroups), [contactGroups]);

    const { contactGroupName, totalContactsInGroup } = useMemo(() => {
        if (!contactGroups || !contactGroups.length || !contactGroupID) {
            return Object.create(null);
        }
        const contactGroup = contactGroups.find(({ ID }) => ID === contactGroupID);
        if (!contactGroup) {
            return Object.create(null);
        }
        return {
            contactGroupName: contactGroup.Name,
            totalContactsInGroup: contacts.filter(({ LabelIDs = [] }) => LabelIDs.includes(contactGroupID)).length
        };
    }, [contacts, contactGroups, contactGroupID]);

    const contactEmailsMap = useMemo<ContactEmailsMap>(() => {
        if (!Array.isArray(contactEmails)) {
            return {};
        }
        return contactEmails.reduce((acc, contactEmail) => {
            const { ContactID } = contactEmail;
            if (!acc[ContactID]) {
                acc[ContactID] = [];
            }
            acc[ContactID].push(contactEmail);
            return acc;
        }, Object.create(null));
    }, [contactEmails]);

    const filteredContacts = useMemo<Contact[]>(() => {
        if (!Array.isArray(contacts)) {
            return [];
        }
        return contacts.filter(({ Name, ID, LabelIDs }) => {
            const emails = contactEmailsMap[ID] ? contactEmailsMap[ID].map(({ Email }) => Email).join(' ') : '';
            const searchFilter = normalizedSearch.length
                ? normalize(`${Name} ${emails}`).includes(normalizedSearch)
                : true;

            const groupFilter = contactGroupID ? LabelIDs.includes(contactGroupID) : true;

            return searchFilter && groupFilter;
        });
    }, [contacts, contactGroupID, normalizedSearch, contactEmailsMap]);

    const formattedContacts = useMemo(() => {
        return filteredContacts.map((contact) => {
            const { ID } = contact;
            return {
                ...contact,
                emails: (contactEmailsMap[ID] || []).map(({ Email }) => Email),
                isChecked: !!checkedContacts[ID]
            };
        });
    }, [filteredContacts, checkedContacts, contactEmailsMap]);

    const onCheck = (contactIDs: string[] = [], checked = false) => {
        const update = contactIDs.reduce((acc, contactID) => {
            acc[contactID] = checked;
            return acc;
        }, Object.create(null));
        setCheckedContacts({ ...checkedContacts, ...update });
    };

    const onCheckAll = () =>
        onCheck(
            filteredContacts.map(({ ID }) => ID),
            true
        );
    const onUncheckAll = () => onCheck(filteredContacts.map(({ ID }) => ID));

    return {
        contactGroupsMap,
        checkedContacts,
        onCheck,
        onCheckAll,
        onUncheckAll,
        contactEmailsMap,
        contactGroupName,
        totalContactsInGroup,
        formattedContacts
    };
};

export default useContactList;
