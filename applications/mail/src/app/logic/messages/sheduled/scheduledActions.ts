import { createAction } from '@reduxjs/toolkit';

export const updateScheduled = createAction<{ ID: string; scheduledAt: number }>('message/scheduled/update');

export const cancelScheduled = createAction<string>('message/scheduled/cancel');
