import React from 'react';
import { Icon, classnames, useMailSettings } from 'react-components';
import { c, msgid } from 'ttag';
import { VIEW_MODE } from 'proton-shared/lib/constants';

import './RefreshRotation.scss';

interface Props {
    unreadCount?: number;
    active?: boolean;
    refreshing?: boolean;
}

const { GROUP } = VIEW_MODE;
const UNREAD_LIMIT = 9999;

const LocationAside = ({ unreadCount = 0, active = false, refreshing = false }: Props) => {
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

    return (
        <>
            {active && (
                <Icon
                    className={classnames(['mr0-5', refreshing && 'location-refresh-rotate'])}
                    name="reload"
                    data-testid="navigation-link:refresh-folder"
                />
            )}
            {unreadCount ? (
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
