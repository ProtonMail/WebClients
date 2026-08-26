import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { BackgroundEffect } from '@proton/meet/store/slices/backgroundSlice';
import { backgroundReducer, initialState } from '@proton/meet/store/slices/backgroundSlice';
import { ProtonStoreContext } from '@proton/react-redux-store';

import { useAppliedBackgroundEffect } from './useAppliedBackgroundEffect';

const unleashMocks = vi.hoisted(() => ({ useFlag: vi.fn(() => true) }));
vi.mock('@proton/unleash/useFlag', () => unleashMocks);

const renderAppliedBackgroundEffect = (appliedBackgroundEffect: BackgroundEffect) => {
    const store = configureStore({
        reducer: { ...backgroundReducer },
        preloadedState: { background: { ...initialState, appliedBackgroundEffect } },
    });

    return renderHook(() => useAppliedBackgroundEffect(), {
        wrapper: ({ children }) => (
            <Provider context={ProtonStoreContext} store={store}>
                {children}
            </Provider>
        ),
    });
};

describe('useAppliedBackgroundEffect', () => {
    it('should report the applied virtual background', () => {
        const { result } = renderAppliedBackgroundEffect('office');

        expect(result.current).toBe('office');
    });

    it('should report blur', () => {
        const { result } = renderAppliedBackgroundEffect('blur');

        expect(result.current).toBe('blur');
    });

    describe('when virtual backgrounds are turned off', () => {
        it('should hide a stored virtual background from the very first render', () => {
            unleashMocks.useFlag.mockReturnValue(false);

            const { result } = renderAppliedBackgroundEffect('beach');

            // A render that still reports the background would apply it to the camera preview and
            // announce it, leaving the user with an effect the feature no longer lets them change.
            expect(result.current).toBe('none');
        });

        it('should keep reporting blur, which the flag does not cover', () => {
            unleashMocks.useFlag.mockReturnValue(false);

            const { result } = renderAppliedBackgroundEffect('blur');

            expect(result.current).toBe('blur');
        });
    });
});
