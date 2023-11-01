import { createAction } from '@reduxjs/toolkit';

import withCacheBlock from '@proton/pass/store/actions/with-cache-block';

export const requestInvalidate = createAction('request::invalidate', (requestId: string) =>
    withCacheBlock({ payload: { requestId } })
);

export const requestProgress = createAction('request::progress', (requestId: string, progress: number) =>
    withCacheBlock({ payload: { requestId, progress } })
);
