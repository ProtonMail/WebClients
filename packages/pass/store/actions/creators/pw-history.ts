import { createAction } from '@reduxjs/toolkit';

import { withCache } from '@proton/pass/store/actions/with-cache';
import type { PasswordHistoryEntry } from '@proton/pass/store/reducers';

export const passwordSave = createAction('password::save', (payload: PasswordHistoryEntry) => withCache({ payload }));
export const passwordDelete = createAction('password::delete', (payload: { id: string }) => withCache({ payload }));
export const passwordHistoryClear = createAction('password-history::clear', () => withCache({ payload: {} }));
export const passwordHistoryGarbageCollect = createAction('password-history::gc', () => withCache({ payload: {} }));
