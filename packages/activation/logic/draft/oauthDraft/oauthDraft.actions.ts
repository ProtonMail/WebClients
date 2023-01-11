import { createAction } from '@reduxjs/toolkit';

import { ImportType } from '@proton/activation/interface';
import { ImportProvider } from '@proton/activation/interface';

const ACTION_PREFIX = 'draft/oauth';

export const resetOauthDraft = createAction(`${ACTION_PREFIX}/reset`);

export const startOauthDraft = createAction<{
    provider: ImportProvider;
    products: ImportType[];
}>(`${ACTION_PREFIX}/start`);

export const readOauthInstructions = createAction<boolean>(`${ACTION_PREFIX}/readInstructions`);
