import { useDrive } from '@proton/drive';

import { downloadLogs } from '../../utils/downloadLogs';

export type Log = {
    time: Date;
    level: string;
    logger: string;
    message: string;
};

export const useLogsState = () => {
    const { getLogs } = useDrive();

    const unparsedLogs = getLogs() || [];

    const parsedLogs = unparsedLogs.map((log) => JSON.parse(log));

    const logs: Log[] = parsedLogs.map((log) => ({
        time: new Date(log.time),
        level: log.level,
        logger: log.loggerName,
        message: log.message,
    }));

    return {
        logs,
        downloadLogs: () => {
            downloadLogs(getLogs());
        },
    };
};
