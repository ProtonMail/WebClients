import React from 'react';
import { classnames } from '../../helpers';
import LearnMore from '../link/LearnMore';

const CLASSES = {
    info: 'mb1 block-info-standard',
    warning: 'mb1 block-info-standard--warning',
    error: 'mb1 block-info-standard--error',
    success: 'mb1 block-info-standard--success',
} as const;

interface Props {
    type?: 'info' | 'error' | 'warning' | 'success';
    children?: React.ReactNode;
    learnMore?: string;
    className?: string;
}
const Alert = ({ type = 'info', children, learnMore, className }: Props) => {
    return (
        <div className={classnames([CLASSES[type], className])}>
            <div>{children}</div>
            {learnMore ? (
                <div>
                    <LearnMore url={learnMore} />
                </div>
            ) : null}
        </div>
    );
};

export default Alert;
