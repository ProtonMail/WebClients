import { type FC, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { useAppState } from '@proton/pass/components/Core/AppStateProvider';
import { clientReady } from '@proton/pass/lib/client';
import { selectPassPlan, selectVisibleNonTrashedSshKeyItems } from '@proton/pass/store/selectors';
import { UserPassPlan } from '@proton/pass/types/api/plan';

const KEYS_SYNC_DEBOUNCE_TIME = 200;

type SshAgentSyncProps = { appIsReady: boolean };

/** Sync SSH keys and app ready state with SSH agent.
 * Only rendered when SSH agent setting is enabled. */
const SshAgentSync: FC<SshAgentSyncProps> = ({ appIsReady }) => {
    const sshKeys = useSelector(selectVisibleNonTrashedSshKeyItems);
    const syncTimeoutRef = useRef<NodeJS.Timeout>();
    const syncPromiseRef = useRef<Promise<void>>(Promise.resolve());

    useEffect(() => {
        if (syncTimeoutRef.current) {
            clearTimeout(syncTimeoutRef.current);
        }

        syncPromiseRef.current = new Promise((resolve) => {
            syncTimeoutRef.current = setTimeout(async () => {
                try {
                    const isRunning = Boolean((await window.ctxBridge?.getSshAgentStatus())?.socketPath);

                    if (isRunning) {
                        if (sshKeys.length === 0) {
                            await window.ctxBridge?.removeAllSshKeys();
                        } else {
                            await window.ctxBridge?.setSshKeyItems(sshKeys);
                        }
                    }
                } finally {
                    resolve();
                }
            }, KEYS_SYNC_DEBOUNCE_TIME);
        });

        return () => {
            if (syncTimeoutRef.current) {
                clearTimeout(syncTimeoutRef.current);
            }
        };
    }, [sshKeys]);

    useEffect(() => {
        const updateStatus = async () => {
            /* Wait for SSH keys to finish sync with redux store
             * before sending isReady to main process */
            if (appIsReady) {
                await syncPromiseRef.current;
            }
            void window.ctxBridge?.setSshAgentAppReady(appIsReady);
        };
        void updateStatus();
    }, [appIsReady]);

    return null;
};

/** Initialize SSH agent and sync keys if SSH agent setting is enabled.
 * That setting is stored in Electron store instead of app settings
 * so that we can check the setting and start the agent even if
 * the app is still locked (in which case no key will be sent).
 * This allows for a better UX since after app boot,
 * executing a SSH command will put Pass window
 * with the unlock screen in the foreground. */
export const SshAgentProvider: FC = () => {
    const [isAgentEnabled, setIsAgentEnabled] = useState(false);
    const { status } = useAppState();
    const appIsReady = clientReady(status);
    const plan = useSelector(selectPassPlan);
    // When app state is not ready, plan will always return free
    const isFreePlan = appIsReady && plan === UserPassPlan.FREE;

    useEffect(() => {
        const init = async () => {
            const settingEnabled = await window.ctxBridge?.getSshAgentSettingEnabled();
            setIsAgentEnabled(settingEnabled ?? false);

            if (settingEnabled) {
                const isRunning = Boolean((await window.ctxBridge?.getSshAgentStatus())?.socketPath);
                if (!isRunning) await window.ctxBridge?.startSshAgent();
            }
        };

        void init();

        const unsubscribe = window.ctxBridge?.onSshAgentSettingChanged?.((enabled) => {
            setIsAgentEnabled(enabled);
        });

        return unsubscribe;
    }, []);

    useEffect(() => {
        /* Handle real time downgrading or multi-accounts: switching from paid to free user */
        const handleDowngrade = async () => {
            if (isAgentEnabled && isFreePlan) {
                await window.ctxBridge?.setSshAgentSettingEnabled(false);
                await window.ctxBridge?.stopSshAgent();
            }
        };

        void handleDowngrade();
    }, [isAgentEnabled, isFreePlan]);

    return isAgentEnabled ? <SshAgentSync appIsReady={appIsReady} /> : null;
};
