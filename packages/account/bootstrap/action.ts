import { createAction } from '@reduxjs/toolkit';

export const bootstrapEvent = createAction('bootstrap event', (payload: { type: 'complete' }) => ({ payload }));
