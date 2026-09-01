import type { PayloadAction } from '@reduxjs/toolkit';
import { createSelector, createSlice } from '@reduxjs/toolkit';

import { MAX_BACKGROUNDS_PER_NAMESPACE, getBackgroundNamespace } from '../../utils/customBackgrounds';
import type { MeetState } from '../rootReducer';
import { selectGuestBackgroundId, selectIsGuest, selectUserId } from './userSlice';

/** What the picker renders: a decrypted record, or a placeholder for one still being fetched. */
export interface CustomBackground {
    id: string;
    name: string;
    createdAt: number;
    previewUrl?: string;
    isLoading: boolean;
}

export interface CustomBackgroundsState {
    backgrounds: CustomBackground[];
    isAddingBackground: boolean;
    isDriveUnavailable: boolean;
}

export const initialState: CustomBackgroundsState = {
    backgrounds: [],
    isAddingBackground: false,
    isDriveUnavailable: false,
};

const byNewestFirst = (a: CustomBackground, b: CustomBackground) => b.createdAt - a.createdAt;

const slice = createSlice({
    name: 'customBackgrounds',
    initialState,
    reducers: {
        setCustomBackgrounds: (state, action: PayloadAction<CustomBackground[]>) => {
            state.backgrounds = [...action.payload].sort(byNewestFirst);
        },
        upsertCustomBackground: (state, action: PayloadAction<CustomBackground>) => {
            state.backgrounds = [
                ...state.backgrounds.filter(({ id }) => id !== action.payload.id),
                action.payload,
            ].sort(byNewestFirst);
        },
        removeCustomBackground: (state, action: PayloadAction<string>) => {
            state.backgrounds = state.backgrounds.filter(({ id }) => id !== action.payload);
        },
        /** One action, so a reconciliation does not render the list twice. */
        reconcileCustomBackgrounds: (
            state,
            action: PayloadAction<{ removedIds: string[]; pending: CustomBackground[] }>
        ) => {
            const { removedIds, pending } = action.payload;

            const kept = state.backgrounds.filter(({ id }) => !removedIds.includes(id));
            const added = pending.filter(({ id }) => !kept.some((background) => background.id === id));

            state.backgrounds = [...kept, ...added].sort(byNewestFirst);
        },
        setIsAddingCustomBackground: (state, action: PayloadAction<boolean>) => {
            state.isAddingBackground = action.payload;
        },
        setIsCustomBackgroundDriveUnavailable: (state, action: PayloadAction<boolean>) => {
            state.isDriveUnavailable = action.payload;
        },
        resetCustomBackgrounds: () => initialState,
    },
});

export const selectBackgroundNamespace = createSelector(
    [selectIsGuest, selectUserId, selectGuestBackgroundId],
    (isGuest, userId, guestBackgroundId) =>
        getBackgroundNamespace({ isGuest, userId, guestId: guestBackgroundId ?? undefined })
);

export const selectCustomBackgrounds = (state: MeetState) => state.customBackgrounds.backgrounds;
export const selectIsAddingCustomBackground = (state: MeetState) => state.customBackgrounds.isAddingBackground;
export const selectIsCustomBackgroundDriveUnavailable = (state: MeetState) =>
    state.customBackgrounds.isDriveUnavailable;
export const selectHasReachedCustomBackgroundLimit = (state: MeetState) =>
    state.customBackgrounds.backgrounds.length >= MAX_BACKGROUNDS_PER_NAMESPACE;
/** The feature flag is not part of this; it is checked where the tile renders. */
export const selectCanAddCustomBackground = (state: MeetState) =>
    !state.customBackgrounds.isAddingBackground &&
    !state.customBackgrounds.isDriveUnavailable &&
    !selectHasReachedCustomBackgroundLimit(state);

export const {
    setCustomBackgrounds,
    upsertCustomBackground,
    removeCustomBackground,
    reconcileCustomBackgrounds,
    setIsAddingCustomBackground,
    setIsCustomBackgroundDriveUnavailable,
    resetCustomBackgrounds,
} = slice.actions;

export const customBackgroundsReducer = { customBackgrounds: slice.reducer };
