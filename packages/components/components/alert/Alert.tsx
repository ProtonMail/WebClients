import { ReactNode } from 'react';

import { c } from 'ttag';

import { classnames } from '../../helpers';
import Href from '../link/Href';

const CLASSES = {
    info: 'alert-block',
    warning: 'alert-block--warning',
    error: 'alert-block--danger',
    success: 'alert-block--success',
} as const;

interface Props {
    type?: 'info' | 'error' | 'warning' | 'success';
    children?: ReactNode;
    learnMore?: string;
    className?: string;
}

const Alert = ({ type = 'info', children, learnMore, className }: Props) => {
    return (
        <div className={classnames([CLASSES[type], className])}>
            <div>{children}</div>
            {learnMore ? (
                <div>
                    <Href url={learnMore} className={className}>{c('Link').t`Learn more`}</Href>
                </div>
            ) : null}
        </div>
    );
};

export default Alert;
