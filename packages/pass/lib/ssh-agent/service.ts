import type { ContextBridgeApi, SSHKeyItem } from '../../types';
import { asyncLatest } from '../../utils/fp/promises';
import { logger } from '../../utils/logger';
import { getItemRevisionKey } from '../items/item.utils';

type SshAgentServiceOptions = {
    bridge: ContextBridgeApi;
    datasource: () => SSHKeyItem[];
};

export type SshAgentService = {
    /** Starts the SSH agent if not previously running */
    start: () => Promise<void>;
    /** Stops and destroys the SSH agent */
    destroy: () => Promise<void>;
    /** Syncs current SSH keys with the agent */
    sync: () => Promise<void>;
    /** Force clears all registered SSH keys */
    clear: () => Promise<void>;
    readonly enabled: boolean;
};

type SSHAgentState = {
    enabled: boolean;
    keys: Set<string>;
    /** Whether this SSH agent service instance has pushed keys to the Rust agent
     * at least once. The Rust agent lives in the desktop main process and
     * persists across renderer reloads/account switches, so on a fresh
     * instance `keys` is empty while the agent may still hold a previous
     * account's keys. We must not trust the `skip` optimization until we've
     * reconciled the Rust agent at least once. */
    syncedOnce: boolean;
};

export const createSshAgentService = ({
    bridge: { sshAgent },
    datasource,
}: SshAgentServiceOptions): SshAgentService => {
    const state: SSHAgentState = { enabled: false, syncedOnce: false, keys: new Set() };

    const sync = asyncLatest(async (signal, items: SSHKeyItem[]) => {
        if (state.enabled) {
            try {
                const isRunning = Boolean((await sshAgent.getStatus())?.socketPath);
                if (signal.aborted || !isRunning) return;

                const { keys } = state;
                const skip =
                    state.syncedOnce &&
                    items.length === keys.size &&
                    items.every((i) => keys.has(getItemRevisionKey(i)));
                if (skip) return;

                await sshAgent.setKeys(items);
                state.syncedOnce = true;
                state.keys.clear();
                items.forEach((item) => state.keys.add(getItemRevisionKey(item)));
            } catch (error) {
                logger.warn('[SSH agent] sync failed', error);
            }
        }
    });

    const setEnabled = async (enabled: boolean) => {
        await sshAgent.setEnabled(enabled);
        state.enabled = enabled;
    };

    const service: SshAgentService = {
        get enabled() {
            return state.enabled;
        },

        start: async () => {
            const { socketPath } = await sshAgent.getStatus();
            if (!socketPath) await sshAgent.start();
            if (!service.enabled) await setEnabled(true);
        },

        destroy: async () => {
            sync.cancel();
            state.syncedOnce = false;
            state.keys.clear();
            if (service.enabled) await setEnabled(false);
            await sshAgent.destroy();
        },

        clear: async () => {
            sync.cancel();
            state.syncedOnce = false;
            state.keys.clear();
            await sshAgent.clear();
        },

        sync: () => sync.run(datasource()),
    };

    /** Start the agent early (before unlock) for a better UX so that
     * SSH commands in the terminal will focus the window with the unlock
     * screen. The setting is stored in electron-store and not redux store
     * for this use-case. */
    const init = async () => {
        const settingEnabled = await sshAgent.getEnabled();
        if (settingEnabled) void service.start();
    };

    void init();

    return service;
};
