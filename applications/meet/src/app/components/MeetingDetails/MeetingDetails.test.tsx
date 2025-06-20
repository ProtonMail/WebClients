import { render, screen } from '@testing-library/react';

import { MeetContext } from '../../contexts/MeetContext';
import { MeetingSideBars } from '../../types';
import { MeetingDetails } from './MeetingDetails';

const mockMeetingName = 'Mock Meeting Name';
const mockLink = 'https://mock-link.com';

describe('MeetingDetails', () => {
    it('should return null if not open', () => {
        render(<MeetingDetails />, {
            wrapper: ({ children }) => (
                <MeetContext.Provider
                    value={{
                        // @ts-expect-error - mock data
                        sideBarState: { [MeetingSideBars.MeetingDetails]: false },
                        meetingLink: mockLink,
                        roomName: mockMeetingName,
                    }}
                >
                    {children}
                </MeetContext.Provider>
            ),
        });

        expect(screen.queryByText(mockMeetingName)).not.toBeInTheDocument();
    });

    it('should display the meeting name and the meeting link', () => {
        render(<MeetingDetails />, {
            wrapper: ({ children }) => (
                <MeetContext.Provider
                    value={{
                        // @ts-expect-error - mock data
                        sideBarState: { [MeetingSideBars.MeetingDetails]: true },
                        meetingLink: mockLink,
                        roomName: mockMeetingName,
                    }}
                >
                    {children}
                </MeetContext.Provider>
            ),
        });

        expect(screen.getByText(mockMeetingName)).toBeInTheDocument();
        expect(screen.getByText(mockLink)).toBeInTheDocument();
    });
});
