import type { ComponentProps } from 'react';

import { render, screen } from '@testing-library/react';

import { IcPencil } from '@proton/icons/icons/IcPencil';

import LumoAgentPanel from './LumoAgentPanel';
import type { LumoAgentItem } from './types';

const userTurn: LumoAgentItem = { id: 1, kind: 'user', text: 'move the invoices to archive' };
const reply: LumoAgentItem = { id: 2, kind: 'reply', text: 'Done.' };
const pendingConfirm: LumoAgentItem = {
    id: 3,
    kind: 'confirm',
    action: { type: 'move_items', target: 'Archive' },
    labels: { m1: 'Invoice' },
    status: 'pending',
};

const baseProps: ComponentProps<typeof LumoAgentPanel> = {
    items: [],
    isBusy: false,
    isAtToolLimit: false,
    cardRenderers: { move_items: { icon: IcPencil, title: () => 'Move 1 email to Archive' } },
    onSend: jest.fn(),
    onStop: jest.fn(),
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
    onResume: jest.fn(),
    onDismissToolLimit: jest.fn(),
};

const renderPanel = (props: Partial<ComponentProps<typeof LumoAgentPanel>>) =>
    render(<LumoAgentPanel {...baseProps} {...props} />);

const thinkingIndicator = () => screen.queryByText('Thinking about this');
const idleMark = (container: HTMLElement) => container.querySelector('.lumo-agent-avatar');

// JSDOM implements no scrolling; the transcript scrolls itself on every item change.
beforeAll(() => {
    Element.prototype.scrollTo = jest.fn();
});

describe('LumoAgentPanel', () => {
    it('shows the idle mark and no activity indicator once a turn has finished', () => {
        const { container } = renderPanel({ items: [userTurn, reply] });

        expect(thinkingIndicator()).toBeNull();
        expect(idleMark(container)).not.toBeNull();
    });

    it('shows the activity indicator while the chain is running', () => {
        const { container } = renderPanel({ items: [userTurn], isBusy: true });

        expect(thinkingIndicator()).not.toBeNull();
        expect(idleMark(container)).toBeNull();
    });

    it('stops claiming to think while a confirm card is waiting on the user', () => {
        const { container } = renderPanel({ items: [userTurn, pendingConfirm], isBusy: true });

        expect(thinkingIndicator()).toBeNull();
        expect(idleMark(container)).not.toBeNull();
        expect(screen.getByText('Move 1 email to Archive')).not.toBeNull();
    });

    it('offers stop only while the chain is actually running', () => {
        renderPanel({ items: [userTurn], isBusy: true });

        expect(screen.getByRole('button', { name: 'Stop' })).not.toBeNull();
    });

    it('drops the stop button while a confirm card is waiting on the user', () => {
        renderPanel({ items: [userTurn, pendingConfirm], isBusy: true });

        expect(screen.queryByRole('button', { name: 'Stop' })).toBeNull();
    });
});
