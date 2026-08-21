import type { PayloadAction } from '@reduxjs/toolkit';
import { createSelector, createSlice } from '@reduxjs/toolkit';

import shallowEqual from '@proton/utils/shallowEqual';

import { isCaptionAgentIdentity } from '../../../utils/agents';
import type { MeetState } from '../../rootReducer';

export interface AgentParticipantsState {
    agentIdentities: string[];
}

export const initialState: AgentParticipantsState = {
    agentIdentities: [],
};

const slice = createSlice({
    name: 'agentParticipants',
    initialState,
    reducers: {
        setAgentIdentities: (state, action: PayloadAction<string[]>) => {
            // The participant list churns on events that leave the agents untouched, so an
            // unchanged set has to keep its reference for derived selectors to stay memoized.
            if (shallowEqual(action.payload, state.agentIdentities)) {
                return;
            }

            state.agentIdentities = action.payload;
        },
        resetAgentParticipants: () => initialState,
    },
});

export const selectAgentIdentities = (state: MeetState) => state.agentParticipants.agentIdentities;

/** Memoized so consumers only re-render when the answer changes, not whenever the agent set does. */
export const selectCaptionsAgentPresent = createSelector([selectAgentIdentities], (agentIdentities) =>
    agentIdentities.some(isCaptionAgentIdentity)
);

export const { setAgentIdentities, resetAgentParticipants } = slice.actions;

export const agentParticipantsReducer = { agentParticipants: slice.reducer };
