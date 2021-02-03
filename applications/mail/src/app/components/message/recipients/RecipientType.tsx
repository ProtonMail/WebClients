import React, { ReactNode } from 'react';

interface Props {
    label: ReactNode;
    className?: string;
    children: ReactNode;
}

const RecipientType = ({
    label,
    className = 'flex flex-align-items-start flex-nowrap message-recipient-item-expanded max-w100',
    children,
}: Props) => {
    return (
        <span className={className}>
            <span className="container-to pt0-5">{label}</span>
            <span className="flex-align-self-center message-recipient-item-expanded-content">{children}</span>
        </span>
    );
};

export default RecipientType;
