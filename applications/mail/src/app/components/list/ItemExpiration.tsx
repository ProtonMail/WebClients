import React, { useMemo } from 'react';
import { Icon, Tooltip, classnames } from 'react-components';
import { c } from 'ttag';
import { fromUnixTime } from 'date-fns';

import { Element } from '../../models/element';
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
        // @ts-ignore
        <Tooltip title={tooltipMessage} className={classnames(['flex', className])}>
            <div className="pill-icon bg-global-warning" data-testid="item-expiration">
                <Icon name="expiration" size={14} alt={tooltipMessage} />
            </div>
        </Tooltip>
    );
};

export default ItemExpiration;
