import { createSelector } from '@reduxjs/toolkit';

import type { EOStoreState } from 'proton-mail/store/eo/eoStore';

const eoState = (state: EOStoreState) => state.eo;

export const eoTokenSelector = createSelector(eoState, (state) => state.encryptedToken);

export const eoDecryptedTokenSelector = createSelector(eoState, (state) => state.decryptedToken);

export const eoMessageSelector = createSelector(eoState, (state) => state.message);

export const isStoreInitializedSelector = createSelector(eoState, (state) => state.isStoreInitialized);

export const isEncryptedTokenInitializedSelector = createSelector(
    eoState,
    (state) => state.isEncryptedTokenInitialized
);

export const passwordSelector = createSelector(eoState, (state) => state.password);

export const eoMessageStateSelector = createSelector(eoState, (state) => state.messageState);
