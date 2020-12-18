import React, { createContext, ReactNode, useContext, useMemo } from 'react';
import { useContactEmails, useContactGroups } from 'react-components';
import { ContactEmail, ContactGroup } from 'proton-shared/lib/interfaces/contacts';
import { toMap } from 'proton-shared/lib/helpers/object';
import { SimpleMap } from 'proton-shared/lib/interfaces/utils';
import { normalizeEmail } from 'proton-shared/lib/helpers/email';

export type ContactsMap = SimpleMap<ContactEmail>;
export type ContactsMapWithDuplicates = SimpleMap<ContactEmail[]>;
export type ContactGroupsMap = SimpleMap<ContactGroup>;
export type GroupWithContacts = { group: ContactGroup; contacts: ContactEmail[] };
export type GroupsWithContactsMap = SimpleMap<GroupWithContacts>;

export type ContactCache = {
    contactsMap: ContactsMap;
    contactsMapWithDuplicates: ContactsMapWithDuplicates;
    contactGroupsMap: ContactGroupsMap;
    groupsWithContactsMap: GroupsWithContactsMap;
    recipientsLabelCache: Map<string, string>;
    groupsLabelCache: Map<string, string>;
};

/**
 * Contact context containing the Contact cache
 */
const ContactContext = createContext<ContactCache>(null as any);

/**
 * Hook returning the Contact cache
 */
export const useContactCache = () => useContext(ContactContext);

const computeGroupsMap = (contacts: ContactEmail[], contactGroups: ContactGroup[]) =>
    contacts.reduce<GroupsWithContactsMap>((acc, contact) => {
        contact.LabelIDs?.forEach((labelID) => {
            if (acc[labelID]) {
                acc[labelID]?.contacts.push(contact);
            } else {
                const group = contactGroups.find((group) => group.ID === labelID);
                if (group) {
                    acc[labelID] = { group, contacts: [contact] };
                }
            }
        });
        return acc;
    }, {});

interface Props {
    children?: ReactNode;
    cache?: ContactCache; // Only for testing purposes
}

const toMapWithDuplicates = (contacts: ContactEmail[]) => {
    const contactsMapWithDuplicates = contacts.reduce<ContactsMapWithDuplicates>((acc, contact) => {
        const email = normalizeEmail(contact.Email);
        const contacts = acc[email];
        if (!contacts) {
            acc[email] = [contact];
        } else {
            contacts.push(contact);
            contacts.sort((a, b) => a.Order - b.Order);
        }
        return acc;
    }, {});

    const contactsMap = Object.keys(contactsMapWithDuplicates).reduce<ContactsMap>((acc, key) => {
        acc[key] = contactsMapWithDuplicates[key]?.[0];
        return acc;
    }, {});

    return { contactsMap, contactsMapWithDuplicates };
};

/**
 * Provider for the message cache and listen to event manager for updates
 */
const ContactProvider = ({ children, cache: testCache }: Props) => {
    const [contacts = []] = useContactEmails() as [ContactEmail[], boolean, Error];
    const [contactGroups = []] = useContactGroups();

    const cache = useMemo(
        () =>
            testCache || {
                ...toMapWithDuplicates(contacts),
                contactGroupsMap: toMap(contactGroups, 'Path'),
                groupsWithContactsMap: computeGroupsMap(contacts, contactGroups),
                recipientsLabelCache: new Map<string, string>(),
                groupsLabelCache: new Map<string, string>(),
            },
        [testCache, contacts, contactGroups]
    );

    return <ContactContext.Provider value={cache}>{children}</ContactContext.Provider>;
};

export default ContactProvider;
