import { createAction } from '@reduxjs/toolkit';

import type { UIStateValue } from '../../reducers';
import { withSynchronousAction } from '../enhancers/client';

/** Persists a single piece of UX-only UI state (eg. an expanded/collapsed
 * section, a last-active tab) into the worker-owned store so it survives
 * the popup being closed and reopened. Excluded from the persisted cache. */
export const setUIStateValue = createAction('ui::state::set', (payload: { key: string; value: UIStateValue }) =>
    withSynchronousAction({ payload })
);

export const unsetUIStateValue = createAction('ui::state::unset', (payload: { key: string }) => withSynchronousAction({ payload }));
