import * as React from 'react';
import { c } from 'ttag';

import { classnames } from '../../helpers';

export interface Props extends React.HTMLAttributes<HTMLSpanElement> {
    className?: string;
}

const EllipsisLoader = ({ className, ...rest }: Props) => {
    return (
        <span className={classnames(['ellipsis-loader', className])} {...rest}>
            <span className="sr-only">{c('Info').t`Loading`}</span>
        </span>
    );
};

export default EllipsisLoader;
