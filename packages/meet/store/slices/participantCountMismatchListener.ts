import type { MeetState } from '../rootReducer';
import type { MeetAppStartListening } from '../store';
import { selectMlsGroupState } from './currentMeeting';
import { selectAgentIdentities } from './participants/agentParticipantsSlice';
import { selectTotalParticipantCount } from './participants/sortedParticipantsSlice';
import { selectParticipantCountMismatchSince, setParticipantCountMismatchSince } from './uiStateSlice';

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

export const participantCountMismatchListener = (startListening: MeetAppStartListening) => {
    startListening({
        predicate: (_action, currentState, previousState) =>
            selectHasParticipantCountMismatch(currentState) !== selectHasParticipantCountMismatch(previousState),
        effect: (_action, { dispatch, getState }) => {
            const state = getState();

            if (!selectHasParticipantCountMismatch(state)) {
                dispatch(setParticipantCountMismatchSince(null));
                return;
            }

            if (selectParticipantCountMismatchSince(state) === null) {
                dispatch(setParticipantCountMismatchSince(Date.now()));
            }
        },
    });
};
