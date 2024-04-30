import { createAction } from '@reduxjs/toolkit';

export const requestInvalidate = createAction('request::invalidate', (requestId: string) => ({
    payload: { requestId },
}));

export const requestProgress = createAction('request::progress', (requestId: string, progress: number) => ({
    payload: { requestId, progress },
}));
