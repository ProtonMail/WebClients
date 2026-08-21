import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';

import type { MeetState } from './rootReducer';
import { resetChatAndReactions } from './slices/chatAndReactionsSlice';
import { resetConnection } from './slices/connectionSlice';
import { resetCurrentMeeting, stopMeetingDurationTimer } from './slices/currentMeeting';
import { resetMeetingInfoModel } from './slices/meetingInfoModel';
import { resetAgentParticipants } from './slices/participants/agentParticipantsSlice';
import { resetParticipants } from './slices/participants/participantsSlice';
import { resetSortedParticipants } from './slices/participants/sortedParticipantsSlice';
import { resetRecordingStatus } from './slices/recordingStatusSlice';
import { resetScreenShareStatus } from './slices/screenShareStatusSlice';
import { resetWaitingRoomSetting } from './slices/settings';
import { resetUiState } from './slices/uiStateSlice';
import { resetWaitingRoom } from './slices/waitingRoomSlice';

// Single teardown for all per-meeting state.
export const resetMeetingState =
    (): ThunkAction<void, MeetState, ProtonThunkArguments, UnknownAction> => (dispatch) => {
        dispatch(resetRecordingStatus());
        dispatch(stopMeetingDurationTimer());
        dispatch(resetCurrentMeeting());
        dispatch(resetMeetingInfoModel());
        dispatch(resetChatAndReactions());
        dispatch(resetUiState());
        dispatch(resetConnection());
        dispatch(resetParticipants());
        dispatch(resetAgentParticipants());
        dispatch(resetSortedParticipants());
        dispatch(resetScreenShareStatus());
        dispatch(resetWaitingRoom());
        dispatch(resetWaitingRoomSetting());
    };
