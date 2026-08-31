import noop from '@proton/utils/noop';

import { clipboard as clipboardNative } from 'proton-pass-desktop-native';

import { setupIpcHandler } from '../ipc';

declare module '../ipc' {
    interface IPCChannels {
        'clipboard:read': IPCChannel<[], string>;
        'clipboard:write': IPCChannel<[text: string], void>;
    }
}

export const setupIpcHandlers = () => {
    setupIpcHandler('clipboard:read', () => clipboardNative.read());
    setupIpcHandler('clipboard:write', (text) => clipboardNative.writeText(text, true).catch(noop));
};
