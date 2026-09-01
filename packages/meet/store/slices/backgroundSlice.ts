import type { PayloadAction, ThunkAction, UnknownAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { getItem, removeItem, setItem } from '@proton/shared/lib/helpers/storage';

import { clearPersistedCustomBackgroundId, persistCustomBackgroundId } from '../../utils/customBackgroundStorage';
import type { CustomBackgroundEffect } from '../../utils/customBackgrounds';
import { getCustomBackgroundRecordId } from '../../utils/customBackgrounds';
import type { VirtualBackgroundId } from '../../utils/virtualBackgrounds';
import { isVirtualBackgroundId } from '../../utils/virtualBackgrounds';
import type { MeetState } from '../rootReducer';
import { selectBackgroundNamespace } from './customBackgroundsSlice';

const BACKGROUND_BLUR_KEY = 'meetBackgroundBlur';
const VIRTUAL_BACKGROUND_KEY = 'meetVirtualBackground';

export type BackgroundEffect = 'none' | 'blur' | VirtualBackgroundId | CustomBackgroundEffect;

// Which effect a pipeline is warming up for, so the UI can name it correctly.
export type InitializingBackgroundEffect = 'blur' | 'virtualBackground';

export interface BackgroundState {
    /** The effect currently running on the camera track, and the one persisted across sessions. */
    appliedBackgroundEffect: BackgroundEffect;
    /** The effect the user last picked while a change is still in flight, so the UI can show the selection immediately. `null` when no change is in progress. */
    pendingBackgroundEffect: BackgroundEffect | null;
    /** The kind of effect whose pipeline is warming up, used to show a loading state. `null` when nothing is initializing. */
    initializingBackgroundEffect: InitializingBackgroundEffect | null;
    /** The kind of effect whose initialization failed, used to show an error. `null` when there is no failure to report. */
    failedBackgroundEffect: InitializingBackgroundEffect | null;
    /** Incremented on every initialization attempt so results from superseded attempts can be ignored. */
    initializationToken: number;
}

export const initialState: BackgroundState = {
    appliedBackgroundEffect: 'none',
    pendingBackgroundEffect: null,
    initializingBackgroundEffect: null,
    failedBackgroundEffect: null,
    initializationToken: 0,
};

const getPersistedBackgroundEffect = (): BackgroundEffect => {
    const virtualBackgroundId = getItem(VIRTUAL_BACKGROUND_KEY);

    if (isVirtualBackgroundId(virtualBackgroundId)) {
        return virtualBackgroundId;
    }

    return getItem(BACKGROUND_BLUR_KEY) === 'true' ? 'blur' : 'none';
};

export const getPersistedBackgroundState = (): BackgroundState => ({
    ...initialState,
    appliedBackgroundEffect: getPersistedBackgroundEffect(),
});

const slice = createSlice({
    name: 'background',
    initialState,
    reducers: {
        setAppliedBackgroundEffect: (state, action: PayloadAction<BackgroundEffect>) => {
            state.appliedBackgroundEffect = action.payload;
        },
        setPendingBackgroundEffect: (state, action: PayloadAction<BackgroundEffect | null>) => {
            state.pendingBackgroundEffect = action.payload;
        },
        startBackgroundEffectInitialization: (state, action: PayloadAction<InitializingBackgroundEffect>) => {
            state.initializationToken += 1;
            state.initializingBackgroundEffect = action.payload;
            state.failedBackgroundEffect = null;
        },
        finishBackgroundEffectInitialization: (state, action: PayloadAction<number>) => {
            if (action.payload !== state.initializationToken) {
                return;
            }

            state.initializingBackgroundEffect = null;
        },
        clearBackgroundEffectInitialization: (state, action: PayloadAction<number | undefined>) => {
            if (action.payload !== undefined && action.payload !== state.initializationToken) {
                return;
            }

            state.initializationToken += 1;
            state.initializingBackgroundEffect = null;
            state.failedBackgroundEffect = null;
        },
        reportBackgroundEffectFailure: (
            state,
            action: PayloadAction<{ effect: InitializingBackgroundEffect; token?: number }>
        ) => {
            const { effect, token } = action.payload;

            if (token !== undefined && token !== state.initializationToken) {
                return;
            }

            state.initializationToken += 1;
            state.initializingBackgroundEffect = null;
            state.failedBackgroundEffect = effect;
        },
        resetBackgroundEffectStatus: (state) => {
            state.initializationToken += 1;
            state.pendingBackgroundEffect = null;
            state.initializingBackgroundEffect = null;
            state.failedBackgroundEffect = null;
        },
    },
});

export const {
    setPendingBackgroundEffect,
    startBackgroundEffectInitialization,
    finishBackgroundEffectInitialization,
    clearBackgroundEffectInitialization,
    reportBackgroundEffectFailure,
    resetBackgroundEffectStatus,
} = slice.actions;

export const selectAppliedBackgroundEffect = (state: MeetState) => state.background.appliedBackgroundEffect;
export const selectBackgroundBlur = (state: MeetState) => state.background.appliedBackgroundEffect === 'blur';
export const selectVirtualBackgroundId = (state: MeetState) => {
    const effect = state.background.appliedBackgroundEffect;

    return isVirtualBackgroundId(effect) ? effect : null;
};
export const selectCustomBackgroundId = (state: MeetState) =>
    getCustomBackgroundRecordId(state.background.appliedBackgroundEffect);
export const selectPendingBackgroundEffect = (state: MeetState) => state.background.pendingBackgroundEffect;
export const selectInitializingBackgroundEffect = (state: MeetState) => state.background.initializingBackgroundEffect;
export const selectFailedBackgroundEffect = (state: MeetState) => state.background.failedBackgroundEffect;
export const selectBackgroundEffectInitializationToken = (state: MeetState) => state.background.initializationToken;

export const applyBackgroundEffectAndPersist =
    (effect: BackgroundEffect): ThunkAction<void, MeetState, ProtonThunkArguments, UnknownAction> =>
    (dispatch, getState) => {
        const replacedEffect = selectAppliedBackgroundEffect(getState());

        dispatch(slice.actions.setAppliedBackgroundEffect(effect));

        setItem(BACKGROUND_BLUR_KEY, (effect === 'blur').toString());

        if (isVirtualBackgroundId(effect)) {
            setItem(VIRTUAL_BACKGROUND_KEY, effect);
        } else {
            removeItem(VIRTUAL_BACKGROUND_KEY);
        }

        const namespace = selectBackgroundNamespace(getState());
        const customBackgroundId = getCustomBackgroundRecordId(effect);

        if (customBackgroundId) {
            persistCustomBackgroundId(namespace, customBackgroundId);
            return;
        }

        if (getCustomBackgroundRecordId(replacedEffect)) {
            clearPersistedCustomBackgroundId(namespace);
        }
    };

export const backgroundReducer = { background: slice.reducer };
