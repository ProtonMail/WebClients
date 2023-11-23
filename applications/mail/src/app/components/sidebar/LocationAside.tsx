import { c, msgid } from 'ttag';

import { ReloadSpinner } from '@proton/components';
import { VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';
import clsx from '@proton/utils/clsx';

import useMailModel from 'proton-mail/hooks/useMailModel';

interface Props {
    unreadCount?: number;
    active?: boolean;
    weak?: boolean;
    refreshing?: boolean;
    itemOptions?: React.ReactNode;
    shouldDisplayTotal: boolean;
    hideCountOnHover: boolean;
    onRefresh?: () => void;
    isOptionDropdownOpened?: boolean;
}

const { GROUP } = VIEW_MODE;
const UNREAD_LIMIT = 9999;

const LocationAside = ({
    unreadCount = 0,
    active = false,
    refreshing = false,
    onRefresh,
    weak = false,
    shouldDisplayTotal,
    hideCountOnHover,
    itemOptions,
    isOptionDropdownOpened,
}: Props) => {
    const mailSettings = useMailModel('MailSettings');

    const getUnreadTitle = () => {
        if (shouldDisplayTotal) {
            return c('Info').ngettext(
                msgid`${unreadCount} scheduled message`,
                `${unreadCount} scheduled messages`,
                unreadCount
            );
        }
        if (mailSettings.ViewMode === GROUP) {
            return c('Info').ngettext(
                msgid`${unreadCount} unread conversation`,
                `${unreadCount} unread conversations`,
                unreadCount
            );
        }
        return c('Info').ngettext(msgid`${unreadCount} unread message`, `${unreadCount} unread messages`, unreadCount);
    };

    const unreadText = unreadCount > UNREAD_LIMIT ? '9999+' : unreadCount;

    return (
        <>
            {active && (
                <ReloadSpinner
                    className={clsx([unreadCount > 0 ? 'mr-2' : 'mr-0.5'])}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    data-testid="navigation-link:refresh-folder"
                />
            )}
            {unreadCount > 0 ? (
                <span
                    className={clsx([
                        'navigation-counter-item px-1 flex-item-noshrink',
                        hideCountOnHover && 'group-hover:hidden',
                        weak && 'navigation-counter-item--weak pl-0',
                        isOptionDropdownOpened && 'hidden',
                    ])}
                    title={getUnreadTitle()}
                    aria-label={getUnreadTitle()}
                    data-testid="navigation-link:unread-count"
                    data-unread-count={unreadText}
                >
                    {unreadText}
                </span>
            ) : null}
            {itemOptions && (
                <span
                    className={clsx(
                        'group-hover:opacity-100 group-hover:opacity-100-no-width flex-item-noshrink hidden md:flex mr-custom right-custom',
                        isOptionDropdownOpened && 'is-active'
                    )}
                    style={{ '--mr-custom': 'calc(var(--space-1) * -1)', '--right-custom': 'var(--space-2)' }}
                >
                    {itemOptions}
                </span>
            )}
        </>
    );
};

export default LocationAside;
