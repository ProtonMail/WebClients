import type { ReactNode } from 'react';
import { Provider } from 'react-redux';

import { MeetCoreErrorEnum } from '@proton-meet/proton-meet-core';
import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';
import { configureStore } from '@reduxjs/toolkit';
import { act, cleanup, renderHook } from '@testing-library/react';

import type { MeetState } from '@proton/meet/store/rootReducer';
import {
    WaitingRoomAdmissionStatus,
    resetWaitingRoom,
    waitingRoomReducer,
} from '@proton/meet/store/slices/waitingRoomSlice';
import { ProtonStoreContext } from '@proton/react-redux-store';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createPromise } from '@proton/shared/lib/helpers/promise';

import { MeetCoreClientContext } from '../../../contexts/MeetCoreClientContext';
import { type MeetCoreClientMock, createMeetCoreClientMock } from '../../../wasm/MeetCoreClient.mock';
import { emitWaitingRoomJoinDecision } from '../../../wasm/waitingRoomCallbacks';
import { usePreJoinWaitingRoom } from './usePreJoinWaitingRoom';

const notifyError = vi.fn();

vi.mock('@proton/unleash/useFlag', () => ({
    useFlag: () => true,
}));

vi.mock('../../useNotifyError', () => ({
    useNotifyError: () => notifyError,
}));

vi.mock('@proton/meet/hooks/useMeetErrorReporting', () => ({
    useMeetErrorReporting: () => ({ reportMeetError: vi.fn() }),
}));

const MEET_LINK_NAME = 'meeting-link';
const SESSION_KEY = 'session-key-base64';
const REQUEST_ID = 'request-1';
const HOST_POLL_INTERVAL_MS = 3000;

const createStore = () => {
    const store = configureStore({ reducer: { ...waitingRoomReducer } });
    return store as unknown as Omit<typeof store, 'dispatch' | 'getState'> & {
        dispatch: ThunkDispatch<MeetState, ProtonThunkArguments, UnknownAction>;
        getState: () => MeetState;
    };
};

type TestStore = ReturnType<typeof createStore>;

const createWrapper = (store: TestStore, meetCoreClient: MeetCoreClientMock) =>
    function Wrapper({ children }: { children: ReactNode }) {
        return (
            <Provider context={ProtonStoreContext} store={store}>
                <MeetCoreClientContext.Provider value={meetCoreClient}>{children}</MeetCoreClientContext.Provider>
            </Provider>
        );
    };

describe('usePreJoinWaitingRoom', () => {
    let store: TestStore;
    let welcome: ReturnType<typeof createPromise<void>>;
    let meetCoreClient: MeetCoreClientMock;

    const getAdmissionStatus = () => store.getState().waitingRoom.admissionStatus;

    const renderPreJoinWaitingRoom = () =>
        renderHook(() => usePreJoinWaitingRoom(), { wrapper: createWrapper(store, meetCoreClient) });

    const startAdmission = async (result: ReturnType<typeof renderPreJoinWaitingRoom>) => {
        await act(async () => {
            await result.result.current.startAdmission(MEET_LINK_NAME, SESSION_KEY);
        });
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        store = createStore();
        welcome = createPromise<void>();
        meetCoreClient = createMeetCoreClientMock({
            hasMlsGroupInfo: vi.fn().mockResolvedValue(true),
            waitForWaitingRoomWelcome: vi.fn().mockReturnValue(welcome.promise),
        });
    });

    afterEach(() => {
        cleanup();
        store.dispatch(resetWaitingRoom());
        welcome.resolve();
        vi.useRealTimers();
    });

    it('should send the join request when the host has already started', async () => {
        const rendered = renderPreJoinWaitingRoom();

        expect(getAdmissionStatus()).toBe(WaitingRoomAdmissionStatus.INACTIVE);

        await startAdmission(rendered);

        expect(meetCoreClient.createJoinRequest).toHaveBeenCalledWith(MEET_LINK_NAME, SESSION_KEY);
        expect(getAdmissionStatus()).toBe(WaitingRoomAdmissionStatus.AWAITING);
    });

    it('should wait for the host when the meeting has not started', async () => {
        meetCoreClient.hasMlsGroupInfo.mockResolvedValue(false);

        const rendered = renderPreJoinWaitingRoom();

        expect(getAdmissionStatus()).toBe(WaitingRoomAdmissionStatus.INACTIVE);

        await startAdmission(rendered);

        expect(getAdmissionStatus()).toBe(WaitingRoomAdmissionStatus.HOST_NOT_STARTED);
        expect(meetCoreClient.createJoinRequest).not.toHaveBeenCalled();
    });

    it('should send the join request once the host starts the meeting', async () => {
        meetCoreClient.hasMlsGroupInfo.mockResolvedValue(false);

        const rendered = renderPreJoinWaitingRoom();

        expect(getAdmissionStatus()).toBe(WaitingRoomAdmissionStatus.INACTIVE);

        await startAdmission(rendered);

        expect(getAdmissionStatus()).toBe(WaitingRoomAdmissionStatus.HOST_NOT_STARTED);
        expect(meetCoreClient.createJoinRequest).not.toHaveBeenCalled();

        meetCoreClient.hasMlsGroupInfo.mockResolvedValue(true);

        await act(async () => {
            await vi.advanceTimersByTimeAsync(HOST_POLL_INTERVAL_MS);
        });

        expect(meetCoreClient.createJoinRequest).toHaveBeenCalledWith(MEET_LINK_NAME, SESSION_KEY);
        expect(getAdmissionStatus()).toBe(WaitingRoomAdmissionStatus.AWAITING);
    });

    it('should admit the guest when the welcome arrives', async () => {
        const rendered = renderPreJoinWaitingRoom();

        await startAdmission(rendered);

        expect(getAdmissionStatus()).toBe(WaitingRoomAdmissionStatus.AWAITING);

        await act(async () => {
            welcome.resolve();
        });

        expect(getAdmissionStatus()).toBe(WaitingRoomAdmissionStatus.ADMITTED);
    });

    it('should expire the admission when the welcome fails', async () => {
        const rendered = renderPreJoinWaitingRoom();

        await startAdmission(rendered);

        expect(getAdmissionStatus()).toBe(WaitingRoomAdmissionStatus.AWAITING);

        await act(async () => {
            welcome.reject(new Error('welcome failed'));
        });

        expect(getAdmissionStatus()).toBe(WaitingRoomAdmissionStatus.EXPIRED);
    });

    it('should not expire the admission when the wait was cancelled by the core', async () => {
        const rendered = renderPreJoinWaitingRoom();

        await startAdmission(rendered);

        expect(getAdmissionStatus()).toBe(WaitingRoomAdmissionStatus.AWAITING);

        await act(async () => {
            welcome.reject(MeetCoreErrorEnum.WaitingRoomJoinCancelled);
        });

        expect(getAdmissionStatus()).toBe(WaitingRoomAdmissionStatus.AWAITING);
    });

    it('should reject the admission when the host declines the request', async () => {
        const rendered = renderPreJoinWaitingRoom();

        await startAdmission(rendered);

        expect(getAdmissionStatus()).toBe(WaitingRoomAdmissionStatus.AWAITING);

        await act(async () => {
            emitWaitingRoomJoinDecision(REQUEST_ID, false);
        });

        expect(getAdmissionStatus()).toBe(WaitingRoomAdmissionStatus.REJECTED);
    });

    it('should keep the rejection when the welcome fails afterwards', async () => {
        const rendered = renderPreJoinWaitingRoom();

        await startAdmission(rendered);

        expect(getAdmissionStatus()).toBe(WaitingRoomAdmissionStatus.AWAITING);

        await act(async () => {
            emitWaitingRoomJoinDecision(REQUEST_ID, false);
        });

        await act(async () => {
            welcome.reject(new Error('welcome failed'));
        });

        expect(getAdmissionStatus()).toBe(WaitingRoomAdmissionStatus.REJECTED);
    });

    it('should cancel the request against the core when the guest leaves', async () => {
        const rendered = renderPreJoinWaitingRoom();

        await startAdmission(rendered);

        expect(getAdmissionStatus()).toBe(WaitingRoomAdmissionStatus.AWAITING);

        await act(async () => {
            await rendered.result.current.leave();
        });

        expect(meetCoreClient.cancelWaitingRoomJoinRequest).toHaveBeenCalledWith(MEET_LINK_NAME);
        expect(getAdmissionStatus()).toBe(WaitingRoomAdmissionStatus.INACTIVE);
    });

    it('should notify the guest when the join request cannot be created', async () => {
        meetCoreClient.createJoinRequest.mockRejectedValue(new Error('request failed'));

        const rendered = renderPreJoinWaitingRoom();

        expect(getAdmissionStatus()).toBe(WaitingRoomAdmissionStatus.INACTIVE);

        await startAdmission(rendered);

        expect(notifyError).toHaveBeenCalled();
        expect(getAdmissionStatus()).toBe(WaitingRoomAdmissionStatus.INACTIVE);
    });

    it('should cancel a pending request when the guest navigates away', async () => {
        const rendered = renderPreJoinWaitingRoom();

        await startAdmission(rendered);

        expect(meetCoreClient.cancelWaitingRoomJoinRequest).not.toHaveBeenCalled();

        rendered.unmount();

        expect(meetCoreClient.cancelWaitingRoomJoinRequest).toHaveBeenCalledWith(MEET_LINK_NAME);
    });

    it('should not cancel anything on unmount once the guest was admitted', async () => {
        const rendered = renderPreJoinWaitingRoom();

        await startAdmission(rendered);

        await act(async () => {
            rendered.result.current.reset();
        });
        rendered.unmount();

        expect(meetCoreClient.cancelWaitingRoomJoinRequest).not.toHaveBeenCalled();
    });
});
