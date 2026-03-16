import { meetAppStateReducer } from './meetAppStateSlice';
import { meetingInfoReducer } from './meetingInfo';
import { chatAndReactionsReducer } from './chatAndReactionsSlice';
import { meetingsReducer } from './meetings';
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
    ...settingsReducer,
    ...sortedParticipantsReducer,
    ...uiStateReducer,
};
