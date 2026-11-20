import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import { describe, expect, it } from 'vitest';

import type { MeetState } from '../rootReducer';
import type { MeetAppStartListening } from '../store';
import { currentMeetingReducer, setMlsGroupState } from './currentMeeting';
import { participantCountMismatchListener, selectHiddenParticipantCount } from './participantCountMismatchListener';
import { agentParticipantsReducer } from './participants/agentParticipantsSlice';
import { setSortedParticipantIdentities, sortedParticipantsReducer } from './participants/sortedParticipantsSlice';
import { selectParticipantCountMismatchSince, uiStateReducer } from './uiStateSlice';

const createState = ({
    memberCount,
    humanCount,
    agentCount = 0,
}: {
    memberCount: number | null;
    humanCount: number;
    agentCount?: number;
}) =>
    ({
        currentMeeting: { mlsGroupState: memberCount === null ? null : { memberCount } },
        sortedParticipants: {
            sortedParticipantIdentities: Array.from({ length: humanCount }, (_, index) => `human-${index}`),
        },
        agentParticipants: { agentIdentities: Array.from({ length: agentCount }, (_, index) => `agent-${index}`) },
    }) as unknown as MeetState;

describe('selectHiddenParticipantCount', () => {
    it('counts the MLS members missing from the call', () => {
        expect(selectHiddenParticipantCount(createState({ memberCount: 5, humanCount: 2 }))).toBe(3);
    });

    it('counts connected agents as present members', () => {
        expect(selectHiddenParticipantCount(createState({ memberCount: 4, humanCount: 2, agentCount: 1 }))).toBe(1);
    });

    it('is 0 when every member is in the call', () => {
        expect(selectHiddenParticipantCount(createState({ memberCount: 3, humanCount: 2, agentCount: 1 }))).toBe(0);
    });

    it('is negative when more participants are connected than MLS members', () => {
        expect(selectHiddenParticipantCount(createState({ memberCount: 2, humanCount: 3 }))).toBe(-1);
    });

    it('is 0 while the MLS member count is unknown', () => {
        expect(selectHiddenParticipantCount(createState({ memberCount: null, humanCount: 3 }))).toBe(0);
        expect(selectHiddenParticipantCount(createState({ memberCount: 0, humanCount: 3 }))).toBe(0);
    });
});

describe('participantCountMismatchListener', () => {
    const createStore = () => {
        const listenerMiddleware = createListenerMiddleware();
        participantCountMismatchListener(listenerMiddleware.startListening as unknown as MeetAppStartListening);

        const store = configureStore({
            reducer: {
                ...currentMeetingReducer,
                ...sortedParticipantsReducer,
                ...agentParticipantsReducer,
                ...uiStateReducer,
            },
            middleware: (getDefaultMiddleware) => getDefaultMiddleware().prepend(listenerMiddleware.middleware),
        });

        return {
            dispatch: store.dispatch as (action: unknown) => void,
            mismatchSince: () => selectParticipantCountMismatchSince(store.getState() as unknown as MeetState),
        };
    };

    const setMemberCount = (memberCount: number) => setMlsGroupState({ displayCode: null, epoch: 1, memberCount });

    it('starts tracking a mismatch when a member is missing from the call and stops once they join', () => {
        const { dispatch, mismatchSince } = createStore();
        dispatch(setSortedParticipantIdentities(['alice']));

        dispatch(setMemberCount(2));
        expect(mismatchSince()).not.toBeNull();

        dispatch(setSortedParticipantIdentities(['alice', 'bob']));
        expect(mismatchSince()).toBeNull();
    });

    it('does not track a mismatch while the MLS member count is unknown', () => {
        const { dispatch, mismatchSince } = createStore();

        dispatch(setSortedParticipantIdentities(['alice']));
        dispatch(setMemberCount(0));

        expect(mismatchSince()).toBeNull();
    });
});
