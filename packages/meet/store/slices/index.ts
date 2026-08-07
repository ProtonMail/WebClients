import { chatAndReactionsReducer } from './chatAndReactionsSlice';
import { connectionReducer } from './connectionSlice';
import { currentMeetingReducer } from './currentMeeting';
import { devToolsReducer } from './devToolsSlice';
import { deviceManagementReducer } from './deviceManagementSlice';
import { meetAppStateReducer } from './meetAppStateSlice';
import { meetingInfoModelReducer } from './meetingInfoModel';
import { meetingsReducer } from './meetings';
import { participantsReducer } from './participants/participantsSlice';
import { sortedParticipantsReducer } from './participants/sortedParticipantsSlice';
import { recordingStatusReducer } from './recordingStatusSlice';
import { recordingsReducer } from './recordingsSlice';
import { screenShareStatusReducer } from './screenShareStatusSlice';
import { settingsReducer } from './settings';
import { uiStateReducer } from './uiStateSlice';
import { userSettingsReducer } from './userSettings';
import { meetUserReducer } from './userSlice';
import { waitingRoomReducer } from './waitingRoomSlice';

export const meetReducers = {
    ...chatAndReactionsReducer,
    ...connectionReducer,
    ...devToolsReducer,
    ...deviceManagementReducer,
    ...meetAppStateReducer,
    ...currentMeetingReducer,
    ...meetingInfoModelReducer,
    ...meetingsReducer,
    ...participantsReducer,
    ...sortedParticipantsReducer,
    ...userSettingsReducer,
    ...recordingsReducer,
    ...recordingStatusReducer,
    ...screenShareStatusReducer,
    ...settingsReducer,
    ...uiStateReducer,
    ...meetUserReducer,
    ...waitingRoomReducer,
};
