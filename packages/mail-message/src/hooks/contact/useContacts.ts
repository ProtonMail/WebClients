import { baseUseSelector } from '@proton/react-redux-store/ProtonStoreContext';

import {
    contactGroupsMap,
    contactsMap,
    groupsLabelCache,
    groupsWithContactsMap,
    recipientsLabelCache,
} from '../../store/contacts/contactsSelectors';
import type { ContactsStoreState } from '../../store/contacts/contactsTypes';

const useContactsSelector = baseUseSelector.withTypes<ContactsStoreState>();

export const useContactsMap = () => {
    return useContactsSelector(contactsMap);
};

export const useContactGroupsMap = () => {
    return useContactsSelector(contactGroupsMap);
};

export const useGroupsWithContactsMap = () => {
    return useContactsSelector(groupsWithContactsMap);
};

export const useRecipientsLabelCache = () => {
    return useContactsSelector(recipientsLabelCache);
};

export const useGroupsLabelCache = () => {
    return useContactsSelector(groupsLabelCache);
};
