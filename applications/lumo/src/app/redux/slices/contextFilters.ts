import { createAction, createReducer } from '@reduxjs/toolkit';

import type { ContextFilter } from '../../llm';

export type ContextFiltersState = {
    filters: ContextFilter[];
};

const initialState: ContextFiltersState = {
    filters: [],
};

export type FilterAction = { messageId: string; filename: string };
export type ClearFilterAction = { messageId?: string };

// Actions
export const addContextFilter = createAction<FilterAction>('contextFilters/add');
export const removeContextFilter = createAction<FilterAction>('contextFilters/remove');
export const clearContextFilters = createAction<ClearFilterAction>('contextFilters/clear');
export const resetAllContextFilters = createAction('contextFilters/resetAll');

// Reducer
const contextFiltersReducer = createReducer(initialState, (builder) => {
    builder
        .addCase(addContextFilter, (state, action) => {
            const { messageId, filename } = action.payload;

            // Find existing filter for this message
            const filter = state.filters.find((f) => f.messageId === messageId);

            if (filter) {
                // Add filename if not already excluded
                if (!filter.excludedFiles.includes(filename)) {
                    filter.excludedFiles.push(filename);
                }
            } else {
                // Create new filter for this message
                state.filters.push({
                    messageId,
                    excludedFiles: [filename],
                });
            }
        })
        .addCase(removeContextFilter, (state, action) => {
            const { messageId, filename } = action.payload;

            const filter = state.filters.find((f) => f.messageId === messageId);
            if (filter) {
                filter.excludedFiles = filter.excludedFiles.filter((f) => f !== filename);

                // Remove the filter entirely if no files are excluded
                if (filter.excludedFiles.length === 0) {
                    state.filters = state.filters.filter((f) => f.messageId !== messageId);
                }
            }
        })
        .addCase(clearContextFilters, (state, action) => {
            const { messageId } = action.payload;

            if (messageId) {
                // Clear filters for specific message
                state.filters = state.filters.filter((f) => f.messageId !== messageId);
            } else {
                // Clear all filters
                state.filters = [];
            }
        })
        .addCase(resetAllContextFilters, (state) => {
            state.filters = [];
        });
});

export default contextFiltersReducer;
