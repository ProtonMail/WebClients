import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook } from '@testing-library/react';

import type { BackgroundEffect } from '@proton/meet/store/slices/backgroundSlice';
import {
    applyBackgroundEffectAndPersist,
    backgroundReducer,
    initialState,
} from '@proton/meet/store/slices/backgroundSlice';
import { meetUserReducer } from '@proton/meet/store/slices/userSlice';
import { ProtonStoreContext } from '@proton/react-redux-store';

import { useBackgroundEffectAnnouncements } from './useBackgroundEffectAnnouncements';

const announce = vi.fn();

vi.mock('../useAnnounce', () => ({ useAnnounce: () => announce }));
vi.mock('@proton/unleash/useFlag', () => ({ useFlag: () => true }));

const renderWithEffect = (initialEffect: BackgroundEffect) => {
    const store = configureStore({
        // The persist thunk reads the background namespace out of the user slice.
        reducer: { ...backgroundReducer, ...meetUserReducer },
        preloadedState: { background: { ...initialState, appliedBackgroundEffect: initialEffect } },
    });

    const { rerender } = renderHook(() => useBackgroundEffectAnnouncements(), {
        wrapper: ({ children }) => (
            <Provider context={ProtonStoreContext} store={store}>
                {children}
            </Provider>
        ),
    });

    const applyEffect = (effect: BackgroundEffect) => {
        act(() => {
            // The thunk is typed against the whole meet state, of which this store only carries
            // the one slice the hook reads.
            (store.dispatch as (action: unknown) => void)(applyBackgroundEffectAndPersist(effect));
        });
        rerender();
    };

    return { applyEffect };
};

describe('useBackgroundEffectAnnouncements', () => {
    beforeEach(() => {
        announce.mockClear();
        localStorage.clear();
    });

    it('should not announce the effect carried over from the prejoin screen', () => {
        renderWithEffect('office');

        expect(announce).not.toHaveBeenCalled();
    });

    it('should announce the virtual background by name', () => {
        const { applyEffect } = renderWithEffect('none');

        applyEffect('office');

        expect(announce).toHaveBeenCalledWith('Blurred office background applied');
    });

    it('should announce blur with a spelled out label', () => {
        const { applyEffect } = renderWithEffect('none');

        applyEffect('blur');

        expect(announce).toHaveBeenCalledWith('Blurred background applied');
    });

    it('should announce going back to no effect', () => {
        const { applyEffect } = renderWithEffect('office');

        applyEffect('none');

        expect(announce).toHaveBeenCalledWith('Background effect turned off');
    });

    it('should not announce a re-render that keeps the same effect', () => {
        const { applyEffect } = renderWithEffect('none');

        applyEffect('office');
        applyEffect('office');

        expect(announce).toHaveBeenCalledTimes(1);
    });
});
