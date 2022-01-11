import { HTMLAttributes } from 'react';
import { classnames } from '../../helpers';
import RecoveryStatus from './RecoveryStatus';

interface Props extends HTMLAttributes<HTMLSpanElement> {
    status: RecoveryStatus;
}

const RecoveryStatusText = ({ status, className, ...rest }: Props) => {
    let config = {
        className: 'color-success',
    };

    if (status === 'intermediate') {
        config = {
            className: 'color-info',
        };
    }

    if (status === 'incomplete') {
        config = {
            className: 'color-warning',
        };
    }

    return <span className={classnames([config.className, className])} {...rest} />;
};

export default RecoveryStatusText;
