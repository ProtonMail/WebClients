import { type VFC, useCallback, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Card } from '@proton/atoms/Card';
import { Icon } from '@proton/components/components';
import { pageMessage, sendMessage } from '@proton/pass/extension/message';
import { type Maybe, type MaybeNull, WorkerMessageType } from '@proton/pass/types';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

export const ApplicationLogs: VFC = () => {
    const [showLogs, setShowLogs] = useState(false);
    const [logs, setLogs] = useState<MaybeNull<string[]>>(null);
    const intervalRef = useRef<Maybe<NodeJS.Timer>>();

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
        <Card rounded className="mb-4 p-3 relative">
            <strong className="color-norm block">{c('Label').t`Application logs`}</strong>

            <hr className="my-2 border-weak" />

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
                    <div className="scroll-if-needed  max-h-custom" style={{ '--max-height-custom': '300px' }}>
                        {logs.map((log, i) => (
                            <span key={i} className="block text-xs color-weak">
                                {log}
                            </span>
                        ))}
                    </div>
                </>
            )}
            {!showLogs && (
                <Button
                    icon
                    shape="ghost"
                    className="w100 flex flex-align-items-center"
                    onClick={() => setShowLogs(true)}
                >
                    <Icon name="window-terminal" className="mr-2" />
                    <span className="flex-item-fluid">{c('Label').t`View logs`}</span>
                    <Icon name="chevron-down" />
                </Button>
            )}

            <hr className="border-weak my-2" />

            <Button icon shape="ghost" onClick={downloadLogs} className="w100 flex flex-align-items-center">
                <Icon name="arrow-down-to-square" className="mr-2" />
                <span className="flex-item-fluid">{c('Label').t`Download logs`}</span>
            </Button>
        </Card>
    );
};
