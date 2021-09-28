import React from 'react';
import { render, screen } from '@testing-library/react';
import MiniCalendar from './MiniCalendar';

describe('MiniCalendar', () => {
    const getFakeNow = () => new Date(Date.UTC(2021, 0, 1, 0, 0, 0));

    beforeAll(() => {
        jest.useFakeTimers('modern').setSystemTime(getFakeNow().getTime());
    });

    it('disables today button if out of range', async () => {
        const { rerender } = render(<MiniCalendar date={getFakeNow()} hasToday min={getFakeNow()} />);

        expect(screen.getByTestId(/minicalendar:today/)).not.toBeDisabled();

        const fakeTomorrow = getFakeNow();
        fakeTomorrow.setUTCDate(getFakeNow().getUTCDate() + 1);
        rerender(<MiniCalendar date={getFakeNow()} hasToday min={fakeTomorrow} />);

        expect(screen.getByTestId(/minicalendar:today/)).toBeDisabled();

        const fakeYesterday = getFakeNow();
        fakeYesterday.setUTCDate(getFakeNow().getUTCDate() - 1);
        rerender(<MiniCalendar date={getFakeNow()} hasToday max={fakeYesterday} />);

        expect(screen.getByTestId(/minicalendar:today/)).toBeDisabled();
    });
});
