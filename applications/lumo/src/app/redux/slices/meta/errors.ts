import { type PayloadAction, createSelector, createSlice } from '@reduxjs/toolkit';

import type { ConversationId } from '../../../types';
import type { LUMO_USER_TYPE } from '../../../types';
import type { ActionParams } from '../../../types-api';
import type { LUMO_API_ERRORS } from '../../../types-api';

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

// State interface
interface ErrorState {
    conversationErrors: Record<ConversationId, ConversationError[]>;
    tierErrors: TierError[];
}

const initialState: ErrorState = {
    conversationErrors: {},
    tierErrors: [],
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
            state.conversationErrors[error.conversationId].push(error);
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
    },
});

export const {
    addConversationError,
    addTierError,
    clearConversationErrors,
    dismissConversationError,
    clearTierErrors,
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

// export const addTestTierError = () => (dispatch: LumoDispatch) => {
//     dispatch(
//         addTierError({
//             userType: LUMO_USER_TYPE.FREE,
//             errorTitle: "You've reached your weekly limit of 40 questions.",
//             errorMessage: "Upgrade to Lumo Plus to get unlimited questions and access to all premium features.",
//             errorType: LUMO_API_ERRORS.TIER_LIMIT,
//         })
//     );
// };

export default errorsSlice.reducer;
