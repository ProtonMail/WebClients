import type { Ref } from 'react';
import { forwardRef, memo } from 'react';
import { Redirect, useRouteMatch } from 'react-router-dom';

import type { Breakpoints } from '@proton/components';
import {
    MailShortcutsModal,
    useFolders,
    useLabels,
    useModalState,
    useOpenDrawerOnLoad,
    useUserSettings,
} from '@proton/components';
import type { UserSettings } from '@proton/shared/lib/interfaces';
import type { Label } from '@proton/shared/lib/interfaces/Label';

import AssistantIframe from 'proton-mail/components/assistant/AssistantIframe';
import useMailModel from 'proton-mail/hooks/useMailModel';

import PrivateLayout from '../components/layout/PrivateLayout';
import { LabelActionsContextProvider } from '../components/sidebar/EditLabelContext';
import { HUMAN_TO_LABEL_IDS } from '../constants';
import type { MailUrlParams } from '../helpers/mailboxUrl';
import { useContactsListener } from '../hooks/contact/useContactsListener';
import { useConversationsEvent } from '../hooks/events/useConversationsEvents';
import { useMessagesEvents } from '../hooks/events/useMessagesEvents';
import useIncomingDefaultsEvents from '../hooks/incomingDefaults/useIncomingDefaultsEvents';
import useIncomingDefaultsLoad from '../hooks/incomingDefaults/useIncomingDefaultsLoad';
import { usePageHotkeys } from '../hooks/mailbox/usePageHotkeys';
import { useDeepMemo } from '../hooks/useDeepMemo';
import MailStartupModals from './MailStartupModals';
import MailboxContainer from './mailbox/MailboxContainer';

interface Props {
    params: MailUrlParams;
    breakpoints: Breakpoints;
}

const PageContainer = ({ params: { elementID, labelID, messageID }, breakpoints }: Props, ref: Ref<HTMLDivElement>) => {
    const [userSettings] = useUserSettings();
    const mailSettings = useMailModel('MailSettings');
    const [mailShortcutsProps, setMailShortcutsModalOpen, renderMailShortcutsModal] = useModalState();

    useOpenDrawerOnLoad();

    useContactsListener();
    useConversationsEvent();
    useMessagesEvents();

    /**
     * Incoming defaults
     * - cache loading
     * - events subscription
     */
    useIncomingDefaultsLoad();
    useIncomingDefaultsEvents();

    usePageHotkeys({ onOpenShortcutsModal: () => setMailShortcutsModalOpen(true) });

    if (!labelID) {
        return <Redirect to="/inbox" />;
    }

    return (
        <PrivateLayout ref={ref} labelID={labelID} elementID={elementID} breakpoints={breakpoints}>
            <MailStartupModals />
            <LabelActionsContextProvider>
                <MailboxContainer
                    labelID={labelID}
                    mailSettings={mailSettings}
                    userSettings={userSettings as UserSettings}
                    breakpoints={breakpoints}
                    elementID={elementID}
                    messageID={messageID}
                />
            </LabelActionsContextProvider>
            {renderMailShortcutsModal && <MailShortcutsModal {...mailShortcutsProps} />}
            <AssistantIframe />
        </PrivateLayout>
    );
};

const MemoPageContainer = memo(forwardRef(PageContainer));

interface PageParamsParserProps {
    breakpoints: Breakpoints;
}

const PageParamsParser = (props: PageParamsParserProps, ref: Ref<HTMLDivElement>) => {
    const [labels = []] = useLabels();
    const [folders = []] = useFolders();
    const match = useRouteMatch<MailUrlParams>();

    const params = useDeepMemo(() => {
        const labelIDs = [...labels, ...folders].map(({ ID }: Label) => ID);
        const { elementID, labelID: currentLabelID = '', messageID } = (match || {}).params || {};
        const labelID = HUMAN_TO_LABEL_IDS[currentLabelID] || (labelIDs.includes(currentLabelID) && currentLabelID);
        return { elementID, labelID, messageID };
    }, [match]);

    return <MemoPageContainer ref={ref} {...props} params={params} />;
};
export default forwardRef(PageParamsParser);
