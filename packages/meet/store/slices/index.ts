import { chatAndReactionsReducer } from './chatAndReactionsSlice';
import { devToolsReducer } from './devToolsSlice';
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
import { meetUserReducer } from './userSlice';

export * from './meetAppStateSlice';
export * from './meetingInfo';
export * from './meetings';

export const meetReducers = {
    ...chatAndReactionsReducer,
    ...devToolsReducer,
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
    ...meetUserReducer,
};
