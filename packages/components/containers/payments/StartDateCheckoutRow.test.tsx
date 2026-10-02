import { render, screen } from '@testing-library/react';

import { getReadableTime } from '../../components/time/Time';
import StartDateCheckoutRow from './StartDateCheckoutRow';

describe('StartDateCheckoutRow', () => {
    it('names the info button with the start date as text', () => {
        const nextSubscriptionStart = 1793491200; // 1 Nov 2026
        const date = getReadableTime({ value: nextSubscriptionStart });

        render(<StartDateCheckoutRow nextSubscriptionStart={nextSubscriptionStart} />);

        expect(
            screen.getByRole('button', { name: `More info: The new subscription cycle starts on ${date}` })
        ).toBeInTheDocument();
        expect(screen.getByText(date, { selector: 'time' })).toBeInTheDocument();
        expect(screen.queryByText(/object Object/)).not.toBeInTheDocument();
    });
});
