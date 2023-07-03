import { createAction } from '@reduxjs/toolkit';

import type { PasswordHistoryEntry } from '../../reducers/pw-history';

export const passwordSave = createAction<PasswordHistoryEntry>('password save');
export const passwordDelete = createAction<{ id: string }>('password delete');
export const passwordHistoryClear = createAction('password history clear');
export const passwordHistoryGarbageCollect = createAction('password history gc');
