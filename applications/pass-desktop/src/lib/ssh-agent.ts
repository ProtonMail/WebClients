import { BrowserWindow } from 'electron';
import { isClientAppReady } from 'proton-pass-desktop/lib/client';
import type { SshKeyData } from 'proton-pass-desktop/native';
import { ssh_agent_napi } from 'proton-pass-desktop/native';
import { store } from 'proton-pass-desktop/store';
import logger from 'proton-pass-desktop/utils/logger';

import type { ItemRevision } from '@proton/pass/types';
import { getErrorMessage } from '@proton/pass/utils/errors/get-error-message';
import { waitUntil } from '@proton/pass/utils/fp/wait-until';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';

import { setupIpcHandler } from './ipc';

declare module 'proton-pass-desktop/lib/ipc' {
    interface IPCChannels {
        'sshAgent:start': IPCChannel<[], void>;
        'sshAgent:stop': IPCChannel<[], void>;
        'sshAgent:setSshKeyItems': IPCChannel<[ItemRevision<'sshKey'>[]], void>;
        'sshAgent:removeAllSshKeys': IPCChannel<[], void>;
        'sshAgent:getStatus': IPCChannel<[], ssh_agent_napi.SshAgentStatus>;
        'sshAgent:getSettingEnabled': IPCChannel<[], boolean>;
        'sshAgent:setSettingEnabled': IPCChannel<[enabled: boolean], void>;
    }
}

const intoNativeSshKey = (item: ItemRevision<'sshKey'>): SshKeyData => ({
    id: item.itemId,
    name: item.data.metadata.name,
    publicKey: item.data.content.publicKey || '',
    privateKey: deobfuscate(item.data.content.privateKey) || '',
});

/** Create a callback that will be called from Rust when SSH operations
 * occur. Returns true if app is unlocked, false if locked/timeout.
 * Waits for unlock with a 60 seconds timeout polling every 100ms.
 * Worst-case: concurrent SSH operations each start polling when locked. */
const onSSHAgentStart = (event: Electron.IpcMainInvokeEvent) =>
    ssh_agent_napi.startAgent(
        async (
            error,
            /** For V2: use publicKey, or better yet: itemID/name,
             * to display key usage confirmation UI */
            _publicKey
        ) => {
            try {
                if (error) throw new Error(`Lock check error from Rust (${error})`);

                const window = BrowserWindow.fromWebContents(event.sender);
                if (!window) throw new Error('Could not find window for lock check');
                if (isClientAppReady()) return true;

                window.show();
                await waitUntil(isClientAppReady, 100, 60_000);

                return true;
            } catch (err) {
                logger.error(`[SSH Agent] ${getErrorMessage(err)}`);
                return false;
            }
        }
    );

export const setupIpcHandlers = () => {
    setupIpcHandler('sshAgent:getSettingEnabled', () => store.get('sshAgentSettingEnabled') ?? false);
    setupIpcHandler('sshAgent:getStatus', () => ssh_agent_napi.getStatus());
    setupIpcHandler('sshAgent:removeAllSshKeys', () => ssh_agent_napi.removeAllKeys());
    setupIpcHandler('sshAgent:setSettingEnabled', (_, enabled) => store.set('sshAgentSettingEnabled', enabled));
    setupIpcHandler('sshAgent:setSshKeyItems', (_, items) => ssh_agent_napi.setKeys(items.map(intoNativeSshKey)));
    setupIpcHandler('sshAgent:start', onSSHAgentStart);
    setupIpcHandler('sshAgent:stop', () => ssh_agent_napi.stopAgent());
};
