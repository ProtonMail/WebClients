import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';

import NotificationsProvider from '@proton/components/containers/notifications/Provider';
import { MeetingSideBars, uiStateReducer } from '@proton/meet/store/slices/uiStateSlice';
import { ProtonStoreContext } from '@proton/react-redux-store';

import { MeetContext } from '../../contexts/MeetContext';
import { WrappedMeetingDetails } from './MeetingDetails';

const mockMeetingName = 'Mock Meeting Name';

const meetingLinkName = '1234567890';
const mockLink = `https://example.com/join/id-${meetingLinkName}#pwd-password1234`;

vi.mock('@proton/meet/store/hooks/useMeetings', () => ({
    useMeetings: () => [
        [
            {
                MeetingLinkName: meetingLinkName,
                StartTime: '1756492800',
                EndTime: '1756496400',
                Timezone: 'CET',
            },
        ],
    ],
}));

const createMockStore = (sideBarOpen = false) => {
    return configureStore({
        // @ts-expect-error - mock data
        reducer: {
            ...uiStateReducer,
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
        },
    });
};

describe('MeetingDetails', () => {
    it('should return null if not open', () => {
        const store = createMockStore(false);

        render(<WrappedMeetingDetails />, {
            wrapper: ({ children }) => (
                <Provider context={ProtonStoreContext} store={store}>
                    <NotificationsProvider>
                        <MeetContext.Provider
                            // @ts-expect-error - mock data
                            value={{
                                meetingLink: mockLink,
                                roomName: mockMeetingName,
                            }}
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
        const store = createMockStore(true);

        render(<WrappedMeetingDetails />, {
            wrapper: ({ children }) => (
                <Provider context={ProtonStoreContext} store={store}>
                    <NotificationsProvider>
                        <MeetContext.Provider
                            // @ts-expect-error\
                            value={{
                                meetingLink: mockLink,
                                roomName: mockMeetingName,
                            }}
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
        const store = createMockStore(true);

        render(<WrappedMeetingDetails />, {
            wrapper: ({ children }) => (
                <Provider context={ProtonStoreContext} store={store}>
                    <NotificationsProvider>
                        <MeetContext.Provider
                            // @ts-expect-error - mock data
                            value={{ meetingLink: mockLink, roomName: mockMeetingName, passphrase: '123' }}
                        >
                            {children}
                        </MeetContext.Provider>
                    </NotificationsProvider>
                </Provider>
            ),
        });

        expect(screen.getByText('Info')).toBeInTheDocument();
        expect(screen.getByText('Meeting details')).toBeInTheDocument();
        expect(screen.getByText(mockMeetingName)).toBeInTheDocument();
        expect(screen.getByText('Friday, August 29, 2025')).toBeInTheDocument();
        expect(screen.getByText(mockLink)).toBeInTheDocument();
        expect(screen.getByText('20:40 - 21:40 (CET)')).toBeInTheDocument();
        expect(screen.getByText('123')).toBeInTheDocument();
    });
});
