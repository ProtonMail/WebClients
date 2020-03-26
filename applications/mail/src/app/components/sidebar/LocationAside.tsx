import React from 'react';
import { Icon, classnames } from 'react-components';
import { LabelCount } from 'proton-shared/lib/interfaces/Label';

import './RefreshRotation.scss';

interface Props {
    count?: LabelCount;
    active?: boolean;
    refreshing?: boolean;
}

const LocationAside = ({ count, active = false, refreshing = false }: Props) => {
    return (
        <>
            {active && (
                <Icon
                    className={classnames(['mr0-5 color-global-light', refreshing && 'location-refresh-rotate'])}
                    name="reload"
                />
            )}
            {count?.Unread ? (
                <span className="navigation__counterItem flex-item-noshrink rounded">{count.Unread}</span>
            ) : null}
        </>
    );
};

export default LocationAside;
