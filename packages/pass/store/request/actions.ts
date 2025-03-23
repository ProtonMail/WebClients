import { createAction } from '@reduxjs/toolkit';

export const requestInvalidate = createAction('request::invalidate', (requestId: string) => ({
    payload: { requestId },
}));

export const requestProgress = createAction('request::progress', (requestId: string, progress: number) => ({
    payload: { requestId, progress },
}));

export const requestCancel = createAction('request::cancel', (requestId: string) => ({
    payload: { requestId },
}));

export const matchCancel = (requestId: string) => (action: unknown) =>
    requestCancel.match(action) && action.payload.requestId === requestId;
