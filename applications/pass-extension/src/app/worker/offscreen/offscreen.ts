import { createMessageBroker } from 'proton-pass-extension/lib/message/message-broker';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import browser from '@proton/pass/lib/globals/browser';

// Use the offscreen document's `document` interface to write a new value to the system clipboard.
//
// At this time `navigator.clipboard` API requires that the window is focused, but offscreen documents cannot be
// focused. As such, we have to fall back to `document.execCommand()`.
// https://github.com/GoogleChrome/chrome-extensions-samples/blob/main/functional-samples/cookbook.offscreen-clipboard-write/offscreen.js
// https://issues.chromium.org/issues/41497480

const textareaElement = document.querySelector('#text') as HTMLTextAreaElement;

const legacyClipboardRead = () => {
    textareaElement.focus();
    document.execCommand('paste');
    return textareaElement.value;
};

const legacyClipboardWrite = (content: string) => {
    // Legacy copy of empty doesn't work, fallback on ' '
    textareaElement.value = !content ? ' ' : content;
    textareaElement.select();
    document.execCommand('copy');
};

const MessageBroker = createMessageBroker({
    allowExternal: [WorkerMessageType.CLIPBOARD_OFFSCREEN_READ, WorkerMessageType.CLIPBOARD_OFFSCREEN_WRITE],
    strictOriginCheck: [WorkerMessageType.CLIPBOARD_OFFSCREEN_READ, WorkerMessageType.CLIPBOARD_OFFSCREEN_WRITE],
    onError: (err) => {
        console.warn('broker on error', err);
    },
    onDisconnect: (...args) => {
        console.warn('broker on disconnect', args);
    },
});

MessageBroker.registerMessage(WorkerMessageType.CLIPBOARD_OFFSCREEN_READ, async () => {
    const content = legacyClipboardRead();
    console.warn('CLIPBOARD_OFFSCREEN_READ', content);
    return { content };
});

MessageBroker.registerMessage(WorkerMessageType.CLIPBOARD_OFFSCREEN_WRITE, async ({ payload }) => {
    legacyClipboardWrite(payload.content);
    console.warn('CLIPBOARD_OFFSCREEN_WRITE', payload);
    return true;
});

browser.runtime.onMessage.addListener(MessageBroker.onMessage);
