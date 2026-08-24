import { render, screen } from '@testing-library/react';

import { IcPencil } from '@proton/icons/icons/IcPencil';
import type { ActionRequest } from '@proton/llm/lib/lumoAgent/contracts/types';

import ResultTile from './ResultTile';
import type { CardRenderer } from './types';

const action: ActionRequest = { type: 'move_items', target: 'Archive' };

const withDetail: CardRenderer = {
    icon: IcPencil,
    title: () => 'Move 1 email to Archive',
    detail: () => '2 emails',
};

const withoutDetail: CardRenderer = {
    icon: IcPencil,
    title: () => 'Move 1 email to Archive',
};

describe('ResultTile', () => {
    it('expands the renderer detail behind a disclosure', () => {
        const { container } = render(<ResultTile renderer={withDetail} action={action} labels={{}} status="applied" />);

        expect(container.querySelector('details')).not.toBeNull();
        expect(screen.getByText('2 emails')).toBeInTheDocument();
        expect(container.querySelector('svg.color-success')).not.toBeNull();
    });

    // The status mark is the only thing separating a cancelled receipt from an applied one.
    it('marks a cancelled action apart from an applied one', () => {
        const { container } = render(
            <ResultTile renderer={withDetail} action={action} labels={{}} status="cancelled" />
        );

        expect(container.querySelector('.lumo-agent-result-tile.is-cancelled')).not.toBeNull();
        expect(container.querySelector('svg.color-success')).toBeNull();
        expect(container.querySelector('svg.color-weak')).not.toBeNull();
    });

    it('renders a plain row when the renderer has no detail to reveal', () => {
        const { container } = render(
            <ResultTile renderer={withoutDetail} action={action} labels={{}} status="applied" />
        );

        expect(container.querySelector('details')).toBeNull();
        expect(screen.getByText('Move 1 email to Archive')).toBeInTheDocument();
    });
});
