import { ContactEmail, ContactGroup } from 'proton-shared/lib/interfaces/contacts';
import { getEmailParts, validateEmailAddress } from 'proton-shared/lib/helpers/email';
import { MAJOR_DOMAINS } from 'proton-shared/lib/constants';
import { contactToInput, contactToRecipient, majorToRecipient } from 'proton-shared/lib/mail/recipient';
import { c, msgid } from 'ttag';
import { SimpleMap } from 'proton-shared/lib/interfaces';

export type AddressesAutocompleteItem =
    | {
          type: 'major';
          value: string;
          label: string;
          key: string;
      }
    | {
          type: 'contact';
          value: ContactEmail;
          label: string;
          key: string;
          score: number;
      }
    | {
          type: 'group';
          value: ContactGroup;
          label: string;
          key: string;
      };

export type GroupWithContacts = { group: ContactGroup; contacts: ContactEmail[] };
export type GroupsWithContactsMap = SimpleMap<GroupWithContacts>;

const compare = (item1: AddressesAutocompleteItem, item2: AddressesAutocompleteItem) => {
    if (item1.type === 'contact' && item2.type === 'contact' && item1.score !== item2.score) {
        return (item2.score || 0) - (item1.score || 0);
    }

    if (item1.label > item2.label) {
        return 1;
    }

    if (item1.label < item2.label) {
        return -1;
    }

    return 0;
};

const getMajorList = (input: string) => {
    const [localPart] = getEmailParts(input);
    if (!localPart) {
        return [];
    }
    if (!validateEmailAddress(`${localPart}@a.com`)) {
        return [];
    }
    return MAJOR_DOMAINS.map((domain) => `${localPart}@${domain}`);
};

export const getRecipientFromAutocompleteItem = (
    contactEmails: ContactEmail[] | undefined,
    item: AddressesAutocompleteItem
) => {
    if (item.type === 'major') {
        return [majorToRecipient(item.value)];
    }
    if (item.type === 'contact') {
        return [contactToRecipient(item.value)];
    }
    if (item.type === 'group') {
        const group = item.value;
        return (contactEmails || [])
            .filter((contact) => contact.LabelIDs?.includes(group.ID || ''))
            .map((contact) => contactToRecipient(contact, group.Path));
    }
    throw new Error('Unknown type');
};

export const getContactsAutocompleteItems = (
    contactEmails: ContactEmail[] = [],
    filter: (contact: ContactEmail) => boolean
) => {
    return contactEmails
        .filter(filter)
        .map(
            (contact) =>
                ({
                    label: contactToInput(contact),
                    value: contact,
                    type: 'contact',
                    key: contact.ID,
                    score: contact.LastUsedTime || 0,
                } as const)
        )
        .sort(compare);
};

export const getContactGroupsAutocompleteItems = (
    contactGroups: ContactGroup[] = [],
    filter: (contactGroup: ContactGroup) => boolean
) => {
    return contactGroups
        .filter(filter)
        .map((group) => {
            return {
                label: group.Name,
                value: group,
                key: group.ID,
                type: 'group',
            } as const;
        })
        .sort(compare);
};

export const getMajorListAutocompleteItems = (input: string, filter: (email: string) => boolean) => {
    return getMajorList(input)
        .filter(filter)
        .map((email) => {
            return {
                label: email,
                value: email,
                key: email,
                type: 'major',
            } as const;
        });
};

export const getNumberOfMembersText = (groupID: string, groupsWithContactsMap?: GroupsWithContactsMap) => {
    const memberCount = groupsWithContactsMap ? groupsWithContactsMap[groupID]?.contacts.length || 0 : 0;

    // translator: number of members of a contact group, the variable is a positive integer (written in digits) always greater or equal to 0
    return c('Info').ngettext(msgid`(${memberCount} member)`, `(${memberCount} members)`, memberCount);
};
