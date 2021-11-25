import { createSlice } from '@reduxjs/toolkit';
import { globalReset } from '../actions';
import { refresh } from './contactsActions';
import { reset, refresh as refreshReducer } from './contactsReducers';
import { ContactsState } from './contactsTypes';

export const initialState: ContactsState = {
    contactsMap: {},
    contactsMapWithDuplicates: {},
    contactGroupsMap: {},
    groupsWithContactsMap: {},
    recipientsLabelCache: {},
    groupsLabelCache: {},
};

const elementsSlice = createSlice({
    name: 'contacts',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(globalReset, reset);

        builder.addCase(refresh, refreshReducer);
    },
});

// Export the reducer, either as a default or named export
export default elementsSlice.reducer;
