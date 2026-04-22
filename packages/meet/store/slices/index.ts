import { chatAndReactionsReducer } from './chatAndReactionsSlice';
import { deviceManagementReducer } from './deviceManagementSlice';
import { meetAppStateReducer } from './meetAppStateSlice';
import { meetingInfoReducer } from './meetingInfo';
import { meetingsReducer } from './meetings';
import { recordingStatusReducer } from './recordingStatusSlice';
import { screenShareStatusReducer } from './screenShareStatusSlice';
import { settingsReducer } from './settings';
import { sortedParticipantsReducer } from './sortedParticipantsSlice';
import { uiStateReducer } from './uiStateSlice';
import { userSettingsReducer } from './userSettings';

export * from './deviceManagementSlice';
export * from './meetAppStateSlice';
export * from './meetingInfo';
export * from './meetings';
export * from './uiStateSlice';
export * from './userSettings';

export const meetReducers = {
    ...chatAndReactionsReducer,
    ...deviceManagementReducer,
    ...meetAppStateReducer,
    ...meetingInfoReducer,
    ...meetingsReducer,
    ...userSettingsReducer,
    ...recordingStatusReducer,
    ...screenShareStatusReducer,
    ...settingsReducer,
    ...sortedParticipantsReducer,
    ...uiStateReducer,
};
