import { render, screen } from '@testing-library/react';

import { MeetContext } from '../../contexts/MeetContext';
import { UIStateContext } from '../../contexts/UIStateContext';
import { MeetingSideBars } from '../../types';
import { MeetingDetails } from './MeetingDetails';

const mockMeetingName = 'Mock Meeting Name';
const mockLink = 'https://mock-link.com';

describe('MeetingDetails', () => {
    it('should return null if not open', () => {
        render(<MeetingDetails />, {
            wrapper: ({ children }) => (
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
            ),
        });

        expect(screen.queryByText(mockMeetingName)).not.toBeInTheDocument();
    });

    it('should display the meeting name and the meeting link', () => {
        render(<MeetingDetails />, {
            wrapper: ({ children }) => (
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
            ),
        });

        expect(screen.getByText(mockMeetingName)).toBeInTheDocument();
        expect(screen.getByText(mockLink)).toBeInTheDocument();
    });
});
