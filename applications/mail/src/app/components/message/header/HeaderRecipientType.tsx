import React, { ReactNode } from 'react';

interface Props {
    label: ReactNode;
    className?: string;
    children: ReactNode;
}

const HeaderRecipientType = ({
    label,
    className = 'flex flex-nowrap message-recipient-item-expanded mw100',
    children
}: Props) => {
    return (
        <span className={className}>
            <span className="container-to is-appearing-content">{label}</span>
            <span className="flex-self-vcenter mr0-5">{children}</span>
        </span>
    );
};

export default HeaderRecipientType;
