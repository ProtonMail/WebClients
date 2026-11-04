import { type ReactNode, createElement } from 'react';
import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook } from '@testing-library/react';

import { connectionReducer, setJoinedRoom } from '@proton/meet/store/slices/connectionSlice';
import { participantsReducer } from '@proton/meet/store/slices/participants/participantsSlice';
import { addWaitingParticipant, waitingRoomReducer } from '@proton/meet/store/slices/waitingRoomSlice';
import type { ParticipantEntity } from '@proton/meet/types/types';
import { ProtonStoreContext } from '@proton/react-redux-store/ProtonStoreContext';

import { useParticipantNameMap } from './useParticipantNameMap';

const mocks = vi.hoisted(() => ({
    api: vi.fn(),
    room: { on: vi.fn(), off: vi.fn(), remoteParticipants: new Map() },
    loggerError: vi.fn(),
}));

vi.mock('@livekit/components-react', () => ({
    useRoomContext: () => mocks.room,
    useLocalParticipant: () => ({ localParticipant: { identity: 'local-participant' } }),
}));

vi.mock('@proton/app-context/useApi', () => ({ useApi: () => mocks.api }));

vi.mock('@protontech/logger', () => ({ logger: { error: mocks.loggerError } }));

interface PendingResponse {
    resolve: (participants: ParticipantEntity[]) => void;
    reject: (error: Error) => void;
}

const MEETING_LINK_NAME = 'meeting-link';

let pendingResponses: PendingResponse[];

const toParticipants = (...identities: string[]): ParticipantEntity[] =>
    identities.map((identity) => ({ ParticipantUUID: identity, EncryptedDisplayName: 'encrypted' }));

const manyParticipants = () => toParticipants(...Array.from({ length: 11 }, (_, index) => `participant-${index}`));

const createStore = () =>
    configureStore({
        reducer: { ...participantsReducer, ...connectionReducer, ...waitingRoomReducer },
    });

const renderParticipantNameMap = () => {
    const store = createStore();
    const wrapper = ({ children }: { children: ReactNode }) =>
        createElement(Provider, { context: ProtonStoreContext, store, children });
    const rendered = renderHook(() => useParticipantNameMap(MEETING_LINK_NAME), { wrapper });

    const getParticipants = () => {
        let landed = false;
        const promise = rendered.result.current.getParticipants(MEETING_LINK_NAME).then(() => {
            landed = true;
        });
        return { promise, hasLanded: () => landed };
    };

    return { store, rendered, getParticipants };
};

const flush = () => act(() => vi.advanceTimersByTimeAsync(0));

const respond = async (participants: ParticipantEntity[]) => {
    pendingResponses.shift()!.resolve(participants);
    await flush();
};

const fail = async () => {
    pendingResponses.shift()!.reject(new Error('network'));
    await flush();
};

const participantIdentities = (store: ReturnType<typeof createStore>) =>
    Object.keys(store.getState().participants.participantsMap).sort();

describe('useParticipantNameMap getParticipants', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        pendingResponses = [];
        mocks.api.mockImplementation(
            () =>
                new Promise((resolve, reject) => {
                    pendingResponses.push({
                        resolve: (participants) => resolve({ Participants: participants }),
                        reject,
                    });
                })
        );
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    describe('when idle', () => {
        it('starts one fetch and resolves once its participants are in the store', async () => {
            const { store, getParticipants } = renderParticipantNameMap();

            const call = getParticipants();
            await flush();

            expect(mocks.api).toHaveBeenCalledTimes(1);
            expect(call.hasLanded()).toBe(false);
            expect(store.getState().participants.isFetchingParticipants).toBe(true);

            await respond(toParticipants('alice'));

            expect(call.hasLanded()).toBe(true);
            expect(participantIdentities(store)).toEqual(['alice']);
            expect(store.getState().participants.isFetchingParticipants).toBe(false);
        });
    });

    describe('when fetching', () => {
        it('runs one follow-up fetch after the current one and resolves once the follow-up has landed', async () => {
            const { store, getParticipants } = renderParticipantNameMap();

            const first = getParticipants();
            await flush();
            const second = getParticipants();
            await flush();

            expect(mocks.api).toHaveBeenCalledTimes(1);
            expect(second.hasLanded()).toBe(false);

            await respond(toParticipants('alice'));

            expect(first.hasLanded()).toBe(true);
            expect(second.hasLanded()).toBe(false);
            expect(mocks.api).toHaveBeenCalledTimes(2);

            await respond(toParticipants('alice', 'bob'));

            expect(second.hasLanded()).toBe(true);
            expect(participantIdentities(store)).toEqual(['alice', 'bob']);
        });

        it('collapses several calls during one fetch into a single follow-up', async () => {
            const { getParticipants } = renderParticipantNameMap();

            getParticipants();
            await flush();
            const calls = [getParticipants(), getParticipants(), getParticipants()];

            await respond(toParticipants('alice'));
            await respond(toParticipants('alice', 'bob'));

            expect(mocks.api).toHaveBeenCalledTimes(2);
            expect(calls.every((call) => call.hasLanded())).toBe(true);
        });

        it('logs a failed fetch, clears the fetching flag and resolves without rejecting', async () => {
            const { store, getParticipants } = renderParticipantNameMap();

            const call = getParticipants();
            await flush();
            await fail();

            expect(call.hasLanded()).toBe(true);
            expect(mocks.loggerError).toHaveBeenCalledWith('Failed to fetch participants', expect.any(Error));
            expect(store.getState().participants.isFetchingParticipants).toBe(false);

            getParticipants();
            await flush();

            expect(mocks.api).toHaveBeenCalledTimes(2);
        });

        it('still runs the pending follow-up when the current fetch fails', async () => {
            const { store, getParticipants } = renderParticipantNameMap();

            getParticipants();
            await flush();
            const followUp = getParticipants();

            await fail();

            expect(mocks.api).toHaveBeenCalledTimes(2);

            await respond(toParticipants('alice'));

            expect(followUp.hasLanded()).toBe(true);
            expect(participantIdentities(store)).toEqual(['alice']);
        });

        it('fetches the name of a waiting room request that arrives while the join fetch is in flight', async () => {
            const { store, getParticipants } = renderParticipantNameMap();

            getParticipants();
            await flush();
            await act(async () => {
                store.dispatch(setJoinedRoom(true));
                store.dispatch(
                    addWaitingParticipant({
                        requestId: 'request',
                        participantUid: 'guest',
                        expiresAt: Date.now() + 60_000,
                        receivedAt: Date.now(),
                    })
                );
            });

            await respond(toParticipants('host'));
            await respond(toParticipants('host', 'guest'));

            expect(mocks.api).toHaveBeenCalledTimes(2);
            expect(store.getState().participants.participantDecryptedNameMap.guest).toBeTruthy();
        });
    });

    describe('when throttled because the meeting has more than 10 participants', () => {
        const renderAfterLargeFetch = async () => {
            const rendered = renderParticipantNameMap();
            rendered.getParticipants();
            await flush();
            await respond(manyParticipants());
            return rendered;
        };

        it('waits until 5 seconds after the last fetch, then fetches and resolves once the result has landed', async () => {
            const { store, getParticipants } = await renderAfterLargeFetch();

            await act(() => vi.advanceTimersByTimeAsync(2000));
            const call = getParticipants();
            await act(() => vi.advanceTimersByTimeAsync(2999));

            expect(mocks.api).toHaveBeenCalledTimes(1);
            expect(call.hasLanded()).toBe(false);

            await act(() => vi.advanceTimersByTimeAsync(1));

            expect(mocks.api).toHaveBeenCalledTimes(2);
            expect(call.hasLanded()).toBe(false);

            await respond([...manyParticipants(), ...toParticipants('late-joiner')]);

            expect(call.hasLanded()).toBe(true);
            expect(participantIdentities(store)).toContain('late-joiner');
        });

        it('turns a call made while waiting into a single follow-up after the scheduled fetch', async () => {
            const { getParticipants } = await renderAfterLargeFetch();

            getParticipants();
            const followUp = getParticipants();
            await act(() => vi.advanceTimersByTimeAsync(5000));

            expect(mocks.api).toHaveBeenCalledTimes(2);

            await respond(manyParticipants());
            await act(() => vi.advanceTimersByTimeAsync(5000));

            expect(mocks.api).toHaveBeenCalledTimes(3);
            expect(followUp.hasLanded()).toBe(false);

            await respond(manyParticipants());

            expect(followUp.hasLanded()).toBe(true);
        });
    });

    describe('after unmount', () => {
        it('drops a result that arrives after unmount and starts no follow-up', async () => {
            const { store, rendered, getParticipants } = renderParticipantNameMap();

            const first = getParticipants();
            await flush();
            const followUp = getParticipants();
            rendered.unmount();

            await respond(toParticipants('previous-meeting-host'));

            expect(participantIdentities(store)).toEqual([]);
            expect(mocks.api).toHaveBeenCalledTimes(1);
            expect(first.hasLanded()).toBe(true);
            expect(followUp.hasLanded()).toBe(true);
        });

        it('cancels a scheduled fetch and resolves its promise', async () => {
            const { rendered, getParticipants } = renderParticipantNameMap();
            getParticipants();
            await flush();
            await respond(manyParticipants());

            const call = getParticipants();
            rendered.unmount();
            await act(() => vi.advanceTimersByTimeAsync(5000));

            expect(mocks.api).toHaveBeenCalledTimes(1);
            expect(call.hasLanded()).toBe(true);
        });

        it('starts no fetch for a call made after unmount', async () => {
            const { rendered, getParticipants } = renderParticipantNameMap();
            rendered.unmount();

            const call = getParticipants();
            await flush();

            expect(mocks.api).not.toHaveBeenCalled();
            expect(call.hasLanded()).toBe(true);
        });
    });
});
