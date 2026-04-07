import { chatAndReactionsReducer } from './chatAndReactionsSlice';
import { meetAppStateReducer } from './meetAppStateSlice';
import { meetingInfoReducer } from './meetingInfo';
import { meetingsReducer } from './meetings';
import { recordingStatusReducer } from './recordingStatusSlice';
import { settingsReducer } from './settings';
import { sortedParticipantsReducer } from './sortedParticipantsSlice';
import { uiStateReducer } from './uiStateSlice';
import { userSettingsReducer } from './userSettings';

export * from './meetAppStateSlice';
export * from './meetingInfo';
export * from './meetings';
export * from './uiStateSlice';
export * from './userSettings';

export const meetReducers = {
    ...meetAppStateReducer,
    ...meetingInfoReducer,
    ...meetingsReducer,
    ...userSettingsReducer,
    ...chatAndReactionsReducer,
    ...recordingStatusReducer,
    ...settingsReducer,
    ...sortedParticipantsReducer,
    ...uiStateReducer,
};
