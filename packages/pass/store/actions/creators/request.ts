import { createAction } from '@reduxjs/toolkit';

import withCacheBlock from '../with-cache-block';

export const invalidateRequest = createAction('request::invalidate', (requestId: string) =>
    withCacheBlock({ payload: { requestId } })
);

export const setRequestProgress = createAction('request::progress', (requestId: string, progress: number) =>
    withCacheBlock({ payload: { requestId, progress } })
);
