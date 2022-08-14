import * as React from 'react';

import { classnames } from '@proton/components';

interface Props extends React.HTMLProps<HTMLDivElement> {
    children: React.ReactNode;
}

const Content = ({ children, className, ...rest }: Props) => {
    return (
        <div className={classnames(['sign-layout-main-content', className])} {...rest}>
            {children}
        </div>
    );
};

export default Content;
