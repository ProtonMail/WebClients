import { BrowserWindow } from 'electron';
import logger from 'proton-pass-desktop/utils/logger';

import type { ItemRevision, MaybeNull } from '@proton/pass/types';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';
import { wait } from '@proton/shared/lib/helpers/promise';

import type { SshKeyData } from '../../native';
import { ssh_agent_napi } from '../../native';
import { store } from '../store';
import { setupIpcHandler } from './ipc';

/** Store app state received from renderer. True if app is unlocked and booted */
let appIsReady = false;

declare module 'proton-pass-desktop/lib/ipc' {
    interface IPCChannels {
        'sshAgent:start': IPCChannel<[], void>;
        'sshAgent:stop': IPCChannel<[], void>;
        'sshAgent:setSshKeyItems': IPCChannel<[ItemRevision<'sshKey'>[]], void>;
        'sshAgent:removeAllSshKeys': IPCChannel<[], void>;
        'sshAgent:getStatus': IPCChannel<[], ssh_agent_napi.SshAgentStatus>;
        'sshAgent:getSettingEnabled': IPCChannel<[], boolean>;
        'sshAgent:setSettingEnabled': IPCChannel<[enabled: boolean], void>;
        'sshAgent:setAppReady': IPCChannel<[isReady: boolean], void>;
        'sshAgent:settingChanged': IPCChannel<[], boolean>;
    }
}

const intoNativeSshKey = (item: ItemRevision<'sshKey'>): SshKeyData => ({
    id: item.itemId,
    name: item.data.metadata.name,
    publicKey: item.data.content.publicKey || '',
    privateKey: deobfuscate(item.data.content.privateKey) || '',
});

/** Create a callback that will be called from Rust when SSH operations occur.
 * Returns true if app is unlocked, false if locked/timeout */
const isUnlockedCallback = async ({
    window,
    error,
}: {
    window: MaybeNull<BrowserWindow>;
    error: MaybeNull<Error>;
    // For V2: use publicKey, or better yet: itemID/name, to display key usage confirmation UI
    publicKey?: MaybeNull<string>;
}): Promise<boolean> => {
    try {
        if (error) {
            logger.error(`[SSH Agent] Lock check error from Rust (${error})`);
            return false;
        }

        if (!window) {
            logger.error('[SSH Agent] Could not find window for lock check');
            return false;
        }

        if (appIsReady) return true;

        window.show();

        const startTime = Date.now();
        const timeoutMs = 60000;

        // Wait for unlock with timeout (60 seconds) and check every 100ms
        while (Date.now() - startTime < timeoutMs) {
            if (appIsReady) {
                return true;
            }
            await wait(100);
        }

        logger.warn('[SSH Agent] Timeout waiting for app to be ready');
        return false;
    } catch (error) {
        logger.error('[SSH Agent] Lock check callback error:', error);
        return false;
    }
};

export const setupIpcHandlers = () => {
    setupIpcHandler('sshAgent:start', async (event) => {
        const window = BrowserWindow.fromWebContents(event.sender);
        return ssh_agent_napi.startAgent((error, publicKey) => isUnlockedCallback({ window, error, publicKey }));
    });
    setupIpcHandler('sshAgent:stop', async () => ssh_agent_napi.stopAgent());
    setupIpcHandler('sshAgent:setSshKeyItems', async (_, items) => {
        const keys = items.map(intoNativeSshKey);
        return ssh_agent_napi.setKeys(keys);
    });
    setupIpcHandler('sshAgent:removeAllSshKeys', async () => ssh_agent_napi.removeAllKeys());
    setupIpcHandler('sshAgent:getStatus', async () => ssh_agent_napi.getStatus());
    setupIpcHandler('sshAgent:getSettingEnabled', async () => store.get('sshAgentSettingEnabled') ?? false);
    setupIpcHandler('sshAgent:setSettingEnabled', async (event, enabled) => {
        store.set('sshAgentSettingEnabled', enabled);
        const window = BrowserWindow.fromWebContents(event.sender);
        window?.webContents.send('sshAgent:settingChanged', enabled);
    });
    setupIpcHandler('sshAgent:setAppReady', async (_, isReady) => {
        appIsReady = isReady;
    });
};
