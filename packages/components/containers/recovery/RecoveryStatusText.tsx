import { HTMLAttributes } from 'react';
import { classnames } from '../../helpers';

interface Props extends HTMLAttributes<HTMLSpanElement> {
    type: 'info' | 'success' | 'warning' | 'danger';
}

const RecoveryStatusText = ({ type, className, ...rest }: Props) => {
    return <span className={classnames([`color-${type}`, className])} {...rest} />;
};

export default RecoveryStatusText;
