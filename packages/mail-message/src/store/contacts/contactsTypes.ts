import type { ContactEmail, ContactGroup } from '@proton/shared/lib/interfaces/contacts/Contact';
import type { SimpleMap } from '@proton/shared/lib/interfaces/utils';

export type ContactsMap = SimpleMap<ContactEmail>;
export type ContactsMapWithDuplicates = SimpleMap<ContactEmail[]>;
export type ContactGroupsMap = SimpleMap<ContactGroup>;
type GroupWithContacts = { group: ContactGroup; contacts: ContactEmail[] };
export type GroupsWithContactsMap = SimpleMap<GroupWithContacts>;

export type ContactsState = {
    contactsMap: ContactsMap;
    contactsMapWithDuplicates: ContactsMapWithDuplicates;
    contactGroupsMap: ContactGroupsMap;
    groupsWithContactsMap: GroupsWithContactsMap;
    recipientsLabelCache: SimpleMap<string>;
    groupsLabelCache: SimpleMap<string>;
};
