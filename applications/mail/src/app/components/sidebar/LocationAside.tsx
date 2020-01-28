import React from 'react';
import { LabelCount } from '../../models/label';
import { Icon, classnames } from 'react-components';

import './RefreshRotation.scss';

interface Props {
    labelID: string;
    counterMap: { [labelID: string]: LabelCount | undefined };
    currentLabelID: string;
    refreshLabelID?: string;
}

const LocationAside = ({ labelID, counterMap, currentLabelID, refreshLabelID }: Props) => {
    const unread = counterMap[labelID]?.Unread;

    return (
        <>
            {labelID === currentLabelID && (
                <Icon
                    className={classnames(['mr0-5', labelID === refreshLabelID && 'location-refresh-rotate'])}
                    fill="light"
                    name="reload"
                />
            )}
            {unread ? <span className="navigation__counterItem flex-item-noshrink rounded">{unread}</span> : null}
        </>
    );
};

export default LocationAside;
