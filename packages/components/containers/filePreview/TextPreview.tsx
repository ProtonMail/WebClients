import React from 'react';
import { mergeUint8Arrays } from 'proton-shared/lib/helpers/array';

interface Props {
    contents?: Uint8Array[];
}

const TextPreview = ({ contents = [] }: Props) => {
    const string = new TextDecoder().decode(mergeUint8Arrays(contents));

    return (
        <div className="file-preview-container">
            <div className="file-preview-text">{string}</div>
        </div>
    );
};

export default TextPreview;
