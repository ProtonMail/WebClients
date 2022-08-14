import { ReactNode, createContext, useContext, useMemo } from 'react';

import { useContactEmails, useContactGroups } from '@proton/components';
import { canonizeEmail } from '@proton/shared/lib/helpers/email';
import { ContactEmail, ContactGroup } from '@proton/shared/lib/interfaces/contacts';
import { SimpleMap } from '@proton/shared/lib/interfaces/utils';

export type GroupWithContacts = { group: ContactGroup; contacts: ContactEmail[] };
export type GroupsWithContactsMap = SimpleMap<GroupWithContacts>;

export type ContactEmailsCache = {
    contactEmails: ContactEmail[];
    contactGroups: ContactGroup[];
    contactEmailsMap: SimpleMap<ContactEmail>;
    contactEmailsMapWithDuplicates: SimpleMap<ContactEmail[]>;
    groupsWithContactsMap: GroupsWithContactsMap;
};

const ContactEmailsContext = createContext<ContactEmailsCache | null>(null);

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

export const useContactEmailsCache = () => {
    const state = useContext(ContactEmailsContext);
    if (!state) {
        throw new Error('Trying to use uninitialized ContactEmailsProvider');
    }
    return state;
};

const toMapWithDuplicates = (contacts: ContactEmail[]) => {
    const contactEmailsMapWithDuplicates = contacts.reduce<SimpleMap<ContactEmail[]>>((acc, contact) => {
        const email = canonizeEmail(contact.Email);
        const contacts = acc[email];
        if (!contacts) {
            acc[email] = [contact];
        } else {
            contacts.push(contact);
            contacts.sort((a, b) => a.Order - b.Order);
        }
        return acc;
    }, {});

    const contactEmailsMap = Object.keys(contactEmailsMapWithDuplicates).reduce<SimpleMap<ContactEmail>>((acc, key) => {
        acc[key] = contactEmailsMapWithDuplicates[key]?.[0];
        return acc;
    }, {});

    return { contactEmailsMap, contactEmailsMapWithDuplicates };
};

interface Props {
    children?: ReactNode;
}
const ContactEmailsProvider = ({ children }: Props) => {
    const [contactEmails = []] = useContactEmails() as [ContactEmail[], boolean, Error];
    const [contactGroups = []] = useContactGroups();
    const cache = useMemo(() => {
        return {
            contactEmails,
            contactGroups,
            ...toMapWithDuplicates(contactEmails),
            groupsWithContactsMap: computeGroupsMap(contactEmails, contactGroups),
        };
    }, [contactEmails, contactGroups]);

    return <ContactEmailsContext.Provider value={cache}>{children}</ContactEmailsContext.Provider>;
};

export default ContactEmailsProvider;
