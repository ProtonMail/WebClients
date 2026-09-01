import { configureStore } from '@reduxjs/toolkit';
import { describe, expect, it } from 'vitest';

import { MAX_BACKGROUNDS_PER_NAMESPACE } from '../../utils/customBackgrounds';
import type { MeetState } from '../rootReducer';
import type { CustomBackground, CustomBackgroundsState } from './customBackgroundsSlice';
import {
    customBackgroundsReducer,
    initialState,
    reconcileCustomBackgrounds,
    removeCustomBackground,
    resetCustomBackgrounds,
    selectBackgroundNamespace,
    selectCanAddCustomBackground,
    selectCustomBackgrounds,
    selectHasReachedCustomBackgroundLimit,
    setCustomBackgrounds,
    setIsAddingCustomBackground,
    setIsCustomBackgroundDriveUnavailable,
    upsertCustomBackground,
} from './customBackgroundsSlice';
import type { MeetUserState } from './userSlice';
import { initialState as initialUserState, meetUserReducer } from './userSlice';

const background = (id: string, createdAt: number, isLoading = false): CustomBackground => ({
    id,
    name: `${id}.png`,
    createdAt,
    isLoading,
});

const createStore = (
    customBackgrounds: Partial<CustomBackgroundsState> = {},
    meetUser: Partial<MeetUserState> = {}
) => {
    const store = configureStore({
        reducer: { ...customBackgroundsReducer, ...meetUserReducer },
        preloadedState: {
            customBackgrounds: { ...initialState, ...customBackgrounds },
            meetUser: { ...initialUserState, ...meetUser },
        },
    });

    return {
        dispatch: store.dispatch as (action: unknown) => void,
        getState: () => store.getState() as MeetState,
        getIds: () => store.getState().customBackgrounds.backgrounds.map(({ id }) => id),
    };
};

describe('customBackgroundsSlice', () => {
    it('should render the newest background first whichever order it arrives in', () => {
        const { dispatch, getIds } = createStore();

        dispatch(setCustomBackgrounds([background('older', 1), background('newest', 3)]));
        dispatch(upsertCustomBackground(background('middle', 2)));

        expect(getIds()).toEqual(['newest', 'middle', 'older']);
    });

    it('should replace the pending tile with the background that landed', () => {
        const { dispatch, getState } = createStore({ backgrounds: [background('node-1', 1, true)] });

        dispatch(upsertCustomBackground({ ...background('node-1', 1), previewUrl: 'blob:node-1' }));

        expect(selectCustomBackgrounds(getState())).toEqual([
            { id: 'node-1', name: 'node-1.png', createdAt: 1, previewUrl: 'blob:node-1', isLoading: false },
        ]);
    });

    it('should remove a single background and leave the rest alone', () => {
        const { dispatch, getIds } = createStore({
            backgrounds: [background('node-2', 2), background('node-1', 1)],
        });

        dispatch(removeCustomBackground('node-1'));

        expect(getIds()).toEqual(['node-2']);
    });

    describe('reconcileCustomBackgrounds', () => {
        it('should drop what Drive no longer has and hold a place for what it does', () => {
            const { dispatch, getState } = createStore({
                backgrounds: [background('trashed', 2), background('kept', 1)],
            });

            dispatch(
                reconcileCustomBackgrounds({
                    removedIds: ['trashed'],
                    pending: [background('elsewhere', 3, true)],
                })
            );

            expect(selectCustomBackgrounds(getState())).toEqual([
                { id: 'elsewhere', name: 'elsewhere.png', createdAt: 3, isLoading: true },
                { id: 'kept', name: 'kept.png', createdAt: 1, isLoading: false },
            ]);
        });

        it('should not put a placeholder over a background that is already drawn', () => {
            const { dispatch, getState } = createStore({ backgrounds: [background('node-1', 1)] });

            dispatch(reconcileCustomBackgrounds({ removedIds: [], pending: [background('node-1', 1, true)] }));

            // Its thumbnail is in hand, so replacing it with a placeholder would blank the tile.
            expect(selectCustomBackgrounds(getState())).toEqual([
                { id: 'node-1', name: 'node-1.png', createdAt: 1, isLoading: false },
            ]);
        });

        it('should still fetch a background whose revision was dropped', () => {
            const { dispatch, getState } = createStore({ backgrounds: [background('node-1', 1)] });

            dispatch(reconcileCustomBackgrounds({ removedIds: ['node-1'], pending: [background('node-1', 1, true)] }));

            expect(selectCustomBackgrounds(getState())).toEqual([
                { id: 'node-1', name: 'node-1.png', createdAt: 1, isLoading: true },
            ]);
        });
    });

    describe('selectCanAddCustomBackground', () => {
        it('should allow adding a background by default', () => {
            const { getState } = createStore();

            expect(selectCanAddCustomBackground(getState())).toBe(true);
        });

        it('should not allow a second upload while one is in flight', () => {
            const { dispatch, getState } = createStore();

            dispatch(setIsAddingCustomBackground(true));

            expect(selectCanAddCustomBackground(getState())).toBe(false);
        });

        it('should not allow uploading against a folder that could not be read', () => {
            const { dispatch, getState } = createStore();

            dispatch(setIsCustomBackgroundDriveUnavailable(true));

            expect(selectCanAddCustomBackground(getState())).toBe(false);
        });

        it('should not allow adding one past the limit', () => {
            const { getState } = createStore({
                backgrounds: Array.from({ length: MAX_BACKGROUNDS_PER_NAMESPACE }, (_, index) =>
                    background(`node-${index}`, index)
                ),
            });

            expect(selectHasReachedCustomBackgroundLimit(getState())).toBe(true);
            expect(selectCanAddCustomBackground(getState())).toBe(false);
        });
    });

    describe('selectBackgroundNamespace', () => {
        it('should scope a guest to the ID minted for this browser', () => {
            const { getState } = createStore({}, { isGuest: true, guestBackgroundId: 'guest-1' });

            expect(selectBackgroundNamespace(getState())).toBe('guest.guest-1');
        });

        it('should have no namespace for a guest that has never cached anything', () => {
            const { getState } = createStore({}, { isGuest: true, guestBackgroundId: null });

            expect(selectBackgroundNamespace(getState())).toBeUndefined();
        });
    });

    it('should forget everything once the preview URLs are revoked', () => {
        const { dispatch, getState } = createStore({
            backgrounds: [{ ...background('node-1', 1), previewUrl: 'blob:node-1' }],
            isDriveUnavailable: true,
        });

        dispatch(resetCustomBackgrounds());

        expect(getState().customBackgrounds).toEqual(initialState);
    });
});
