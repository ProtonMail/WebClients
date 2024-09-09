import { useRef } from 'react';

import { APP_VERSION } from '../../config';
import type { TransferInitializationLog, TransferLog, TransferType } from './interface';

export default function useTransferLog(transferType: TransferType) {
    const logs = useRef<(TransferInitializationLog | TransferLog)[]>([]);

    const log = (id: string, message: string, time = new Date()) => {
        logs.current.push({
            transferType,
            id,
            time,
            message,
        });
    };

    if (logs.current.length === 0) {
        logs.current.push({
            transferType,
            time: new Date(),
            message: `Transfer logging initialized. App version: ${APP_VERSION}`,
        });
    }

    const getLogs = () => {
        // Convert logs into string of one log object per line.
        return logs.current.map((log) => JSON.stringify(log)).join('\n');
    };

    const downloadLogs = () => {
        // Add info about how much time passed since last log to understand how long user waited before giving up.
        if (logs.current.length > 0) {
            log('', 'Downloading logs');
        }

        const logData = getLogs();
        if (!logData) {
            return;
        }

        var elm = document.createElement('a');
        elm.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(logData));
        elm.setAttribute('download', `proton-drive-${transferType}.log`);
        elm.style.display = 'none';
        document.body.appendChild(elm);
        elm.click();
        document.body.removeChild(elm);
    };

    const clearLogs = () => {
        logs.current = [];
    };

    return {
        log,
        downloadLogs,
        clearLogs,
    };
}
