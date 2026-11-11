import { createAction } from '@reduxjs/toolkit';

import { pipe } from '../../../utils/fp/pipe';
import { withThrottledCache } from '../enhancers/cache';
import { withSynchronousAction } from '../enhancers/client';

export const setFolderExpanded = createAction('folder-expanded::set', (payload: { id: string; expanded: boolean }) =>
    pipe(withThrottledCache, withSynchronousAction)({ payload })
);
