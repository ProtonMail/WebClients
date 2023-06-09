import { HTMLAttributes } from 'react';

import clsx from '@proton/utils/clsx';

interface Props extends HTMLAttributes<HTMLSpanElement> {
    type: 'info' | 'success' | 'warning' | 'danger';
}

const RecoveryStatusText = ({ type, className, ...rest }: Props) => {
    return <span className={clsx([`color-${type}`, className])} {...rest} />;
};

export default RecoveryStatusText;
