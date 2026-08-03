import { createSlice } from '@reduxjs/toolkit';

import { globalReset } from '../actions';
import { refresh } from './contactsActions';
import { mailContactsInitialState } from './contactsInitialState';
import { refresh as refreshReducer, reset } from './contactsReducers';

export { mailContactsInitialState } from './contactsInitialState';

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
