import useOpenDrawerOnLoad from '@proton/components/hooks/drawer/useOpenDrawerOnLoad';

import { useContactsListener } from '../../hooks/contact/useContactsListener';
import { useConversationsEvent } from '../../hooks/events/useConversationsEvents';
import { useMessagesEvents } from '../../hooks/events/useMessagesEvents';
import useIncomingDefaultsEvents from '../../hooks/incomingDefaults/useIncomingDefaultsEvents';
import { usePageHotkeys } from '../../hooks/mailbox/usePageHotkeys';
import useComposerEvent from '../../hooks/useComposerEvent';
import { useMailPTTMetric } from '../../metrics/useMailPTTMetric';

import { useMailNavigationLogger } from './useMailNavigationLogger';

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

    // Logs user navigation
    useMailNavigationLogger();

    /**
     * Incoming defaults
     * - cache loading
     * - events subscription
     */
    useIncomingDefaultsEvents();

    useComposerEvent();

    usePageHotkeys({ onOpenShortcutsModal: () => openShortcutsModal(true) });
};
