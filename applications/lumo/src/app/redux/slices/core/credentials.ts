import { createAction, createReducer } from '@reduxjs/toolkit';

import type { Credentials, MasterKeyFailure, MasterKeysBundle } from '../../../types';

/**
 * Kept with its original name on purpose: `takeEvery(addMasterKey, initAppSaga)`
 * (`redux/sagas/index.ts`) and `tests/integration/helpers.ts` both depend on this exact action.
 */
export const addMasterKey = createAction<MasterKeysBundle>('lumo/credentials/addMasterKey');

/** The master key could not be fetched, decrypted, or minted. */
export const masterKeyFailed = createAction<string | MasterKeyFailure>('lumo/credentials/masterKeyFailed');

export function normalizeMasterKeyFailure(payload: string | MasterKeyFailure): MasterKeyFailure {
    if (typeof payload === 'string') {
        return { message: payload, reason: 'unknown' };
    }
    return payload;
}

/** The user is not eligible for Lumo, so there is no master key to load. Not an error. */
export const masterKeyIneligible = createAction('lumo/credentials/masterKeyIneligible');

/**
 * Back to `loading` for a retry. Also re-arms `waitForMasterKey`, which refuses to wait in the
 * `failed` state.
 */
export const masterKeyRetrying = createAction('lumo/credentials/masterKeyRetrying');

export const EMPTY_CREDENTIALS: Credentials = {
    masterKeyState: { status: 'loading' },
};
const initialState: Credentials = EMPTY_CREDENTIALS;

const credentialsReducer = createReducer<Credentials>(initialState, (builder) => {
    builder
        .addCase(addMasterKey, (_state, action) => {
            console.log('Action triggered: addMasterKey');
            const { primaryMasterKeyId, primaryMasterKey, masterKeys } = action.payload;
            return {
                masterKeyState: {
                    status: 'ready',
                    primaryMasterKeyId,
                    primaryMasterKey,
                    masterKeys,
                },
            };
        })
        .addCase(masterKeyFailed, (_state, action) => {
            console.log('Action triggered: masterKeyFailed');
            const failure = normalizeMasterKeyFailure(action.payload);
            return { masterKeyState: { status: 'failed', ...failure } };
        })
        .addCase(masterKeyIneligible, () => {
            console.log('Action triggered: masterKeyIneligible');
            return { masterKeyState: { status: 'ineligible' } };
        })
        .addCase(masterKeyRetrying, () => {
            console.log('Action triggered: masterKeyRetrying');
            return { masterKeyState: { status: 'loading' } };
        });
});

export default credentialsReducer;
