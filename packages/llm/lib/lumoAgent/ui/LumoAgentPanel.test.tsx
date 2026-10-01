import type { ComponentProps } from 'react';

import type { RenderResult } from '@testing-library/react';
import { fireEvent, render, screen } from '@testing-library/react';

import { IcPencil } from '@proton/icons/icons/IcPencil';
import ItemCheckList from '@proton/lumo-ui/primitives/ItemCheckList';

import type { ActionRequest } from '../contracts/types';
import LumoAgentPanel from './LumoAgentPanel';
import type { CardBodyProps, LumoAgentItem } from './types';
import { ConfirmStatus } from './types';

const userTurn: LumoAgentItem = { id: 1, kind: 'user', text: 'move the invoices to archive' };
const reply: LumoAgentItem = { id: 2, kind: 'reply', text: 'Done.' };
const pendingConfirm: LumoAgentItem = {
    id: 3,
    kind: 'confirm',
    action: { type: 'move_items', target: 'Archive' },
    labels: { m1: { title: 'Invoice' } },
    status: ConfirmStatus.PENDING,
};

const suggestions = [
    {
        id: 'organise',
        icon: IcPencil,
        getTitle: () => 'Tidy up my inbox',
        getDescription: () => "I'll suggest folders and filters. Nothing moves until you agree.",
        getPrompt: () => 'Suggest how to organise my inbox',
    },
];

const baseProps: ComponentProps<typeof LumoAgentPanel> = {
    items: [],
    isBusy: false,
    toolLimit: null,
    cardRenderers: { move_items: { icon: IcPencil, sentence: () => 'Move 1 email to Archive' } },
    onSend: jest.fn(),
    onStop: jest.fn(),
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
    onResume: jest.fn(),
    onDismissToolLimit: jest.fn(),
};

const panelWith = (props: Partial<ComponentProps<typeof LumoAgentPanel>>) => (
    <LumoAgentPanel {...baseProps} {...props} />
);

const renderPanel = (props: Partial<ComponentProps<typeof LumoAgentPanel>>) => render(panelWith(props));

const thinkingIndicator = () => screen.queryByText('Thinking about this');
const idleMark = (container: HTMLElement) => container.querySelector('.lumo-agent-avatar');

beforeAll(() => {
    Element.prototype.scrollTo = jest.fn();
});

const TRANSCRIPT_HEIGHT = 400;
const CONTENT_HEIGHT = 1000;
const PINNED_CARD_HEIGHT = 150;
const AT_BOTTOM = CONTENT_HEIGHT - TRANSCRIPT_HEIGHT;

const layOutTranscript = (container: HTMLElement, clientHeight: number, scrollTop: number) => {
    const transcript = container.querySelector('.lumo-agent-transcript')!;
    Object.defineProperties(transcript, {
        scrollHeight: { configurable: true, value: CONTENT_HEIGHT },
        clientHeight: { configurable: true, value: clientHeight },
        scrollTop: { configurable: true, value: scrollTop },
    });
    fireEvent.scroll(transcript);
};

const userScrollsTranscriptTo = (container: HTMLElement, scrollTop: number) =>
    layOutTranscript(container, TRANSCRIPT_HEIGHT, scrollTop);

// The browser clamps scrollTop to the taller transcript's new bottom and fires scroll with no user input.
const pinnedCardCloses = (container: HTMLElement) => {
    const grownHeight = TRANSCRIPT_HEIGHT + PINNED_CARD_HEIGHT;
    layOutTranscript(container, grownHeight, CONTENT_HEIGHT - grownHeight);
};

const userScrollsUpFromBottom = (container: HTMLElement) => {
    userScrollsTranscriptTo(container, AT_BOTTOM);
    userScrollsTranscriptTo(container, AT_BOTTOM - 10);
};

const streamingReply = (text: string): LumoAgentItem => ({ ...reply, text });

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

    // The sentence has to follow the body's live params, not the proposal: a card that says "3 emails"
    // over an emptied selection is the exact misreport the design exists to stop.
    it("counts the card body's current params in the sentence, not the proposed action", () => {
        const cardRenderers = {
            move_items: {
                icon: IcPencil,
                sentence: (action: ActionRequest) => `Move ${(action.ids as string[]).length} emails`,
                renderBody: ({ action, params, onChange }: CardBodyProps) => (
                    <ItemCheckList
                        items={(action.ids as string[]).map((id) => ({ id, label: id }))}
                        selectedIds={params.ids}
                        onToggle={(id, checked) =>
                            onChange({
                                ...params,
                                ids: checked
                                    ? [...params.ids, id]
                                    : (params.ids as string[]).filter((kept) => kept !== id),
                            })
                        }
                    />
                ),
            },
        };
        const proposal: LumoAgentItem = {
            ...pendingConfirm,
            action: { type: 'move_items', ids: ['m1', 'm2'], target: 'Archive' },
        };

        renderPanel({ items: [userTurn, proposal], cardRenderers });
        expect(screen.getByText('Move 2 emails')).toBeInTheDocument();

        fireEvent.click(screen.getAllByRole('checkbox')[0]);
        expect(screen.getByText('Move 1 emails')).toBeInTheDocument();
    });

    it('names the steps taken and the last one on the tool-limit card', () => {
        renderPanel({ items: [userTurn], toolLimit: { steps: 10, activity: 'Found 12 emails' } });

        expect(screen.getByText(/10 steps/)).toBeInTheDocument();
        expect(screen.getByText('Found 12 emails')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Keep going' })).toBeInTheDocument();
    });

    // The empty state is the whole feature: cards teach a first-time user, and must be gone the moment
    // there is a conversation to read instead.
    it('offers the suggestion cards only while the transcript is empty', () => {
        const { rerender } = renderPanel({ items: [], suggestions });
        expect(screen.getByRole('button', { name: /Tidy up my inbox/ })).toBeInTheDocument();

        rerender(panelWith({ items: [userTurn], suggestions }));
        expect(screen.queryByRole('button', { name: /Tidy up my inbox/ })).toBeNull();
    });

    // Protects the Drive/file-preview consumer, which passes no suggestions and must get a bare panel.
    it('renders no empty state for a product that supplies no suggestions', () => {
        const { container } = renderPanel({ items: [] });

        expect(container.querySelector('.lumo-welcome')).toBeNull();
    });

    it('closes off Confirm while the card body has nothing to apply', () => {
        const canApply = (params: Record<string, any>) => (params.ids as string[]).length > 0;
        const cardRenderers = { move_items: { icon: IcPencil, sentence: () => 'Move emails', canApply } };
        const emptySelection: LumoAgentItem = {
            ...pendingConfirm,
            action: { type: 'move_items', ids: [], target: 'Archive' },
        };

        renderPanel({ items: [userTurn, emptySelection], cardRenderers, isBusy: true });

        expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled();
    });

    describe('following the stream', () => {
        const scrollToMock = () => jest.mocked(Element.prototype.scrollTo);

        const midStream = () => panelWith({ items: [userTurn, streamingReply('Look')], isBusy: true });
        const nextToken = () => panelWith({ items: [userTurn, streamingReply('Looking')], isBusy: true });

        const detach = (view: RenderResult) => {
            userScrollsUpFromBottom(view.container);
            scrollToMock().mockClear();
            return view;
        };

        it('leaves the user where they scrolled while tokens keep arriving', () => {
            const { rerender } = detach(render(midStream()));

            rerender(nextToken());

            expect(scrollToMock()).not.toHaveBeenCalled();
        });

        it('follows again once the user scrolls back to the bottom', () => {
            const { container, rerender } = detach(render(midStream()));

            userScrollsTranscriptTo(container, AT_BOTTOM);
            rerender(nextToken());

            expect(scrollToMock()).toHaveBeenCalled();
        });

        it('snaps back to the newest turn when the user sends a message', () => {
            const { rerender } = detach(renderPanel({ items: [userTurn, streamingReply('Look')] }));

            fireEvent.change(screen.getByRole('textbox'), { target: { value: 'and the receipts' } });
            fireEvent.click(screen.getByRole('button', { name: 'Send' }));
            rerender(nextToken());

            expect(scrollToMock()).toHaveBeenCalled();
        });

        it('snaps back to the newest turn when the user picks a suggestion', () => {
            const { rerender } = detach(renderPanel({ items: [], suggestions }));

            fireEvent.click(screen.getByRole('button', { name: /Tidy up my inbox/ }));
            rerender(nextToken());

            expect(scrollToMock()).toHaveBeenCalled();
        });

        it('keeps following after the confirm card resolves and the transcript grows', () => {
            const appliedConfirm: LumoAgentItem = { ...pendingConfirm, status: ConfirmStatus.APPLIED };
            const { container, rerender } = renderPanel({ items: [userTurn, pendingConfirm], isBusy: true });
            userScrollsTranscriptTo(container, AT_BOTTOM);

            rerender(panelWith({ items: [userTurn, appliedConfirm], isBusy: true }));
            pinnedCardCloses(container);
            scrollToMock().mockClear();
            rerender(panelWith({ items: [userTurn, appliedConfirm, streamingReply('Moved')], isBusy: true }));

            expect(scrollToMock()).toHaveBeenCalled();
        });

        it('keeps following after the user asks to keep going and the card closes', () => {
            const { container, rerender } = detach(
                renderPanel({ items: [userTurn, streamingReply('Look')], toolLimit: { steps: 10 } })
            );

            fireEvent.click(screen.getByRole('button', { name: 'Keep going' }));
            rerender(nextToken());
            pinnedCardCloses(container);
            scrollToMock().mockClear();
            rerender(panelWith({ items: [userTurn, streamingReply('Looking further')], isBusy: true }));

            expect(scrollToMock()).toHaveBeenCalled();
        });
    });
});
