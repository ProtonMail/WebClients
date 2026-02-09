import { meetAppStateReducer } from './meetAppStateSlice';
import { meetingStateReducer } from './meetingState';
import { meetingsReducer } from './meetings';
import { settingsReducer } from './settings';
import { uiStateReducer } from './uiStateSlice';
import { userSettingsReducer } from './userSettings';

export * from './meetAppStateSlice';
export * from './meetings';
export * from './uiStateSlice';
export * from './userSettings';

export const meetReducers = {
    ...meetAppStateReducer,
    ...meetingsReducer,
    ...userSettingsReducer,
    ...settingsReducer,
    ...meetingStateReducer,
    ...uiStateReducer,
};
