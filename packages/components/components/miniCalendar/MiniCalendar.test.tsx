import { fireEvent, render, screen } from '@testing-library/react';

import MiniCalendar from './MiniCalendar';

describe('MiniCalendar', () => {
    const getFakeNow = () => new Date(Date.UTC(2021, 0, 1, 0, 0, 0));

    beforeAll(() => {
        jest.useFakeTimers('modern').setSystemTime(getFakeNow().getTime());
    });

    it('disables today button when out of range', async () => {
        const { rerender } = render(<MiniCalendar date={getFakeNow()} hasToday min={getFakeNow()} />);

        const getTodayButton = () => screen.getByTestId(/minicalendar:today/);

        expect(getTodayButton()).not.toBeDisabled();

        const fakeTomorrow = getFakeNow();
        fakeTomorrow.setUTCDate(getFakeNow().getUTCDate() + 1);
        rerender(<MiniCalendar date={getFakeNow()} hasToday min={fakeTomorrow} />);

        expect(getTodayButton()).toBeDisabled();

        const fakeYesterday = getFakeNow();
        fakeYesterday.setUTCDate(getFakeNow().getUTCDate() - 1);
        rerender(<MiniCalendar date={getFakeNow()} hasToday max={fakeYesterday} />);

        expect(getTodayButton()).toBeDisabled();
    });

    it('disables month navigation when out of range', async () => {
        const { rerender } = render(<MiniCalendar date={getFakeNow()} min={getFakeNow()} max={getFakeNow()} />);

        const getPrevMonthButton = () => screen.getByTestId(/minicalendar:previous-month/);
        const getNextMonthButton = () => screen.getByTestId(/minicalendar:next-month/);

        expect(getPrevMonthButton()).toBeDisabled();
        expect(getNextMonthButton()).toBeDisabled();

        const fakeNextMonth = getFakeNow();
        const fakePrevMonth = getFakeNow();
        fakePrevMonth.setUTCMonth(getFakeNow().getUTCMonth() - 1);
        fakeNextMonth.setUTCMonth(getFakeNow().getUTCMonth() + 1);

        rerender(<MiniCalendar date={getFakeNow()} hasToday min={fakePrevMonth} max={fakeNextMonth} />);

        expect(getPrevMonthButton()).not.toBeDisabled();
        expect(getNextMonthButton()).not.toBeDisabled();

        fireEvent.click(getNextMonthButton());

        expect(getNextMonthButton()).toBeDisabled();

        fireEvent.click(getPrevMonthButton());
        fireEvent.click(getPrevMonthButton());

        expect(getPrevMonthButton()).toBeDisabled();
    });
});
