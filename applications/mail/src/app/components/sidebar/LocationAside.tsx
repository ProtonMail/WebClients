import React from 'react';
import { Icon, classnames } from 'react-components';

import './RefreshRotation.scss';

interface Props {
    unreadCount?: number;
    active?: boolean;
    refreshing?: boolean;
}

const LocationAside = ({ unreadCount, active = false, refreshing = false }: Props) => {
    return (
        <>
            {active && (
                <Icon
                    className={classnames(['mr0-5 color-global-light', refreshing && 'location-refresh-rotate'])}
                    name="reload"
                />
            )}
            {unreadCount ? (
                <span className="navigation__counterItem flex-item-noshrink rounded">{unreadCount}</span>
            ) : null}
        </>
    );
};

export default LocationAside;
