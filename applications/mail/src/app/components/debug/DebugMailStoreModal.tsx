import { type MouseEvent, useEffect, useState } from 'react';

import { Button } from '@proton/atoms/Button/Button';
import ModalTwo, { type ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { Tab } from '@proton/components/components/tabs/Tabs';
import { Tabs } from '@proton/components/components/tabs/Tabs';
import useNotifications from '@proton/components/hooks/useNotifications';
// eslint-disable-next-line no-restricted-imports
import { useConversationCounts } from '@proton/mail/store/counts/conversationCountsSlice';
// eslint-disable-next-line no-restricted-imports
import { useMessageCounts } from '@proton/mail/store/counts/messageCountsSlice';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import humanSize from '@proton/shared/lib/helpers/humanSize';
// eslint-disable-next-line no-restricted-imports
import { loggerManager } from '@proton/shared/lib/logger';

import {
    contextPages,
    contextTotal,
    elements,
    elementsLength,
    selectCurrentContextIdentifier,
    selectFilter,
    selectLabelID,
    selectParams,
    selectSort,
} from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

interface Props extends ModalProps {}

const mailLogger = loggerManager.getLogger('mail');

const InfoRow = ({ title, value }: { title: string; value: any }) => (
    <div className="flex flex-nowrap items-baseline py-1 border-bottom border-weak">
        <span className="text-semibold shrink-0 w-custom" style={{ '--w-custom': '10rem' }}>
            {title}
        </span>
        <span className="flex-1 color-weak text-break-all">{value}</span>
    </div>
);

export const DebugMailStoreContextTotal = ({ ...rest }: Props) => {
    const params = useMailSelector(selectParams);
    const total = useMailSelector(contextTotal);
    const length = useMailSelector(elementsLength);

    const labelID = useMailSelector(selectLabelID);
    const sort = useMailSelector(selectSort);
    const filter = useMailSelector(selectFilter);

    const currentContext = useMailSelector(selectCurrentContextIdentifier);
    const ctxTotal = useMailSelector(contextTotal);
    const ctxPage = useMailSelector(contextPages);
    const el = useMailSelector(elements);

    const [conversationCounts] = useConversationCounts();
    const [messageCounts] = useMessageCounts();

    const { createNotification } = useNotifications();

    const [index, setIndex] = useState(0);
    const [reduxLogs, setReduxLogs] = useState<string>();
    const [reduxLogSize, setReduxLogSize] = useState<number>();

    useEffect(() => {
        const getReduxLogInfo = async () => {
            const logs = await mailLogger.getLogs();
            setReduxLogs(logs);

            const logsize = new Blob([logs]).size;
            if (logsize > 0) {
                setReduxLogSize(logsize);
            }
        };

        void getReduxLogInfo();
    }, []);

    const data = {
        params,
        contextTotal: total,
        elementsLength: length,
        counts: {
            conversations: conversationCounts,
            messages: messageCounts,
        },
    };

    const stringData = JSON.stringify(data, null, 2);

    const handleClearLog = () => {
        void mailLogger.clearLogs();
        setReduxLogs(undefined);
        setReduxLogSize(undefined);
    };

    const handleRefreshLog = async () => {
        const logs = await mailLogger.getLogs();
        setReduxLogs(logs);

        const logsize = new Blob([logs]).size;
        if (logsize > 0) {
            setReduxLogSize(logsize);
        }
    };

    const handleCopy = (e: MouseEvent<HTMLButtonElement>, value: string) => {
        textToClipboard(value, e.currentTarget);
        createNotification({ text: 'Copied to clipboard' });
    };

    const tabs: Tab[] = [
        {
            title: 'Information',
            content: (
                <div className="text-sm">
                    <InfoRow title="Label ID" value={labelID} />
                    <InfoRow title="Sort" value={JSON.stringify(sort)} />
                    <InfoRow title="Filter" value={JSON.stringify(filter)} />
                    <InfoRow title="URL" value={window.location.href} />
                    <InfoRow title="Current context" value={currentContext} />
                    <InfoRow title="Context total" value={ctxTotal} />
                    <InfoRow title="Context page" value={ctxPage} />
                    <InfoRow title="Elements in store" value={el.length} />
                    <InfoRow title="Tab age" value={`${Math.floor(performance.now() / 1000)}s`} />
                </div>
            ),
        },
        {
            title: 'Redux logs',
            content: (
                <div className="flex gap-2 items-center">
                    <Button size="small" onClick={handleRefreshLog}>
                        Refresh logs
                    </Button>
                    <Button size="small" onClick={() => mailLogger.downloadLogs()}>
                        Download Redux logs
                    </Button>
                    <Button size="small" onClick={(e) => handleCopy(e, reduxLogs || '')}>
                        Copy
                    </Button>
                    <Button size="small" onClick={handleClearLog}>
                        Clear logs
                    </Button>
                    {reduxLogSize && <span>{`${humanSize({ bytes: reduxLogSize, unit: 'KB' })}`}</span>}
                    {reduxLogs && <pre className="text-sm m-0 p-2 bg-weak rounded overflow-auto">{reduxLogs}</pre>}
                </div>
            ),
        },
        {
            title: 'Store state',
            content: (
                <div className="flex flex-column gap-2">
                    <div className="flex gap-2 items-center">
                        <Button size="small" onClick={(e) => handleCopy(e, stringData)}>
                            Copy
                        </Button>
                    </div>
                    <pre className="text-sm m-0 p-2 bg-weak rounded overflow-auto">{stringData}</pre>
                </div>
            ),
        },
    ];

    return (
        <ModalTwo {...rest} onClose={rest.onClose} size="large">
            <ModalTwoHeader title="Mail debugging information" />
            <ModalTwoContent className="h-custom" style={{ '--h-custom': '30rem' }}>
                <Tabs tabs={tabs} variant="modern" value={index} onChange={setIndex} />
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={rest.onClose}>Close</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
