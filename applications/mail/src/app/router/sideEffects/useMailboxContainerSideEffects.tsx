import { useCalendarUserSettings } from '@proton/calendar/calendarUserSettings/hooks';
import { useCalendars } from '@proton/calendar/calendars/hooks';

import useAutoOpenContactsDrawer from '../../hooks/drawer/useAutoOpenContactsDrawer';
import { useMailboxPageTitle } from '../../hooks/mailbox/mailboxPageTitle/useMailboxPageTitle';
import useNewEmailNotification from '../../hooks/mailbox/notifications/useNewEmailNotification';
import { type EncryptedSearchParams, useApplyEncryptedSearch } from '../../hooks/mailbox/useApplyEncryptedSearch';
import { useMailboxFavicon } from '../../hooks/mailbox/useMailboxFavicon';
import usePreLoadElements from '../../hooks/mailbox/usePreLoadElements';
import useInboxBadgeCount from '../../hooks/useInboxBadgeCount';
import useInboxDesktopElementId from '../../hooks/useInboxDesktopElementId';
import useMailtoHash from '../../hooks/useMailtoHash';
import type { Element } from '../../models/element';

import useShowBYOESpotlightModal from '../../hooks/useShowBYOESpotlightModal';

interface Props {
    labelID: string;
    isSearch: boolean;
    elementsParams: EncryptedSearchParams;
    handleCheckAll: (value: boolean) => void;
    elements: Element[];
    loading: boolean;
}

/**
 * This hook is temporary, it's used to ensure the behavior
 * is the same while we release the mailbox refactoring.
 * The hook will be removed once we delete the `MailboxContainer`
 */
export const useMailboxContainerSideEffects = ({
    labelID,
    isSearch,
    elementsParams,
    handleCheckAll,
    elements,
    loading,
}: Props) => {
    // Open a composer when the url contains a mailto query
    useMailtoHash({ isSearch });

    // Opens the email details when the url contains a elementID query
    useInboxDesktopElementId({ isSearch });

    useApplyEncryptedSearch(elementsParams);

    useMailboxPageTitle();
    useMailboxFavicon();
    useInboxBadgeCount();

    useNewEmailNotification(() => handleCheckAll(false));

    // When URL contains a contact route, we need to open the contact drawer app
    useAutoOpenContactsDrawer();

    // Launch two calendar-specific API calls here to boost calendar widget performance
    useCalendars();
    useCalendarUserSettings();

    usePreLoadElements({ elements, labelID, loading });

    useShowBYOESpotlightModal();
};
