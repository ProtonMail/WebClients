import { RootState } from '../store';

export const contactsMap = (state: RootState) => state.contacts.contactsMap;
export const contactGroupsMap = (state: RootState) => state.contacts.contactGroupsMap;
export const groupsWithContactsMap = (state: RootState) => state.contacts.groupsWithContactsMap;
export const recipientsLabelCache = (state: RootState) => state.contacts.recipientsLabelCache;
export const groupsLabelCache = (state: RootState) => state.contacts.groupsLabelCache;
