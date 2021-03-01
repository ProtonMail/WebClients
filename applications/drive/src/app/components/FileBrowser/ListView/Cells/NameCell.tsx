import React from 'react';
import { FileNameDisplay } from 'react-components';
import { FEATURE_FLAGS } from 'proton-shared/lib/constants';

interface Props {
    name: string;
}

const NameCell = ({ name }: Props) =>
    FEATURE_FLAGS.includes('file-name-display') ? (
        <div key="name" className="flex">
            <FileNameDisplay text={name} />
        </div>
    ) : (
        <div key="name" title={name} className="text-ellipsis">
            <span className="text-pre">{name}</span>
        </div>
    );

export default NameCell;
