import { type PayloadAction, type UnknownAction, createSlice } from '@reduxjs/toolkit';
import type { ThunkAction } from 'redux-thunk';

import { bootstrapEvent } from '@proton/account/bootstrap/action';
import { type UserState, selectUser } from '@proton/account/user';
import type { ProtonThunkArguments, SharedStartListening } from '@proton/redux-shared-store-types';
import { getItem, removeItem, setItem } from '@proton/shared/lib/helpers/storage';
import { SessionRecoveryState } from '@proton/shared/lib/interfaces';

const storage = (() => {
    const confirmedKey = `sr--confirmed`;
    const cancelledKey = `sr--cancelled`;
    return {
        confirmed: {
            get: (id: string) => {
                return getItem(`${confirmedKey}:${id}`) === 'true';
            },
            set: (id: string, value: boolean) => {
                setItem(`${confirmedKey}:${id}`, `${value}`);
            },
            remove: (id: string) => {
                removeItem(`${confirmedKey}:${id}`);
            },
        },
        cancelled: {
            get: (id: string) => {
                return getItem(`${cancelledKey}:${id}`) === 'true';
            },
            set: (id: string, value: boolean) => {
                setItem(`${cancelledKey}:${id}`, `${value}`);
            },
            remove: (id: string) => {
                removeItem(`${cancelledKey}:${id}`);
            },
        },
    };
})();

export type SessionRecoverySliceState = {
    confirmed: boolean;
    dismissed: boolean;
};

export type SessionRecoverySliceReducerState = {
    sessionRecovery: SessionRecoverySliceState;
};

export const sessionRecoverySlice = createSlice({
    name: 'sessionRecovery',
    initialState: {
        confirmed: false,
        dismissed: false,
    },
    reducers: {
        confirmSessionRecoveryInProgress: (state, action: PayloadAction<boolean>) => {
            state.confirmed = action.payload;
        },
        dismissSessionRecoveryCancelled: (state, action: PayloadAction<boolean>) => {
            state.dismissed = action.payload;
        },
    },
});

type RequiredState = SessionRecoverySliceReducerState & UserState;
export const confirmSessionRecoveryInProgress = (): ThunkAction<
    void,
    RequiredState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return (dispatch, getState) => {
        const user = selectUser(getState())?.value;
        if (!user) {
            return;
        }
        const newValue = true;
        dispatch(sessionRecoverySlice.actions.confirmSessionRecoveryInProgress(newValue));
        storage.confirmed.set(user.ID, newValue);
    };
};

export const dismissSessionRecoveryCancelled = (): ThunkAction<
    void,
    RequiredState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return (dispatch, getState) => {
        const user = selectUser(getState())?.value;
        if (!user) {
            return;
        }
        const newValue = true;
        dispatch(sessionRecoverySlice.actions.dismissSessionRecoveryCancelled(newValue));
        storage.cancelled.set(user.ID, newValue);
    };
};

export const sessionRecoveryListener = (startListening: SharedStartListening<RequiredState>) => {
    startListening({
        actionCreator: bootstrapEvent,
        effect: async (action, listenerApi) => {
            const user = selectUser(listenerApi.getState())?.value;
            if (!user) {
                return;
            }
            const confirmed = storage.confirmed.get(user.ID);
            const dismissed = storage.cancelled.get(user.ID);
            listenerApi.dispatch(sessionRecoverySlice.actions.dismissSessionRecoveryCancelled(dismissed));
            listenerApi.dispatch(sessionRecoverySlice.actions.confirmSessionRecoveryInProgress(confirmed));
        },
    });

    const getAccountRecoveryStateFromUser = (state: RequiredState) => {
        return state?.user?.value?.AccountRecovery?.State;
    };

    startListening({
        predicate: (_, currentState, previousState) => {
            return getAccountRecoveryStateFromUser(currentState) !== getAccountRecoveryStateFromUser(previousState);
        },
        effect: (_, listenerApi) => {
            const state = listenerApi.getState();
            const user = selectUser(state)?.value;
            if (!user) {
                return;
            }
            const sessionRecoveryState = getAccountRecoveryStateFromUser(state);
            if (state.sessionRecovery.dismissed && sessionRecoveryState !== SessionRecoveryState.CANCELLED) {
                listenerApi.dispatch(sessionRecoverySlice.actions.dismissSessionRecoveryCancelled(false));
                storage.cancelled.remove(user.ID);
            }
            if (state.sessionRecovery.confirmed && sessionRecoveryState !== SessionRecoveryState.GRACE_PERIOD) {
                listenerApi.dispatch(sessionRecoverySlice.actions.confirmSessionRecoveryInProgress(false));
                // Clear up local storage when not in grace period
                storage.confirmed.remove(user.ID);
            }
        },
    });
};
