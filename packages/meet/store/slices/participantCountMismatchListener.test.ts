import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MINUTE, SECOND } from '@proton/shared/lib/constants';

import { ParticipantCapabilityPermission } from '../../types/types';
import type { MeetState } from '../rootReducer';
import type { MeetAppStartListening } from '../store';
import { currentMeetingReducer, setMlsGroupState } from './currentMeeting';
import { participantCountMismatchListener, selectHiddenParticipantCount } from './participantCountMismatchListener';
import { agentParticipantsReducer, setAgentIdentities } from './participants/agentParticipantsSlice';
import { mergeParticipantsMap, participantsReducer } from './participants/participantsSlice';
import { setSortedParticipantIdentities, sortedParticipantsReducer } from './participants/sortedParticipantsSlice';
import { selectParticipantCountMismatch, uiStateReducer } from './uiStateSlice';

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

    it('is 0 when more participants are connected than MLS members', () => {
        expect(selectHiddenParticipantCount(createState({ memberCount: 2, humanCount: 3 }))).toBe(0);
    });

    it('is 0 while the MLS member count is unknown', () => {
        expect(selectHiddenParticipantCount(createState({ memberCount: null, humanCount: 3 }))).toBe(0);
        expect(selectHiddenParticipantCount(createState({ memberCount: 0, humanCount: 3 }))).toBe(0);
    });
});

describe('participantCountMismatchListener', () => {
    const NOW = new Date('2026-11-20T12:00:00Z').getTime();

    const createStore = () => {
        const listenerMiddleware = createListenerMiddleware();
        participantCountMismatchListener(listenerMiddleware.startListening as unknown as MeetAppStartListening);

        const store = configureStore({
            reducer: {
                ...currentMeetingReducer,
                ...sortedParticipantsReducer,
                ...agentParticipantsReducer,
                ...participantsReducer,
                ...uiStateReducer,
            },
            middleware: (getDefaultMiddleware) => getDefaultMiddleware().prepend(listenerMiddleware.middleware),
        });

        return {
            dispatch: store.dispatch as (action: unknown) => void,
            mismatch: () => selectParticipantCountMismatch(store.getState() as unknown as MeetState),
        };
    };

    const setMemberCount = (memberCount: number) => setMlsGroupState({ displayCode: null, epoch: 1, memberCount });

    const participant = (identity: string) => ({ ParticipantUUID: identity, EncryptedDisplayName: 'encrypted-name' });

    const setHost = (identity: string, isHost: boolean) =>
        mergeParticipantsMap({
            [identity]: {
                ...participant(identity),
                IsHost: isHost ? ParticipantCapabilityPermission.Allowed : ParticipantCapabilityPermission.NotAllowed,
            },
        });

    const createMismatchWithHost = () => {
        const store = createStore();
        store.dispatch(setHost('host', true));
        store.dispatch(setSortedParticipantIdentities(['host', 'alice']));
        store.dispatch(setMemberCount(5));
        return store;
    };

    const createMismatchWithoutHost = () => {
        const store = createStore();
        store.dispatch(setSortedParticipantIdentities(['alice', 'bob']));
        store.dispatch(setMemberCount(5));
        return store;
    };

    beforeEach(() => {
        vi.useFakeTimers({ now: NOW });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('starts timing a mismatch when a member is missing from the call and stops once they join', () => {
        const { dispatch, mismatch } = createStore();
        dispatch(setSortedParticipantIdentities(['alice']));

        dispatch(setMemberCount(2));
        expect(mismatch()).toEqual({ since: NOW, isHostInCall: false });

        dispatch(setSortedParticipantIdentities(['alice', 'bob']));
        expect(mismatch()).toBeNull();
    });

    it('also times a mismatch when more participants are connected than MLS members', () => {
        const { dispatch, mismatch } = createStore();
        dispatch(setSortedParticipantIdentities(['alice', 'bob']));

        dispatch(setMemberCount(1));
        expect(mismatch()).not.toBeNull();
    });

    it('does not time a mismatch while the MLS member count is unknown', () => {
        const { dispatch, mismatch } = createStore();

        dispatch(setSortedParticipantIdentities(['alice']));
        dispatch(setMemberCount(0));

        expect(mismatch()).toBeNull();
    });

    it('records that the host is in the call when the mismatch starts', () => {
        const { mismatch } = createMismatchWithHost();

        expect(mismatch()).toEqual({ since: NOW, isHostInCall: true });
    });

    it('restarts the clock without the host when the host leaves', () => {
        const { dispatch, mismatch } = createMismatchWithHost();

        vi.advanceTimersByTime(2 * MINUTE);
        dispatch(setSortedParticipantIdentities(['alice']));

        expect(mismatch()).toEqual({ since: NOW + 2 * MINUTE, isHostInCall: false });
    });

    it('restarts the clock without the host when the host loses the host role', () => {
        const { dispatch, mismatch } = createMismatchWithHost();

        vi.advanceTimersByTime(2 * MINUTE);
        dispatch(setHost('host', false));

        expect(mismatch()).toEqual({ since: NOW + 2 * MINUTE, isHostInCall: false });
    });

    it('restarts the clock with the host when the host rejoins', () => {
        const { dispatch, mismatch } = createMismatchWithHost();
        dispatch(setSortedParticipantIdentities(['alice']));

        vi.advanceTimersByTime(MINUTE);
        dispatch(setSortedParticipantIdentities(['alice', 'host']));

        expect(mismatch()).toEqual({ since: NOW + MINUTE, isHostInCall: true });
    });

    it('restarts the clock when someone joins or leaves with the host in the call', () => {
        const { dispatch, mismatch } = createMismatchWithHost();

        vi.advanceTimersByTime(30 * SECOND);
        dispatch(setSortedParticipantIdentities(['host', 'alice', 'carol']));
        expect(mismatch()).toEqual({ since: NOW + 30 * SECOND, isHostInCall: true });

        vi.advanceTimersByTime(30 * SECOND);
        dispatch(setSortedParticipantIdentities(['host', 'carol']));
        expect(mismatch()).toEqual({ since: NOW + MINUTE, isHostInCall: true });
    });

    it('keeps the clock when the same people are only reordered', () => {
        const { dispatch, mismatch } = createMismatchWithHost();

        vi.advanceTimersByTime(30 * SECOND);
        dispatch(setSortedParticipantIdentities(['alice', 'host']));

        expect(mismatch()).toEqual({ since: NOW, isHostInCall: true });
    });

    it('keeps the clock when the captions agent joins', () => {
        const { dispatch, mismatch } = createStore();
        dispatch(setHost('host', true));
        dispatch(setSortedParticipantIdentities(['host', 'alice']));
        dispatch(setMemberCount(4));

        vi.advanceTimersByTime(30 * SECOND);
        dispatch(setAgentIdentities(['captions-agent']));

        expect(mismatch()).toEqual({ since: NOW, isHostInCall: true });
    });

    it('keeps the clock when only the MLS member count changes', () => {
        const { dispatch, mismatch } = createMismatchWithHost();

        vi.advanceTimersByTime(30 * SECOND);
        dispatch(setMemberCount(6));

        expect(mismatch()).toEqual({ since: NOW, isHostInCall: true });
    });

    it('keeps the clock when someone joins without the host in the call', () => {
        const { dispatch, mismatch } = createMismatchWithoutHost();

        vi.advanceTimersByTime(30 * SECOND);
        dispatch(setSortedParticipantIdentities(['alice', 'bob', 'carol']));

        expect(mismatch()).toEqual({ since: NOW, isHostInCall: false });
    });

    it('does not count an admin who is not the host', () => {
        const { dispatch, mismatch } = createStore();
        dispatch(
            mergeParticipantsMap({
                admin: { ...participant('admin'), IsAdmin: ParticipantCapabilityPermission.Allowed },
            })
        );
        dispatch(setSortedParticipantIdentities(['admin', 'alice']));

        dispatch(setMemberCount(3));

        expect(mismatch()).toEqual({ since: NOW, isHostInCall: false });
    });

    it('does not count a host who is not connected', () => {
        const { dispatch, mismatch } = createStore();
        dispatch(setHost('host', true));
        dispatch(setSortedParticipantIdentities(['alice', 'bob']));

        dispatch(setMemberCount(3));

        expect(mismatch()).toEqual({ since: NOW, isHostInCall: false });
    });
});
