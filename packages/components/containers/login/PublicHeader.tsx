import React from 'react';

interface Props {
    left?: React.ReactNode;
    middle?: React.ReactNode;
    right?: React.ReactNode;
}

const PublicHeader = ({ left, middle, right }: Props) => (
    <header className="flex-item-noshrink flex flex-items-center noprint mb2">
        <div className="nomobile flex-item-fluid">{left}</div>
        <div className="w150p center">{middle}</div>
        <div className="nomobile flex-item-fluid alignright">{right}</div>
    </header>
);

export default PublicHeader;
