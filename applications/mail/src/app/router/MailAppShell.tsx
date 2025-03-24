import { type Ref, forwardRef } from 'react';

import { MailShortcutsModal, useModalStateObject, useOpenDrawerOnLoad } from '@proton/components';

import AssistantIframe from 'proton-mail/components/assistant/AssistantIframe';
import PrivateLayout from 'proton-mail/components/layout/PrivateLayout';
import { LabelActionsContextProvider } from 'proton-mail/components/sidebar/EditLabelContext';
import MailStartupModals from 'proton-mail/containers/MailStartupModals';
import { useContactsListener } from 'proton-mail/hooks/contact/useContactsListener';
import { useConversationsEvent } from 'proton-mail/hooks/events/useConversationsEvents';
import { useMessagesEvents } from 'proton-mail/hooks/events/useMessagesEvents';
import useIncomingDefaultsEvents from 'proton-mail/hooks/incomingDefaults/useIncomingDefaultsEvents';
import useIncomingDefaultsLoad from 'proton-mail/hooks/incomingDefaults/useIncomingDefaultsLoad';
import { usePageHotkeys } from 'proton-mail/hooks/mailbox/usePageHotkeys';
import { useMailPTTMetric } from 'proton-mail/metrics/useMailPTTMetric';
import { paramsSelector } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

import { RouterMailboxContainer } from './RouterMailboxContainer';
import { MailboxLayoutProvider } from './components/MailboxLayoutContext';

const MailAppShell = (_props: {}, ref: Ref<HTMLDivElement>) => {
    const mailShortcut = useModalStateObject();

    useOpenDrawerOnLoad();

    useContactsListener();
    useConversationsEvent();
    useMessagesEvents();

    useMailPTTMetric();

    useIncomingDefaultsLoad();
    useIncomingDefaultsEvents();

    usePageHotkeys({ onOpenShortcutsModal: () => mailShortcut.openModal(true) });

    const { labelID } = useMailSelector(paramsSelector);

    return (
        <PrivateLayout ref={ref} labelID={labelID}>
            <MailStartupModals />
            <LabelActionsContextProvider>
                <MailboxLayoutProvider>
                    <RouterMailboxContainer />
                </MailboxLayoutProvider>
            </LabelActionsContextProvider>
            <AssistantIframe />
            {mailShortcut.render && <MailShortcutsModal {...mailShortcut.modalProps} />}
        </PrivateLayout>
    );
};

export default forwardRef(MailAppShell);
