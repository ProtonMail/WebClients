import type { MailState } from '../store';

export const contactsMap = (state: MailState) => state.mailContacts.contactsMap;
export const contactGroupsMap = (state: MailState) => state.mailContacts.contactGroupsMap;
export const groupsWithContactsMap = (state: MailState) => state.mailContacts.groupsWithContactsMap;
export const recipientsLabelCache = (state: MailState) => state.mailContacts.recipientsLabelCache;
export const groupsLabelCache = (state: MailState) => state.mailContacts.groupsLabelCache;
