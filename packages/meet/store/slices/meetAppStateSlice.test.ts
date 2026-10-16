import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';
import { configureStore } from '@reduxjs/toolkit';
import { describe, expect, it } from 'vitest';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';

import type { MeetState } from '../rootReducer';
import { currentMeetingReducer, setNavigationSeed } from './currentMeeting';
import {
    meetAppStateReducer,
    savePreviousMeeting,
    selectPreviousMeetingLink,
    selectPreviousMeetingName,
} from './meetAppStateSlice';
import { meetingInfoModelReducer } from './meetingInfoModel';

const createStore = () => {
    const store = configureStore({
        reducer: {
            ...currentMeetingReducer,
            ...meetingInfoModelReducer,
            ...meetAppStateReducer,
        },
    });
    return store as unknown as Omit<typeof store, 'dispatch' | 'getState'> & {
        dispatch: ThunkDispatch<MeetState, ProtonThunkArguments, UnknownAction>;
        getState: () => MeetState;
    };
};

describe('savePreviousMeeting', () => {
    it('should save the link and the name of the current meeting', () => {
        const store = createStore();
        store.dispatch(
            setNavigationSeed({ meetingName: 'Design Weekly', isPersonalRoom: false, canManageWaitingRoom: false })
        );

        store.dispatch(savePreviousMeeting('link'));

        expect(selectPreviousMeetingLink(store.getState())).toBe('link');
        expect(selectPreviousMeetingName(store.getState())).toBe('Design Weekly');
    });

    it('should save an empty name when the current meeting has no name', () => {
        const store = createStore();

        store.dispatch(savePreviousMeeting('link'));

        expect(selectPreviousMeetingLink(store.getState())).toBe('link');
        expect(selectPreviousMeetingName(store.getState())).toBe('');
    });
});
