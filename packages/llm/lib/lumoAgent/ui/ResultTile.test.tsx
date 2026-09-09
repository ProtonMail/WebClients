import { render, screen } from '@testing-library/react';

import { IcPencil } from '@proton/icons/icons/IcPencil';
import sentenceValue from '@proton/lumo-ui/primitives/sentenceValue';

import type { ActionRequest } from '../contracts/types';
import ResultTile from './ResultTile';
import type { CardRenderer } from './types';
import { ConfirmStatus } from './types';

const action: ActionRequest = { type: 'move_items', target: 'Archive' };

const withDetail: CardRenderer = {
    icon: IcPencil,
    sentence: (settled) => ['Move 1 email to ', sentenceValue(String(settled.target))],
    detail: () => '2 emails',
};

const withoutDetail: CardRenderer = {
    icon: IcPencil,
    sentence: () => 'Move 1 email to Archive',
};

describe('ResultTile', () => {
    it('expands the renderer detail behind a disclosure', () => {
        const { container } = render(
            <ResultTile renderer={withDetail} action={action} labels={{}} status={ConfirmStatus.APPLIED} />
        );

        expect(container.querySelector('details')).not.toBeNull();
        expect(screen.getByText('2 emails')).toBeInTheDocument();
        expect(container.querySelector('svg.color-success')).not.toBeNull();
    });

    // The status mark is the only thing separating a cancelled receipt from an applied one.
    it('marks a cancelled action apart from an applied one', () => {
        const { container } = render(
            <ResultTile renderer={withDetail} action={action} labels={{}} status={ConfirmStatus.CANCELLED} />
        );

        expect(container.querySelector('.lumo-agent-result-tile.is-cancelled')).not.toBeNull();
        expect(container.querySelector('svg.color-success')).toBeNull();
        expect(container.querySelector('svg.color-weak')).not.toBeNull();
    });

    // The whole point of the failed status: a change the mailbox refused must not wear a success mark.
    it('marks a failed action apart from an applied one', () => {
        const { container } = render(
            <ResultTile renderer={withDetail} action={action} labels={{}} status={ConfirmStatus.FAILED} />
        );

        expect(container.querySelector('.lumo-agent-result-tile.is-failed')).not.toBeNull();
        expect(container.querySelector('svg.color-success')).toBeNull();
        expect(container.querySelector('svg.color-danger')).not.toBeNull();
    });

    it('renders a plain row when the renderer has no detail to reveal', () => {
        const { container } = render(
            <ResultTile renderer={withoutDetail} action={action} labels={{}} status={ConfirmStatus.APPLIED} />
        );

        expect(container.querySelector('details')).toBeNull();
        expect(screen.getByText('Move 1 email to Archive')).toBeInTheDocument();
    });

    // The row clips, so the sentence has to reach the `title` as text. The sentence is a node with its
    // values emphasised, which is exactly what an attribute cannot hold.
    it('carries the whole sentence, emphasis included, into the row title', () => {
        const { container } = render(
            <ResultTile
                renderer={{ icon: IcPencil, sentence: withDetail.sentence }}
                action={action}
                labels={{}}
                status={ConfirmStatus.APPLIED}
            />
        );

        expect(container.querySelector('.lumo-agent-result-tile span[title]')).toHaveAttribute(
            'title',
            'Move 1 email to Archive'
        );
    });
});
