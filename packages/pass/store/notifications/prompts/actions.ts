import { createAction } from '@reduxjs/toolkit';

import { getEpoch } from '../../../utils/time/epoch';
import { withCache } from '../../actions/enhancers/cache';
import type { PromptId } from './types';

/** Records a user dismissal of a client-side prompt. Deliberately
 * does **not** count CTA interactions as dismissals (6419's lesson):
 * intent to enable is the opposite of "not now". `dismissedAt` is
 * injectable for deterministic tests; defaults to now. */
export const promptDismissed = createAction('prompts::dismissed', (id: PromptId, dismissedAt?: number) =>
    withCache({ payload: { id, dismissedAt: dismissedAt ?? getEpoch() } })
);

/** Development/QA escape hatch: wipes the whole dismissal ledger.
 * Dispatched by the extension's debug buttons; persisted via cache. */
export const promptsReset = createAction('prompts::reset', () => withCache({ payload: undefined }));
