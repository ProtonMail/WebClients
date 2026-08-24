import { useState } from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { format } from 'date-fns';

import { dateLocale } from '@proton/shared/lib/i18n';
import { SETTINGS_WEEK_START } from '@proton/shared/lib/interfaces/UserSettings';

import type { DateTimeFieldSpec } from './DateTimeBody';
import DateTimeBody from './DateTimeBody';

jest.mock('@proton/account/userSettings/hooks', () => ({
    useUserSettings: () => [{ WeekStart: SETTINGS_WEEK_START.MONDAY }, false],
}));

const wakeAt = new Date(2026, 7, 20, 9, 0);

const field = (param: string): DateTimeFieldSpec => ({
    param,
    dateLabel: `${param} date`,
    timeLabel: `${param} time`,
    fallback: () => wakeAt,
});

const renderBody = (fields: DateTimeFieldSpec[], params: Record<string, any>, onChange = jest.fn()) => {
    render(<DateTimeBody fields={fields} params={params} onChange={onChange} />);
    return onChange;
};

/** The body is controlled, so a second edit only sees the first one through a parent that feeds params back. */
const renderControlledBody = (fields: DateTimeFieldSpec[], initial: Record<string, any>) => {
    const onChange = jest.fn();
    const Harness = () => {
        const [params, setParams] = useState(initial);

        return (
            <DateTimeBody
                fields={fields}
                params={params}
                onChange={(next) => {
                    onChange(next);
                    setParams(next);
                }}
            />
        );
    };
    render(<Harness />);

    return onChange;
};

describe('DateTimeBody', () => {
    it('carries the time of day over to a newly picked date, on the field it belongs to', async () => {
        const onChange = renderBody([field('wake_at')], { ids: ['m1'], wake_at: wakeAt.toISOString() });
        const moved = new Date(2026, 7, 25, 9, 0);

        const dateInput = screen.getByLabelText('wake_at date');
        await userEvent.clear(dateInput);
        await userEvent.type(dateInput, format(moved, 'PP', { locale: dateLocale }));
        await userEvent.tab();

        expect(onChange).toHaveBeenCalledWith({ ids: ['m1'], wake_at: moved.toISOString() });
    });

    it.each([
        ['prose', 'tomorrow morning'],
        ['null', null],
        ['epoch millis', 1787000000000],
    ])('reports the fallback it displays, so a %s param is never the one confirmed', (_shape, raw) => {
        const onChange = renderBody([field('wake_at')], { ids: ['m1'], wake_at: raw });

        expect(onChange).toHaveBeenCalledWith({ ids: ['m1'], wake_at: wakeAt.toISOString() });
    });

    describe('a range rule the registering tool passes', () => {
        const futureOnly = (param: string): DateTimeFieldSpec => ({
            ...field(param),
            accepts: (date) => date > new Date(),
        });

        it('replaces a proposal it rejects, so the tool is never handed a value it can only refuse', () => {
            const onChange = renderBody([futureOnly('wake_at')], {
                ids: ['m1'],
                wake_at: new Date(2020, 0, 1, 9, 0).toISOString(),
            });

            expect(onChange).toHaveBeenCalledWith({ ids: ['m1'], wake_at: wakeAt.toISOString() });
        });

        it('keeps editing an out-of-range date the user picked, rather than snapping back to the fallback', async () => {
            const picked = new Date(2020, 0, 5);
            const onChange = renderControlledBody([futureOnly('wake_at')], {
                ids: ['m1'],
                wake_at: wakeAt.toISOString(),
            });

            const dateInput = screen.getByLabelText('wake_at date');
            await userEvent.clear(dateInput);
            await userEvent.type(dateInput, format(picked, 'PP', { locale: dateLocale }));
            await userEvent.tab();

            const timeInput = screen.getByLabelText('wake_at time');
            await userEvent.clear(timeInput);
            await userEvent.type(timeInput, format(new Date(2020, 0, 5, 8, 15), 'p', { locale: dateLocale }));
            await userEvent.tab();

            expect(onChange).toHaveBeenLastCalledWith({
                ids: ['m1'],
                wake_at: new Date(2020, 0, 5, 8, 15).toISOString(),
            });
        });
    });

    it('renders one pair per field, so a window gets a start and an end', () => {
        const { unmount } = render(<DateTimeBody fields={[field('wake_at')]} params={{}} onChange={jest.fn()} />);

        expect(screen.getAllByRole('textbox')).toHaveLength(2);
        unmount();

        renderBody([field('start_at'), field('end_at')], {});

        expect(screen.getAllByRole('textbox')).toHaveLength(4);
    });
});
