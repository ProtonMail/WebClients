import type { ActionReducerMapBuilder } from '@reduxjs/toolkit';

import { refresh } from './contactsActions';
import { refresh as refreshReducer } from './contactsReducers';
import type { ContactsState } from './contactsTypes';

/**
 * Registers the cases for the contacts slice's own actions.
 * The app owns the slice and adds the reset case.
 */
export const addContactsCases = (builder: ActionReducerMapBuilder<ContactsState>) => {
    builder.addCase(refresh, refreshReducer);
};
