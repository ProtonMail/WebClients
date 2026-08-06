import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';
import { configureStore } from '@reduxjs/toolkit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { SECOND } from '@proton/shared/lib/constants';

import type { MeetState } from '../rootReducer';
import {
    ADMISSION_TIMEOUT_S,
    WaitingRoomAdmissionStatus,
    cancelAdmission,
    setAdmissionStatus,
    settleAdmission,
    startWaitingRoomAdmissionTimer,
    waitingRoomReducer,
} from './waitingRoomSlice';

const createStore = () => {
    const store = configureStore({
        reducer: {
            ...waitingRoomReducer,
        },
    });
    return store as unknown as Omit<typeof store, 'dispatch' | 'getState'> & {
        dispatch: ThunkDispatch<MeetState, ProtonThunkArguments, UnknownAction>;
        getState: () => MeetState;
    };
};

const createStoreAwaitingAdmission = () => {
    const store = createStore();
    store.dispatch(setAdmissionStatus(WaitingRoomAdmissionStatus.AWAITING));
    return store;
};

describe('waitingRoomSlice', () => {
    describe('settleAdmission', () => {
        it('should settle an admission that is awaiting a decision', () => {
            const store = createStoreAwaitingAdmission();

            store.dispatch(settleAdmission(WaitingRoomAdmissionStatus.ADMITTED));

            expect(store.getState().waitingRoom.admissionStatus).toBe(WaitingRoomAdmissionStatus.ADMITTED);
        });

        it('should settle an admission that is waiting for the host to start', () => {
            const store = createStore();
            store.dispatch(setAdmissionStatus(WaitingRoomAdmissionStatus.HOST_NOT_STARTED));

            store.dispatch(settleAdmission(WaitingRoomAdmissionStatus.REJECTED));

            expect(store.getState().waitingRoom.admissionStatus).toBe(WaitingRoomAdmissionStatus.REJECTED);
        });

        it('should keep a rejection when a late expiry arrives', () => {
            const store = createStoreAwaitingAdmission();
            store.dispatch(settleAdmission(WaitingRoomAdmissionStatus.REJECTED));

            store.dispatch(settleAdmission(WaitingRoomAdmissionStatus.EXPIRED));

            expect(store.getState().waitingRoom.admissionStatus).toBe(WaitingRoomAdmissionStatus.REJECTED);
        });

        it('should keep an admission when a late rejection arrives', () => {
            const store = createStoreAwaitingAdmission();
            store.dispatch(settleAdmission(WaitingRoomAdmissionStatus.ADMITTED));

            store.dispatch(settleAdmission(WaitingRoomAdmissionStatus.REJECTED));

            expect(store.getState().waitingRoom.admissionStatus).toBe(WaitingRoomAdmissionStatus.ADMITTED);
        });

        it('should not settle an admission that the guest already left', () => {
            const store = createStoreAwaitingAdmission();
            store.dispatch(cancelAdmission());

            store.dispatch(settleAdmission(WaitingRoomAdmissionStatus.EXPIRED));

            expect(store.getState().waitingRoom.admissionStatus).toBe(WaitingRoomAdmissionStatus.INACTIVE);
        });

        it('should stop the countdown timer', () => {
            const store = createStoreAwaitingAdmission();
            store.dispatch(startWaitingRoomAdmissionTimer());

            store.dispatch(settleAdmission(WaitingRoomAdmissionStatus.REJECTED));

            expect(store.getState().waitingRoom.admissionTimer).toBeNull();
        });
    });

    describe('cancelAdmission', () => {
        it('should go back to inactive from a terminal status', () => {
            const store = createStoreAwaitingAdmission();
            store.dispatch(settleAdmission(WaitingRoomAdmissionStatus.REJECTED));

            store.dispatch(cancelAdmission());

            expect(store.getState().waitingRoom.admissionStatus).toBe(WaitingRoomAdmissionStatus.INACTIVE);
        });

        it('should stop the countdown timer', () => {
            const store = createStoreAwaitingAdmission();
            store.dispatch(startWaitingRoomAdmissionTimer());

            store.dispatch(cancelAdmission());

            expect(store.getState().waitingRoom.admissionTimer).toBeNull();
        });
    });

    describe('startWaitingRoomAdmissionTimer', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should count down from the admission timeout', () => {
            const store = createStoreAwaitingAdmission();

            store.dispatch(startWaitingRoomAdmissionTimer());

            expect(store.getState().waitingRoom.admissionCountdown).toBe(ADMISSION_TIMEOUT_S);

            vi.advanceTimersByTime(3 * SECOND);

            expect(store.getState().waitingRoom.admissionCountdown).toBe(ADMISSION_TIMEOUT_S - 3);
        });

        it('should expire the admission when the countdown runs out', () => {
            const store = createStoreAwaitingAdmission();

            store.dispatch(startWaitingRoomAdmissionTimer());
            vi.advanceTimersByTime(ADMISSION_TIMEOUT_S * SECOND);

            expect(store.getState().waitingRoom.admissionStatus).toBe(WaitingRoomAdmissionStatus.EXPIRED);
            expect(store.getState().waitingRoom.admissionTimer).toBeNull();
        });

        it('should not expire an admission that was rejected while the countdown was running', () => {
            const store = createStoreAwaitingAdmission();

            store.dispatch(startWaitingRoomAdmissionTimer());
            store.dispatch(settleAdmission(WaitingRoomAdmissionStatus.REJECTED));
            vi.advanceTimersByTime(ADMISSION_TIMEOUT_S * SECOND);

            expect(store.getState().waitingRoom.admissionStatus).toBe(WaitingRoomAdmissionStatus.REJECTED);
        });

        it('should replace a previous timer instead of leaving it running', () => {
            const store = createStoreAwaitingAdmission();

            store.dispatch(startWaitingRoomAdmissionTimer());
            const firstTimer = store.getState().waitingRoom.admissionTimer;

            store.dispatch(startWaitingRoomAdmissionTimer());

            expect(store.getState().waitingRoom.admissionTimer).not.toBe(firstTimer);
            expect(vi.getTimerCount()).toBe(1);
        });
    });
});
