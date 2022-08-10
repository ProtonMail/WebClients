import { useMemo } from 'react';

import { fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { Icon, Tooltip, classnames } from '@proton/components';

import { formatFullDate } from '../../helpers/date';

import './ItemExpiration.scss';

interface Props {
    className?: string;
    expirationTime?: number;
}

const ItemExpiration = ({ className, expirationTime }: Props) => {
    const tooltipMessage = useMemo(() => {
        const date = fromUnixTime(expirationTime || 0);
        const formattedDate = formatFullDate(date);
        return c('Info').t`This message will expire ${formattedDate}`;
    }, [expirationTime]);

    if (!expirationTime) {
        return null;
    }

    return (
        // @ts-ignore
        <Tooltip title={tooltipMessage} className={classnames(['flex', className])}>
            <div className="pill-icon bg-global-warning" data-testid="item-expiration">
                <Icon name="hourglass" size={14} alt={tooltipMessage} />
            </div>
        </Tooltip>
    );
};

export default ItemExpiration;
