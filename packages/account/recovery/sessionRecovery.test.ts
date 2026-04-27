import { combineReducers } from '@reduxjs/toolkit';
import { waitFor } from '@testing-library/react';

import { getServerEvent } from '@proton/account/test/getServerEvent';
import { userFulfilled, userReducer } from '@proton/account/user';
import { getTestStore } from '@proton/redux-shared-store/test';
import { SessionRecoveryState, type UserModel } from '@proton/shared/lib/interfaces';

import { sessionRecoveryListener, sessionRecoverySlice } from './sessionRecovery';

const reducer = combineReducers({
    ...userReducer,
    sessionRecovery: sessionRecoverySlice.reducer,
});

const getUser = (recoveryState?: SessionRecoveryState): UserModel =>
    ({
        ID: 'user-id',
        AccountRecovery: recoveryState !== undefined ? { State: recoveryState } : undefined,
    }) as UserModel;

const getMockStorage = (initial: { gracePeriodConfirmed?: boolean; canceledStateDismissed?: boolean } = {}) => ({
    get: jest.fn().mockReturnValue({
        gracePeriodConfirmed: initial.gracePeriodConfirmed ?? false,
        canceledStateDismissed: initial.canceledStateDismissed ?? false,
    }),
    set: jest.fn(),
});

const setup = (
    preloadedState?: Partial<ReturnType<typeof reducer>>,
    storageInitial?: { gracePeriodConfirmed?: boolean; canceledStateDismissed?: boolean }
) => {
    const mockStorage = getMockStorage(storageInitial);
    const { store, startListening } = getTestStore({
        preloadedState,
        reducer,
        extraThunkArguments: {} as any,
    });
    sessionRecoveryListener(startListening, mockStorage);
    return { store, mockStorage };
};

describe('sessionRecoveryListener', () => {
    describe('init listener', () => {
        it('does not sync before a user is in the store', () => {
            const { mockStorage } = setup();
            expect(mockStorage.get).not.toHaveBeenCalled();
            expect(mockStorage.set).not.toHaveBeenCalled();
        });

        it('does not sync when user has no AccountRecovery state', async () => {
            const { store, mockStorage } = setup();
            store.dispatch(userFulfilled(getUser(undefined)));
            await new Promise((resolve) => setTimeout(resolve, 0));
            expect(mockStorage.set).not.toHaveBeenCalled();
        });

        it('loads gracePeriodConfirmed and dismissed from storage on first user', async () => {
            const { store, mockStorage } = setup(undefined, {
                gracePeriodConfirmed: true,
                canceledStateDismissed: true,
            });

            store.dispatch(userFulfilled(getUser(SessionRecoveryState.GRACE_PERIOD)));

            await waitFor(() => expect(mockStorage.get).toHaveBeenCalledWith('user-id'));
        });

        it('keeps gracePeriodConfirmed=true when loaded from storage and state is GRACE_PERIOD', async () => {
            const { store } = setup(undefined, { gracePeriodConfirmed: true });

            store.dispatch(userFulfilled(getUser(SessionRecoveryState.GRACE_PERIOD)));

            await waitFor(() => expect(store.getState().sessionRecovery.gracePeriodConfirmed).toBe(true));
            expect(store.getState().sessionRecovery.canceledStateDismissed).toBe(false);
        });

        it('resets gracePeriodConfirmed=false when loaded from storage but state is not GRACE_PERIOD', async () => {
            const { store } = setup(undefined, { gracePeriodConfirmed: true });

            store.dispatch(userFulfilled(getUser(SessionRecoveryState.CANCELLED)));

            await waitFor(() => expect(store.getState().sessionRecovery.gracePeriodConfirmed).toBe(false));
        });

        it('keeps canceledStateDismissed=true when loaded from storage and state is CANCELLED', async () => {
            const { store } = setup(undefined, { canceledStateDismissed: true });

            store.dispatch(userFulfilled(getUser(SessionRecoveryState.CANCELLED)));

            await waitFor(() => expect(store.getState().sessionRecovery.canceledStateDismissed).toBe(true));
            expect(store.getState().sessionRecovery.gracePeriodConfirmed).toBe(false);
        });

        it('resets canceledStateDismissed=false when loaded from storage but state is not CANCELLED', async () => {
            const { store } = setup(undefined, { canceledStateDismissed: true });

            store.dispatch(userFulfilled(getUser(SessionRecoveryState.GRACE_PERIOD)));

            await waitFor(() => expect(store.getState().sessionRecovery.canceledStateDismissed).toBe(false));
        });

        it('unsubscribes after the first user — subsequent dispatches do not re-read storage', async () => {
            const { store, mockStorage } = setup();

            store.dispatch(userFulfilled(getUser(SessionRecoveryState.GRACE_PERIOD)));
            await waitFor(() => expect(mockStorage.get).toHaveBeenCalledTimes(1));

            mockStorage.get.mockClear();

            store.dispatch(userFulfilled(getUser(SessionRecoveryState.GRACE_PERIOD)));
            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(mockStorage.get).not.toHaveBeenCalled();
        });
    });

    describe('state change listener', () => {
        const setupWithInitialUser = async (
            initialState: SessionRecoveryState,
            storageInitial?: {
                gracePeriodConfirmed?: boolean;
                canceledStateDismissed?: boolean;
            }
        ) => {
            const result = setup(undefined, storageInitial);
            result.store.dispatch(userFulfilled(getUser(initialState)));
            await waitFor(() => expect(result.mockStorage.get).toHaveBeenCalled());
            result.mockStorage.set.mockClear();
            return result;
        };

        it('resets gracePeriodConfirmed when AccountRecovery.State changes out of GRACE_PERIOD', async () => {
            const { store } = await setupWithInitialUser(SessionRecoveryState.GRACE_PERIOD, {
                gracePeriodConfirmed: true,
            });

            store.dispatch(getServerEvent({ User: getUser(SessionRecoveryState.CANCELLED) }));

            await waitFor(() => expect(store.getState().sessionRecovery.gracePeriodConfirmed).toBe(false));
        });

        it('resets canceledStateDismissed when AccountRecovery.State changes out of CANCELLED', async () => {
            const { store } = await setupWithInitialUser(SessionRecoveryState.CANCELLED, {
                canceledStateDismissed: true,
            });

            store.dispatch(getServerEvent({ User: getUser(SessionRecoveryState.GRACE_PERIOD) }));

            await waitFor(() => expect(store.getState().sessionRecovery.canceledStateDismissed).toBe(false));
        });

        it('does not fire when user is updated but AccountRecovery.State stays the same', async () => {
            const { store, mockStorage } = await setupWithInitialUser(SessionRecoveryState.GRACE_PERIOD);

            store.dispatch(
                getServerEvent({ User: { ...getUser(SessionRecoveryState.GRACE_PERIOD), Name: 'updated' } })
            );
            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(mockStorage.set).not.toHaveBeenCalled();
        });
    });

    describe('storage persistence', () => {
        const setupWithInitialUser = async (
            initialState: SessionRecoveryState,
            storageInitial?: {
                gracePeriodConfirmed?: boolean;
                canceledStateDismissed?: boolean;
            }
        ) => {
            const result = setup(undefined, storageInitial);
            result.store.dispatch(userFulfilled(getUser(initialState)));
            await waitFor(() => expect(result.mockStorage.get).toHaveBeenCalled());
            return result;
        };

        it('persists to storage when reconciliation changes the state', async () => {
            // Storage has gracePeriodConfirmed=true, but user arrives with CANCELLED — must be reset.
            const { mockStorage } = await setupWithInitialUser(SessionRecoveryState.CANCELLED, {
                gracePeriodConfirmed: true,
            });

            await waitFor(() =>
                expect(mockStorage.set).toHaveBeenCalledWith('user-id', {
                    gracePeriodConfirmed: false,
                    canceledStateDismissed: false,
                })
            );
        });

        it('does not persist to storage when reconciliation leaves state unchanged', async () => {
            // Storage has gracePeriodConfirmed=true and user is in GRACE_PERIOD — no reset needed.
            const { mockStorage } = await setupWithInitialUser(SessionRecoveryState.GRACE_PERIOD, {
                gracePeriodConfirmed: true,
            });

            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(mockStorage.set).not.toHaveBeenCalled();
        });

        it('persists to storage when AccountRecovery.State change produces new values', async () => {
            // gracePeriodConfirmed=true in GRACE_PERIOD, then transition to CANCELLED resets it.
            const { store, mockStorage } = await setupWithInitialUser(SessionRecoveryState.GRACE_PERIOD, {
                gracePeriodConfirmed: true,
            });

            store.dispatch(getServerEvent({ User: getUser(SessionRecoveryState.CANCELLED) }));

            await waitFor(() =>
                expect(mockStorage.set).toHaveBeenCalledWith('user-id', {
                    gracePeriodConfirmed: false,
                    canceledStateDismissed: false,
                })
            );
        });

        it('does not persist to storage when AccountRecovery.State change leaves values unchanged', async () => {
            // gracePeriodConfirmed=false, canceledStateDismissed=false in GRACE_PERIOD, then transition to CANCELLED.
            // Reconciliation: gracePeriodConfirmed stays false, canceledStateDismissed stays false — nothing changes.
            const { store, mockStorage } = await setupWithInitialUser(SessionRecoveryState.GRACE_PERIOD);

            store.dispatch(getServerEvent({ User: getUser(SessionRecoveryState.CANCELLED) }));

            await new Promise((resolve) => setTimeout(resolve, 0));
            expect(mockStorage.set).not.toHaveBeenCalled();
        });
    });
});
