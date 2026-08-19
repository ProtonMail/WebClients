import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { renderHook } from '@testing-library/react';
import type { Mock } from 'vitest';

import {
    currentMeetingReducer,
    initialState as initialCurrentMeetingState,
} from '@proton/meet/store/slices/currentMeeting';
import { ProtonStoreContext } from '@proton/react-redux-store';
import { useFlag } from '@proton/unleash/useFlag';

import { getDesktopAppPreference, tryOpenInDesktopApp } from '../../utils/desktopAppDetector';
import { useDesktopAppRedirect } from './useDesktopAppRedirect';

vi.mock('@proton/unleash/useFlag', () => ({
    useFlag: vi.fn(),
}));

vi.mock('@proton/shared/lib/helpers/desktop', () => ({
    isElectronApp: false,
}));

vi.mock('../../utils/desktopAppDetector', () => ({
    getDesktopAppPreference: vi.fn(),
    tryOpenInDesktopApp: vi.fn(),
}));

const useFlagMock = useFlag as unknown as Mock;
const getDesktopAppPreferenceMock = getDesktopAppPreference as unknown as Mock;
const tryOpenInDesktopAppMock = tryOpenInDesktopApp as unknown as Mock;

const createMockStore = () =>
    configureStore({
        reducer: { ...currentMeetingReducer },
        preloadedState: {
            currentMeeting: {
                ...initialCurrentMeetingState,
                meetingLinkName: 'meeting-abc',
                meetingPassword: 'password-abc',
            },
        },
    });

function createTestWrapper(store: ReturnType<typeof createMockStore>) {
    function TestWrapper({ children }: { children: React.ReactNode }) {
        return (
            <Provider context={ProtonStoreContext} store={store}>
                {children}
            </Provider>
        );
    }
    return TestWrapper;
}

const renderDesktopAppRedirect = ({ token = 'meeting-abc', isInstantJoin = false } = {}) =>
    renderHook(() => useDesktopAppRedirect({ token, isInstantJoin }), {
        wrapper: createTestWrapper(createMockStore()),
    });

describe('useDesktopAppRedirect', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useFlagMock.mockReturnValue(true);
        getDesktopAppPreferenceMock.mockReturnValue(true);
    });

    it('opens the meeting in the desktop app', () => {
        const { result } = renderDesktopAppRedirect();

        expect(result.current.openedInDesktopApp).toBe(true);
        expect(tryOpenInDesktopAppMock).toHaveBeenCalledWith(
            'http://localhost:3000/join/id-meeting-abc#pwd-password-abc'
        );
    });

    it('stays on the web when the flag is off', () => {
        useFlagMock.mockReturnValue(false);

        const { result } = renderDesktopAppRedirect();

        expect(result.current.openedInDesktopApp).toBe(false);
        expect(tryOpenInDesktopAppMock).not.toHaveBeenCalled();
    });

    it('stays on the web when the user never asked for the desktop app', () => {
        getDesktopAppPreferenceMock.mockReturnValue(false);

        const { result } = renderDesktopAppRedirect();

        expect(result.current.openedInDesktopApp).toBe(false);
        expect(tryOpenInDesktopAppMock).not.toHaveBeenCalled();
    });

    it('stays on the web for an instant join', () => {
        const { result } = renderDesktopAppRedirect({ isInstantJoin: true });

        expect(result.current.openedInDesktopApp).toBe(false);
        expect(tryOpenInDesktopAppMock).not.toHaveBeenCalled();
    });

    it('stays on the web when there is no meeting link', () => {
        const { result } = renderDesktopAppRedirect({ token: '' });

        expect(result.current.openedInDesktopApp).toBe(false);
        expect(tryOpenInDesktopAppMock).not.toHaveBeenCalled();
    });

    it('redirects only once when the hook re-renders', () => {
        const { rerender } = renderDesktopAppRedirect();

        rerender();
        rerender();

        expect(tryOpenInDesktopAppMock).toHaveBeenCalledTimes(1);
    });
});
