import { type Ref, forwardRef } from 'react';

import { MailShortcutsModal, useModalStateObject } from '@proton/components';

import AssistantIframe from 'proton-mail/components/assistant/AssistantIframe';
import PrivateLayout from 'proton-mail/components/layout/PrivateLayout';
import { LabelActionsContextProvider } from 'proton-mail/components/sidebar/EditLabelContext';
import MailStartupModals from 'proton-mail/containers/MailStartupModals';

import { RouterMailboxContainer } from './RouterMailboxContainer';
import { MailboxLayoutProvider } from './components/MailboxLayoutContext';
import { useAppShellSideEffects } from './sideEffects/useAppShellSideEffects';

const MailAppShell = (_props: {}, ref: Ref<HTMLDivElement>) => {
    const mailShortcut = useModalStateObject();

    /**
     * Temporary: App side effects
     */
    useAppShellSideEffects({ openShortcutsModal: (value: boolean) => mailShortcut.openModal(value) });

    return (
        <PrivateLayout ref={ref}>
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
