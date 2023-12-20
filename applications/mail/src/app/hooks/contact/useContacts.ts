import { useMailSelector } from 'proton-mail/store/hooks';

import {
    contactGroupsMap,
    contactsMap,
    groupsLabelCache,
    groupsWithContactsMap,
    recipientsLabelCache,
} from '../../store/contacts/contactsSelectors';

export const useContactsMap = () => {
    return useMailSelector(contactsMap);
};

export const useContactGroupsMap = () => {
    return useMailSelector(contactGroupsMap);
};

export const useGroupsWithContactsMap = () => {
    return useMailSelector(groupsWithContactsMap);
};

export const useRecipientsLabelCache = () => {
    return useMailSelector(recipientsLabelCache);
};

export const useGroupsLabelCache = () => {
    return useMailSelector(groupsLabelCache);
};
