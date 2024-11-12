import { useCallback } from 'react';

import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import { baseUseDispatch, baseUseSelector } from '@proton/react-redux-store';
import type { UserSettings } from '@proton/shared/lib/interfaces';

const name = 'welcomeFlags' as const;

export interface WelcomeFlagsState {
    hasGenericWelcomeStep: boolean;
    isWelcomeFlow: boolean;
    isDone: boolean;
    isReplay: boolean;
}

const initialState: WelcomeFlagsState = {
    hasGenericWelcomeStep: false,
    isWelcomeFlow: false,
    isDone: true,
    isReplay: false,
};

export const getWelcomeFlagsValue = (userSettings: Pick<UserSettings, 'WelcomeFlag' | 'Flags'>): WelcomeFlagsState => {
    const hasProductWelcomeStep = userSettings.WelcomeFlag === 0;
    const hasGenericWelcomeStep = userSettings.Flags.Welcomed === 0;
    const isWelcomeFlow = hasGenericWelcomeStep || hasProductWelcomeStep;
    return {
        hasGenericWelcomeStep,
        isWelcomeFlow,
        isDone: !isWelcomeFlow,
        isReplay: false,
    };
};

const slice = createSlice({
    name,
    initialState,
    reducers: {
        initial: (state, action: PayloadAction<Pick<UserSettings, 'WelcomeFlag' | 'Flags'>>) => {
            return getWelcomeFlagsValue(action.payload);
        },
        done: (state) => {
            return { ...state, isDone: true };
        },
        replayed: (state) => {
            return { ...state, isReplay: false };
        },
        replaying: (state) => {
            return { ...state, isReplay: true };
        },
    },
});

export const welcomeFlagsReducer = { [name]: slice.reducer };
export const welcomeFlagsActions = slice.actions;
export const selectWelcomeFlags = (state: { [name]: WelcomeFlagsState }) => state[name];

interface WelcomeFlagsOutput {
    endReplay: () => void;
    setDone: () => void;
    startReplay: () => void;
    welcomeFlags: WelcomeFlagsState;
}

export const useWelcomeFlags = (): WelcomeFlagsOutput => {
    const value = baseUseSelector(selectWelcomeFlags);
    const dispatch = baseUseDispatch();
    const setDone = useCallback(() => {
        dispatch(slice.actions.done());
    }, []);
    const endReplay = useCallback(() => {
        dispatch(slice.actions.replayed());
    }, []);
    const startReplay = useCallback(() => {
        dispatch(slice.actions.replaying());
    }, []);

    return {
        endReplay,
        setDone,
        startReplay,
        welcomeFlags: value,
    };
};
