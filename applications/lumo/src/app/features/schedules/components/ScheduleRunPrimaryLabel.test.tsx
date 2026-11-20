import { render, screen } from '@testing-library/react';

import { useUserSettings } from '@proton/account/userSettings/hooks';

import { ALWAYS_LOCAL_TIMEZONE_ID } from '../../../components/RecurrenceRuleFieldset/types';
import { useScheduleRunState } from '../useScheduleRunState';
import { ScheduleRunPrimaryLabel } from './ScheduleRunPrimaryLabel';

vi.mock('@proton/account/userSettings/hooks', () => ({ useUserSettings: vi.fn() }));
vi.mock('../useScheduleRunState', () => ({ useScheduleRunState: vi.fn() }));

describe('ScheduleRunPrimaryLabel', () => {
    const rule = { frequency: 'DAILY' as const, hour: 9, minute: 0, timezone: ALWAYS_LOCAL_TIMEZONE_ID };

    beforeEach(() => {
        vi.mocked(useUserSettings).mockReturnValue([{ WeekStart: 1 }] as never);
    });

    it.each([true, false])('shares running and paused labels with chip=%s', (chip) => {
        vi.mocked(useScheduleRunState).mockReturnValue({ isRunning: true, isPaused: false } as never);
        const { rerender } = render(<ScheduleRunPrimaryLabel rule={rule} scheduleId="schedule" chip={chip} />);
        const label = screen.getByText('Running now…').parentElement;
        if (chip) {
            expect(label).toHaveClass('schedule-run-primary-label--chip');
        } else {
            expect(label).not.toHaveClass('schedule-run-primary-label--chip');
        }
        vi.mocked(useScheduleRunState).mockReturnValue({ isRunning: false, isPaused: true } as never);
        rerender(<ScheduleRunPrimaryLabel rule={rule} scheduleId="schedule" chip={chip} />);
        expect(screen.getByText('Paused')).toBeInTheDocument();
    });

    it('falls back to the cadence and prioritizes execution over a paused schedule', () => {
        vi.mocked(useScheduleRunState).mockReturnValue({ isRunning: false, isPaused: false } as never);
        const { rerender } = render(<ScheduleRunPrimaryLabel rule={rule} scheduleId="schedule" />);
        expect(screen.queryByText('Paused')).not.toBeInTheDocument();
        expect(screen.queryByText('Running now…')).not.toBeInTheDocument();
        expect(screen.getByText(/9:00/)).toBeInTheDocument();
        vi.mocked(useScheduleRunState).mockReturnValue({ isRunning: true, isPaused: true } as never);
        rerender(<ScheduleRunPrimaryLabel rule={rule} scheduleId="schedule" />);
        expect(screen.getByText('Running now…')).toBeInTheDocument();
        expect(screen.queryByText('Paused')).not.toBeInTheDocument();
    });
});
