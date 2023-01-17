import { c, msgid } from 'ttag';

import { ReloadSpinner, classnames, useMailSettings } from '@proton/components';
import { VIEW_MODE } from '@proton/shared/lib/constants';

interface Props {
    unreadCount?: number;
    active?: boolean;
    weak?: boolean;
    refreshing?: boolean;
    itemOptions?: React.ReactNode;
    shouldDisplayTotal: boolean;
    hideCountOnHover: boolean;
    onRefresh?: (event: React.MouseEvent<Element>) => void;
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
}: Props) => {
    const [mailSettings] = useMailSettings();

    const getUnreadTitle = () => {
        if (shouldDisplayTotal) {
            return c('Info').ngettext(
                msgid`${unreadCount} scheduled message`,
                `${unreadCount} scheduled messages`,
                unreadCount
            );
        }
        if (mailSettings?.ViewMode === GROUP) {
            return c('Info').ngettext(
                msgid`${unreadCount} unread conversation`,
                `${unreadCount} unread conversations`,
                unreadCount
            );
        }
        return c('Info').ngettext(msgid`${unreadCount} unread message`, `${unreadCount} unread messages`, unreadCount);
    };

    return (
        <>
            {active && (
                <ReloadSpinner
                    className={classnames([unreadCount > 0 ? 'mr0-5' : 'mr0-15'])}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    data-testid="navigation-link:refresh-folder"
                />
            )}
            {unreadCount > 0 ? (
                <span
                    className={classnames([
                        'navigation-counter-item flex-item-noshrink',
                        hideCountOnHover && 'hide-on-hover',
                        weak && 'navigation-counter-item--weak',
                    ])}
                    title={getUnreadTitle()}
                    aria-label={getUnreadTitle()}
                    data-testid="navigation-link:unread-count"
                >
                    {unreadCount > UNREAD_LIMIT ? '9999+' : unreadCount}
                </span>
            ) : null}
            {itemOptions && (
                <span className="opacity-on-hover opacity-on-hover-no-width flex-item-noshrink no-mobile">
                    {itemOptions}
                </span>
            )}
        </>
    );
};

export default LocationAside;
