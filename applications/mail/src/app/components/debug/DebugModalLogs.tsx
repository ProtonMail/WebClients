import type { MouseEvent } from 'react';
import { useEffect, useState } from 'react';

import { Button } from '@proton/atoms/Button/Button';
import useNotifications from '@proton/components/hooks/useNotifications';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import humanSize from '@proton/shared/lib/helpers/humanSize';
// eslint-disable-next-line no-restricted-imports
import { loggerManager } from '@proton/shared/lib/logger';

const mailLogger = loggerManager.getLogger('mail');

export const DebugModalLogs = () => {
    const [logs, setLogs] = useState<string>();

    const { createNotification } = useNotifications();

    useEffect(() => {
        const getLogs = async () => {
            const logs = await mailLogger.getLogs();
            setLogs(logs);
        };

        void getLogs();
    }, []);

    const handleClearLog = () => {
        void mailLogger.clearLogs();
        setLogs(undefined);
    };

    const handleRefreshLog = async () => {
        const logs = await mailLogger.getLogs();
        setLogs(logs);
    };

    const handleCopy = (e: MouseEvent<HTMLButtonElement>, value: string) => {
        textToClipboard(value, e.currentTarget);
        createNotification({ text: 'Copied to clipboard' });
    };

    const logsSize = logs ? new Blob([logs]).size : 0;

    return (
        <div className="flex gap-2 items-center">
            <Button size="small" onClick={handleRefreshLog}>
                Refresh logs
            </Button>
            <Button size="small" onClick={() => mailLogger.downloadLogs()}>
                Download Redux logs
            </Button>
            <Button size="small" onClick={(e) => handleCopy(e, logs || '')}>
                Copy
            </Button>
            <Button size="small" onClick={handleClearLog}>
                Clear logs
            </Button>
            {logsSize > 0 && <span>{`${humanSize({ bytes: logsSize })}`}</span>}
            {logs && <pre className="text-sm m-0 p-2 bg-weak rounded overflow-auto">{logs}</pre>}
        </div>
    );
};
