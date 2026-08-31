import type { BrowserWindow } from 'electron';

import type { ItemRevision, MaybeNull, SSHKeyItem } from '@proton/pass/types';
import { getErrorMessage } from '@proton/pass/utils/errors/get-error-message';
import { waitUntil } from '@proton/pass/utils/fp/wait-until';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';

import type { SshKeyData } from 'proton-pass-desktop-native';
import { ssh_agent_napi } from 'proton-pass-desktop-native';

import { store } from '../store';
import logger from '../utils/logger';
import { isWindows } from '../utils/platform';
import { isClientBooted } from './client';
import { setupIpcHandler } from './ipc';

declare module './ipc' {
    interface IPCChannels {
        'sshAgent:start': IPCChannel<[], void>;
        'sshAgent:clear': IPCChannel<[], void>;
        'sshAgent:destroy': IPCChannel<[], void>;
        'sshAgent:setSshKeyItems': IPCChannel<[ItemRevision<'sshKey'>[]], void>;
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

let sshSynced = false;
let readyLock: MaybeNull<Promise<void>> = null;

const isReady = () => sshSynced && isClientBooted();

/** Fix window foreground limitation on Windows:
 * https://github.com/electron/electron/issues/2867#issuecomment-2901356176 */
const showWindowInForeground = (window: BrowserWindow) => {
    if (isWindows() && !window.isFocused() && !window.isMinimized()) window.minimize();
    window.show();
};

/** Create a callback that will be called from Rust when SSH
 * operations occur. Returns true if app is unlocked, false if
 * locked/timeout. Concurrent callers share a single 60s poll. */
const onStart = (getWindow: () => MaybeNull<BrowserWindow>) => () =>
    ssh_agent_napi.startAgent(
        async (
            error,
            /** For V2: use publicKey, or better yet: itemID/name,
             * to display key usage confirmation UI */
            _publicKey
        ) => {
            try {
                if (error) throw new Error('Lock check error', { cause: error });

                const window = getWindow();
                if (!window) throw new Error('Could not find window for lock check');

                if (isReady()) return true;
                showWindowInForeground(window);
                await (readyLock ??= waitUntil(isReady, 100, 60_000).finally(() => (readyLock = null)));
                return true;
            } catch (err) {
                logger.error(`[SSH Agent] ${getErrorMessage(err)}`);
                return false;
            }
        }
    );

const onClear = async () => {
    sshSynced = false;
    await ssh_agent_napi.removeAllKeys();
};

const onDestroy = async () => {
    sshSynced = false;
    await ssh_agent_napi.destroyAgent();
};

const onSync = async (items: SSHKeyItem[]) => {
    await ssh_agent_napi.setKeys(items.map(intoNativeSshKey));
    sshSynced = true;
};

export const setupIpcHandlers = (getWindow: () => MaybeNull<BrowserWindow>) => {
    setupIpcHandler('sshAgent:getSettingEnabled', () => store.get('sshAgentSettingEnabled') ?? false);
    setupIpcHandler('sshAgent:getStatus', () => ssh_agent_napi.getStatus());
    setupIpcHandler('sshAgent:setSettingEnabled', (enabled) => store.set('sshAgentSettingEnabled', enabled));
    setupIpcHandler('sshAgent:setSshKeyItems', onSync);
    setupIpcHandler('sshAgent:start', onStart(getWindow));
    setupIpcHandler('sshAgent:clear', onClear);
    setupIpcHandler('sshAgent:destroy', onDestroy);
};
