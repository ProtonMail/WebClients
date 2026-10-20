import type { ContactGroup } from '../interfaces/contacts/Contact';

export const orderContactGroups = (contactGroups: ContactGroup[]) => {
    return [...contactGroups].sort((contactGroupA, contactGroupB) =>
        contactGroupA.Name.localeCompare(contactGroupB.Name)
    );
};
