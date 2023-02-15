import { createSelector } from '@reduxjs/toolkit';

import { EasySwitchState } from '../../store';

const selectOauthDraft = (state: EasySwitchState) => state.oauthDraft;
export const selectOauthDraftStep = createSelector(selectOauthDraft, (draft) => draft.step);
export const selectOauthDraftProvider = createSelector(selectOauthDraft, (draft) => draft.provider);
export const selectOauthDraftStepConfirmModalDisplay = createSelector(
    selectOauthDraft,
    (draft) => draft.displayConfirmLeaveModal
);

export const selectOauthImportState = createSelector(selectOauthDraft, (draft) => draft.mailImport);
export const selectOauthImportStateStep = createSelector(selectOauthImportState, (draft) => draft?.step);
export const selectOauthImportStateScopes = createSelector(selectOauthImportState, (draft) => draft?.scopes);
export const selectOauthImportStateProducts = createSelector(selectOauthImportState, (draft) => draft?.products);
export const selectOauthImportStateImporterData = createSelector(
    selectOauthImportState,
    (draft) => draft?.importerData
);
export const selectOauthImportStateLoadingImporters = createSelector(
    selectOauthImportState,
    (draft) => draft?.isCreatingImporter
);
