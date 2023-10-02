import { createAction } from '@reduxjs/toolkit';

import withCacheBlock from '../with-cache-block';

export const invalidateRequest = createAction('request::invalidate', (requestId: string) =>
    withCacheBlock({ payload: { requestId } })
);
