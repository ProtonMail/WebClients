import type { MeetState } from '../rootReducer';
import type { MeetAppStartListening } from '../store';
import { selectMlsGroupState } from './currentMeeting';
import { selectTotalParticipantCount } from './participants/sortedParticipantsSlice';
import { selectParticipantCountMismatchSince, setParticipantCountMismatchSince } from './uiStateSlice';

/**
 * Tracked participants count and the MLS member count here rather than in the component,
 * because the sidebar unmounts whenever it is closed, which would restart the timer.
 */
const selectHasParticipantCountMismatch = (state: MeetState) => {
    const memberCount = selectMlsGroupState(state)?.memberCount ?? 0;

    return !!memberCount && memberCount !== selectTotalParticipantCount(state);
};

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
