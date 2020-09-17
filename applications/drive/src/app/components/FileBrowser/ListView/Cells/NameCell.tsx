import React from 'react';

interface Props {
    name: string;
}

const NameCell = ({ name }: Props) => (
    <div key="name" title={name} className="ellipsis">
        <span className="pre">{name}</span>
    </div>
);

export default NameCell;
