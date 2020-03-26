import React, { ReactNode } from 'react';
import { classnames } from 'react-components';

interface Props {
    children: ReactNode;
    className?: string;
}

const Main = ({ children, className }: Props) => {
    return <main className={classnames(['relative flex-item-fluid', className])}>{children}</main>;
};

export default Main;
