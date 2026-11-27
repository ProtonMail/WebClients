import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { renderHook } from '@testing-library/react';

import { initialState, settingsReducer } from '@proton/meet/store/slices/settings';
import { ProtonStoreContext } from '@proton/react-redux-store/ProtonStoreContext';

import { useMirrorSelfView } from './useMirrorSelfView';

const enabledFlags = vi.hoisted(() => ({ current: [] as string[] }));

vi.mock('@proton/unleash/useFlag', () => ({
    useFlag: (flag: string) => enabledFlags.current.includes(flag),
}));

const renderMirrorSelfView = ({ mirrorSelfView }: { mirrorSelfView: boolean }) => {
    const store = configureStore({
        reducer: settingsReducer,
        preloadedState: { meetSettings: { ...initialState, mirrorSelfView } },
    });

    return renderHook(() => useMirrorSelfView(), {
        wrapper: ({ children }: { children: React.ReactNode }) => (
            <Provider context={ProtonStoreContext} store={store}>
                {children}
            </Provider>
        ),
    }).result.current;
};

describe('useMirrorSelfView', () => {
    afterEach(() => {
        enabledFlags.current = [];
    });

    it('should mirror regardless of the saved choice while the feature is off', () => {
        expect(renderMirrorSelfView({ mirrorSelfView: false })).toBe(true);
    });

    it('should follow the saved choice while the feature is on', () => {
        enabledFlags.current = ['MeetSelfViewMirrorToggle'];

        expect(renderMirrorSelfView({ mirrorSelfView: false })).toBe(false);
        expect(renderMirrorSelfView({ mirrorSelfView: true })).toBe(true);
    });
});
