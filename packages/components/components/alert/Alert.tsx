import * as React from 'react';
import { classnames } from '../../helpers';
import LearnMore from '../link/LearnMore';

const CLASSES = {
    info: 'mb1 alert-block',
    warning: 'mb1 alert-block--warning',
    error: 'mb1 alert-block--danger',
    success: 'mb1 alert-block--success',
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
