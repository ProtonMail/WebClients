import * as React from 'react';
import { classnames } from '@proton/components';
import './EmailUnsubscribeBorderedContainer.scss';

interface EmailUnsubscribeBorderedContainerProps {
    children: React.ReactNode;
    className?: string;
}

const EmailUnsubscribeBorderedContainer = ({
    children,
    className: classNameProp,
}: EmailUnsubscribeBorderedContainerProps) => {
    const className = classnames([
        'flex flex-column flex-align-items-center mt4 bordered p2 email-unsubscribe-container',
        classNameProp,
    ]);

    return <div className={className}>{children}</div>;
};

export default EmailUnsubscribeBorderedContainer;
