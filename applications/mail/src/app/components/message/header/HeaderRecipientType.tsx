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
            <span className="container-to">{label}</span>
            <span className="flex-self-vcenter mr1">{children}</span>
        </span>
    );
};

export default HeaderRecipientType;
