import { createAction } from '@reduxjs/toolkit';

export const safetyReviewListenerStarted = createAction('safetyReview/started', (payload: { href: string }) => ({
    payload,
}));
export const safetyReviewListenerStopped = createAction('safetyReview/stopped');
