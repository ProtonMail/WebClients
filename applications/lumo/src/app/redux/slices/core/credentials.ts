import {createAction, createReducer} from '@reduxjs/toolkit';

import type {Base64, Credentials} from '../../../types';

export const addMasterKey = createAction<Base64>('lumo/credentials/addMasterKey');

export const EMPTY_CREDENTIALS = {
    masterKey: '',
};
const initialState: Credentials = EMPTY_CREDENTIALS;

const credentialsReducer = createReducer<Credentials>(initialState, (builder) => {
    builder.addCase(addMasterKey, (_state, action) => {
        console.log('Action triggered: addMasterKey');
        const masterKey = action.payload;
        return {
            masterKey,
        };
    });
});

export default credentialsReducer;
