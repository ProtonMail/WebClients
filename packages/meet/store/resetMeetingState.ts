import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';

import type { MeetState } from './rootReducer';
import { resetChatAndReactions } from './slices/chatAndReactionsSlice';
import { resetMeetingInfo, stopMeetingDurationTimer } from './slices/meetingInfo';
import { resetRecordingStatus } from './slices/recordingStatusSlice';
import { resetScreenShareStatus } from './slices/screenShareStatusSlice';
import { resetSortedParticipants } from './slices/sortedParticipantsSlice';
import { resetUiState } from './slices/uiStateSlice';

// Single teardown for all per-meeting state.
export const resetMeetingState =
    (): ThunkAction<void, MeetState, ProtonThunkArguments, UnknownAction> => (dispatch) => {
        dispatch(resetRecordingStatus());
        dispatch(stopMeetingDurationTimer());
        dispatch(resetMeetingInfo());
        dispatch(resetChatAndReactions());
        dispatch(resetUiState());
        dispatch(resetSortedParticipants());
        dispatch(resetScreenShareStatus());
    };
