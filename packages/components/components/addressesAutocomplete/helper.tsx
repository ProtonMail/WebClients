import { c, msgid } from 'ttag';

import { canonicalizeEmail } from '@proton/shared/lib/helpers/email';
import type { SimpleMap } from '@proton/shared/lib/interfaces';
import type { ContactEmail, ContactGroup } from '@proton/shared/lib/interfaces/contacts';
import { contactToInput, contactToRecipient, majorToRecipient } from '@proton/shared/lib/mail/recipient';

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

type GroupWithContacts = { group: ContactGroup; contacts: ContactEmail[] };
export type GroupsWithContactsMap = SimpleMap<GroupWithContacts>;

export const isEmailSelected = ({ Email }: ContactEmail, recipients: Set<string>) => {
    return recipients.has(canonicalizeEmail(Email));
};

export const isGroupEmpty = (groupID: string, groupsWithContactsMap?: GroupsWithContactsMap) => {
    return groupsWithContactsMap ? (groupsWithContactsMap[groupID]?.contacts.length || 0) <= 0 : false;
};

export const isGroupSelected = (
    { Path, ID }: ContactGroup,
    recipients: Set<String>,
    groupsWithContactsMap?: GroupsWithContactsMap
) => {
    return recipients.has(Path) && !isGroupEmpty(ID, groupsWithContactsMap);
};

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

export function getContactsAutocompleteItems(
    contactEmails: ContactEmail[] | undefined,
    filter: (contact: ContactEmail) => boolean
): Extract<AddressesAutocompleteItem, { type: 'contact' }>[];
export function getContactsAutocompleteItems<
    TAutocompleteItem extends Extract<AddressesAutocompleteItem, { type: 'contact' }>,
>(
    contactEmails: ContactEmail[] | undefined,
    filter: (contact: ContactEmail) => boolean,
    mapper?: (
        autocompleteItem: Extract<AddressesAutocompleteItem, { type: 'contact' }>,
        initialContact: ContactEmail
    ) => TAutocompleteItem
): TAutocompleteItem[];
export function getContactsAutocompleteItems<
    TAutocompleteItem extends Extract<AddressesAutocompleteItem, { type: 'contact' }>,
>(
    contactEmails: ContactEmail[] = [],
    filter: (contact: ContactEmail) => boolean,
    mapper?: (
        autocompleteItem: Extract<AddressesAutocompleteItem, { type: 'contact' }>,
        initialContact: ContactEmail
    ) => TAutocompleteItem
): TAutocompleteItem[] | Extract<AddressesAutocompleteItem, { type: 'contact' }>[] {
    return contactEmails
        .filter(filter)
        .map((contact) => {
            const autocompleteItem = {
                label: contactToInput(contact),
                value: contact,
                type: 'contact',
                key: contact.ID,
                score: contact.LastUsedTime || 0,
            } satisfies Extract<AddressesAutocompleteItem, { type: 'contact' }>;

            const item = mapper ? mapper(autocompleteItem, contact) : autocompleteItem;

            return item;
        })
        .sort(compare);
}

export function getContactGroupsAutocompleteItems(
    contactGroups: ContactGroup[] | undefined,
    filter: (contactGroup: ContactGroup) => boolean
): Extract<AddressesAutocompleteItem, { type: 'group' }>[];
export function getContactGroupsAutocompleteItems<
    TAutocompleteItem extends Extract<AddressesAutocompleteItem, { type: 'group' }>,
>(
    contactGroups: ContactGroup[] | undefined,
    filter: (contactGroup: ContactGroup) => boolean,
    mapper?: (
        autocompleteItem: Extract<AddressesAutocompleteItem, { type: 'group' }>,
        initialContactGroup: ContactGroup
    ) => TAutocompleteItem
): TAutocompleteItem[];
export function getContactGroupsAutocompleteItems<
    TAutocompleteItem extends Extract<AddressesAutocompleteItem, { type: 'group' }>,
>(
    contactGroups: ContactGroup[] = [],
    filter: (contactGroup: ContactGroup) => boolean,
    mapper?: (
        autocompleteItem: Extract<AddressesAutocompleteItem, { type: 'group' }>,
        initialContactGroup: ContactGroup
    ) => TAutocompleteItem
): TAutocompleteItem[] | Extract<AddressesAutocompleteItem, { type: 'group' }>[] {
    return contactGroups
        .filter(filter)
        .map((group) => {
            const mappedItem = {
                label: group.Name,
                value: group,
                key: group.ID,
                type: 'group',
            } satisfies Extract<AddressesAutocompleteItem, { type: 'group' }>;

            const item = mapper ? mapper(mappedItem, group) : mappedItem;

            return item;
        })
        .sort(compare);
}

export const getNumberOfMembersText = (groupID: string, groupsWithContactsMap?: GroupsWithContactsMap) => {
    const memberCount = groupsWithContactsMap ? groupsWithContactsMap[groupID]?.contacts.length || 0 : 0;

    // translator: number of members of a contact group, the variable is a positive integer (written in digits) always greater or equal to 0
    return c('Info').ngettext(msgid`(${memberCount} member)`, `(${memberCount} members)`, memberCount);
};

export const getNumberOfMembersCount = (groupID: string, groupsWithContactsMap?: GroupsWithContactsMap) => {
    const memberCount = groupsWithContactsMap ? groupsWithContactsMap[groupID]?.contacts.length || 0 : 0;

    return `(${memberCount})`;
};
