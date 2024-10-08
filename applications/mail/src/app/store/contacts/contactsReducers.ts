import type { PayloadAction } from '@reduxjs/toolkit';
import type { Draft } from 'immer';

import { canonicalizeEmail } from '@proton/shared/lib/helpers/email';
import { toMap } from '@proton/shared/lib/helpers/object';
import type { ContactEmail, ContactGroup } from '@proton/shared/lib/interfaces/contacts';

import { mailContactsInitialState } from './contactsSlice';
import type { ContactsMap, ContactsMapWithDuplicates, ContactsState, GroupsWithContactsMap } from './contactsTypes';

const toMapWithDuplicates = (contacts: ContactEmail[]) => {
    const contactsMapWithDuplicates = contacts.reduce<ContactsMapWithDuplicates>((acc, contact) => {
        const email = canonicalizeEmail(contact.Email);
        const contacts = acc[email];
        if (!contacts) {
            acc[email] = [contact];
        } else {
            contacts.push(contact);
            contacts.sort((a, b) => a.Order - b.Order);
        }
        return acc;
    }, {});

    const contactsMap = Object.keys(contactsMapWithDuplicates).reduce<ContactsMap>((acc, key) => {
        acc[key] = contactsMapWithDuplicates[key]?.[0];
        return acc;
    }, {});

    return { contactsMap, contactsMapWithDuplicates };
};

const computeGroupsMap = (contacts: ContactEmail[], contactGroups: ContactGroup[]) =>
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

export const reset = (state: Draft<ContactsState>) => {
    Object.assign(state, mailContactsInitialState);
};

export const refresh = (
    state: Draft<ContactsState>,
    { payload: { contacts, contactGroups } }: PayloadAction<{ contacts: ContactEmail[]; contactGroups: ContactGroup[] }>
) => {
    const { contactsMap, contactsMapWithDuplicates } = toMapWithDuplicates(contacts);
    state.contactsMap = contactsMap;
    state.contactsMapWithDuplicates = contactsMapWithDuplicates;
    state.contactGroupsMap = toMap(contactGroups, 'Path');
    state.groupsWithContactsMap = computeGroupsMap(contacts, contactGroups);
    state.recipientsLabelCache = {};
    state.groupsLabelCache = {};
};
