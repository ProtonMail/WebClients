import { render, screen } from '@testing-library/react';

import type { RecurrenceRule } from '../../../components/RecurrenceRuleFieldset/types';
import { useScheduleRunState } from '../useScheduleRunState';
import { ScheduleSidebarLabel } from './ScheduleSidebarLabel';

jest.mock('../useScheduleRunState', () => ({ useScheduleRunState: jest.fn() }));

describe('ScheduleSidebarLabel', () => {
    it('keeps the cadence while queued and updates as the task runs, pauses, and resumes', () => {
        const rule: RecurrenceRule = {
            frequency: 'WEEKLY',
            byWeekDay: ['MO', 'TU', 'WE', 'TH', 'FR'],
            hour: 9,
            minute: 0,
            timezone: 'UTC',
        };
        const state = { isRunning: false, isPaused: false, isQueued: true };
        jest.mocked(useScheduleRunState).mockReturnValue(state as never);
        const label = <ScheduleSidebarLabel rule={rule} scheduleId="schedule" />;
        const { rerender } = render(label);
        expect(screen.getByText('Weekdays')).toBeInTheDocument();

        jest.mocked(useScheduleRunState).mockReturnValue({ ...state, isRunning: true, isPaused: true } as never);
        rerender(<ScheduleSidebarLabel rule={rule} scheduleId="schedule" />);
        expect(screen.getByText('Running')).toBeInTheDocument();

        jest.mocked(useScheduleRunState).mockReturnValue({ ...state, isPaused: true } as never);
        rerender(<ScheduleSidebarLabel rule={rule} scheduleId="schedule" />);
        expect(screen.getByText('Paused')).toBeInTheDocument();

        jest.mocked(useScheduleRunState).mockReturnValue(state as never);
        rerender(<ScheduleSidebarLabel rule={rule} scheduleId="schedule" />);
        expect(screen.getByText('Weekdays')).toBeInTheDocument();
    });
});
