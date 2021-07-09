import React from 'react';
import { Icon, classnames, useMailSettings } from '@proton/components';
import { c, msgid } from 'ttag';
import { VIEW_MODE } from '@proton/shared/lib/constants';

import './RefreshRotation.scss';

interface Props {
    unreadCount?: number;
    totalMessagesCount?: number;
    active?: boolean;
    refreshing?: boolean;
}

const { GROUP } = VIEW_MODE;
const UNREAD_LIMIT = 9999;

const LocationAside = ({ unreadCount = 0, totalMessagesCount = 0, active = false, refreshing = false }: Props) => {
    const [mailSettings] = useMailSettings();

    const getUnreadTitle = () => {
        if (mailSettings?.ViewMode === GROUP) {
            return c('Info').ngettext(
                msgid`${unreadCount} unread conversation`,
                `${unreadCount} unread conversations`,
                unreadCount
            );
        }
        return c('Info').ngettext(msgid`${unreadCount} unread message`, `${unreadCount} unread messages`, unreadCount);
    };

    const getTotalMessagesTitle = () => {
        return c('Info').ngettext(
            msgid`${totalMessagesCount} scheduled message`,
            `${totalMessagesCount} scheduled messages`,
            totalMessagesCount
        );
    };

    return (
        <>
            {active && (
                <Icon
                    className={classnames(['mr0-5', refreshing && 'location-refresh-rotate'])}
                    name="reload"
                    data-testid="navigation-link:refresh-folder"
                />
            )}
            {totalMessagesCount && totalMessagesCount > 0 ? (
                <span
                    className="navigation-counter-item navigation-counter-item--transparent flex-item-noshrink"
                    title={getTotalMessagesTitle()}
                    data-testid="navigation-link:total-messages-count"
                >
                    {totalMessagesCount > UNREAD_LIMIT ? '9999+' : totalMessagesCount}
                </span>
            ) : null}
            {unreadCount > 0 ? (
                <span
                    className="navigation-counter-item flex-item-noshrink"
                    title={getUnreadTitle()}
                    data-testid="navigation-link:unread-count"
                >
                    {unreadCount > UNREAD_LIMIT ? '9999+' : unreadCount}
                </span>
            ) : null}
        </>
    );
};

export default LocationAside;
