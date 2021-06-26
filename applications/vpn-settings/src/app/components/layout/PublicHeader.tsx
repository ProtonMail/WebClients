import React from 'react';

interface Props {
    left?: React.ReactNode;
    middle?: React.ReactNode;
    right?: React.ReactNode;
}

const PublicHeader = ({ left, middle, right }: Props) => (
    <header className="flex-item-noshrink flex flex-align-items-center no-print mb2">
        <div className="no-mobile flex-item-fluid">{left}</div>
        <div className="w150p center">{middle}</div>
        <div className="flex-item-fluid text-right">{right}</div>
    </header>
);

export default PublicHeader;
