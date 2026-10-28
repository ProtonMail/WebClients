import { fireEvent, render, screen } from '@testing-library/react';

import noop from '@proton/utils/noop';

import type { BookingRange } from '../interface';
import { EndTimeInput } from './FormRangeListShared';

const range: BookingRange = {
    id: 'range-id',
    start: new Date(2023, 0, 11, 9),
    end: new Date(2023, 0, 11, 17),
    timezone: 'Europe/Zurich',
};

describe('EndTimeInput', () => {
    it.each([
        [15, '9:15 AM'],
        [30, '9:30 AM'],
        [60, '10:00 AM'],
        [90, '10:30 AM'],
        [120, '11:00 AM'],
    ])('should start options at the right time for %s minutes', (duration, first) => {
        render(<EndTimeInput id="end" range={range} duration={duration} onChange={noop} />);
        fireEvent.click(screen.getByDisplayValue('5:00 PM'));

        expect(screen.getByText(first)).toBeInTheDocument();
        expect(screen.queryByText('9:00 AM')).toBe(null);
        if (duration > 30) {
            expect(screen.queryByText('9:30 AM')).toBe(null);
        }
    });
});
