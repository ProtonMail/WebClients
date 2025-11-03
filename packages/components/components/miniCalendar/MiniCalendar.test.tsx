import { fireEvent, render, screen } from '@testing-library/react';

import MiniCalendar from './MiniCalendar';

describe('MiniCalendar', () => {
    const getFakeNow = () => new Date(Date.UTC(2021, 0, 1, 0, 0, 0));

    beforeAll(() => {
        jest.useFakeTimers().setSystemTime(getFakeNow().getTime());
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

    it('calls onDisplayedDaysChange when calendar is rendered', () => {
        const onDisplayedDaysChange = jest.fn();
        render(<MiniCalendar date={getFakeNow()} onDisplayedDaysChange={onDisplayedDaysChange} />);

        expect(onDisplayedDaysChange).toHaveBeenCalledTimes(1);
        expect(onDisplayedDaysChange).toHaveBeenCalledWith(expect.any(Array));

        const displayedDays = onDisplayedDaysChange.mock.calls[0][0];
        expect(displayedDays.length).toBeGreaterThan(0);
        expect(displayedDays[0]).toBeInstanceOf(Date);
    });

    it('calls onDisplayedDaysChange when month changes', () => {
        const onDisplayedDaysChange = jest.fn();
        render(<MiniCalendar date={getFakeNow()} onDisplayedDaysChange={onDisplayedDaysChange} />);

        expect(onDisplayedDaysChange).toHaveBeenCalledTimes(1);

        const getNextMonthButton = () => screen.getByTestId(/minicalendar:next-month/);
        fireEvent.click(getNextMonthButton());

        expect(onDisplayedDaysChange).toHaveBeenCalledTimes(2);

        const firstCallDays = onDisplayedDaysChange.mock.calls[0][0];
        const secondCallDays = onDisplayedDaysChange.mock.calls[1][0];

        expect(firstCallDays[0].getTime()).not.toBe(secondCallDays[0].getTime());
    });

    it('displays 6 weeks of days by default in onDisplayedDaysChange', () => {
        const onDisplayedDaysChange = jest.fn();
        render(<MiniCalendar date={getFakeNow()} onDisplayedDaysChange={onDisplayedDaysChange} />);

        const displayedDays = onDisplayedDaysChange.mock.calls[0][0];
        expect(displayedDays.length).toBe(42);
    });

    it('calls onMonthChange when navigating to different month', () => {
        const onMonthChange = jest.fn();
        render(<MiniCalendar date={getFakeNow()} onMonthChange={onMonthChange} />);

        const getNextMonthButton = () => screen.getByTestId(/minicalendar:next-month/);
        fireEvent.click(getNextMonthButton());

        expect(onMonthChange).toHaveBeenCalledTimes(1);
        expect(onMonthChange).toHaveBeenCalledWith(expect.any(Date));

        const calledDate = onMonthChange.mock.calls[0][0];
        expect(calledDate.getMonth()).toBe((getFakeNow().getMonth() + 1) % 12);
    });

    it('applies custom className from getDayClassName', () => {
        const getDayClassName = jest.fn((date: Date) => {
            return date.getDate() === 15 ? 'custom-day-class' : '';
        });

        render(<MiniCalendar date={getFakeNow()} getDayClassName={getDayClassName} />);

        expect(getDayClassName).toHaveBeenCalled();

        const daysWith15 = getDayClassName.mock.calls.filter((call) => call[0].getDate() === 15);
        expect(daysWith15.length).toBeGreaterThan(0);

        const day15Element = screen.getByText('15');
        expect(day15Element.parentElement).toHaveClass('custom-day-class');
    });
});
