import { act, render, screen } from '@testing-library/react';

import { ScheduleRunSecondaryLabel } from './ScheduleRunSecondaryLabel';

jest.mock('../useScheduleRunState', () => ({ useScheduleRunState: () => ({}) }));
jest.mock('./utils/run-label', () => ({
    getScheduleRunLabel: () => new Date().toISOString(),
    getScheduleNextRunLabel: jest.fn(),
}));

describe('ScheduleRunSecondaryLabel', () => {
    afterEach(() => {
        jest.useRealTimers();
    });

    it('ticks at minute boundaries and clears the timer on unmount', () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-10-27T10:00:25.500Z'));
        const { unmount } = render(
            <ScheduleRunSecondaryLabel
                scheduleId="schedule"
                rule={{ frequency: 'DAILY', hour: 9, minute: 0, timezone: 'UTC' }}
            />
        );
        act(() => jest.advanceTimersByTime(34_499));
        expect(screen.getByText('2026-10-27T10:00:25.500Z')).toBeInTheDocument();
        act(() => jest.advanceTimersByTime(1));
        expect(screen.getByText('2026-10-27T10:01:00.000Z')).toBeInTheDocument();
        act(() => jest.advanceTimersByTime(60_000));
        expect(screen.getByText('2026-10-27T10:02:00.000Z')).toBeInTheDocument();
        unmount();
        expect(jest.getTimerCount()).toBe(0);
    });
});
