import React, { createRef } from 'react';

import { act, fireEvent, render, screen } from '@testing-library/react';

import type { Message } from '../../../types';
import { MessageChainComponent } from './MessageChainComponent';

vi.mock('./message/MessageComponent', () => ({ MessageComponent: () => <div>Answer</div> }));
vi.mock('./ScrollToBottomButton/ScrollToBottomButton', () => ({
    ScrollToBottomButton: ({ show }: { show: boolean }) => <button aria-label="Scroll indicator" hidden={!show} />,
}));
vi.mock('./clipboard', () => ({ prepareSelectedContentForCopy: vi.fn() }));

it('coalesces replay mutations and updates the indicator only after layout', () => {
    const observers: MutationCallback[] = [];
    const frames: FrameRequestCallback[] = [];
    const originalObserver = window.MutationObserver;
    const disconnect = vi.fn();
    window.MutationObserver = vi.fn().mockImplementation(function (callback: MutationCallback) {
        observers.push(callback);
        return { observe: vi.fn(), disconnect };
    });
    const animationFrame = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
        frames.push(callback);
        return frames.length;
    });
    const cancelAnimationFrame = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
    const scrollToDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollTo');
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', { configurable: true, value: vi.fn() });
    const messageChainRef = createRef<HTMLDivElement>();
    const otherRef = createRef<HTMLDivElement>();
    try {
        const view = render(
            <MessageChainComponent
                messageChainRef={messageChainRef}
                sourcesContainerRef={otherRef}
                composerContainerRef={otherRef}
                messageChain={[{ id: 'answer', content: 'Answer' } as Message]}
                isGenerating
                conversationId="conversation"
                handleRegenerateMessage={vi.fn()}
                handleEditMessage={vi.fn()}
                getSiblingInfo={() => ({ idx: 0, count: 1, onPrev: vi.fn(), onNext: vi.fn() })}
                handleOpenSources={vi.fn()}
                handleOpenFiles={vi.fn()}
                handleOpenFilePreview={vi.fn()}
            />
        );
        const container = messageChainRef.current!;
        Object.defineProperties(container, {
            scrollHeight: { configurable: true, value: 800 },
            clientHeight: { configurable: true, value: 100 },
        });
        frames.length = 0;
        animationFrame.mockClear();
        const observer = observers.at(-1)!;
        act(() => {
            for (let index = 0; index < 100; index++) observer([], {} as MutationObserver);
        });
        expect(animationFrame).toHaveBeenCalledTimes(1);
        expect(screen.getByLabelText('Scroll indicator').hasAttribute('hidden')).toBe(true);
        act(() => frames.shift()!(0));
        expect(screen.getByLabelText('Scroll indicator').hasAttribute('hidden')).toBe(false);
        container.scrollTop = 700;
        fireEvent.scroll(container);
        act(() => frames.shift()!(0));
        expect(screen.getByLabelText('Scroll indicator').hasAttribute('hidden')).toBe(true);
        view.unmount();
        expect(disconnect).toHaveBeenCalled();
    } finally {
        window.MutationObserver = originalObserver;
        animationFrame.mockRestore();
        cancelAnimationFrame.mockRestore();
        if (scrollToDescriptor) {
            Object.defineProperty(HTMLElement.prototype, 'scrollTo', scrollToDescriptor);
        } else {
            Reflect.deleteProperty(HTMLElement.prototype, 'scrollTo');
        }
    }
});
