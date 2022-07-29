import { useSelector } from 'react-redux';

import {
    contactGroupsMap,
    contactsMap,
    groupsLabelCache,
    groupsWithContactsMap,
    recipientsLabelCache,
} from '../../logic/contacts/contactsSelectors';

export const useContactsMap = () => {
    return useSelector(contactsMap);
};

export const useContactGroupsMap = () => {
    return useSelector(contactGroupsMap);
};

export const useGroupsWithContactsMap = () => {
    return useSelector(groupsWithContactsMap);
};

export const useRecipientsLabelCache = () => {
    return useSelector(recipientsLabelCache);
};

export const useGroupsLabelCache = () => {
    return useSelector(groupsLabelCache);
};
