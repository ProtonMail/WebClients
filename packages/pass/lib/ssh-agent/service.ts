import { getItemRevisionKey } from '@proton/pass/lib/items/item.utils';
import type { ContextBridgeApi, SSHKeyItem } from '@proton/pass/types';
import { asyncLatest } from '@proton/pass/utils/fp/promises';
import { logger } from '@proton/pass/utils/logger';

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
};

export const createSshAgentService = ({
    bridge: { sshAgent },
    datasource,
}: SshAgentServiceOptions): SshAgentService => {
    const state: SSHAgentState = { enabled: false, keys: new Set() };

    const sync = asyncLatest(async (signal, items: SSHKeyItem[]) => {
        if (state.enabled) {
            try {
                const isRunning = Boolean((await sshAgent.getStatus())?.socketPath);
                if (signal.aborted || !isRunning) return;

                const { keys } = state;
                const skip = items.length === keys.size && items.every((i) => keys.has(getItemRevisionKey(i)));
                if (skip) return;

                await sshAgent.setKeys(items);
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
            state.keys.clear();
            if (service.enabled) await setEnabled(false);
            await sshAgent.destroy();
        },

        clear: async () => {
            sync.cancel();
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
