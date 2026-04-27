import { type PayloadAction, createSelector, createSlice } from '@reduxjs/toolkit';

import type { ActionParams, ConversationId, LUMO_API_ERRORS, LUMO_USER_TYPE } from '../../../types';

// Base error interface for consistent error structure
interface BaseError {
    errorTitle: string;
    errorMessage: string;
    timestamp: number;
    errorType: LUMO_API_ERRORS;
}

// Specific error types
export interface ConversationError {
    conversationId: ConversationId;
    errorTitle: string;
    errorMessage: string;
    errorType: LUMO_API_ERRORS;
    actionParams?: ActionParams;
}

export interface TierError extends BaseError {
    userType: LUMO_USER_TYPE;
}

export type ResourceLimitType = 'messages' | 'assets' | 'conversations' | 'spaces';

export interface ResourceLimitError {
    id: string;
    resource: ResourceLimitType;
    limit: number;
    serverMessage?: string;
    timestamp: number;
}

export type DebugLimitOverride = 'approaching' | 'at' | null;

// State interface
interface ErrorState {
    conversationErrors: Record<ConversationId, ConversationError[]>;
    tierErrors: TierError[];
    resourceLimitErrors: ResourceLimitError[];
    // Dev-only: lets the Debug View force the resource-limit banner state.
    debugLimitOverrides: Record<ResourceLimitType, DebugLimitOverride>;
}

const initialState: ErrorState = {
    conversationErrors: {},
    tierErrors: [],
    resourceLimitErrors: [],
    debugLimitOverrides: {
        messages: null,
        assets: null,
        conversations: null,
        spaces: null,
    },
};

const errorsSlice = createSlice({
    name: 'errors',
    initialState,
    reducers: {
        addConversationError: (state, action: PayloadAction<Omit<ConversationError, 'timestamp'>>) => {
            const error = {
                ...action.payload,
                timestamp: Date.now(),
            };

            if (!state.conversationErrors[error.conversationId]) {
                state.conversationErrors[error.conversationId] = [];
            }
            state.conversationErrors[error.conversationId]!.push(error);
        },

        addTierError: (state, action: PayloadAction<Omit<TierError, 'timestamp'>>) => {
            const error = {
                ...action.payload,
                timestamp: Date.now(),
            };
            state.tierErrors.push(error);
        },

        clearConversationErrors: (state, action: PayloadAction<ConversationId>) => {
            delete state.conversationErrors[action.payload];
        },

        dismissConversationError: (
            state,
            action: PayloadAction<{
                conversationId: ConversationId;
                index: number;
            }>
        ) => {
            const { conversationId, index } = action.payload;
            if (state.conversationErrors[conversationId]) {
                state.conversationErrors[conversationId].splice(index, 1);
                if (state.conversationErrors[conversationId].length === 0) {
                    delete state.conversationErrors[conversationId];
                }
            }
        },

        clearTierErrors: (state) => {
            state.tierErrors = [];
        },

        addResourceLimitError: (
            state,
            action: PayloadAction<Omit<ResourceLimitError, 'id' | 'timestamp'>>
        ) => {
            // Deduplicate: if there's already a recent error for this resource, don't pile them up.
            const now = Date.now();
            const existing = state.resourceLimitErrors.find(
                (e) => e.resource === action.payload.resource && now - e.timestamp < 5000
            );
            if (existing) return;
            state.resourceLimitErrors.push({
                ...action.payload,
                id: `${action.payload.resource}-${now}-${Math.random().toString(36).slice(2, 8)}`,
                timestamp: now,
            });
        },

        dismissResourceLimitError: (state, action: PayloadAction<string>) => {
            state.resourceLimitErrors = state.resourceLimitErrors.filter((e) => e.id !== action.payload);
        },

        clearResourceLimitErrors: (state) => {
            state.resourceLimitErrors = [];
        },

        setDebugLimitOverride: (
            state,
            action: PayloadAction<{ resource: ResourceLimitType; override: DebugLimitOverride }>
        ) => {
            state.debugLimitOverrides[action.payload.resource] = action.payload.override;
        },

        clearAllDebugLimitOverrides: (state) => {
            state.debugLimitOverrides = {
                messages: null,
                assets: null,
                conversations: null,
                spaces: null,
            };
        },
    },
});

export const {
    addConversationError,
    addTierError,
    clearConversationErrors,
    dismissConversationError,
    clearTierErrors,
    addResourceLimitError,
    dismissResourceLimitError,
    clearResourceLimitErrors,
    setDebugLimitOverride,
    clearAllDebugLimitOverrides,
} = errorsSlice.actions;

// Selectors
const selectErrorsState = (state: { errors: ErrorState }) => state.errors;

export const selectConversationErrors = createSelector(
    [selectErrorsState, (_state, conversationId: ConversationId) => conversationId],
    (errorsState, conversationId) => errorsState.conversationErrors[conversationId] || []
);

export const selectTierErrors = createSelector([selectErrorsState], (errorsState) => errorsState.tierErrors);

export const selectHasTierErrors = createSelector(
    [selectErrorsState],
    (errorsState) => errorsState.tierErrors.length > 0
);

export const selectResourceLimitErrors = createSelector(
    [selectErrorsState],
    (errorsState) => errorsState.resourceLimitErrors
);

export const selectDebugLimitOverride =
    (resource: ResourceLimitType) =>
    (state: { errors: ErrorState }): DebugLimitOverride =>
        state.errors.debugLimitOverrides[resource];

export const selectAllDebugLimitOverrides = createSelector(
    [selectErrorsState],
    (errorsState) => errorsState.debugLimitOverrides
);

export default errorsSlice.reducer;
