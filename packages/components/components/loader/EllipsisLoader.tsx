import { HTMLAttributes } from 'react';

import { c } from 'ttag';

import clsx from '@proton/utils/clsx';

export interface Props extends HTMLAttributes<HTMLSpanElement> {
    className?: string;
}

const EllipsisLoader = ({ className, ...rest }: Props) => {
    return (
        <span className={clsx(['ellipsis-loader', className])} {...rest}>
            <span className="sr-only">{c('Info').t`Loading`}</span>
        </span>
    );
};

export default EllipsisLoader;
