import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockUseAddresses } from '@proton/testing';

import CalendarSearchViewDayEvents from './CalendarSearchViewDayEvents';
import type { VisualSearchItem } from './interface';

jest.mock('@proton/components/hooks/useUser', () => () => [
    {
        hasPaidMail: true,
    },
    false,
]);

const dailyEvents = [
    {
        ID: 'z1atJaCep8olkfcWKkWxUz_t0wbXL6JXeVRZhSHD2JFjqz3xxKXVcNo4I-KdQCdxqAV_aAxuR4fASmIgTXfPzw==',
        CalendarID: 'ZJflPbyEpNUINXU4ES56y31KgmMO20zOzY6OB7gRCN_yLRY4YI-21AXCBBmUo-Sm2UFfHAx2GtTmQftN5bDNWA==',
        isAllDay: false,
        plusDaysToEnd: 0,
        Summary: 'Tataratatata',
        fakeUTCStartDate: new Date('2021-09-01T14:00:00.000Z'),
        fakeUTCEndDate: new Date('2021-09-01T14:30:00.000Z'),
        Organizer: { value: 'mailto:jovan@proton.me' },
        visualCalendar: {
            Color: '#415DF0',
        },
    },
    {
        ID: 'sDg73oEngnm_5U7Wkl1V2ClOnND0xgY4GbicaN-0ZgrgDJfaKuvY1XdTORbb9Yy77DC7WzvH3sv6oT2lS1h80g==',
        CalendarID: 'ZJflPbyEpNUINXU4ES56y31KgmMO20zOzY6OB7gRCN_yLRY4YI-21AXCBBmUo-Sm2UFfHAx2GtTmQftN5bDNWA==',
        isAllDay: false,
        fakeUTCStartDate: new Date('2021-09-01T15:00:00.000Z'),
        fakeUTCEndDate: new Date('2021-09-01T15:30:00.000Z'),
        Summary: 'Testerere',
        plusDaysToEnd: 0,
        Organizer: { value: 'mailto:jovan@proton.me' },
        visualCalendar: {
            Color: '#415DF0',
        },
    },
] as unknown as VisualSearchItem[];

describe('CalendarSearchViewDayEvents', () => {
    beforeEach(() => {
        mockUseAddresses();
    });

    const dummyRef = () => {};

    it('should correctly displayed day events', () => {
        render(
            <CalendarSearchViewDayEvents
                dailyEvents={dailyEvents}
                onClickSearchItem={jest.fn()}
                closestToDateRef={dummyRef}
            />
        );

        expect(screen.getByText('1'));
        expect(screen.getByText('Wed, Sep 2021'));

        const events = screen.getAllByRole('button');
        expect(events).toHaveLength(2);

        const [first, second] = events;

        // first event
        expect(within(first).getByText('2:00 PM - 2:30 PM'));
        expect(within(first).getByText('Tataratatata'));

        // first event
        expect(within(second).getByText('3:00 PM - 3:30 PM'));
        expect(within(second).getByText('Testerere'));
    });

    describe('when the is no event', () => {
        const today = new Date('2023-07-17T13:30:00.000Z');
        beforeEach(() => {
            jest.useFakeTimers();
            jest.setSystemTime(today);
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should correctly render empty today line', () => {
            render(
                <CalendarSearchViewDayEvents
                    dailyEvents={[]}
                    onClickSearchItem={jest.fn()}
                    closestToDateRef={dummyRef}
                />
            );

            expect(screen.getByText('17'));
            expect(screen.getByText('Mon, Jul 2023'));
        });

        it('should set `aria-current` attribute', () => {
            render(
                <CalendarSearchViewDayEvents
                    dailyEvents={[]}
                    onClickSearchItem={jest.fn()}
                    closestToDateRef={dummyRef}
                />
            );
            expect(screen.getByTestId('month-day-block')).toHaveAttribute('aria-current', 'date');
        });
    });

    describe('when user click on an event', () => {
        it('should call `onClickSearchItem`', async () => {
            const onClickSearchItem = jest.fn();
            render(
                <CalendarSearchViewDayEvents
                    dailyEvents={dailyEvents}
                    onClickSearchItem={onClickSearchItem}
                    closestToDateRef={dummyRef}
                />
            );

            const events = screen.getAllByRole('button');

            const [first] = events;

            await userEvent.click(first);
            await waitFor(() => {
                expect(onClickSearchItem).toHaveBeenCalledTimes(1);
            });
            // first callback argument is a react event
            expect(onClickSearchItem.mock.calls[0][1]).toStrictEqual(dailyEvents[0]);
        });
    });

    describe('when an event is cancelled', () => {
        it('should render event without striked text', () => {
            const cancelledEvent = {
                Status: 'CANCELLED',
                ID: 'sDg73oEngnm_5U7Wkl1V2ClOnND0xgY4GbicaN-0ZgrgDJfaKuvY1XdTORbb9Yy77DC7WzvH3sv6oT2lS1h80g==',
                CalendarID: 'ZJflPbyEpNUINXU4ES56y31KgmMO20zOzY6OB7gRCN_yLRY4YI-21AXCBBmUo-Sm2UFfHAx2GtTmQftN5bDNWA==',
                isAllDay: false,
                fakeUTCStartDate: new Date('2021-09-01T15:00:00.000Z'),
                fakeUTCEndDate: new Date('2021-09-01T15:30:00.000Z'),
                Summary: 'Testerere',
                plusDaysToEnd: 0,
                Organizer: { value: 'mailto:mike@proton.me' },
                visualCalendar: {
                    Color: '#415DF0',
                },
            } as unknown as VisualSearchItem;

            render(
                <CalendarSearchViewDayEvents
                    dailyEvents={[cancelledEvent]}
                    onClickSearchItem={jest.fn()}
                    closestToDateRef={dummyRef}
                />
            );

            const event = screen.getByRole('button');
            expect(event).toBeInTheDocument();
            expect(event).toHaveClass('text-strike');
        });
    });

    describe('when an invite is unanswered', () => {
        it('should render event correct border', () => {
            const inviteEvent = {
                ID: 'z1atJaCep8olkfcWKkWxUz_t0wbXL6JXeVRZhSHD2JFjqz3xxKXVcNo4I-KdQCdxqAV_aAxuR4fASmIgTXfPzw==',
                CalendarID: 'ZJflPbyEpNUINXU4ES56y31KgmMO20zOzY6OB7gRCN_yLRY4YI-21AXCBBmUo-Sm2UFfHAx2GtTmQftN5bDNWA==',
                isAllDay: false,
                plusDaysToEnd: 0,
                Summary: 'Tataratatata',
                fakeUTCStartDate: new Date('2021-09-01T14:00:00.000Z'),
                fakeUTCEndDate: new Date('2021-09-01T14:30:00.000Z'),
                Organizer: { value: 'mailto:mike@proton.me' },
                Attendees: [
                    {
                        value: 'mailto:jovan@proton.me',
                        parameters: {
                            cn: 'jovan@proton.me',
                            role: 'REQ-PARTICIPANT',
                            rsvp: 'TRUE',
                            partstat: 'NEEDS-ACTION',
                        },
                    },
                ],
                visualCalendar: {
                    Color: '#415DF0',
                },
            } as unknown as VisualSearchItem;

            render(
                <CalendarSearchViewDayEvents
                    dailyEvents={[inviteEvent]}
                    onClickSearchItem={jest.fn()}
                    closestToDateRef={dummyRef}
                />
            );

            const event = screen.getByRole('button');
            expect(event).toBeInTheDocument();
            expect(event.firstChild).toHaveClass('isUnanswered');
        });
    });
});
