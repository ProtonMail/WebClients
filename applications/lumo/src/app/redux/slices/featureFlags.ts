import { createAction, createReducer } from '@reduxjs/toolkit';

export interface FeatureFlag {
    id: string;
    versionId: string;
    dismissedAt: number;
}

export const initialFeatureFlags: FeatureFlag[] = [];

// Actions
export const dismissFeatureFlag = createAction<{ id: string; versionId: string }>('featureFlags/dismissFeatureFlag');
export const updateFeatureFlags = createAction<FeatureFlag[]>('featureFlags/updateFeatureFlags');
export const resetFeatureFlags = createAction('featureFlags/resetFeatureFlags');

// Reducer
const featureFlagsReducer = createReducer(initialFeatureFlags, (builder) => {
    builder
        .addCase(dismissFeatureFlag, (state, action) => {
            const { id, versionId } = action.payload;
            const existingFlag = state.find((flag) => flag.id === id && flag.versionId === versionId);
            if (!existingFlag) {
                state.push({
                    id,
                    versionId,
                    dismissedAt: Date.now(),
                });
            }
            return state;
        })
        .addCase(updateFeatureFlags, (state, action) => {
            return action.payload;
        })
        // For development testing purposes
        .addCase(resetFeatureFlags, () => {
            return initialFeatureFlags;
        });
});

export default featureFlagsReducer;
