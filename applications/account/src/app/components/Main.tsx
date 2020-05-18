import React, { ReactNode } from 'react';

interface Props {
    className?: string;
    children: ReactNode;
}

const Main = ({ className = '', children }: Props) => {
    return <main className={`main-area-content relative flex-item-fluid ${className}`}>{children}</main>;
};

export default Main;
