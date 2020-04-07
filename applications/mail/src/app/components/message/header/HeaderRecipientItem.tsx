import React, { ReactNode } from 'react';

interface Props {
    label: ReactNode;
    children: ReactNode;
}

const RecipientItem = ({ label, children }: Props) => {
    return (
        <span className="flex">
            <span className="opacity-50 container-to">{label}</span>
            <span className="flex-self-vcenter mr1">{children}</span>
        </span>
    );
};

export default RecipientItem;
