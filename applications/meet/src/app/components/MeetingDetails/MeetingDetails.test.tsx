import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { act, fireEvent, render, screen, within } from '@testing-library/react';

import NotificationsProvider from '@proton/components/containers/notifications/Provider';
import { addEvent, chatAndReactionsReducer } from '@proton/meet/store/slices/chatAndReactionsSlice';
import {
    currentMeetingReducer,
    initialState as initialCurrentMeetingState,
} from '@proton/meet/store/slices/currentMeeting';
import { meetingInfoModelReducer } from '@proton/meet/store/slices/meetingInfoModel';
import {
    mergeParticipantDecryptedNameMap,
    participantsReducer,
} from '@proton/meet/store/slices/participants/participantsSlice';
import {
    initialState as initialSortedParticipantsState,
    sortedParticipantsReducer,
} from '@proton/meet/store/slices/participants/sortedParticipantsSlice';
import type { ParticipantCountMismatch } from '@proton/meet/store/slices/uiStateSlice';
import { MeetingSideBars, uiStateReducer } from '@proton/meet/store/slices/uiStateSlice';
import { initialState as initialMeetUserState, meetUserReducer } from '@proton/meet/store/slices/userSlice';
import type { KeyRotationLog } from '@proton/meet/types/types';
import { ParticipantEvent } from '@proton/meet/types/types';
import { getMeetingLink } from '@proton/meet/utils/getMeetingLink';
import { ProtonStoreContext } from '@proton/react-redux-store/ProtonStoreContext';
import { MINUTE } from '@proton/shared/lib/constants';

import { MeetContext } from '../../contexts/MeetContext';
import { WrappedMeetingDetails } from './MeetingDetails';

const flagMocks = vi.hoisted(() => ({ enabledFlags: new Set<string>() }));
vi.mock('@proton/unleash/useFlag', () => ({
    useFlag: (flag: string) => flagMocks.enabledFlags.has(flag),
}));

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

const createMockStore = ({
    sideBarOpen = false,
    keyRotationLogs = initialCurrentMeetingState.keyRotationLogs,
    participantCountMismatch = null as ParticipantCountMismatch | null,
    isGuest = initialMeetUserState.isGuest,
}) => {
    return configureStore({
        // @ts-expect-error - mock data
        reducer: {
            ...uiStateReducer,
            ...currentMeetingReducer,
            ...meetingInfoModelReducer,
            ...sortedParticipantsReducer,
            ...meetUserReducer,
            ...chatAndReactionsReducer,
            ...participantsReducer,
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
                participantCountMismatch,
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
                isGuest,
            },
        },
    });
};

describe('MeetingDetails', () => {
    afterEach(() => {
        meetingSchedule = defaultMeetingSchedule;
        flagMocks.enabledFlags.clear();
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

    describe('activity events', () => {
        const keyRotationLogs: KeyRotationLog[] = [
            { timestamp: Date.parse('2026-11-12T10:00:00Z'), epoch: 3, type: 'log', message: 'Joined' },
            { timestamp: Date.parse('2026-11-12T10:00:05Z'), epoch: 4, type: 'log', message: 'Rotated' },
        ];

        const renderActivityEvents = () => {
            const store = createMockStore({ sideBarOpen: true, keyRotationLogs });
            store.dispatch(
                addEvent([
                    {
                        identity: 'alice',
                        eventType: ParticipantEvent.Join,
                        timestamp: Date.parse('2026-11-12T10:00:04Z'),
                        type: 'event',
                    },
                    {
                        identity: 'bob',
                        eventType: ParticipantEvent.Join,
                        timestamp: Date.parse('2026-11-12T10:00:06Z'),
                        type: 'event',
                    },
                    {
                        identity: 'alice',
                        eventType: ParticipantEvent.Leave,
                        timestamp: Date.parse('2026-11-12T10:00:07Z'),
                        type: 'event',
                    },
                ])
            );
            store.dispatch(mergeParticipantDecryptedNameMap({ alice: 'Alice' }));

            render(<WrappedMeetingDetails />, {
                wrapper: ({ children }) => (
                    <Provider context={ProtonStoreContext} store={store}>
                        <NotificationsProvider>
                            <MeetContext.Provider
                                // @ts-expect-error - mock data
                                value={{ getKeychainIndexInformation: () => [] }}
                            >
                                {children}
                            </MeetContext.Provider>
                        </NotificationsProvider>
                    </Provider>
                ),
            });

            const activityEventsTable = within(
                screen.getByRole('heading', { name: 'Activity events' }).parentElement!.parentElement!
            ).getByRole('table');

            return {
                store,
                rows: within(activityEventsTable)
                    .getAllByRole('row')
                    .map((row) => ({
                        time: within(row).getByRole('rowheader').textContent,
                        event: within(row).getByRole('cell'),
                    })),
            };
        };

        beforeEach(() => {
            vi.stubEnv('TZ', 'UTC');
        });

        it('should list joins, leaves and epochs newest first, with your own join last', () => {
            flagMocks.enabledFlags.add('MeetActivityEventsJoinLeave');

            const { rows } = renderActivityEvents();

            expect(rows.map(({ time, event }) => [time, event.textContent])).toEqual([
                ['10:00:07', 'Alice left'],
                ['10:00:06', 'A participant joined'],
                ['10:00:05', 'Epoch 3 → 4'],
                ['10:00:04', 'Alice joined'],
                ['10:00:00', 'Epoch 3'],
                ['10:00:00', 'You joined'],
            ]);
            expect(screen.queryByText(/Joined at epoch/)).not.toBeInTheDocument();
        });

        it('should show join and leave rows in the normal text color and epoch rows in the hint color', () => {
            flagMocks.enabledFlags.add('MeetActivityEventsJoinLeave');

            const { rows } = renderActivityEvents();

            expect(rows.map(({ event }) => event.className.includes('color-norm'))).toEqual([
                true,
                true,
                false,
                true,
                false,
                true,
            ]);
            expect(rows.map(({ event }) => event.className.includes('color-hint'))).toEqual([
                false,
                false,
                true,
                false,
                true,
                false,
            ]);
        });

        it('should keep the current rows while the feature flag is off', () => {
            const { rows } = renderActivityEvents();

            expect(rows.map(({ time, event }) => [time, event.textContent])).toEqual([
                ['10:00:00', 'Joined at epoch 3'],
                ['10:00:05', 'Epoch 3 → 4'],
            ]);
            expect(screen.queryByText(/joined$/)).not.toBeInTheDocument();
        });

        it('should copy the same activity events as before, without names', async () => {
            flagMocks.enabledFlags.add('MeetActivityEventsJoinLeave');
            flagMocks.enabledFlags.add('MeetAllowMLSLogExport');
            const writeText = vi.fn().mockResolvedValue(undefined);
            Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

            renderActivityEvents();
            await act(async () => {
                fireEvent.click(screen.getByRole('button', { name: 'Copy all activity events' }));
            });

            expect(writeText).toHaveBeenCalledWith(
                JSON.stringify({ keyRotationLogs, keychainIndexInformation: [] }, null, 2)
            );
        });
    });

    describe('participant count mismatch card', () => {
        const renderMismatchCard = (participantCountMismatch: ParticipantCountMismatch) => {
            flagMocks.enabledFlags.add('MeetParticipantCountMismatch');
            const store = createMockStore({ sideBarOpen: true, participantCountMismatch, isGuest: false });

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

            return screen.getByText('Participant counts don’t match').closest('.meeting-count-mismatch-card');
        };

        it('should show the host-away text in the normal style once the counts differ without the host', () => {
            const card = renderMismatchCard({ since: Date.now() - MINUTE, isHostInCall: false });

            expect(card).toHaveTextContent(
                'The host isn’t in the meeting right now. The participant counts will match again when the host joins.'
            );
            expect(card).not.toHaveClass('meeting-count-mismatch-card--warning');
        });

        it('should show the warning style once the counts differ for a minute with the host', () => {
            const card = renderMismatchCard({ since: Date.now() - MINUTE, isHostInCall: true });

            expect(card).toHaveClass('meeting-count-mismatch-card--warning');
            expect(card).not.toHaveTextContent('The host isn’t in the meeting right now.');
        });
    });
});
