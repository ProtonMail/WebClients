import React from 'react';
import { FileNameDisplay } from 'react-components';

interface Props {
    name: string;
}

const NameCell = ({ name }: Props) => (
    <div key="name" className="flex">
        <FileNameDisplay text={name} />
    </div>
);

export default NameCell;
