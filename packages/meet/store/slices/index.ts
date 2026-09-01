import { backgroundReducer } from './backgroundSlice';
import { chatAndReactionsReducer } from './chatAndReactionsSlice';
import { connectionReducer } from './connectionSlice';
import { currentMeetingReducer } from './currentMeeting';
import { customBackgroundsReducer } from './customBackgroundsSlice';
import { devToolsReducer } from './devToolsSlice';
import { deviceManagementReducer } from './deviceManagementSlice';
import { meetAppStateReducer } from './meetAppStateSlice';
import { meetingInfoModelReducer } from './meetingInfoModel';
import { meetingsReducer } from './meetings';
import { agentParticipantsReducer } from './participants/agentParticipantsSlice';
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
    ...backgroundReducer,
    ...chatAndReactionsReducer,
    ...connectionReducer,
    ...devToolsReducer,
    ...deviceManagementReducer,
    ...meetAppStateReducer,
    ...currentMeetingReducer,
    ...customBackgroundsReducer,
    ...meetingInfoModelReducer,
    ...meetingsReducer,
    ...participantsReducer,
    ...agentParticipantsReducer,
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
