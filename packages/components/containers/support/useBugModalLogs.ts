import { useState } from 'react';

import { logger } from '@proton/logger';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';
import { getInboxDesktopLogsBlob, isInboxDesktopBugReportLogsSupported } from '@proton/shared/lib/desktop/logHelpers';
import { useFlag } from '@proton/unleash/useFlag';

const APPS_FOR_LOG_COLLECTION: Partial<Record<APP_NAMES, boolean>> = {
    [APPS.PROTONMAIL]: true,
    [APPS.PROTONCALENDAR]: true,
};

const getTimestampedFilename = (prefix: string) => `${prefix}-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;

export const useBugModalLogs = (app: APP_NAMES) => {
    // Preloaded by BugModalLogs as soon as the modal opens, so submission does not have to wait on reading the log file.
    const [preloadedLogs, setPreloadedLogs] = useState<string>();

    const isCollectingLogsFlagOn = useFlag('CollectLogs');
    const isAppCollectingLogs = Boolean(APPS_FOR_LOG_COLLECTION[app]);
    const collectLogs = isCollectingLogsFlagOn && isAppCollectingLogs;

    const isDesktopLogCollectionDisabled = useFlag('InboxDesktopBugReportLogAttachmentDisabled');
    const collectLogsInboxDesktop = !isDesktopLogCollectionDisabled && isInboxDesktopBugReportLogsSupported();

    const [includeLogs, setIncludeLogs] = useState(collectLogs || collectLogsInboxDesktop);

    const getLogAttachments = async (existingAttachments: { [key: string]: Blob }) => {
        const attachments: { [key: string]: Blob } = {};

        if (collectLogs && includeLogs) {
            const logs = preloadedLogs ?? (await logger.getLogs());
            if (logs && logs.trim()) {
                attachments[getTimestampedFilename('logs')] = new Blob([logs], { type: 'text/plain' });
            }
        }

        if (collectLogsInboxDesktop && includeLogs) {
            const attachmentSize = Object.values({ ...existingAttachments, ...attachments }).reduce(
                (sum, blob) => sum + blob.size,
                0
            );
            const inboxDesktopLogs = await getInboxDesktopLogsBlob(attachmentSize);
            if (inboxDesktopLogs) {
                attachments[getTimestampedFilename('logs-INDA')] = inboxDesktopLogs;
            }
        }

        return attachments;
    };

    return {
        collectLogs,
        collectLogsInboxDesktop,
        includeLogs,
        setIncludeLogs,
        setPreloadedLogs,
        getLogAttachments,
    };
};
