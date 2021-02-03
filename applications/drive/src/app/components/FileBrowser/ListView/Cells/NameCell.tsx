import React from 'react';

interface Props {
    name: string;
}

const NameCell = ({ name }: Props) => (
    <div key="name" title={name} className="text-ellipsis">
        <span className="text-pre">{name}</span>
    </div>
);

export default NameCell;
