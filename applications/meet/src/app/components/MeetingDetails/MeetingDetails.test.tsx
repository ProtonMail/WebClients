import { render, screen } from '@testing-library/react';

import NotificationsProvider from '@proton/components/containers/notifications/Provider';

import { MeetContext } from '../../contexts/MeetContext';
import { UIStateContext } from '../../contexts/UIStateContext';
import { MeetingSideBars } from '../../types';
import { WrappedMeetingDetails } from './MeetingDetails';

const mockMeetingName = 'Mock Meeting Name';

const meetingLinkName = '1234567890';
const mockLink = `https://example.com/join/id-${meetingLinkName}#pwd-password123`;

vi.mock('../../store', () => ({
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

describe('MeetingDetails', () => {
    it('should return null if not open', () => {
        render(<WrappedMeetingDetails />, {
            wrapper: ({ children }) => (
                <NotificationsProvider>
                    <MeetContext.Provider
                        // @ts-expect-error - mock data
                        value={{
                            meetingLink: mockLink,
                            roomName: mockMeetingName,
                        }}
                    >
                        {/* @ts-expect-error - mock data */}
                        <UIStateContext.Provider value={{ sideBarState: { [MeetingSideBars.MeetingDetails]: false } }}>
                            {children}
                        </UIStateContext.Provider>
                    </MeetContext.Provider>
                </NotificationsProvider>
            ),
        });

        expect(screen.queryByText(mockMeetingName)).not.toBeInTheDocument();
    });

    it('should display the meeting name and the meeting link', () => {
        render(<WrappedMeetingDetails />, {
            wrapper: ({ children }) => (
                <NotificationsProvider>
                    <MeetContext.Provider
                        // @ts-expect-error\
                        value={{
                            meetingLink: mockLink,
                            roomName: mockMeetingName,
                        }}
                    >
                        <UIStateContext.Provider
                            // @ts-expect-error - mock data
                            value={{ sideBarState: { [MeetingSideBars.MeetingDetails]: true } }}
                        >
                            {children}
                        </UIStateContext.Provider>
                    </MeetContext.Provider>
                </NotificationsProvider>
            ),
        });

        expect(screen.getByText(mockMeetingName)).toBeInTheDocument();
        expect(screen.getByText(mockLink)).toBeInTheDocument();
    });

    it('should display the meeting details', () => {
        render(<WrappedMeetingDetails />, {
            wrapper: ({ children }) => (
                <NotificationsProvider>
                    <MeetContext.Provider
                        // @ts-expect-error - mock data
                        value={{ meetingLink: mockLink, roomName: mockMeetingName, passphrase: '123' }}
                    >
                        <UIStateContext.Provider
                            // @ts-expect-error - mock data
                            value={{ sideBarState: { [MeetingSideBars.MeetingDetails]: true } }}
                        >
                            {children}
                        </UIStateContext.Provider>
                    </MeetContext.Provider>
                </NotificationsProvider>
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
