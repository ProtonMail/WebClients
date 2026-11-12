import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';

import NotificationsProvider from '@proton/components/containers/notifications/Provider';
import {
    currentMeetingReducer,
    initialState as initialCurrentMeetingState,
} from '@proton/meet/store/slices/currentMeeting';
import { meetingInfoModelReducer } from '@proton/meet/store/slices/meetingInfoModel';
import {
    initialState as initialSortedParticipantsState,
    sortedParticipantsReducer,
} from '@proton/meet/store/slices/participants/sortedParticipantsSlice';
import { MeetingSideBars, uiStateReducer } from '@proton/meet/store/slices/uiStateSlice';
import { initialState as initialMeetUserState, meetUserReducer } from '@proton/meet/store/slices/userSlice';
import { getMeetingLink } from '@proton/meet/utils/getMeetingLink';
import { ProtonStoreContext } from '@proton/react-redux-store/ProtonStoreContext';

import { MeetContext } from '../../contexts/MeetContext';
import { WrappedMeetingDetails } from './MeetingDetails';

const mockMeetingName = 'Mock Meeting Name';

const meetingLinkName = '1234567890';
const meetingPassword = 'password1234';
const mockLink = `${window.location.origin}${getMeetingLink(meetingLinkName, meetingPassword)}`;

const defaultMeetingSchedule = { StartTime: '1756492800', EndTime: '1756496400', Timezone: 'CET' };
let meetingSchedule = defaultMeetingSchedule;

vi.mock('@proton/meet/store/hooks/useMeetings', () => ({
    useMeetings: () => [
        [
            {
                MeetingLinkName: meetingLinkName,
                ...meetingSchedule,
            },
        ],
    ],
}));

vi.mock('@proton/unleash/useFlag', () => ({
    useFlag: (flag: string) => flag === 'MeetShowMLSLogs',
}));

const createMockStore = ({ sideBarOpen = false, keyRotationLogs = initialCurrentMeetingState.keyRotationLogs }) => {
    return configureStore({
        // @ts-expect-error - mock data
        reducer: {
            ...uiStateReducer,
            ...currentMeetingReducer,
            ...meetingInfoModelReducer,
            ...sortedParticipantsReducer,
            ...meetUserReducer,
        },
        preloadedState: {
            uiState: {
                meetingReadyPopupOpen: false,
                sideBarState: {
                    [MeetingSideBars.Participants]: false,
                    [MeetingSideBars.AssignHost]: false,
                    [MeetingSideBars.Settings]: false,
                    [MeetingSideBars.Chat]: false,
                    [MeetingSideBars.MeetingDetails]: sideBarOpen,
                    [MeetingSideBars.Backgrounds]: false,
                },
                popupState: {
                    Microphone: false,
                    Camera: false,
                    LeaveMeeting: false,
                    LeaveMeetingParticipant: false,
                    ScreenShareLeaveWarning: false,
                    EndMeeting: false,
                },
                permissionPromptStatus: 'CLOSED',
                noDeviceDetected: 'CLOSED',
            },
            currentMeeting: {
                ...initialCurrentMeetingState,
                meetingLinkName,
                meetingPassword,
                keyRotationLogs,
            },
            meetingInfoModel: {
                value: {
                    meetingLinkName,
                    meetingName: mockMeetingName,
                    meetingInfo: { MeetingLinkName: meetingLinkName },
                },
                error: undefined,
                meta: { fetchedAt: 0, fetchedEphemeral: true },
            },
            sortedParticipants: {
                ...initialSortedParticipantsState,
            },
            meetUser: {
                ...initialMeetUserState,
            },
        },
    });
};

describe('MeetingDetails', () => {
    afterEach(() => {
        meetingSchedule = defaultMeetingSchedule;
        vi.unstubAllEnvs();
    });

    it('should return null if not open', () => {
        const store = createMockStore({ sideBarOpen: false });

        render(<WrappedMeetingDetails />, {
            wrapper: ({ children }) => (
                <Provider context={ProtonStoreContext} store={store}>
                    <NotificationsProvider>
                        <MeetContext.Provider
                            // @ts-expect-error - mock data
                            value={{}}
                        >
                            {children}
                        </MeetContext.Provider>
                    </NotificationsProvider>
                </Provider>
            ),
        });

        expect(screen.queryByText(mockMeetingName)).not.toBeInTheDocument();
    });

    it('should display the meeting name and the meeting link', () => {
        const store = createMockStore({ sideBarOpen: true });

        render(<WrappedMeetingDetails />, {
            wrapper: ({ children }) => (
                <Provider context={ProtonStoreContext} store={store}>
                    <NotificationsProvider>
                        <MeetContext.Provider
                            // @ts-expect-error\
                            value={{}}
                        >
                            {children}
                        </MeetContext.Provider>
                    </NotificationsProvider>
                </Provider>
            ),
        });

        expect(screen.getByText(mockMeetingName)).toBeInTheDocument();
        expect(screen.getByText(mockLink)).toBeInTheDocument();
    });

    it('should display the meeting details', () => {
        const store = createMockStore({ sideBarOpen: true });

        render(<WrappedMeetingDetails />, {
            wrapper: ({ children }) => (
                <Provider context={ProtonStoreContext} store={store}>
                    <NotificationsProvider>
                        <MeetContext.Provider
                            // @ts-expect-error - mock data
                            value={{}}
                        >
                            {children}
                        </MeetContext.Provider>
                    </NotificationsProvider>
                </Provider>
            ),
        });

        expect(screen.getByText('Info')).toBeInTheDocument();
        expect(screen.getByText('Meeting')).toBeInTheDocument();
        expect(screen.getByText(mockMeetingName)).toBeInTheDocument();
        expect(screen.getByText('Friday, August 29, 2025')).toBeInTheDocument();
        expect(screen.getByText(mockLink)).toBeInTheDocument();
        expect(screen.getByText('20:40 - 21:40 (CET)')).toBeInTheDocument();
    });

    it('should display a Vancouver meeting after the move to permanent time at UTC-7', () => {
        meetingSchedule = { StartTime: '1794502800', EndTime: '1794506400', Timezone: 'America/Vancouver' };
        const store = createMockStore({ sideBarOpen: true });

        render(<WrappedMeetingDetails />, {
            wrapper: ({ children }) => (
                <Provider context={ProtonStoreContext} store={store}>
                    <NotificationsProvider>
                        <MeetContext.Provider
                            // @ts-expect-error - mock data
                            value={{}}
                        >
                            {children}
                        </MeetContext.Provider>
                    </NotificationsProvider>
                </Provider>
            ),
        });

        expect(screen.getByText('10:00 - 11:00 (America/Vancouver)')).toBeInTheDocument();
    });

    it('should display the date in the meeting time zone when the device is in another time zone', () => {
        vi.stubEnv('TZ', 'Europe/Zurich');
        meetingSchedule = { StartTime: '1794549600', EndTime: '1794551400', Timezone: 'America/Vancouver' };
        const store = createMockStore({ sideBarOpen: true });

        render(<WrappedMeetingDetails />, {
            wrapper: ({ children }) => (
                <Provider context={ProtonStoreContext} store={store}>
                    <NotificationsProvider>
                        <MeetContext.Provider
                            // @ts-expect-error - mock data
                            value={{}}
                        >
                            {children}
                        </MeetContext.Provider>
                    </NotificationsProvider>
                </Provider>
            ),
        });

        expect(screen.getByText('Thursday, November 12, 2026')).toBeInTheDocument();
        expect(screen.getByText('23:00 - 23:30 (America/Vancouver)')).toBeInTheDocument();
    });

    it('should display a meeting in the device time zone when the bundled data does not know its time zone', () => {
        vi.stubEnv('TZ', 'Asia/Tokyo');
        meetingSchedule = { ...defaultMeetingSchedule, Timezone: 'Not/AZone' };
        const store = createMockStore({ sideBarOpen: true });

        render(<WrappedMeetingDetails />, {
            wrapper: ({ children }) => (
                <Provider context={ProtonStoreContext} store={store}>
                    <NotificationsProvider>
                        <MeetContext.Provider
                            // @ts-expect-error - mock data
                            value={{}}
                        >
                            {children}
                        </MeetContext.Provider>
                    </NotificationsProvider>
                </Provider>
            ),
        });

        expect(screen.getByText('03:40 - 04:40 (Asia/Tokyo)')).toBeInTheDocument();
    });

    describe('on a Vancouver device whose browser has the rules from before the move to permanent time', () => {
        beforeEach(() => {
            vi.stubEnv('TZ', 'America/Los_Angeles');
            const deviceOptions = Intl.DateTimeFormat().resolvedOptions();
            vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
                ...deviceOptions,
                timeZone: 'America/Vancouver',
            });
        });

        afterEach(() => {
            vi.restoreAllMocks();
        });

        it('should display the activity event time in Vancouver time', () => {
            const store = createMockStore({
                sideBarOpen: true,
                keyRotationLogs: [
                    { timestamp: Date.parse('2026-11-12T17:00:00Z'), epoch: 1, type: 'log', message: 'Joined' },
                ],
            });

            render(<WrappedMeetingDetails />, {
                wrapper: ({ children }) => (
                    <Provider context={ProtonStoreContext} store={store}>
                        <NotificationsProvider>
                            <MeetContext.Provider
                                // @ts-expect-error - mock data
                                value={{}}
                            >
                                {children}
                            </MeetContext.Provider>
                        </NotificationsProvider>
                    </Provider>
                ),
            });

            expect(screen.getByText('10:00:00')).toBeInTheDocument();
        });
    });
});
