import type { ContactsState } from '@proton/mail-message/store/contacts/contactsTypes';

export const mailContactsInitialState: ContactsState = {
    contactsMap: {},
    contactsMapWithDuplicates: {},
    contactGroupsMap: {},
    groupsWithContactsMap: {},
    recipientsLabelCache: {},
    groupsLabelCache: {},
};
