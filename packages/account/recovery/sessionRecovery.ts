import { type ListenerEffectAPI, type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { type UserState, selectUser } from '@proton/account/user';
import type { ProtonDispatch, ProtonThunkArguments, SharedStartListening } from '@proton/redux-shared-store-types';
import { getItem, removeItem, setItem } from '@proton/shared/lib/helpers/storage';
import { SessionRecoveryState, type UserModel } from '@proton/shared/lib/interfaces';

export type SessionRecoverySliceState = {
    gracePeriodConfirmed: boolean;
    canceledStateDismissed: boolean;
};

const getDefaultStorage = () => {
    const getKeyValueStorage = (keyPrefix: string) => {
        const getKeyFromId = (id: string) => `${keyPrefix}:${id}`;
        return {
            get: (id: string): boolean => {
                return getItem(getKeyFromId(id)) === 'true';
            },
            set: (id: string, value: boolean): void => {
                const key = getKeyFromId(id);
                if (value) {
                    setItem(key, 'true');
                } else {
                    removeItem(key);
                }
            },
        };
    };

    // If the grace period banner (state) has been confirmed by the user.
    const gracePeriodConfirmedStorage = getKeyValueStorage(`sr--confirmed`);
    // If the canceled state banner (state) has been dismissed by the user.
    const canceledStateDismissedStorage = getKeyValueStorage(`sr--cancelled`);

    return {
        get: (id: string) => {
            return {
                gracePeriodConfirmed: gracePeriodConfirmedStorage.get(id),
                canceledStateDismissed: canceledStateDismissedStorage.get(id),
            };
        },
        set: (id: string, data: SessionRecoverySliceState) => {
            gracePeriodConfirmedStorage.set(id, data.gracePeriodConfirmed);
            canceledStateDismissedStorage.set(id, data.canceledStateDismissed);
        },
    };
};

export type SessionRecoverySliceReducerState = {
    sessionRecovery: SessionRecoverySliceState;
};

export const sessionRecoverySlice = createSlice({
    name: 'sessionRecovery',
    initialState: {
        gracePeriodConfirmed: false,
        canceledStateDismissed: false,
    },
    reducers: {
        setState: (state, action: PayloadAction<Partial<SessionRecoverySliceState>>) => {
            state.gracePeriodConfirmed = action.payload.gracePeriodConfirmed ?? state.gracePeriodConfirmed;
            state.canceledStateDismissed = action.payload.canceledStateDismissed ?? state.canceledStateDismissed;
        },
    },
});

type RequiredState = SessionRecoverySliceReducerState & UserState;

export const sessionRecoveryListener = (
    startListening: SharedStartListening<RequiredState>,
    storage = getDefaultStorage()
) => {
    const getAccountRecoveryStateFromUser = (user: UserModel | undefined) => {
        return user?.AccountRecovery?.State;
    };

    const syncState = (listenerApi: ListenerEffectAPI<RequiredState, ProtonDispatch<any>, ProtonThunkArguments>) => {
        const state = listenerApi.getState();
        const user = selectUser(state)?.value;
        const userID = user?.ID;
        const sessionRecoveryState = getAccountRecoveryStateFromUser(user);
        if (!userID || sessionRecoveryState === undefined) {
            return;
        }
        listenerApi.dispatch(
            sessionRecoverySlice.actions.setState({
                // If previously confirmed, ensure that the user is still in the grace period recovery state.
                gracePeriodConfirmed:
                    state.sessionRecovery.gracePeriodConfirmed &&
                    sessionRecoveryState === SessionRecoveryState.GRACE_PERIOD,
                // If previously dismissed, ensure that the user is still in the canceled recovery state.
                canceledStateDismissed:
                    state.sessionRecovery.canceledStateDismissed &&
                    sessionRecoveryState === SessionRecoveryState.CANCELLED,
            })
        );
    };

    // Delay syncing to storage until the state has been bootstrapped.
    let syncToStorage = false;

    // First time on init, as soon as a user is set to the store. Triggered once and then this listener unsubscribes.
    // Sets initial state to values from storage, and synchronizes state to the user.
    startListening({
        predicate: (_, currentState) => {
            return Boolean(currentState.user.value?.ID);
        },
        effect: (_, listenerApi) => {
            const userID = selectUser(listenerApi.getState())?.value?.ID;
            if (!userID) {
                return;
            }
            listenerApi.unsubscribe();
            listenerApi.dispatch(sessionRecoverySlice.actions.setState(storage.get(userID)));
            syncToStorage = true;
            syncState(listenerApi);
        },
    });

    // Any time the account recovery state changes on the user model. Synchronize the state to the reducer.
    startListening({
        predicate: (_, currentState, previousState) => {
            const currentUser = currentState.user.value;
            const previousUser = previousState.user.value;
            const currentUserId = currentUser?.ID;
            const previousUserId = previousUser?.ID;
            return (
                Boolean(currentUserId) &&
                Boolean(previousUserId) &&
                currentUserId === previousUserId &&
                getAccountRecoveryStateFromUser(currentUser) !== getAccountRecoveryStateFromUser(previousUser)
            );
        },
        effect: (_, listenerApi) => {
            syncState(listenerApi);
        },
    });

    // Persist the state to storage.
    startListening({
        predicate: (_, currentState, previousState) => {
            return syncToStorage && currentState.sessionRecovery !== previousState.sessionRecovery;
        },
        effect: (_, listenerApi) => {
            const state = listenerApi.getState();
            const userID = selectUser(state)?.value?.ID;
            if (!userID) {
                return;
            }
            storage.set(userID, state.sessionRecovery);
        },
    });
};
