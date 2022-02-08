import * as React from 'react';
import { classnames } from '@proton/components';

import './PublicContainer.scss';

interface PublicContainerProps {
    children: React.ReactNode;
    className?: string;
}

const PublicContainer = ({ children, className: classNameProp }: PublicContainerProps) => {
    const className = classnames([
        'flex flex-column flex-align-items-center mt4 border p2 public-container',
        classNameProp,
    ]);

    return <div className={className}>{children}</div>;
};

export default PublicContainer;
