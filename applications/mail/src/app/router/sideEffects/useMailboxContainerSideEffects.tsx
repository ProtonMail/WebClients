import { useCalendarUserSettings } from '@proton/calendar/calendarUserSettings/hooks';
import { useCalendars } from '@proton/calendar/calendars/hooks';
import { useInboxDesktopBadgeCount } from '@proton/components';

import useAutoOpenContactsDrawer from 'proton-mail/hooks/drawer/useAutoOpenContactsDrawer';
import useNewEmailNotification from 'proton-mail/hooks/mailbox/notifications/useNewEmailNotification';
import { type EncryptedSearchParams, useApplyEncryptedSearch } from 'proton-mail/hooks/mailbox/useApplyEncryptedSearch';
import { useMailboxFavicon } from 'proton-mail/hooks/mailbox/useMailboxFavicon';
import { useMailboxPageTitle } from 'proton-mail/hooks/mailbox/useMailboxPageTitle';
import usePreLoadElements from 'proton-mail/hooks/mailbox/usePreLoadElements';
import useInboxDesktopElementId from 'proton-mail/hooks/useInboxDesktopElementId';
import useMailtoHash from 'proton-mail/hooks/useMailtoHash';
import type { Element } from 'proton-mail/models/element';

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

    useMailboxPageTitle(labelID);
    useMailboxFavicon(labelID);
    useInboxDesktopBadgeCount();

    useNewEmailNotification(() => handleCheckAll(false));

    // When URL contains a contact route, we need to open the contact drawer app
    useAutoOpenContactsDrawer();

    // Launch two calendar-specific API calls here to boost calendar widget performance
    useCalendars();
    useCalendarUserSettings();

    usePreLoadElements({ elements, labelID, loading });
};
