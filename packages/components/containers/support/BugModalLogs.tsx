import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Collapsible from '@proton/components/components/collapsible/Collapsible';
import CollapsibleContent from '@proton/components/components/collapsible/CollapsibleContent';
import CollapsibleHeader from '@proton/components/components/collapsible/CollapsibleHeader';
import CollapsibleHeaderIconButton from '@proton/components/components/collapsible/CollapsibleHeaderIconButton';
import Checkbox from '@proton/components/components/input/Checkbox';
import { IcChevronDown } from '@proton/icons/icons/IcChevronDown';
import { logger } from '@proton/logger';

const PREVIEW_LINE_COUNT = 10;

interface Props {
    collectLogs: boolean;
    collectLogsInboxDesktop: boolean;
    includeLogs: boolean;
    onIncludeLogsChange: (value: boolean) => void;
    onLogsLoaded: (logs: string) => void;
    disabled?: boolean;
}

const BugModalLogs = ({
    collectLogs,
    collectLogsInboxDesktop,
    includeLogs,
    onIncludeLogsChange,
    onLogsLoaded,
    disabled,
}: Props) => {
    const [previewLines, setPreviewLines] = useState<string[]>([]);

    // Preloaded on mount so the logs are already read by the time the user submits the form.
    useEffect(() => {
        if (!collectLogs) {
            return;
        }

        void logger.getLogs().then((logs) => {
            onLogsLoaded(logs);
            setPreviewLines(logs.split('\n').filter(Boolean).slice(0, PREVIEW_LINE_COUNT));
        });
    }, [collectLogs]);

    if (!collectLogs && !collectLogsInboxDesktop) {
        return null;
    }

    return (
        <div className="mb-4">
            <div className="flex items-center justify-space-between">
                <Checkbox
                    id="includeLogs"
                    checked={includeLogs}
                    onChange={({ target: { checked } }) => onIncludeLogsChange(checked)}
                    disabled={disabled}
                >
                    {c('Label').t`Include application logs in bug report`}
                </Checkbox>
                {collectLogs && (
                    <Button
                        className="ml-2"
                        shape="underline"
                        onClick={() => logger.downloadLogs()}
                        title={c('Info').t`Download current logs`}
                    >
                        {c('Action').t`Download logs`}
                    </Button>
                )}
            </div>
            <p className="color-weak text-sm mt-1 mb-0">
                {c('Info')
                    .t`Logs help us understand what happened before the problem occurred. They include app actions and error messages, but no message content.`}
            </p>
            {collectLogs && previewLines.length > 0 && (
                <Collapsible className="mt-2">
                    <CollapsibleHeader
                        disableFullWidth
                        suffix={
                            <CollapsibleHeaderIconButton size="small">
                                <IcChevronDown />
                            </CollapsibleHeaderIconButton>
                        }
                    >
                        <span className="text-sm color-weak">{c('Action').t`Preview logs`}</span>
                    </CollapsibleHeader>
                    <CollapsibleContent className="mt-2">
                        <pre className="text-sm bg-weak rounded p-2 mb-0 text-pre-wrap">{previewLines.join('\n')}</pre>
                    </CollapsibleContent>
                </Collapsible>
            )}
        </div>
    );
};

export default BugModalLogs;
