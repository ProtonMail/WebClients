import { c, msgid } from 'ttag';

import type { CategoryTab } from '@proton/mail/features/categoriesView/categoriesConstants';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';
import clsx from '@proton/utils/clsx';

import { selectLabelIDUnreadCount } from 'proton-mail/hooks/mailboxCounter/useMaiboxCounter.selector';
import { useMailSelector } from 'proton-mail/store/hooks';

import { TabState } from './tabsInterface';

interface TabBadgeProps {
    category: CategoryTab;
    tabState: TabState;
    shouldShowCounter: boolean;
    shouldShowNewBadge: boolean;
}

export const TabBadge = ({ category, tabState, shouldShowCounter, shouldShowNewBadge }: TabBadgeProps) => {
    const [mailSettings] = useMailSettings();

    const count = useMailSelector((state) => selectLabelIDUnreadCount(state, category.id));

    if (shouldShowNewBadge) {
        return (
            <span className="tag-badge px-1.5 py-0.5 text-sm mail-category-color mail-category-count-bg">
                {c('Label').t`New`}
            </span>
        );
    }

    if (shouldShowCounter && count > 0) {
        const label =
            mailSettings.ViewMode === VIEW_MODE.GROUP
                ? c('Label').ngettext(msgid`${count} unread conversation`, `${count} unread conversations`, count)
                : c('Label').ngettext(msgid`${count} unread message`, `${count} unread messages`, count);

        return (
            <span
                aria-label={label}
                className={clsx(
                    'tag-count px-1.5 py-0.5 text-sm',
                    shouldShowCounter ? undefined : 'opacity-0',
                    tabState === TabState.ACTIVE ? 'mail-category-color mail-category-count-bg' : 'bg-weak color-weak'
                )}
            >
                {count > 999 ? '999+' : count}
            </span>
        );
    }

    return null;
};
