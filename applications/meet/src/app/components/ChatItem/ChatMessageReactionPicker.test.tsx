import { act, render, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { ChatMessageReactionPicker } from './ChatMessageReactionPicker';

vi.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification: vi.fn() }),
}));

vi.mock('@proton/unleash/useFlag', () => ({
    useFlag: () => false,
}));

vi.mock('@proton/atoms/Popper/usePopper', () => ({
    usePopper: () => ({
        floating: () => {},
        reference: () => {},
        position: { top: 0, left: 0 },
        arrow: {},
        placement: 'bottom',
        availableSize: undefined,
        update: () => {},
    }),
}));

const observerOptions: (IntersectionObserverInit | undefined)[] = [];

class IntersectionObserverStub {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();

    constructor(_callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        observerOptions.push(options);
    }
}

const createEscapeEvent = (keyCode?: number) => {
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true, cancelable: true });
    if (keyCode !== undefined) {
        Object.defineProperty(event, 'keyCode', { value: keyCode });
    }
    return event;
};

// Safari reports the Escape that ends an IME composition as key 'Escape' with keyCode 229.
const createComposingEscapeEvent = () => createEscapeEvent(229);

let appendedNodes: HTMLElement[] = [];

const renderPicker = async ({
    anchor = document.createElement('div'),
    container = anchor,
}: { anchor?: HTMLElement; container?: HTMLElement } = {}) => {
    const trigger = document.createElement('button');
    document.body.append(container, trigger);
    appendedNodes = [container, trigger];
    const onClose = vi.fn();

    render(
        <ChatMessageReactionPicker
            id="picker"
            isOpen
            anchorRef={{ current: anchor }}
            triggerRef={{ current: trigger }}
            onClose={onClose}
            onReact={vi.fn()}
        />
    );

    const input = await waitFor(() => {
        const searchInput = document
            .querySelector('em-emoji-picker')
            ?.shadowRoot?.querySelector<HTMLInputElement>('input[type="search"]');
        expect(searchInput).toBeTruthy();
        return searchInput as HTMLInputElement;
    });

    return { onClose, input, shadowRoot: input.getRootNode() as ShadowRoot };
};

const typeSearchQuery = async (input: HTMLInputElement, shadowRoot: ShadowRoot, query: string) => {
    input.focus();
    input.value = query;
    await act(async () => {
        input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    });
    await waitFor(() => expect(shadowRoot.querySelector('button[aria-label="Clear"]')).toBeTruthy());
};

describe('ChatMessageReactionPicker', () => {
    beforeEach(() => {
        vi.stubGlobal('IntersectionObserver', IntersectionObserverStub);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        appendedNodes.forEach((node) => node.remove());
        appendedNodes = [];
        observerOptions.length = 0;
    });

    it.each([
        ['a message', false, '-56px 0px 0px 0px'],
        ['a reply under a pinned thread root', true, '-140px 0px 0px 0px'],
    ])('closes once the toolbar of %s is fully covered', async (_, isUnderPinnedRoot, rootMargin) => {
        const messageList = document.createElement('div');
        messageList.className = 'message-list';
        const anchor = document.createElement('div');
        anchor.style.setProperty('--side-bar-header-height', '56px');
        anchor.style.setProperty('--chat-thread-root-height', '84px');
        if (isUnderPinnedRoot) {
            const header = document.createElement('div');
            header.className = 'chat-thread-header chat-thread-header--sticky';
            const body = document.createElement('div');
            body.className = 'chat-thread-body';
            body.append(anchor);
            messageList.append(header, body);
        } else {
            messageList.append(anchor);
        }

        await renderPicker({ anchor, container: messageList });

        // emoji-mart observes its own grid too.
        expect(observerOptions.filter((options) => options?.root === messageList)).toEqual([
            { root: messageList, rootMargin },
        ]);
    });

    it('leaves a typed search query alone on a Safari IME Escape', async () => {
        const { onClose, input, shadowRoot } = await renderPicker();
        await typeSearchQuery(input, shadowRoot, 'cat');

        await act(async () => {
            input.dispatchEvent(createComposingEscapeEvent());
        });

        expect(onClose).not.toHaveBeenCalled();
        expect(input.value).toBe('cat');
    });

    it('keeps focus in the search field on a Safari IME Escape with an empty query', async () => {
        const { onClose, input, shadowRoot } = await renderPicker();
        input.focus();
        expect(shadowRoot.activeElement).toBe(input);

        await act(async () => {
            input.dispatchEvent(createComposingEscapeEvent());
        });

        expect(onClose).not.toHaveBeenCalled();
        expect(shadowRoot.activeElement).toBe(input);
    });

    it('closes and restores focus on an Escape in the search field, leaving the query alone', async () => {
        const { onClose, input, shadowRoot } = await renderPicker();
        await typeSearchQuery(input, shadowRoot, 'cat');

        await act(async () => {
            input.dispatchEvent(createEscapeEvent());
        });

        expect(onClose).toHaveBeenCalledWith({ restoreFocus: true });
        expect(input.value).toBe('cat');
    });
});
