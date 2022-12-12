import { createSelector } from '@reduxjs/toolkit';

import { EasySwitchState } from '../../store';

const selectOauthDraft = (state: EasySwitchState) => state.oauthDraft;
export const selectOauthDraftStep = createSelector(selectOauthDraft, (draft) => draft.step);
export const selectOauthDraftProvider = createSelector(selectOauthDraft, (draft) => draft.provider);
export const selectOauthDraftProducts = createSelector(selectOauthDraft, (draft) => draft.products);
