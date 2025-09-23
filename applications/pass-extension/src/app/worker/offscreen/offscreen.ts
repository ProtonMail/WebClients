import { createMessageBroker } from 'proton-pass-extension/lib/message/message-broker';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import browser from '@proton/pass/lib/globals/browser';
import { logger } from '@proton/pass/utils/logger';

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
    allowExternal: [],
    strictOriginCheck: [WorkerMessageType.CLIPBOARD_OFFSCREEN_READ, WorkerMessageType.CLIPBOARD_OFFSCREEN_WRITE],
    onError: () => logger.error('Offscreen broker error'),
    onDisconnect: () => logger.debug('Offscreen broker disconnect'),
});

MessageBroker.registerMessage(WorkerMessageType.CLIPBOARD_OFFSCREEN_READ, async () => {
    const content = legacyClipboardRead();
    return { content };
});

MessageBroker.registerMessage(WorkerMessageType.CLIPBOARD_OFFSCREEN_WRITE, async ({ payload }) => {
    legacyClipboardWrite(payload.content);
    return true;
});

browser.runtime.onMessage.addListener(MessageBroker.onMessage);
