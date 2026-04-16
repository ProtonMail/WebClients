import type { GroupsWithContactsMap } from '@proton/components';
import type { ContactEmail, ContactGroup } from '@proton/shared/lib/interfaces/contacts';

/**
 * Creates a mapping of contact groups to their associated contacts based on label IDs
 * Each contact is assigned to one or more groups, forming a structured representation of group memberships.
 */
export const getGroupsWithContactsMap = (contacts: ContactEmail[], contactGroups: ContactGroup[]) =>
    contacts.reduce<GroupsWithContactsMap>((acc, contact) => {
        contact.LabelIDs?.forEach((labelID) => {
            if (acc[labelID]) {
                acc[labelID]?.contacts.push(contact);
            } else {
                const group = contactGroups.find((group) => group.ID === labelID);
                if (group) {
                    acc[labelID] = { group, contacts: [contact] };
                }
            }
        });
        return acc;
    }, {});
