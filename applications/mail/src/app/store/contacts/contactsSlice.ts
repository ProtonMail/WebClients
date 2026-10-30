import { createSlice } from '@reduxjs/toolkit';

import { addContactsCases } from '@proton/mail-message/store/contacts/contactsCases';
import { mailContactsInitialState } from '@proton/mail-message/store/contacts/contactsInitialState';
import { reset } from '@proton/mail-message/store/contacts/contactsReducers';

import { globalReset } from '../actions';

const name = 'mailContacts';
const contactsSlice = createSlice({
    name,
    initialState: mailContactsInitialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(globalReset, reset);
        addContactsCases(builder);
    },
});

export const contactsReducer = { [name]: contactsSlice.reducer };
