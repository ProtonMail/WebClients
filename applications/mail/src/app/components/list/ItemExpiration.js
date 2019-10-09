import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Icon } from 'react-components';
import { c } from 'ttag';

import { ELEMENT_TYPES } from '../../constants';

const EXPIRATION_INTERVAL = 1000;

const ItemExpiration = ({ element }) => {
    const { ExpirationTime } = element;
    const [willExpireIn, setWillExpireIn] = useState(false);

    useEffect(() => {
        const intervalID = setInterval(() => {
            const now = ~~(Date.now() / 1000); // unix timestamp

            if (ExpirationTime) {
                setWillExpireIn(ExpirationTime < now);
            }
        }, EXPIRATION_INTERVAL);

        return () => {
            clearInterval(intervalID);
        };
    }, []);

    if (!willExpireIn) {
        return null;
    }

    const value = +ExpirationTime * 1000;
    const expiration = new Date(value || Date.now()).toISOString();
    const title = c('Info').t`This message will expire in ${expiration}`;

    return <Icon title={title} name="expiration" fill="warning" />;
};

ItemExpiration.propTypes = {
    element: PropTypes.object.isRequired,
    type: PropTypes.oneOf([ELEMENT_TYPES.CONVERSATION, ELEMENT_TYPES.MESSAGE]).isRequired
};

export default ItemExpiration;
