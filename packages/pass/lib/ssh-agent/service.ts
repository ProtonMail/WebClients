import { AppStateManager } from '@proton/pass/components/Core/AppStateManager';
import { clientReady } from '@proton/pass/lib/client';
import { selectVisibleNonTrashedSshKeyItems } from '@proton/pass/store/selectors';
import type { State } from '@proton/pass/store/types';
import type { ContextBridgeApi, ItemRevision, Maybe } from '@proton/pass/types';
import { asyncLatest } from '@proton/pass/utils/fp/promises';
import { logger } from '@proton/pass/utils/logger';

type SshAgentServiceOptions = {
    bridge: ContextBridgeApi;
};

export type SshAgentService = {
    start: () => Promise<void>;
    stop: () => Promise<void>;
    /* items passed as param to avoid circular dependency in ssh-agent.middleware.ts */
    sync: (items: ItemRevision<'sshKey'>[]) => Promise<void>;
    handleDowngrade: () => Promise<void>;
    init: (getState: () => State) => void;
    enabled: boolean;
};

export const createSshAgentService = ({ bridge }: SshAgentServiceOptions): SshAgentService => {
    const sync = asyncLatest(async (signal, items: ItemRevision<'sshKey'>[]) => {
        try {
            const isRunning = Boolean((await bridge.getSshAgentStatus())?.socketPath);
            if (signal.aborted || !isRunning) return;
            if (items.length === 0) await bridge.removeAllSshKeys();
            else await bridge.setSshKeyItems(items);
        } catch (error) {
            logger.warn('[SSH agent] sync failed', error);
        }
    });

    const service: SshAgentService = {
        enabled: false,

        start: async () => {
            const isRunning = Boolean((await bridge.getSshAgentStatus())?.socketPath);
            if (!isRunning) await bridge.startSshAgent();
        },

        stop: async () => {
            service.enabled = false;
            sync.cancel();
            await bridge.stopSshAgent();
        },

        /** Sync SSH keys, if state is empty it will clear keys  */
        sync: sync.run,

        handleDowngrade: async () => {
            if (!service.enabled) return;
            await bridge.setSshAgentSettingEnabled(false);
            await service.stop();
        },

        init: (getState) => {
            /** Start the agent early (before unlock) for a better UX so that
             * SSH commands in the terminal will focus the window with the unlock screen.
             * The setting is stored in electron-store and not redux store for this use-case. */
            const maybeStart = async () => {
                const settingEnabled = await bridge.getSshAgentSettingEnabled();
                service.enabled = settingEnabled;
                if (settingEnabled) void service.start();
            };
            void maybeStart();

            bridge.onSshAgentSettingChanged((settingEnabled) => {
                service.enabled = settingEnabled;
            });

            let prevReady: Maybe<boolean>;

            AppStateManager.subscribe(async ({ status }) => {
                const ready = clientReady(status);
                if (ready === prevReady) return;
                prevReady = ready;

                if (service.enabled) {
                    await service.sync(selectVisibleNonTrashedSshKeyItems(getState()));
                    void bridge.setSshAgentAppReady(ready);
                }
            });
        },
    };

    return service;
};
