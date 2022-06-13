import { render } from '@testing-library/react';

import { Basic } from './VerticalSteps.stories';

describe('<VerticalSteps /> with Basic render', () => {
    it('should display 4 steps', () => {
        const { container } = render(<Basic />);
        expect(container.querySelectorAll('li')).toHaveLength(4);
    });

    it('should display icons', () => {
        const { container } = render(<Basic />);
        expect(container.querySelectorAll('li > svg')).toHaveLength(4);
    });

    it('should display titles', () => {
        const { container } = render(<Basic />);
        const titles = container.querySelectorAll('.steps-vertical-item-text > span:first-child');
        expect(titles).toHaveLength(4);
        expect(titles[0].textContent).toBe('Choose a username');
        expect(titles[1].textContent).toBe('Today: get instant access');
        expect(titles[2].textContent).toBe('Day 24: Trial end reminder');
        expect(titles[3].textContent).toBe('Day 30: Trial ends');
    });

    it('should display descriptions', () => {
        const { container } = render(<Basic />);
        const descriptions = container.querySelectorAll('.steps-vertical-item-text > span:last-child');
        expect(descriptions).toHaveLength(4);
        expect(descriptions[0].textContent).toBe('You successfully selected your new email address.');
        expect(descriptions[1].textContent).toBe('15 GB secure mailbox with unlimited personalisation.');
        expect(descriptions[2].textContent).toBe('We’ll send you a notice. Cancel anytime.');
        expect(descriptions[3].textContent).toBe('Your subscription will start Jan 16th. Cancel anytime before.');
    });
});
