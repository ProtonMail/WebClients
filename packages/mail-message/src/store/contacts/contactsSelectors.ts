import type { ContactsStoreState } from './contactsTypes';

export const contactsMap = (state: ContactsStoreState) => state.mailContacts.contactsMap;
export const contactGroupsMap = (state: ContactsStoreState) => state.mailContacts.contactGroupsMap;
export const groupsWithContactsMap = (state: ContactsStoreState) => state.mailContacts.groupsWithContactsMap;
export const recipientsLabelCache = (state: ContactsStoreState) => state.mailContacts.recipientsLabelCache;
export const groupsLabelCache = (state: ContactsStoreState) => state.mailContacts.groupsLabelCache;
