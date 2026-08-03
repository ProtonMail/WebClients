import type { ContactsState } from './contactsTypes';

export const mailContactsInitialState: ContactsState = {
    contactsMap: {},
    contactsMapWithDuplicates: {},
    contactGroupsMap: {},
    groupsWithContactsMap: {},
    recipientsLabelCache: {},
    groupsLabelCache: {},
};
