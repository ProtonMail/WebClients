import type { MeetAppStartListening } from '../store';
import { loadPersistedJoinLeaveSoundsSetting } from './settings';
import { selectUserId } from './userSlice';

/** The choice is stored per user, and the user is usually loaded after the store is created. */
export const joinLeaveSoundsListener = (startListening: MeetAppStartListening) => {
    startListening({
        predicate: (_action, currentState, previousState) => selectUserId(currentState) !== selectUserId(previousState),
        effect: (_action, { dispatch }) => {
            dispatch(loadPersistedJoinLeaveSoundsSetting());
        },
    });
};
