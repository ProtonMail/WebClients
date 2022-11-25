import { createAction } from '@reduxjs/toolkit';

import { ImportType } from '@proton/shared/lib/interfaces/EasySwitch';

import { ImportProvider } from '../../types/shared.types';

const ACTION_PREFIX = 'draft/imap';

export const resetImapDraft = createAction(`${ACTION_PREFIX}/reset`);

export const startImapDraft = createAction<{ provider: ImportProvider }>(`${ACTION_PREFIX}/start`);

export const selectImapProductToImport = createAction<{ product: ImportType }>(`${ACTION_PREFIX}/selectProduct`);

export const readImapInstructions = createAction(`${ACTION_PREFIX}/readInstructions`);
