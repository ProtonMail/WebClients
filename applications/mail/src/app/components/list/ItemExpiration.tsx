import React, { useMemo } from 'react';
import { Icon, Tooltip, classnames } from 'react-components';
import { c } from 'ttag';

import { Element } from '../../models/element';
import { fromUnixTime } from 'date-fns';
import { formatFullDate } from '../../helpers/date';

interface Props {
    element?: Element;
    className?: string;
}

const ItemExpiration = ({ element = {}, className }: Props) => {
    const { ExpirationTime } = element;

    const tooltipMessage = useMemo(() => {
        const date = fromUnixTime(ExpirationTime || 0);
        const formattedDate = formatFullDate(date);
        return c('Info').t`This message will expire ${formattedDate}`;
    }, [ExpirationTime]);

    if (!ExpirationTime) {
        return null;
    }

    return (
        <Tooltip title={tooltipMessage}>
            <Icon name="expiration" className={classnames([className, 'color-global-warning'])} alt={tooltipMessage} />
        </Tooltip>
    );
};

export default ItemExpiration;
