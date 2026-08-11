import { render, screen } from '@testing-library/react';

import { enGBLocale, enUSLocale } from '@proton/shared/lib/i18n/dateFnLocales';
import { setDateLocales } from '@proton/shared/lib/i18n/index';

import { LastChanged } from './LastChanged';

describe('LastChanged', () => {
    beforeEach(() => {
        jest.useFakeTimers().setSystemTime(new Date(2026, 5, 15));
    });

    afterEach(() => {
        jest.useRealTimers();
        setDateLocales({ dateLocale: enUSLocale });
    });

    it('renders nothing without a date', () => {
        const { container } = render(<LastChanged date={null} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('omits the year for dates in the current year', () => {
        render(<LastChanged date={new Date(2026, 7, 10, 10, 38)} data-testid="last-changed" />);

        expect(screen.getByTestId('last-changed')).toHaveTextContent('Last changed Aug 10');
    });

    it('includes the year for dates in other years', () => {
        render(<LastChanged date={new Date(2024, 2, 2, 10, 38)} data-testid="last-changed" />);

        expect(screen.getByTestId('last-changed')).toHaveTextContent('Last changed Mar 2, 2024');
    });

    it('always spells out the full date and time in the title', () => {
        const { rerender } = render(<LastChanged date={new Date(2026, 7, 10, 10, 38)} data-testid="last-changed" />);
        expect(screen.getByTestId('last-changed')).toHaveAttribute('title', 'Last changed Aug 10, 2026, 10:38 AM');

        rerender(<LastChanged date={new Date(2024, 2, 2, 22, 5)} data-testid="last-changed" />);
        expect(screen.getByTestId('last-changed')).toHaveAttribute('title', 'Last changed Mar 2, 2024, 10:05 PM');
    });

    it("follows the user's date and time format settings", () => {
        // `dateLocale` is built from the user settings, en-GB puts the day first and uses 24h time
        setDateLocales({ dateLocale: enGBLocale });
        render(<LastChanged date={new Date(2026, 7, 10, 22, 5)} data-testid="last-changed" />);

        const element = screen.getByTestId('last-changed');
        expect(element).toHaveTextContent('Last changed 10 Aug');
        expect(element).toHaveAttribute('title', 'Last changed 10 Aug 2026, 22:05');
    });

    it('merges the given class name with the default styling', () => {
        render(<LastChanged date={new Date(2026, 7, 10)} className="block mt-2" data-testid="last-changed" />);

        expect(screen.getByTestId('last-changed')).toHaveClass('text-sm', 'color-weak', 'block', 'mt-2');
    });
});
