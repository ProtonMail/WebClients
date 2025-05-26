import { useOpenDrawerOnLoad } from '@proton/components';

import { useContactsListener } from 'proton-mail/hooks/contact/useContactsListener';
import { useConversationsEvent } from 'proton-mail/hooks/events/useConversationsEvents';
import { useMessagesEvents } from 'proton-mail/hooks/events/useMessagesEvents';
import useIncomingDefaultsEvents from 'proton-mail/hooks/incomingDefaults/useIncomingDefaultsEvents';
import { usePageHotkeys } from 'proton-mail/hooks/mailbox/usePageHotkeys';
import useComposerEvent from 'proton-mail/hooks/useComposerEvent';
import { useMailPTTMetric } from 'proton-mail/metrics/useMailPTTMetric';

interface Props {
    openShortcutsModal: (value: boolean) => void;
}

/**
 * This hook is temporary, it's used to ensure the behavior
 * is the same while we release the mailbox refactoring.
 * The hook will be removed once we delete the `MailboxContainer`
 */
export const useAppShellSideEffects = ({ openShortcutsModal }: Props) => {
    useOpenDrawerOnLoad();

    useContactsListener();
    useConversationsEvent();
    useMessagesEvents();

    useMailPTTMetric();

    /**
     * Incoming defaults
     * - cache loading
     * - events subscription
     */
    useIncomingDefaultsEvents();

    useComposerEvent();

    usePageHotkeys({ onOpenShortcutsModal: () => openShortcutsModal(true) });
};
