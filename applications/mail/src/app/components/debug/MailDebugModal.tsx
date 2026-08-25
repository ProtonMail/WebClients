import { type MouseEvent, useState } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import ModalTwo, { type ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { Tab } from '@proton/components/components/tabs/Tabs';
import { Tabs } from '@proton/components/components/tabs/Tabs';
// eslint-disable-next-line no-restricted-imports
import { useConversationCounts } from '@proton/mail/store/counts/conversationCountsSlice';
// eslint-disable-next-line no-restricted-imports
import { useMessageCounts } from '@proton/mail/store/counts/messageCountsSlice';
import { selectCategories } from '@proton/mail/store/labels';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import { useFlag } from '@proton/unleash/useFlag';

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
} from '../../store/elements/elementsSelectors';
import { useMailSelector } from '../../store/hooks';
import { DebugContentSearchView } from './DebugContentSearchView';
import { DebugModalLogs } from './DebugModalLogs';
import { DebugModalLogPerformance } from './logPerformances/DebugModalLogPerformance';

interface Props extends ModalProps {}

const InfoRow = ({ title, value }: { title: string; value: any }) => (
    <div className="flex flex-nowrap items-baseline py-1 border-bottom border-weak">
        <span className="text-semibold shrink-0 w-custom" style={{ '--w-custom': '10rem' }}>
            {title}
        </span>
        <span className="flex-1 color-weak text-break-all">{value}</span>
    </div>
);

export const MailDebugModal = ({ ...rest }: Props) => {
    const params = useMailSelector(selectParams);
    const total = useMailSelector(contextTotal);
    const length = useMailSelector(elementsLength);

    const labelID = useMailSelector(selectLabelID);
    const sort = useMailSelector(selectSort);
    const filter = useMailSelector(selectFilter);

    const currentContext = useMailSelector(selectCurrentContextIdentifier);
    const categories = useMailSelector(selectCategories);
    const ctxTotal = useMailSelector(contextTotal);
    const ctxPage = useMailSelector(contextPages);
    const el = useMailSelector(elements);

    const [conversationCounts] = useConversationCounts();
    const [messageCounts] = useMessageCounts();

    const { createNotification } = useNotifications();

    const isContentSearchEnabled = useFlag('ContentSearch');

    const [index, setIndex] = useState(0);

    const data = {
        params,
        categories,
        contextTotal: total,
        elementsLength: length,
        counts: {
            conversations: conversationCounts,
            messages: messageCounts,
        },
    };

    const stringData = JSON.stringify(data, null, 2);

    const handleCopy = (e: MouseEvent<HTMLButtonElement>, value: string) => {
        textToClipboard(value, e.currentTarget);
        createNotification({ text: c('Info').t`Copied to clipboard` });
    };

    const tabs: Tab[] = [
        {
            title: c('Label').t`Information`,
            content: (
                <div className="text-sm">
                    <InfoRow title={c('Label').t`Label ID`} value={labelID} />
                    <InfoRow title={c('Label').t`Sort`} value={JSON.stringify(sort)} />
                    <InfoRow title={c('Label').t`Filter`} value={JSON.stringify(filter)} />
                    <InfoRow title={c('Label').t`URL`} value={window.location.href} />
                    <InfoRow title={c('Label').t`Current context`} value={currentContext} />
                    <InfoRow title={c('Label').t`Context total`} value={ctxTotal} />
                    <InfoRow title={c('Label').t`Context page`} value={ctxPage} />
                    <InfoRow title={c('Label').t`Elements in store`} value={el.length} />
                    <InfoRow title={c('Label').t`Tab age`} value={`${Math.floor(performance.now() / 1000)}s`} />
                </div>
            ),
        },
        { title: c('Label').t`Mail logs`, content: <DebugModalLogs /> },
        { title: c('Label').t`Log performance`, content: <DebugModalLogPerformance /> },
        {
            title: c('Label').t`Store state`,
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

    if (isContentSearchEnabled) {
        tabs.push({
            title: 'Content search',
            content: <DebugContentSearchView />,
        });
    }

    return (
        <ModalTwo {...rest} onClose={rest.onClose} size="large">
            <ModalTwoHeader title={c('Label').t`Mail debugging information`} />
            <ModalTwoContent className="h-custom flex flex-column flex-nowrap" style={{ '--h-custom': '30rem' }}>
                <Tabs
                    tabs={tabs}
                    variant="modern"
                    value={index}
                    onChange={setIndex}
                    className="flex flex-column flex-nowrap flex-1 min-h-0"
                    contentClassName="flex-1 min-h-0 overflow-auto"
                />
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={rest.onClose}>Close</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
