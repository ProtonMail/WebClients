import type { MeetAppStartListening } from '../store';
import { loadPersistedUserSettings } from './settings';
import { selectUserId } from './userSlice';

/** The settings are stored per user, and the user is usually loaded after the store is created. */
export const persistedUserSettingsListener = (startListening: MeetAppStartListening) => {
    startListening({
        predicate: (_action, currentState, previousState) => selectUserId(currentState) !== selectUserId(previousState),
        effect: (_action, { dispatch }) => {
            dispatch(loadPersistedUserSettings());
        },
    });
};
