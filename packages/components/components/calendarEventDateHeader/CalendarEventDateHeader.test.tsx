import { render, screen } from '@testing-library/react';
import { enUS, pt } from 'date-fns/locale';

import CalendarEventDateHeader from './CalendarEventDateHeader';

describe('CalendarEventDateHeader', () => {
    describe('should format properly all-day events', () => {
        it('for single-day events', () => {
            render(
                <CalendarEventDateHeader
                    startDate={new Date(Date.UTC(2021, 10, 2))}
                    endDate={new Date(Date.UTC(2021, 10, 3))}
                    isAllDay
                    hasFakeUtcDates
                    formatOptions={{ locale: enUS }}
                />
            );

            expect(screen.getByText(/Nov/)).toHaveTextContent('Tue, Nov 2, 2021');
        });

        it('for multi-day events', () => {
            render(
                <CalendarEventDateHeader
                    startDate={new Date(2021, 10, 2)}
                    endDate={new Date(2021, 10, 3)}
                    isAllDay
                    hasModifiedAllDayEndDate
                    formatOptions={{ locale: enUS }}
                />
            );
            expect(screen.getAllByText(/Nov/)[0]).toHaveTextContent('Tue, Nov 2, 2021');
            expect(screen.getAllByText(/Nov/)[1]).toHaveTextContent('Wed, Nov 3, 2021');
        });
    });

    describe('should format properly part-day events', () => {
        it('for single-day events', () => {
            render(
                <CalendarEventDateHeader
                    startDate={new Date(2021, 10, 2, 12, 0)}
                    endDate={new Date(2021, 10, 2, 16, 30)}
                    isAllDay={false}
                    formatOptions={{ locale: enUS }}
                />
            );
            const time = screen.getByTestId('calendar-event-header:time-same-day');
            expect(time.textContent).toEqual('Tue, Nov 2, 2021, 12:00 PM–4:30 PM');
        });

        it('for multi-day events', () => {
            render(
                <CalendarEventDateHeader
                    startDate={new Date(Date.UTC(2021, 10, 2, 12, 0))}
                    endDate={new Date(Date.UTC(2021, 10, 3, 0, 30))}
                    isAllDay={false}
                    hasFakeUtcDates
                    formatOptions={{ locale: enUS }}
                />
            );

            const time = screen.getByTestId('calendar-event-header:time');
            expect(time.textContent).toEqual('Tue, Nov 2, 2021 12:00 PM–Wed, Nov 3, 2021 12:30 AM');
        });
    });

    describe('should format in other locales', () => {
        it('for all-day events', () => {
            render(
                <CalendarEventDateHeader
                    startDate={new Date(Date.UTC(2021, 10, 2))}
                    endDate={new Date(Date.UTC(2021, 10, 2))}
                    isAllDay
                    hasFakeUtcDates
                    hasModifiedAllDayEndDate
                    formatOptions={{ locale: pt }}
                />
            );

            expect(screen.getByText(/nov/)).toHaveTextContent('ter, 2 de nov de 2021');
        });

        it('for part-day events', () => {
            render(
                <CalendarEventDateHeader
                    startDate={new Date(2021, 10, 2, 12, 0)}
                    endDate={new Date(2021, 10, 2, 16, 30)}
                    isAllDay={false}
                    formatOptions={{ locale: pt }}
                />
            );

            const time = screen.getByTestId('calendar-event-header:time-same-day');
            expect(time.textContent).toEqual('ter, 2 de nov de 2021, 12:00–16:30');
        });
    });
});
