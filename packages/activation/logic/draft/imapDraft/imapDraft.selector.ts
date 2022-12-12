import { createSelector } from '@reduxjs/toolkit';

import { EasySwitchState } from '../../store';

const selectImapDraft = (state: EasySwitchState) => state.imapDraft;
export const selectImapDraftStep = createSelector(selectImapDraft, (draft) => draft.step);
export const selectImapDraftProvider = createSelector(selectImapDraft, (draft) => draft.provider);
export const selectImapDraftProduct = createSelector(selectImapDraft, (draft) => draft.product);
