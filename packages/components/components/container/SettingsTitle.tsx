import React from 'react';

import { classnames } from '../../helpers';

interface Props extends React.HTMLAttributes<HTMLHeadingElement> {
    children: React.ReactNode;
    onTop?: boolean;
}

const SettingsTitle = ({ children, onTop = true, ...rest }: Props) => {
    return (
        <h1 className={classnames(['sticky-title', onTop && 'sticky-title--on-top'])} {...rest}>
            {children}
        </h1>
    );
};

export default SettingsTitle;
