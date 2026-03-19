import { type FC, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { useAppState } from '@proton/pass/components/Core/AppStateProvider';
import { clientReady } from '@proton/pass/lib/client';
import { selectVisibleNonTrashedSshKeyItems } from '@proton/pass/store/selectors';
import type { MaybeNull } from '@proton/pass/types';

const KEYS_SYNC_DEBOUNCE_TIME = 200;

/** Sync SSH keys and app ready state with SSH agent.
 * Only rendered when SSH agent setting is enabled. */
const SshAgentSync: FC = () => {
    const sshKeys = useSelector(selectVisibleNonTrashedSshKeyItems);
    const syncTimeoutRef = useRef<NodeJS.Timeout>();
    const syncPromiseRef = useRef<Promise<void>>(Promise.resolve());
    const { status } = useAppState();
    const prevStatus = useRef<MaybeNull<boolean>>(null);

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
            const isReady = clientReady(status);

            if (prevStatus.current !== isReady) {
                prevStatus.current = isReady;
                /* Wait for SSH keys to finish sync with redux store
                 * before sending isReady to main process */
                if (isReady) {
                    await syncPromiseRef.current;
                }
                void window.ctxBridge?.setSshAgentAppReady(isReady);
            }
        };
        void updateStatus();
    }, [status]);

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

    return isAgentEnabled ? <SshAgentSync /> : null;
};
