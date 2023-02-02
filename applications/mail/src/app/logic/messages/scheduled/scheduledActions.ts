import { createAction } from '@reduxjs/toolkit';

export const updateScheduled = createAction<{ ID: string; scheduledAt: number }>('message/scheduled/update');

export const cancelScheduled = createAction<{ ID: string; scheduledAt?: number }>('message/scheduled/cancel');
