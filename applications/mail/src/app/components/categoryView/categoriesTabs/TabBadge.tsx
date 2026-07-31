import { c, msgid } from 'ttag';

import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';
import clsx from '@proton/utils/clsx';

import { TabState } from './tabsInterface';

interface TabBadgeProps {
    tabState: TabState;
    shouldShowCounter: boolean;
    count: number;
}

export const TabBadge = ({ tabState, shouldShowCounter, count }: TabBadgeProps) => {
    const [mailSettings] = useMailSettings();

    if (!shouldShowCounter) {
        return null;
    }

    const getLabel = () => {
        if (count === 0) {
            return mailSettings.ViewMode === VIEW_MODE.GROUP
                ? c('Label').t`No unread conversations`
                : c('Label').t`No unread messages`;
        }

        return mailSettings.ViewMode === VIEW_MODE.GROUP
            ? c('Label').ngettext(msgid`${count} unread conversation`, `${count} unread conversations`, count)
            : c('Label').ngettext(msgid`${count} unread message`, `${count} unread messages`, count);
    };

    return (
        <span
            aria-label={getLabel()}
            dir="ltr"
            className={clsx(
                'tag-count px-1.5 py-0.5 text-sm',
                tabState === TabState.ACTIVE ? 'mail-category-color mail-category-count-bg' : 'bg-weak color-weak',
                count === 0 && 'visibility-hidden'
            )}
        >
            {count > 999 ? '999+' : count}
        </span>
    );
};
