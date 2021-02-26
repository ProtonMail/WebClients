import React from 'react';
import { Icon } from 'react-components';

import { MessageExtended } from '../../../models/message';
import { useExpiration } from '../../../hooks/useExpiration';

interface Props {
    message: MessageExtended;
}

const ExtraExpirationTime = ({ message }: Props) => {
    const [isExpiration, delayMessage] = useExpiration(message.data || {});

    if (!isExpiration) {
        return null;
    }

    return (
        <div className="bg-danger rounded p0-5 mb0-5 flex flex-nowrap">
            <Icon name="expiration" className="flex-item-noshrink mtauto mbauto" />
            <span className="pl0-5 pr0-5 flex-item-fluid">{delayMessage}</span>
        </div>
    );
};

export default ExtraExpirationTime;
