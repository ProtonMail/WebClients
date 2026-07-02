import { c, msgid } from 'ttag';

import type { CategoryTab } from '@proton/mail/features/categoriesView/categoriesConstants';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';
import { useFlag } from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

import { selectLabelIDUnreadCount } from 'proton-mail/hooks/mailboxCounter/useMaiboxCounter.selector';
import { useMailSelector } from 'proton-mail/store/hooks';

import { TabState } from './tabsInterface';

interface TabBadgeProps {
    category: CategoryTab;
    tabState: TabState;
    shouldShowCounter: boolean;
}

export const TabBadge = ({ category, tabState, shouldShowCounter }: TabBadgeProps) => {
    const [mailSettings] = useMailSettings();
    const showBadge = useFlag('CategoriesUnseenBadge');

    const count = useMailSelector((state) => selectLabelIDUnreadCount(state, category.id));

    const label =
        mailSettings.ViewMode === VIEW_MODE.GROUP
            ? c('Label').ngettext(msgid`${count} unread conversation`, `${count} unread conversations`, count)
            : c('Label').ngettext(msgid`${count} unread message`, `${count} unread messages`, count);

    if (!showBadge && count > 0) {
        return (
            <span
                aria-label={label}
                dir="ltr"
                className={clsx(
                    'tag-count px-1.5 py-0.5 text-sm',
                    tabState === TabState.ACTIVE ? 'mail-category-color mail-category-count-bg' : 'bg-weak color-weak'
                )}
            >
                {count > 999 ? '999+' : count}
            </span>
        );
    }

    if (shouldShowCounter && count > 0) {
        return (
            <span
                aria-label={label}
                dir="ltr"
                className={clsx(
                    'tag-count px-1.5 py-0.5 text-sm',
                    tabState === TabState.ACTIVE ? 'mail-category-color mail-category-count-bg' : 'bg-weak color-weak'
                )}
            >
                {count > 999 ? '999+' : count}
            </span>
        );
    }

    return null;
};
