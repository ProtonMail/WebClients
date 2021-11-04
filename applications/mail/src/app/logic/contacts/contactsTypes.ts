import { SimpleMap } from '@proton/shared/lib/interfaces';
import { ContactEmail, ContactGroup } from '@proton/shared/lib/interfaces/contacts';

export type ContactsMap = SimpleMap<ContactEmail>;
export type ContactsMapWithDuplicates = SimpleMap<ContactEmail[]>;
export type ContactGroupsMap = SimpleMap<ContactGroup>;
export type GroupWithContacts = { group: ContactGroup; contacts: ContactEmail[] };
export type GroupsWithContactsMap = SimpleMap<GroupWithContacts>;

export type ContactsState = {
    contactsMap: ContactsMap;
    contactsMapWithDuplicates: ContactsMapWithDuplicates;
    contactGroupsMap: ContactGroupsMap;
    groupsWithContactsMap: GroupsWithContactsMap;
    recipientsLabelCache: SimpleMap<string>;
    groupsLabelCache: SimpleMap<string>;
};
