import { canonizeEmail } from '@proton/shared/lib/helpers/email';
import { toMap } from '@proton/shared/lib/helpers/object';
import { ContactEmail, ContactGroup } from '@proton/shared/lib/interfaces/contacts';
import { PayloadAction } from '@reduxjs/toolkit';
import { Draft } from 'immer';
import { initialState } from './contactsSlice';
import { ContactsMap, ContactsState, ContactsMapWithDuplicates, GroupsWithContactsMap } from './contactsTypes';

const toMapWithDuplicates = (contacts: ContactEmail[]) => {
    const contactsMapWithDuplicates = contacts.reduce<ContactsMapWithDuplicates>((acc, contact) => {
        const email = canonizeEmail(contact.Email);
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
    Object.assign(state, initialState);
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
