import { render } from '@testing-library/react';

import { LumoMetricCardRow } from './LumoMetricCardRow';

const metricFence = (title: string) => ({
    language: 'card',
    code: JSON.stringify({ type: 'metric', title, value: '1', direction: 'up' }),
});

describe('LumoMetricCardRow', () => {
    it('renders one cell per metric card', () => {
        const { container } = render(<LumoMetricCardRow cards={[metricFence('A'), metricFence('B')]} />);

        expect(container.querySelectorAll('.lumo-insight-card--metric')).toHaveLength(2);
        expect(container.querySelector('.lumo-metric-card-row--2')).not.toBeNull();
    });

    it('sizes the grid from the cards that parse, ignoring malformed ones', () => {
        const cards = [metricFence('A'), { language: 'card', code: '{ "type": "metric", "title": "B"' }];

        const { container } = render(<LumoMetricCardRow cards={cards} />);

        expect(container.querySelectorAll('.lumo-insight-card--metric')).toHaveLength(1);
        expect(container.querySelector('.lumo-metric-card-row--1')).not.toBeNull();
    });

    it('renders nothing when no card parses and no card is streaming', () => {
        const { container } = render(<LumoMetricCardRow cards={[{ language: 'card', code: 'not json' }]} />);

        expect(container).toBeEmptyDOMElement();
    });

    it('keeps a skeleton slot while the next card streams in', () => {
        const { container } = render(<LumoMetricCardRow cards={[metricFence('A')]} pendingSlot />);

        expect(container.querySelectorAll('.lumo-insight-card--skeleton')).toHaveLength(1);
        expect(container.querySelector('.lumo-metric-card-row--2')).not.toBeNull();
    });
});
