import type { ContextBridgeApi, Maybe, SSHKeyItem } from '@proton/pass/types';
import { prop } from '@proton/pass/utils/fp/lens';
import { asyncLatest } from '@proton/pass/utils/fp/promises';
import { logger } from '@proton/pass/utils/logger';

type SshAgentServiceOptions = {
    bridge: ContextBridgeApi;
    datasource: () => SSHKeyItem[];
};

export type SshAgentService = {
    start: () => Promise<void>;
    stop: () => Promise<void>;
    /** Syncs SSH keys, if state is empty it will clear keys  */
    sync: () => Promise<void>;
    /** Force clear SSH keys */
    clear: () => Promise<void>;
    readonly socketPath: Promise<Maybe<string>>;
    readonly enabled: boolean;
};

export const createSshAgentService = ({ bridge, datasource }: SshAgentServiceOptions): SshAgentService => {
    const state = { enabled: false };

    const sync = asyncLatest(async (signal, items: SSHKeyItem[]) => {
        if (state.enabled) {
            try {
                const isRunning = Boolean((await bridge.getSshAgentStatus())?.socketPath);
                if (signal.aborted || !isRunning) return;
                if (items.length === 0) await bridge.removeAllSshKeys();
                else await bridge.setSshKeyItems(items);
            } catch (error) {
                logger.warn('[SSH agent] sync failed', error);
            }
        }
    });

    const setEnabled = async (enabled: boolean) => {
        await bridge.setSshAgentSetting(enabled);
        state.enabled = enabled;
    };

    const service: SshAgentService = {
        get enabled() {
            return state.enabled;
        },

        get socketPath() {
            return bridge
                .getSshAgentStatus()
                .then(prop('socketPath'))
                .catch((err) => {
                    logger.error('[SSH agent] Could not get status:', err);
                    return undefined;
                });
        },

        start: async () => {
            const running = Boolean(await service.socketPath);
            if (!running) await bridge.startSshAgent();
            if (!service.enabled) await setEnabled(true);
        },

        stop: async () => {
            sync.cancel();
            if (service.enabled) await setEnabled(false);
            await bridge.stopSshAgent();
        },

        clear: () => sync.run([]),

        sync: () => sync.run(datasource()),
    };

    /** Start the agent early (before unlock) for a better UX so that
     * SSH commands in the terminal will focus the window with the unlock screen.
     * The setting is stored in electron-store and not redux store for this use-case. */
    const init = async () => {
        const settingEnabled = await bridge.getSshAgentSetting();
        state.enabled = settingEnabled;
        if (settingEnabled) void service.start();
    };

    void init();

    return service;
};
