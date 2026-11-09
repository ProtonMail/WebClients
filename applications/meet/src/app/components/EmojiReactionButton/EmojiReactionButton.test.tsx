import { useState } from 'react';

import { act, fireEvent, render, screen } from '@testing-library/react';

import { EmojiReactionButton } from './EmojiReactionButton';

vi.mock('../../hooks/bridges/useEmojiReaction', () => ({
    EMOJI_REACTIONS: ['👍'],
    useEmojiReaction: () => vi.fn(),
}));

vi.mock('../../hooks/bridges/useRaiseHand', () => ({
    useRaiseHand: () => ({ isHandRaised: false, toggleHand: vi.fn() }),
}));

let setButtonShown: (shown: boolean) => void = () => {};
let forceRender: () => void = () => {};

const Harness = () => {
    const [buttonShown, setButtonShownState] = useState(true);
    const [, setRenderCount] = useState(0);
    setButtonShown = setButtonShownState;
    forceRender = () => setRenderCount((count) => count + 1);
    return (
        <>
            <input aria-label="Chat composer" />
            {buttonShown && <EmojiReactionButton />}
        </>
    );
};

const getToggle = () => screen.getByRole('button', { name: 'Toggle emoji reactions' });

const flushTimers = () =>
    act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
    });

describe('EmojiReactionButton', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('comes back closed and leaves focus alone when the toolbar button remounts after being hidden while open', async () => {
        render(<Harness />);

        fireEvent.click(getToggle());
        await flushTimers();
        expect(screen.getByRole('dialog', { name: 'Reactions' })).toBeInTheDocument();

        act(() => setButtonShown(false));
        const composer = screen.getByRole('textbox', { name: 'Chat composer' });
        composer.focus();

        act(() => setButtonShown(true));
        await flushTimers();

        expect(screen.queryByRole('dialog', { name: 'Reactions' })).not.toBeInTheDocument();
        expect(getToggle()).toHaveAttribute('aria-expanded', 'false');
        expect(composer).toHaveFocus();
    });

    it('closes on an outside click right after a re-render while open', () => {
        vi.useFakeTimers();
        render(<Harness />);

        fireEvent.click(getToggle());
        act(() => {
            vi.runOnlyPendingTimers();
        });
        expect(getToggle()).toHaveAttribute('aria-expanded', 'true');

        act(() => forceRender());
        fireEvent.click(document.body);

        expect(getToggle()).toHaveAttribute('aria-expanded', 'false');
    });
});
