import { BrowserWindow } from 'electron';
import { PASS_AUTH_STORE_KEY } from 'proton-pass-desktop/constants';
import logger from 'proton-pass-desktop/utils/logger';

import type { ItemRevision, MaybeNull } from '@proton/pass/types';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';
import { wait } from '@proton/shared/lib/helpers/promise';

import type { SshKeyData } from '../../native';
import { ssh_agent_napi } from '../../native';
import { setupIpcHandler } from './ipc';

declare module 'proton-pass-desktop/lib/ipc' {
    interface IPCChannels {
        'sshAgent:start': IPCChannel<[], string>;
        'sshAgent:stop': IPCChannel<[], string>;
        'sshAgent:sendSshKeyItems': IPCChannel<[ItemRevision<'sshKey'>[]], string>;
        'sshAgent:getStatus': IPCChannel<[], ssh_agent_napi.SshAgentStatus>;
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

        const checkLockFunction = `(async () => {
                            const authStore = window["${PASS_AUTH_STORE_KEY}"];
                            if (!authStore) {
                                console.log('[SSH Agent] Renderer could not check lock status');
                                return false;
                            }
                            const locked = authStore.getLocked() ?? false;
                            return locked;
                        })()`;

        const isLocked = await window.webContents.executeJavaScript(checkLockFunction);
        if (!isLocked) return true;

        window.show();

        const startTime = Date.now();
        const timeoutMs = 60000;

        // Wait for unlock with timeout (60 seconds) and check every 500ms
        while (Date.now() - startTime < timeoutMs) {
            try {
                const isLocked = await window.webContents.executeJavaScript(checkLockFunction);
                if (!isLocked) {
                    // Wait 2s so keys can finish syncing (see SshAgentProvider.tsx)
                    // before the SSH agent returns the result
                    // FIXME: wait for AppStatus.READY instead
                    await wait(2_000);
                    return true;
                }
            } catch (error) {
                logger.error('[SSH Agent] Error polling lock state:', error);
                return false;
            }
            await wait(500);
        }

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
    setupIpcHandler('sshAgent:sendSshKeyItems', async (_, items) => {
        const keys = items.map(intoNativeSshKey);
        return ssh_agent_napi.sendKeys(keys);
    });
    setupIpcHandler('sshAgent:getStatus', async () => ssh_agent_napi.getStatus());
};
