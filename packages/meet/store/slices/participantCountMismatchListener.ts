import { createSelector } from '@reduxjs/toolkit';

import type { MeetState } from '../rootReducer';
import type { MeetAppStartListening } from '../store';
import { selectMlsGroupState } from './currentMeeting';
import { selectAgentIdentities } from './participants/agentParticipantsSlice';
import { selectParticipantsMap } from './participants/participantsSlice';
import { selectSortedParticipantIdentities, selectTotalParticipantCount } from './participants/sortedParticipantsSlice';
import { setParticipantCountMismatch } from './uiStateSlice';

export const selectConnectedMemberCount = (state: MeetState) =>
    selectTotalParticipantCount(state) + selectAgentIdentities(state).length;

const selectMemberCountMinusConnected = (state: MeetState): number => {
    const memberCount = selectMlsGroupState(state)?.memberCount ?? 0;

    if (!memberCount) {
        return 0;
    }

    return memberCount - selectConnectedMemberCount(state);
};

export const selectHiddenParticipantCount = (state: MeetState) => Math.max(selectMemberCountMinusConnected(state), 0);

const selectHasParticipantCountMismatch = (state: MeetState) => selectMemberCountMinusConnected(state) !== 0;

const selectIsHostInCall = createSelector(
    [selectSortedParticipantIdentities, selectParticipantsMap],
    (identities, participantsMap) => identities.some((identity) => !!participantsMap[identity]?.IsHost)
);

const haveSameIdentities = (identities: string[], otherIdentities: string[]) => {
    if (identities.length !== otherIdentities.length) {
        return false;
    }

    const otherIdentitySet = new Set(otherIdentities);
    return identities.every((identity) => otherIdentitySet.has(identity));
};

const hasMismatchRunChanged = (currentState: MeetState, previousState: MeetState) => {
    const hasMismatch = selectHasParticipantCountMismatch(currentState);
    if (hasMismatch !== selectHasParticipantCountMismatch(previousState)) {
        return true;
    }

    if (!hasMismatch) {
        return false;
    }

    const isHostInCall = selectIsHostInCall(currentState);
    if (isHostInCall !== selectIsHostInCall(previousState)) {
        return true;
    }

    // Without the host nobody removes the people who dropped, so joins and leaves cannot bring the counts back.
    return (
        isHostInCall &&
        !haveSameIdentities(
            selectSortedParticipantIdentities(currentState),
            selectSortedParticipantIdentities(previousState)
        )
    );
};

export const participantCountMismatchListener = (startListening: MeetAppStartListening) => {
    startListening({
        predicate: (_action, currentState, previousState) => hasMismatchRunChanged(currentState, previousState),
        effect: (_action, { dispatch, getState }) => {
            const state = getState();

            dispatch(
                setParticipantCountMismatch(
                    selectHasParticipantCountMismatch(state)
                        ? { since: Date.now(), isHostInCall: selectIsHostInCall(state) }
                        : null
                )
            );
        },
    });
};
