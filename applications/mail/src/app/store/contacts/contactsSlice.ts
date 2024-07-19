import { createSlice } from '@reduxjs/toolkit';

import { globalReset } from '../actions';
import { refresh } from './contactsActions';
import { refresh as refreshReducer, reset } from './contactsReducers';
import type { ContactsState } from './contactsTypes';

export const mailContactsInitialState: ContactsState = {
    contactsMap: {},
    contactsMapWithDuplicates: {},
    contactGroupsMap: {},
    groupsWithContactsMap: {},
    recipientsLabelCache: {},
    groupsLabelCache: {},
};

const name = 'mailContacts';
const contactsSlice = createSlice({
    name,
    initialState: mailContactsInitialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(globalReset, reset);
        builder.addCase(refresh, refreshReducer);
    },
});

export const contactsReducer = { [name]: contactsSlice.reducer };
