import React from 'react';
import { arrayToBinaryString } from 'proton-shared/lib/helpers/string';
import { mergeUint8Arrays } from '../../utils/array';

interface Props {
    contents?: Uint8Array[];
}

const TextPreview = ({ contents = [] }: Props) => {
    return (
        <div className="pd-file-preview-container">
            <pre className="pd-file-preview-text">{arrayToBinaryString(mergeUint8Arrays(contents))}</pre>
        </div>
    );
};

export default TextPreview;
