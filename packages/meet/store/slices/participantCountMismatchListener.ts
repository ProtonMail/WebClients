import type { MeetState } from '../rootReducer';
import type { MeetAppStartListening } from '../store';
import { selectMlsGroupState } from './currentMeeting';
import { selectAgentIdentities } from './participants/agentParticipantsSlice';
import { selectTotalParticipantCount } from './participants/sortedParticipantsSlice';
import { selectParticipantCountMismatchSince, setParticipantCountMismatchSince } from './uiStateSlice';

/**
 * `selectTotalParticipantCount` only counts humans because `SortedParticipantsProvider` splits
 * agents out into `agentParticipantsSlice`, while the MLS group counts agents as members too.
 * Add the agents back on the LiveKit side so a present agent does not read as a false mismatch.
 * The UI counts stay as they are; this only affects the mismatch check.
 */
export const selectConnectedMemberCount = (state: MeetState) =>
    selectTotalParticipantCount(state) + selectAgentIdentities(state).length;

/**
 * MLS members minus the participants connected on LiveKit: positive when some people who can
 * decrypt the call are not visible in it, negative when more are visible than members.
 * 0 while the MLS member count is unknown.
 */
export const selectHiddenParticipantCount = (state: MeetState): number => {
    const memberCount = selectMlsGroupState(state)?.memberCount ?? 0;

    if (!memberCount) {
        return 0;
    }

    return memberCount - selectConnectedMemberCount(state);
};

/**
 * Tracked participants count and the MLS member count here rather than in the component,
 * because the sidebar unmounts whenever it is closed, which would restart the timer.
 */
const selectHasParticipantCountMismatch = (state: MeetState) => selectHiddenParticipantCount(state) !== 0;

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
