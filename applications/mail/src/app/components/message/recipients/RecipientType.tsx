import React, { ReactNode } from 'react';

interface Props {
    label: ReactNode;
    className?: string;
    children: ReactNode;
}

const RecipientType = ({
    label,
    className = 'flex flex-items-start flex-nowrap message-recipient-item-expanded mw100',
    children,
}: Props) => {
    return (
        <span className={className}>
            <span className="container-to pt0-5 is-appearing-content">{label}</span>
            <span className="flex-self-vcenter">{children}</span>
        </span>
    );
};

export default RecipientType;
