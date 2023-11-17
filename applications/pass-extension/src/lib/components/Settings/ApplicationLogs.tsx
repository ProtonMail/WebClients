import { type VFC, useCallback, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon } from '@proton/components/components';
import { pageMessage, sendMessage } from '@proton/pass/lib/extension/message';
import { type Maybe, type MaybeNull, WorkerMessageType } from '@proton/pass/types';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import { SettingsPanel } from './SettingsPanel';

export const ApplicationLogs: VFC = () => {
    const [showLogs, setShowLogs] = useState(false);
    const [logs, setLogs] = useState<MaybeNull<string[]>>(null);
    const intervalRef = useRef<Maybe<ReturnType<typeof setInterval>>>();

    useEffect(() => {
        const getLogs = () =>
            sendMessage.onSuccess(pageMessage({ type: WorkerMessageType.LOG_REQUEST }), ({ logs }) => setLogs(logs));

        void (showLogs && getLogs());
        intervalRef.current = showLogs ? setInterval(getLogs, 1000) : undefined;

        return () => clearInterval(intervalRef.current);
    }, [showLogs]);

    const downloadLogs = useCallback(() => {
        void sendMessage.onSuccess(pageMessage({ type: WorkerMessageType.LOG_REQUEST }), ({ logs }) => {
            const file = new File(
                logs.map((line) => `${line}\n`),
                `${PASS_APP_NAME}_logs_${Date.now()}`,
                { type: 'text/plain' }
            );

            const link = document.createElement('a');
            const url = URL.createObjectURL(file);

            link.href = url;
            link.download = file.name;
            document.body.appendChild(link);
            link.click();

            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        });
    }, []);

    return (
        <SettingsPanel title={c('Label').t`Application logs`}>
            {showLogs && logs && (
                <>
                    <Button
                        icon
                        shape="ghost"
                        color="weak"
                        size="small"
                        onClick={() => setShowLogs(false)}
                        className="absolute top right mt-2 mr-2"
                    >
                        <Icon name="cross" size={12} />
                    </Button>
                    <div className="scroll-if-needed max-h-custom" style={{ '--max-h-custom': '18.75rem' }}>
                        {logs.map((log, i) => (
                            <span key={i} className="block text-xs color-weak">
                                {log}
                            </span>
                        ))}
                    </div>
                </>
            )}
            {!showLogs && (
                <Button icon shape="ghost" className="w-full" onClick={() => setShowLogs(true)}>
                    <div className="flex items-center">
                        <Icon name="window-terminal" className="mr-2" />
                        <span className="flex-item-fluid">{c('Label').t`View logs`}</span>
                        <Icon name="chevron-down" />
                    </div>
                </Button>
            )}

            <hr className="border-weak my-2" />

            <Button icon shape="ghost" onClick={downloadLogs} className="w-full">
                <div className="flex items-center flex items-center">
                    <Icon name="arrow-down-to-square" className="mr-2" />
                    <span className="flex-item-fluid">{c('Label').t`Download logs`}</span>
                </div>
            </Button>
        </SettingsPanel>
    );
};
