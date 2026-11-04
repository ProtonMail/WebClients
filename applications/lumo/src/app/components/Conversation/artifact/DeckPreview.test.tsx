import { render, screen } from '@testing-library/react';

import { SLIDES_EVAL_FIXTURES } from '../../../util/slides/eval/slidesEvalFixtures';
import { DeckPreview } from './DeckPreview';
import type { ParsedArtifact } from './parseArtifacts';

jest.mock('../../../redux/hooks', () => {
    return {
        useLumoSelector: () => {
            return {};
        },
    };
});

jest.mock('../../../providers/ConversationActionsProvider', () => {
    return {
        useConversationActions: () => {
            return { handleSendArtifactAction: jest.fn() };
        },
    };
});

const northwind = SLIDES_EVAL_FIXTURES.find((item) => {
    return item.id === 'northwind-q3';
})!;

const deckArtifact = (content: string): ParsedArtifact => {
    return { id: 'deck', type: 'presentation', title: 'Northwind Q3', content };
};

describe('DeckPreview', () => {
    const originalResizeObserver = window.ResizeObserver;

    beforeEach(() => {
        // The global mock never reports a size; this one reports the element once it is observed.
        window.ResizeObserver = jest.fn().mockImplementation((callback: ResizeObserverCallback) => {
            return {
                observe: (element: HTMLElement) => {
                    Object.defineProperty(element, 'clientWidth', { configurable: true, value: 800 });
                    callback([], {} as ResizeObserver);
                },
                unobserve: jest.fn(),
                disconnect: jest.fn(),
            };
        });
    });

    afterEach(() => {
        window.ResizeObserver = originalResizeObserver;
    });

    it('draws the slides once a deck that could not be read yet becomes readable', () => {
        // A deck streaming in starts as `{`, which can't be read until its first slide arrives.
        const { rerender } = render(<DeckPreview artifact={deckArtifact('{')} />);
        expect(screen.getByText("This slide deck couldn't be read.")).toBeInTheDocument();

        rerender(<DeckPreview artifact={deckArtifact(JSON.stringify(northwind.modelOutput))} />);

        expect(screen.getByText('Slide 1')).toBeInTheDocument();
        expect(screen.getByText('Highlights')).toBeInTheDocument();
    });
});
