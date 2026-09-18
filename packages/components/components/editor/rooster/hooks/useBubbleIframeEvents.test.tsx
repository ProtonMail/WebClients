import { useRef } from 'react';

import { fireEvent, render, waitFor } from '@testing-library/react';

import { cloneEvent } from '@proton/shared/lib/helpers/events';

import { ROOSTER_EDITOR_WRAPPER_ID } from '../../constants';
import useBubbleIframeEvents from './useBubbleIframeEvents';

jest.mock('@proton/shared/lib/helpers/events', () => ({
    cloneEvent: jest.fn((event: Event) => new Event(event.type)),
    isKeyboardEvent: (event: Event) => 'key' in event,
}));

jest.mock('@proton/shared/lib/shortcuts/helpers', () => ({
    isValidShortcut: jest.fn(() => false),
}));

jest.mock('@proton/shared/lib/shortcuts/mail', () => ({
    editorShortcuts: {},
}));

const TestEditor = () => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    useBubbleIframeEvents(iframeRef);

    return (
        <iframe
            ref={(iframe) => {
                iframeRef.current = iframe;
                if (iframe?.contentDocument?.body && !iframe.contentDocument.getElementById(ROOSTER_EDITOR_WRAPPER_ID)) {
                    const wrapper = iframe.contentDocument.createElement('div');
                    wrapper.id = ROOSTER_EDITOR_WRAPPER_ID;
                    iframe.contentDocument.body.appendChild(wrapper);
                }
            }}
            title="Test editor"
        />
    );
};

const getWrapper = () => {
    const iframe = document.querySelector('iframe') as HTMLIFrameElement;
    const wrapper = iframe.contentDocument?.getElementById(ROOSTER_EDITOR_WRAPPER_ID);
    expect(wrapper).not.toBeNull();
    return wrapper as HTMLElement;
};

describe('useBubbleIframeEvents IME handling', () => {
    beforeEach(() => {
        jest.mocked(cloneEvent).mockClear();
    });

    it('does not bubble keydown while composition is active', async () => {
        render(<TestEditor />);
        const wrapper = getWrapper();
        const event = new KeyboardEvent('keydown', { key: 'Process', isComposing: true, bubbles: true });

        fireEvent(wrapper, event);

        await waitFor(() => expect(cloneEvent).not.toHaveBeenCalled());
    });

    it('does not bubble keydown with the IME keyCode fallback', async () => {
        render(<TestEditor />);
        const wrapper = getWrapper();
        const event = new KeyboardEvent('keydown', { key: 'Process', bubbles: true });
        Object.defineProperty(event, 'keyCode', { value: 229 });

        fireEvent(wrapper, event);

        await waitFor(() => expect(cloneEvent).not.toHaveBeenCalled());
    });

    it('continues to bubble normal keydown events', async () => {
        render(<TestEditor />);
        const wrapper = getWrapper();

        fireEvent.keyDown(wrapper, { key: 'Escape' });

        await waitFor(() => expect(cloneEvent).toHaveBeenCalledTimes(1));
    });
});
