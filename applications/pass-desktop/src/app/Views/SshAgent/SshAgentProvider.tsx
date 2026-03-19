import { type FC, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import { selectVisibleNonTrashedSshKeyItems } from '@proton/pass/store/selectors';

/** Initialize SSH agent and sync keys if SSH agent setting is enabled.
 * That setting is stored in Electron store instead of app settings
 * so that we can check the setting and start the agent even if
 * the app is still locked (in which case no key will be sent).
 * This allows for a better UX since after app boot,
 * executing a SSH command will put Pass window
 * with the unlock screen in the foreground. */
export const SshAgentProvider: FC = () => {
    const sshKeys = useSelector(selectVisibleNonTrashedSshKeyItems);
    const syncTimeoutRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        const init = async () => {
            const settingEnabled = await window.ctxBridge?.getSshAgentSettingEnabled();
            if (!settingEnabled) return;

            const isRunning = Boolean((await window.ctxBridge?.getSshAgentStatus())?.socketPath);
            if (!isRunning) {
                await window.ctxBridge?.startSshAgent();
            }
        };

        void init();
    }, []);

    useEffect(() => {
        if (syncTimeoutRef.current) {
            clearTimeout(syncTimeoutRef.current);
        }

        syncTimeoutRef.current = setTimeout(() => {
            const syncKeys = async () => {
                const isRunning = Boolean((await window.ctxBridge?.getSshAgentStatus())?.socketPath);

                if (!isRunning) return;

                if (sshKeys.length === 0) {
                    await window.ctxBridge?.removeAllSshKeys();
                } else {
                    await window.ctxBridge?.setSshKeyItems(sshKeys);
                }
            };

            void syncKeys();
        }, 400);

        return () => {
            if (syncTimeoutRef.current) {
                clearTimeout(syncTimeoutRef.current);
            }
        };
    }, [sshKeys]);

    return null;
};
