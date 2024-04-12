import { useCallback } from 'react';

import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { baseUseDispatch, baseUseSelector } from '@proton/redux-shared-store/sharedContext';
import { UserSettings } from '@proton/shared/lib/interfaces';

const name = 'welcomeFlags' as const;

export interface WelcomeFlagsState {
    hasGenericWelcomeStep: boolean;
    isWelcomeFlow: boolean;
    isDone: boolean;
}

const initialState: WelcomeFlagsState = {
    hasGenericWelcomeStep: false,
    isWelcomeFlow: false,
    isDone: true,
};

export const getWelcomeFlagsValue = (userSettings: Pick<UserSettings, 'WelcomeFlag' | 'Flags'>): WelcomeFlagsState => {
    const hasProductWelcomeStep = userSettings.WelcomeFlag === 0;
    const hasGenericWelcomeStep = userSettings.Flags.Welcomed === 0;
    const isWelcomeFlow = hasGenericWelcomeStep || hasProductWelcomeStep;
    return {
        hasGenericWelcomeStep,
        isWelcomeFlow,
        isDone: !isWelcomeFlow,
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
    },
});

export const welcomeFlagsReducer = { [name]: slice.reducer };
export const welcomeFlagsActions = slice.actions;
export const selectWelcomeFlags = (state: { [name]: WelcomeFlagsState }) => state[name];

export const useWelcomeFlags = (): [WelcomeFlagsState, () => void] => {
    const value = baseUseSelector(selectWelcomeFlags);
    const dispatch = baseUseDispatch();
    const setDone = useCallback(() => {
        dispatch(slice.actions.done());
    }, []);
    return [value, setDone];
};
