import { configureStore } from '@reduxjs/toolkit';
import { afterEach, describe, expect, it } from 'vitest';

import { getPersistedCustomBackgroundId, persistCustomBackgroundId } from '../../utils/customBackgroundStorage';
import type { MeetState } from '../rootReducer';
import type { BackgroundState } from './backgroundSlice';
import {
    applyBackgroundEffectAndPersist,
    backgroundReducer,
    clearBackgroundEffectInitialization,
    finishBackgroundEffectInitialization,
    getPersistedBackgroundState,
    initialState,
    reportBackgroundEffectFailure,
    resetBackgroundEffectStatus,
    selectAppliedBackgroundEffect,
    selectBackgroundBlur,
    selectVirtualBackgroundId,
    startBackgroundEffectInitialization,
} from './backgroundSlice';
import type { MeetUserState } from './userSlice';
import { initialState as initialUserState, meetUserReducer } from './userSlice';

const GUEST_NAMESPACE = 'guest.guest-1';

const createStore = (background: Partial<BackgroundState> = {}, meetUser: Partial<MeetUserState> = {}) => {
    const store = configureStore({
        reducer: { ...backgroundReducer, ...meetUserReducer },
        preloadedState: {
            background: { ...initialState, ...background },
            meetUser: { ...initialUserState, ...meetUser },
        },
    });

    return {
        dispatch: store.dispatch as (action: unknown) => void,
        getState: () => store.getState() as MeetState,
        getBackground: () => store.getState().background,
    };
};

describe('backgroundSlice', () => {
    afterEach(() => {
        localStorage.clear();
    });

    describe('applyBackgroundEffectAndPersist', () => {
        it('should restore the picked background in a later session', () => {
            const { dispatch, getBackground } = createStore();

            dispatch(applyBackgroundEffectAndPersist('mountain'));

            expect(getBackground().appliedBackgroundEffect).toBe('mountain');
            expect(getPersistedBackgroundState().appliedBackgroundEffect).toBe('mountain');
        });

        it('should drop the stored background when the effect no longer needs it', () => {
            const { dispatch } = createStore();

            dispatch(applyBackgroundEffectAndPersist('mountain'));
            dispatch(applyBackgroundEffectAndPersist('blur'));

            expect(getPersistedBackgroundState().appliedBackgroundEffect).toBe('blur');
        });

        it('should forget the effect once it is turned off', () => {
            const { dispatch } = createStore();

            dispatch(applyBackgroundEffectAndPersist('blur'));
            dispatch(applyBackgroundEffectAndPersist('none'));

            expect(getPersistedBackgroundState().appliedBackgroundEffect).toBe('none');
        });

        it('should store a custom background under the namespace it belongs to', () => {
            const { dispatch } = createStore({}, { isGuest: true, guestBackgroundId: 'guest-1' });

            dispatch(applyBackgroundEffectAndPersist('custom:node-1'));

            expect(getPersistedCustomBackgroundId(GUEST_NAMESPACE)).toBe('node-1');
            // A custom background is stored by ID rather than as one of the preset effects.
            expect(getPersistedBackgroundState().appliedBackgroundEffect).toBe('none');
        });

        it('should forget the custom background once another effect replaces it', () => {
            const { dispatch } = createStore({}, { isGuest: true, guestBackgroundId: 'guest-1' });

            dispatch(applyBackgroundEffectAndPersist('custom:node-1'));
            dispatch(applyBackgroundEffectAndPersist('blur'));

            expect(getPersistedCustomBackgroundId(GUEST_NAMESPACE)).toBeUndefined();
        });

        it('should keep a stored custom background it did not replace', () => {
            persistCustomBackgroundId(GUEST_NAMESPACE, 'node-1');

            const { dispatch } = createStore({}, { isGuest: true, guestBackgroundId: 'guest-1' });

            dispatch(applyBackgroundEffectAndPersist('blur'));

            // Nothing can apply a custom background with the feature off, so this ID is the user's
            // choice from before it was turned off.
            expect(getPersistedCustomBackgroundId(GUEST_NAMESPACE)).toBe('node-1');
        });
    });

    describe('getPersistedBackgroundState', () => {
        it('should report no effect when nothing was ever picked', () => {
            expect(getPersistedBackgroundState()).toEqual(initialState);
        });

        it('should ignore a stored background that is no longer offered', () => {
            localStorage.setItem('meetVirtualBackground', 'library');

            expect(getPersistedBackgroundState().appliedBackgroundEffect).toBe('none');
        });

        it('should keep the stored background ahead of a stale blur flag', () => {
            localStorage.setItem('meetBackgroundBlur', 'true');
            localStorage.setItem('meetVirtualBackground', 'beach');

            expect(getPersistedBackgroundState().appliedBackgroundEffect).toBe('beach');
        });
    });

    describe('initialization state', () => {
        it('should let the running pipeline clear the effect it is warming up', () => {
            const { dispatch, getBackground } = createStore();

            dispatch(startBackgroundEffectInitialization('blur'));
            const { initializationToken } = getBackground();

            expect(getBackground().initializingBackgroundEffect).toBe('blur');

            dispatch(finishBackgroundEffectInitialization(initializationToken));

            expect(getBackground().initializingBackgroundEffect).toBeNull();
        });

        it('should ignore a pipeline that has already been replaced', () => {
            const { dispatch, getBackground } = createStore();

            dispatch(startBackgroundEffectInitialization('blur'));
            const abandonedToken = getBackground().initializationToken;

            dispatch(startBackgroundEffectInitialization('virtualBackground'));

            dispatch(finishBackgroundEffectInitialization(abandonedToken));
            dispatch(reportBackgroundEffectFailure({ effect: 'blur', token: abandonedToken }));

            // Reporting for the abandoned pipeline would take down the spinner that belongs to the
            // effect which replaced it, or blame it for a failure that is not its own.
            expect(getBackground()).toMatchObject({
                initializingBackgroundEffect: 'virtualBackground',
                failedBackgroundEffect: null,
            });
        });

        it('should apply a failure reported by whoever gave up on the effect', () => {
            const { dispatch, getBackground } = createStore();

            dispatch(startBackgroundEffectInitialization('virtualBackground'));
            dispatch(reportBackgroundEffectFailure({ effect: 'virtualBackground' }));

            expect(getBackground()).toMatchObject({
                initializingBackgroundEffect: null,
                failedBackgroundEffect: 'virtualBackground',
            });
        });

        it('should leave the current initialization alone when cancelling a stale one', () => {
            const { dispatch, getBackground } = createStore();

            dispatch(startBackgroundEffectInitialization('blur'));
            const staleToken = getBackground().initializationToken;

            dispatch(startBackgroundEffectInitialization('virtualBackground'));
            dispatch(clearBackgroundEffectInitialization(staleToken));

            expect(getBackground().initializingBackgroundEffect).toBe('virtualBackground');

            dispatch(clearBackgroundEffectInitialization(undefined));

            expect(getBackground().initializingBackgroundEffect).toBeNull();
        });
    });

    describe('resetBackgroundEffectStatus', () => {
        it('should drop what a pipeline was doing but keep the applied effect', () => {
            const { dispatch, getBackground } = createStore();

            dispatch(applyBackgroundEffectAndPersist('blur'));
            dispatch(startBackgroundEffectInitialization('blur'));
            const token = getBackground().initializationToken;

            dispatch(resetBackgroundEffectStatus());

            expect(getBackground()).toMatchObject({
                appliedBackgroundEffect: 'blur',
                pendingBackgroundEffect: null,
                initializingBackgroundEffect: null,
                failedBackgroundEffect: null,
            });

            // The pipeline left running by the meeting that ended must not report back into the
            // next one.
            dispatch(reportBackgroundEffectFailure({ effect: 'blur', token }));

            expect(getBackground().failedBackgroundEffect).toBeNull();
        });
    });

    describe('selectors', () => {
        it('should report no effect when nothing is applied', () => {
            const { getState } = createStore();

            expect(selectAppliedBackgroundEffect(getState())).toBe('none');
            expect(selectBackgroundBlur(getState())).toBe(false);
            expect(selectVirtualBackgroundId(getState())).toBeNull();
        });

        it('should report blur as blur rather than as a background', () => {
            const { getState } = createStore({ appliedBackgroundEffect: 'blur' });

            expect(selectBackgroundBlur(getState())).toBe(true);
            expect(selectVirtualBackgroundId(getState())).toBeNull();
        });

        it('should report a virtual background as a background rather than as blur', () => {
            const { getState } = createStore({ appliedBackgroundEffect: 'beach' });

            expect(selectBackgroundBlur(getState())).toBe(false);
            expect(selectVirtualBackgroundId(getState())).toBe('beach');
        });
    });
});
