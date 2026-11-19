import { render, screen } from '@testing-library/react';

import { SETTINGS_TIME_FORMAT } from '@proton/shared/lib/interfaces/UserSettings';

import type { FormValues } from './MeetingCreation/ScheduleMeetingModal/ScheduleMeetingForm/types';
import { TimeInputBlock } from './TimeInputBlock';

const values: FormValues = {
    meetingName: 'Weekly sync',
    startDate: new Date(2026, 10, 12),
    startTime: '10:00',
    endDate: new Date(2026, 10, 12),
    endTime: '10:30',
    timeZone: 'Europe/Zurich',
    recurrence: 'NO_REPEAT',
};

const renderBlock = (name: 'start' | 'end', errors: { dateError?: string; timeError?: string }) =>
    render(
        <TimeInputBlock
            name={name}
            values={values}
            onDateTimeChange={vi.fn()}
            showTimezones={false}
            timeOptions={[]}
            timeZoneOptions={[]}
            timeFormat={SETTINGS_TIME_FORMAT.H24}
            {...errors}
        />
    );

describe('TimeInputBlock', () => {
    it.each([
        { name: 'start' as const, dateName: 'Start date', timeName: 'Start time' },
        { name: 'end' as const, dateName: 'End date', timeName: 'End time' },
    ])('reads each $name field by its name together with its error', ({ name, dateName, timeName }) => {
        renderBlock(name, { dateError: 'Enter a date', timeError: 'Enter a time' });

        const dateInput = screen.getByRole('textbox', { name: dateName });
        const timeInput = screen.getByRole('textbox', { name: timeName });

        expect(dateInput).toHaveAccessibleDescription('Enter a date');
        expect(dateInput).toHaveAttribute('aria-invalid', 'true');
        expect(timeInput).toHaveAccessibleDescription('Enter a time');
        expect(timeInput).toHaveAttribute('aria-invalid', 'true');
    });

    it('describes neither field when there is no error', () => {
        renderBlock('start', {});

        const dateInput = screen.getByRole('textbox', { name: 'Start date' });
        const timeInput = screen.getByRole('textbox', { name: 'Start time' });

        expect(dateInput).toHaveAccessibleDescription('');
        expect(timeInput).toHaveAccessibleDescription('');
        expect(dateInput).not.toHaveAttribute('aria-invalid', 'true');
    });
});
