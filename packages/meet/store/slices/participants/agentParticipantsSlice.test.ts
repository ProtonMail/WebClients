import { describe, expect, it } from 'vitest';

import {
    agentParticipantsReducer,
    initialState,
    resetAgentParticipants,
    setAgentIdentities,
} from './agentParticipantsSlice';

const reducer = agentParticipantsReducer.agentParticipants;

describe('agentParticipantsSlice', () => {
    it('stores the agent identities', () => {
        const state = reducer(initialState, setAgentIdentities(['SttAgent#1']));

        expect(state.agentIdentities).toEqual(['SttAgent#1']);
    });

    it('keeps the same reference when the identities are unchanged', () => {
        const state = reducer(initialState, setAgentIdentities(['SttAgent#1']));
        const nextState = reducer(state, setAgentIdentities(['SttAgent#1']));

        expect(nextState.agentIdentities).toBe(state.agentIdentities);
    });

    it('replaces the identities when they change', () => {
        const state = reducer(initialState, setAgentIdentities(['SttAgent#1']));
        const nextState = reducer(state, setAgentIdentities(['SttAgent#2']));

        expect(nextState.agentIdentities).toEqual(['SttAgent#2']);
    });

    it('clears the identities on reset', () => {
        const state = reducer(initialState, setAgentIdentities(['SttAgent#1']));

        expect(reducer(state, resetAgentParticipants()).agentIdentities).toEqual([]);
    });
});
