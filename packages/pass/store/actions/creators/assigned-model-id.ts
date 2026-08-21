import { createAction } from '@reduxjs/toolkit';

export const assignedModelIdUpdated = createAction('assigned-model-id::updated', (modelId: string) => ({
    payload: modelId,
}));
