import React, { useState, useEffect } from 'react';
import { Icon, Tooltip } from 'react-components';
import { c } from 'ttag';

import { Element } from '../../models/element';

const EXPIRATION_INTERVAL = 1000;

interface Props {
    element: Element;
}

const ItemExpiration = ({ element }: Props) => {
    const { ExpirationTime = 0 } = element;
    const [willExpireIn, setWillExpireIn] = useState(false);

    useEffect(() => {
        const intervalID = setInterval(() => {
            const now = ~~(Date.now() / 1000); // unix timestamp

            if (ExpirationTime) {
                setWillExpireIn(ExpirationTime < now);
            }
        }, EXPIRATION_INTERVAL);

        return () => clearInterval(intervalID);
    }, []);

    if (!willExpireIn) {
        return null;
    }

    const value = +ExpirationTime * 1000;
    const expiration = new Date(value || Date.now()).toISOString();
    const title = c('Info').t`This message will expire in ${expiration}`;

    return (
        <Tooltip title={title}>
            <Icon name="expiration" className="color-global-warning" />
        </Tooltip>
    );
};

export default ItemExpiration;
