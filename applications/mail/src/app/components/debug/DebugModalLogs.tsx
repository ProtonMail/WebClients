import type { MouseEvent } from 'react';
import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import Collapsible from '@proton/components/components/collapsible/Collapsible';
import CollapsibleContent from '@proton/components/components/collapsible/CollapsibleContent';
import CollapsibleHeader from '@proton/components/components/collapsible/CollapsibleHeader';
import CollapsibleHeaderIconButton from '@proton/components/components/collapsible/CollapsibleHeaderIconButton';
import { IcChevronDown } from '@proton/icons/icons/IcChevronDown';
import { logger } from '@proton/logger';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import humanSize from '@proton/shared/lib/helpers/humanSize';

export const DebugModalLogs = () => {
    const [logs, setLogs] = useState<string>();

    const { createNotification } = useNotifications();

    useEffect(() => {
        const getLogs = async () => {
            const logs = await logger.getLogs();
            setLogs(logs);
        };

        void getLogs();
    }, []);

    const handleClearLog = () => {
        void logger.clearLogs();
        setLogs(undefined);
    };

    const handleRefreshLog = async () => {
        const logs = await logger.getLogs();
        setLogs(logs);
    };

    const handleCopy = (e: MouseEvent<HTMLButtonElement>, value: string) => {
        textToClipboard(value, e.currentTarget);
        createNotification({ text: c('Info').t`Copied to clipboard` });
    };

    const logsSize = logs ? new Blob([logs]).size : 0;

    return (
        <div className="flex gap-2 items-center">
            <Button size="small" onClick={handleRefreshLog}>
                {c('Label').t`Refresh logs`}
            </Button>
            <Button size="small" onClick={() => logger.downloadLogs()}>
                {c('Label').t`Download logs`}
            </Button>
            <Button size="small" onClick={(e) => handleCopy(e, logs || '')}>
                {c('Label').t`Copy`}
            </Button>
            <Button size="small" onClick={handleClearLog}>
                {c('Label').t`Clear logs`}
            </Button>
            {logsSize > 0 && <span>{`${humanSize({ bytes: logsSize })}`}</span>}
            {logs && (
                <Collapsible className="mt-2 w-full">
                    <CollapsibleHeader
                        suffix={
                            <CollapsibleHeaderIconButton>
                                <IcChevronDown />
                            </CollapsibleHeaderIconButton>
                        }
                    >
                        <span>{c('Info').t`Expand logs`}</span>
                    </CollapsibleHeader>
                    <CollapsibleContent>
                        <pre className="text-sm m-0 p-2 bg-weak rounded overflow-auto">{logs}</pre>
                    </CollapsibleContent>
                </Collapsible>
            )}
        </div>
    );
};
