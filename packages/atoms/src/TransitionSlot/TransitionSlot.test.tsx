import { render } from '@testing-library/react';

import { TransitionSlot } from './TransitionSlot';

describe('<TransitionSlot />', () => {
    const items = {
        loading: <span>spinner</span>,
        done: <span>check</span>,
    };

    it('renders every item, regardless of which is active', () => {
        const { getByText } = render(<TransitionSlot activeKey="loading" items={items} />);

        expect(getByText('spinner')).toBeInTheDocument();
        expect(getByText('check')).toBeInTheDocument();
    });

    it('marks only the active item as active and visible to assistive tech', () => {
        const { getByText } = render(<TransitionSlot activeKey="done" items={items} />);

        const active = getByText('check').parentElement;
        const inactive = getByText('spinner').parentElement;

        expect(active).toHaveClass('transition-slot-item--active');
        expect(active).toHaveAttribute('aria-hidden', 'false');
        expect(inactive).not.toHaveClass('transition-slot-item--active');
        expect(inactive).toHaveAttribute('aria-hidden', 'true');
    });

    it('exposes timing knobs as CSS variables', () => {
        const { container } = render(
            <TransitionSlot activeKey="loading" items={items} duration="0.4s" scaleTransitionRatio={0.8} />
        );

        const root = container.querySelector('.transition-slot');

        expect(root).toHaveStyle({
            '--transition-slot-duration': '0.4s',
            '--transition-slot-scale-transition-ratio': '0.8',
        });
    });

    it('passes className', () => {
        const { container } = render(<TransitionSlot activeKey="loading" items={items} className="should-be-passed" />);

        expect(container.querySelector('.transition-slot')).toHaveClass('should-be-passed');
    });
});
