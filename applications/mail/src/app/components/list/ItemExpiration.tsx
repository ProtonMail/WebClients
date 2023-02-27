import { Icon, Tooltip } from '@proton/components';
import clsx from '@proton/utils/clsx';

import useItemExpiration from './useItemExpiration';

import './ItemExpiration.scss';

interface Props {
    className?: string;
    expirationTime?: number;
}

const ItemExpiration = ({ className, expirationTime }: Props) => {
    const { tooltipMessage, shortMessage, willExpireToday } = useItemExpiration(expirationTime);

    if (!expirationTime) {
        return null;
    }

    return (
        <Tooltip title={tooltipMessage}>
            <div
                className={clsx([
                    'pill-icon flex flex-align-items-center flex-nowrap',
                    className,
                    willExpireToday && 'color-danger',
                ])}
                data-testid="item-expiration"
            >
                <Icon name="hourglass" className="flex-item-noshrink" size={14} alt={tooltipMessage} />
                <span className="ml0-25 text-sm text-nowrap">{shortMessage}</span>
            </div>
        </Tooltip>
    );
};

export default ItemExpiration;
