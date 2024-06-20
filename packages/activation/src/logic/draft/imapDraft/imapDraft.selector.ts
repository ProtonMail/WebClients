import { createSelector } from '@reduxjs/toolkit';

import { EasySwitchState } from '../../store';

const selectImapDraft = (state: EasySwitchState) => state.imapDraft;
export const selectImapDraftProvider = createSelector(selectImapDraft, (draft) => draft.provider);
export const selectImapDraftProduct = createSelector(selectImapDraft, (draft) => draft.product);

export const selectImapDraftMailImport = createSelector(selectImapDraft, (draft) => draft.mailImport);
export const selectImapDraftMailConfirmModalDisplay = createSelector(
    selectImapDraft,
    (draft) => draft.displayConfirmLeaveModal
);
export const selectImapDraftMailImportStep = createSelector(
    selectImapDraftMailImport,
    (mailImport) => mailImport?.step
);
export const selectImapDraftMailImportApiError = createSelector(selectImapDraftMailImport, (mailImport) => {
    if (mailImport?.step !== 'form') {
        return undefined;
    }
    return {
        code: mailImport?.apiErrorCode,
        message: mailImport?.apiErrorLabel,
    };
});

export const selectImapDraftMailImportApiErrorCode = createSelector(
    selectImapDraftMailImportApiError,
    (apiError) => apiError?.code
);
