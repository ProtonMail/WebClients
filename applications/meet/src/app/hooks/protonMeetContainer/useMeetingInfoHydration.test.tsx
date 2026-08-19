import { Provider } from 'react-redux';
import { useLocation } from 'react-router-dom';

import { configureStore } from '@reduxjs/toolkit';
import { renderHook, waitFor } from '@testing-library/react';
import type { Mock } from 'vitest';

import { useMeetErrorReporting } from '@proton/meet';
import {
    currentMeetingReducer,
    initialState as initialCurrentMeetingState,
} from '@proton/meet/store/slices/currentMeeting';
import { meetingInfoThunk } from '@proton/meet/store/slices/meetingInfoModel';
import { initialState as initialSettingsState, settingsReducer } from '@proton/meet/store/slices/settings';
import { ProtonStoreContext } from '@proton/react-redux-store';

import type { JoinLocationState } from '../../types';
import { useInvalidMeetingLink } from './useInvalidMeetingLink';
import { useMeetingInfoHydration } from './useMeetingInfoHydration';

vi.mock('react-router-dom', () => ({
    useLocation: vi.fn(),
}));

vi.mock('@proton/meet', () => ({
    useMeetErrorReporting: vi.fn(),
}));

vi.mock('@proton/meet/store/slices/meetingInfoModel', () => ({
    meetingInfoThunk: vi.fn(),
}));

vi.mock('./useInvalidMeetingLink', () => ({
    useInvalidMeetingLink: vi.fn(),
}));

const useLocationMock = useLocation as unknown as Mock;
const useMeetErrorReportingMock = useMeetErrorReporting as unknown as Mock;
const meetingInfoThunkMock = meetingInfoThunk as unknown as Mock;
const useInvalidMeetingLinkMock = useInvalidMeetingLink as unknown as Mock;

const reportMeetError = vi.fn();
const handleInvalidMeetingLink = vi.fn();

const apiError = (Code: number, Error: string, status = 400) => ({
    name: 'StatusCodeError',
    status,
    data: { Code, Error, Details: [] },
});

const serverMeetingInfo = { Locked: 1, WaitingRoom: 1 };

const resolveThunkWith = (meetingInfo: unknown) =>
    meetingInfoThunkMock.mockReturnValue(() => Promise.resolve({ meetingInfo }));

const rejectThunkWith = (error: unknown) => meetingInfoThunkMock.mockReturnValue(() => Promise.reject(error));

const createMockStore = () =>
    configureStore({
        reducer: {
            ...currentMeetingReducer,
            ...settingsReducer,
        },
        preloadedState: {
            currentMeeting: { ...initialCurrentMeetingState },
            meetSettings: { ...initialSettingsState },
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

const renderHydration = ({
    meetingPassword = 'password-abc',
    instantMeeting = false,
    meetingDetails,
}: {
    meetingPassword?: string;
    instantMeeting?: boolean;
    meetingDetails?: JoinLocationState['meetingDetails'];
} = {}) => {
    useLocationMock.mockReturnValue({ state: meetingDetails ? { meetingDetails } : undefined });

    const store = createMockStore();
    const { result } = renderHook(
        () => useMeetingInfoHydration({ meetingLinkName: 'meeting-abc', meetingPassword, instantMeeting }),
        { wrapper: createTestWrapper(store) }
    );

    return { store, result };
};

describe('useMeetingInfoHydration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useMeetErrorReportingMock.mockReturnValue({ reportMeetError });
        useInvalidMeetingLinkMock.mockReturnValue({ handleInvalidMeetingLink });
        resolveThunkWith(serverMeetingInfo);
    });

    it('skips the fetch for an instant meeting', () => {
        const { store, result } = renderHydration({ instantMeeting: true });

        expect(result.current.isReadyToDecrypt).toBe(true);
        expect(store.getState().currentMeeting.isMeetingLoading).toBe(false);
        expect(meetingInfoThunkMock).not.toHaveBeenCalled();
    });

    it('skips the fetch when the url has no password', () => {
        const { store, result } = renderHydration({ meetingPassword: '' });

        expect(result.current.isReadyToDecrypt).toBe(true);
        expect(store.getState().currentMeeting.isMeetingLoading).toBe(false);
        expect(meetingInfoThunkMock).not.toHaveBeenCalled();
    });

    it('seeds the prejoin from the navigation state without waiting for the fetch', async () => {
        const { store, result } = renderHydration({
            meetingDetails: {
                meetingName: 'Standup',
                isPersonalRoom: true,
                waitingRoom: true,
                canManageWaitingRoom: true,
            },
        });

        expect(result.current.isReadyToDecrypt).toBe(true);
        expect(store.getState().currentMeeting.navigationSeed).toEqual({
            meetingName: 'Standup',
            isPersonalRoom: true,
            canManageWaitingRoom: true,
        });
        expect(store.getState().meetSettings.waitingRoomSetting).toBe(true);
        expect(meetingInfoThunkMock).toHaveBeenCalledTimes(1);

        await waitFor(() => expect(store.getState().currentMeeting.isMeetingLoading).toBe(false));
    });

    it('hydrates the meeting policies once the fetch resolves', async () => {
        const { store, result } = renderHydration();

        await waitFor(() => expect(result.current.isReadyToDecrypt).toBe(true));

        expect(store.getState().meetSettings.meetingLocked).toBe(true);
        expect(store.getState().meetSettings.waitingRoomSetting).toBe(true);
        expect(store.getState().currentMeeting.isMeetingLoading).toBe(false);
        expect(handleInvalidMeetingLink).not.toHaveBeenCalled();
    });

    it('sends the user away when the meeting no longer exists', async () => {
        rejectThunkWith(apiError(2501, 'Meeting does not exist'));

        const { store, result } = renderHydration();

        await waitFor(() => expect(handleInvalidMeetingLink).toHaveBeenCalledTimes(1));

        expect(result.current.isReadyToDecrypt).toBe(false);
        expect(store.getState().currentMeeting.isMeetingLoading).toBe(false);
        expect(reportMeetError).not.toHaveBeenCalled();
    });

    it('keeps the prejoin usable and reports a transient failure', async () => {
        rejectThunkWith(apiError(9999, 'Something new', 500));

        const { result } = renderHydration();

        await waitFor(() => expect(result.current.isReadyToDecrypt).toBe(true));

        expect(handleInvalidMeetingLink).not.toHaveBeenCalled();
        expect(reportMeetError).toHaveBeenCalledTimes(1);
    });

    it('does not report an expected failure', async () => {
        rejectThunkWith(apiError(2028, 'Too many requests', 429));

        const { result } = renderHydration();

        await waitFor(() => expect(result.current.isReadyToDecrypt).toBe(true));

        expect(reportMeetError).not.toHaveBeenCalled();
    });
});
