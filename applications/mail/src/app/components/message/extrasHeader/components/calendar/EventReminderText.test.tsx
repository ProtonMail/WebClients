import { render, screen } from '@testing-library/react';

import type { EventReminderTextProps } from './EventReminderText';
import EventReminderText from './EventReminderText';

function renderComponent(props?: Partial<EventReminderTextProps>) {
    const defaultProps = {
        startDate: new Date(1969, 11, 31, 8, 9, 10),
        endDate: new Date(1969, 11, 31, 8, 9, 10),
        isAllDay: false,
    };

    return <EventReminderText {...defaultProps} {...props} />;
}

describe('EventReminderText', () => {
    const fakeNow = new Date(1969, 11, 31, 7, 58, 10);

    beforeEach(() => {
        jest.useFakeTimers().setSystemTime(fakeNow.getTime());
    });

    afterEach(() => {
        jest.clearAllTimers();
    });

    it('displays the time remaining until event', () => {
        const { rerender } = render(renderComponent());

        expect(screen.getByText(/Event starts in 11 minutes/)).toBeInTheDocument();

        rerender(
            renderComponent({
                isAllDay: true,
                startDate: new Date(1970, 0, 1),
                endDate: new Date(1970, 0, 2),
            })
        );

        expect(screen.getByText(/Event is tomorrow/)).toBeInTheDocument();

        rerender(
            renderComponent({
                isAllDay: true,
                startDate: new Date(1970, 0, 1),
                endDate: new Date(1970, 0, 3),
            })
        );

        expect(screen.getByText(/Event starts tomorrow/)).toBeInTheDocument();
    });

    it('displays an alert for events starting now', () => {
        const { rerender } = render(
            renderComponent({
                startDate: new Date(1969, 11, 31, 7, 58, 30),
                endDate: new Date(1969, 11, 31, 8, 9, 10),
                isAllDay: false,
            })
        );

        expect(screen.getByText(/Event starting now/)).toBeInTheDocument();

        rerender(
            renderComponent({
                startDate: new Date(1969, 11, 31, 7, 58, 0),
                endDate: new Date(1969, 11, 31, 8, 9, 10),
                isAllDay: false,
            })
        );

        expect(screen.getByText(/Event in progress/)).toBeInTheDocument();
    });

    it('displays an alert for events that already happened', () => {
        const { rerender } = render(
            renderComponent({
                startDate: new Date(1969, 11, 31, 5, 9, 10),
                endDate: new Date(1969, 11, 31, 6, 8, 10),
            })
        );

        expect(screen.getByText(/Event already ended/)).toBeInTheDocument();

        const endedEventCommonProps = {
            isAllDay: true,
            start: new Date(1969, 10, 11),
        };

        rerender(
            renderComponent({
                ...endedEventCommonProps,
                endDate: new Date(1969, 10, 12),
            })
        );

        expect(screen.getByText(/Event already ended/)).toBeInTheDocument();
    });

    it('displays an alert for ongoing events', () => {
        const { rerender } = render(
            renderComponent({
                startDate: new Date(1969, 11, 31, 6, 58, 10),
                endDate: new Date(1969, 11, 31, 8, 58, 10),
            })
        );

        expect(screen.getByText(/Event in progress/)).toBeInTheDocument();

        rerender(
            renderComponent({
                isAllDay: true,
                startDate: new Date(1969, 11, 31),
                endDate: new Date(1970, 0, 1),
            })
        );

        expect(screen.getByText(/Event in progress/)).toBeInTheDocument();
    });

    it('does not display anything when out of range', () => {
        const { container, rerender } = render(
            renderComponent({
                startDate: new Date(1969, 11, 31, 9, 9, 10),
                endDate: new Date(1969, 11, 31, 9, 9, 10),
            })
        );

        expect(container).toBeEmptyDOMElement();

        rerender(
            renderComponent({
                isAllDay: true,
                startDate: new Date(1970, 0, 2),
                endDate: new Date(1970, 0, 3),
            })
        );

        expect(container).toBeEmptyDOMElement();
    });
});
