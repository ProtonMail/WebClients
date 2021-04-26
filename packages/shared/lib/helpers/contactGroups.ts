import { ContactGroup } from '../interfaces/contacts';

export const orderContactGroups = (contactGroups: ContactGroup[]) => {
    return [...contactGroups].sort((contactGroupA, contactGroupB) =>
        contactGroupA.Name.localeCompare(contactGroupB.Name)
    );
};
