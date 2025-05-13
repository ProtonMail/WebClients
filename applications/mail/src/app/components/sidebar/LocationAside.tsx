import { ReloadSpinner } from '@proton/components';
import clsx from '@proton/utils/clsx';

import useMailModel from 'proton-mail/hooks/useMailModel';

import { getUnreadCount, getUnreadTitle } from './locationAsideHelpers';

interface Props {
    unreadCount?: number;
    weak?: boolean;
    refreshing?: boolean;
    itemOptions?: React.ReactNode;
    shouldDisplayTotal: boolean;
    hideCountOnHover: boolean;
    onRefresh?: () => void;
    isOptionDropdownOpened?: boolean;
    collapsed?: boolean;
    labelID: string;
    hideSpinner?: boolean;
}

const LocationAside = ({
    unreadCount = 0,
    refreshing = false,
    onRefresh,
    weak = false,
    shouldDisplayTotal,
    hideCountOnHover,
    itemOptions,
    isOptionDropdownOpened,
    collapsed = false,
    labelID,
    hideSpinner = false,
}: Props) => {
    const mailSettings = useMailModel('MailSettings');

    const unreadCountCopy = getUnreadCount(labelID, unreadCount);
    const unreadTitleCopy = getUnreadTitle(shouldDisplayTotal, unreadCount, mailSettings);

    return (
        <>
            {!hideSpinner && !collapsed && (
                <ReloadSpinner
                    className={clsx(['reload-spinner hidden', unreadCount > 0 ? 'mr-2' : 'mr-0.5'])}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    data-testid="navigation-link:refresh-folder"
                />
            )}
            {unreadCount > 0 ? (
                <span
                    className={clsx([
                        'navigation-counter-item px-1 shrink-0',
                        hideCountOnHover && 'group-hover:hidden',
                        weak && 'navigation-counter-item--weak pl-0',
                        isOptionDropdownOpened && 'hidden',
                    ])}
                    title={unreadTitleCopy}
                    aria-label={unreadTitleCopy}
                    data-testid="navigation-link:unread-count"
                    data-unread-count={unreadCountCopy}
                >
                    {unreadCountCopy}
                </span>
            ) : null}
            {itemOptions && (
                <span
                    className={clsx(
                        'group-hover:opacity-100 group-hover:opacity-100-no-width shrink-0 hidden md:flex mr-custom right-custom navigation-more-dropdown',
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
