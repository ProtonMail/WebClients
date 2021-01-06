import React from 'react';
import { Icon, classnames } from 'react-components';
import { c, msgid } from 'ttag';

import './RefreshRotation.scss';

interface Props {
    unreadCount?: number;
    active?: boolean;
    refreshing?: boolean;
}

const UNREAD_LIMIT = 999;

const LocationAside = ({ unreadCount, active = false, refreshing = false }: Props) => {
    const unreadTitle = unreadCount
        ? c('Info').ngettext(msgid`${unreadCount} unread element`, `${unreadCount} unread elements`, unreadCount)
        : undefined;
    return (
        <>
            {active && (
                <Icon
                    className={classnames(['mr0-5 color-global-light', refreshing && 'location-refresh-rotate'])}
                    name="reload"
                />
            )}
            {unreadCount ? (
                <span className="navigation__counterItem flex-item-noshrink" title={unreadTitle}>
                    {unreadCount > UNREAD_LIMIT ? '+999' : unreadCount}
                </span>
            ) : null}
        </>
    );
};

export default LocationAside;
