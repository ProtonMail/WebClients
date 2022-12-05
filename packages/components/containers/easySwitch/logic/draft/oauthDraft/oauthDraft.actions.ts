import { createAction } from '@reduxjs/toolkit';

import { ImportType } from '@proton/shared/lib/interfaces/EasySwitch';

import { ImportProvider } from '../../types/shared.types';

const ACTION_PREFIX = 'draft/oauth';

export const resetOauthDraft = createAction(`${ACTION_PREFIX}/reset`);

export const startOauthDraft = createAction<{
    provider: ImportProvider;
    products: ImportType[];
}>(`${ACTION_PREFIX}/start`);

export const readOauthInstructions = createAction<boolean>(`${ACTION_PREFIX}/readInstructions`);
