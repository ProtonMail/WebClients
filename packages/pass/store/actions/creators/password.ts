import { createAction } from '@reduxjs/toolkit';

import type { GeneratePasswordConfig } from '../../../lib/password/types';
import { pipe } from '../../../utils/fp/pipe';
import type { PasswordHistoryEntry } from '../../reducers';
import { withCache } from '../enhancers/cache';
import { withSettings } from '../enhancers/settings';

export const passwordSave = createAction('password::save', (payload: PasswordHistoryEntry) => withCache({ payload }));
export const passwordDelete = createAction('password::delete', (payload: { id: string }) => withCache({ payload }));
export const passwordHistoryClear = createAction('password::history::clear', () => withCache({ payload: {} }));
export const passwordHistoryGarbageCollect = createAction('password::history::gc');

export const passwordOptionsEdit = createAction('password::options::edit', (payload: GeneratePasswordConfig) =>
    pipe(withCache, withSettings)({ payload })
);
