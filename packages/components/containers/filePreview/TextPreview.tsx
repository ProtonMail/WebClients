import { useRef, useState } from 'react';

import mergeUint8Arrays from '@proton/utils/mergeUint8Arrays';

import { useHotkeys } from '../../hooks/useHotkeys';

interface Props {
    contents?: Uint8Array<ArrayBuffer>[];
    onNewContents?: (content: Uint8Array<ArrayBuffer>[]) => void;
}

const TextPreview = ({ contents = [], onNewContents }: Props) => {
    const string = new TextDecoder().decode(mergeUint8Arrays(contents));

    const [value, setValue] = useState(string);

    const handleChange = (event: any) => {
        const newValue = event.target.value as string;
        setValue(newValue);
        const content = Uint8Array.from(newValue.split('').map((x) => x.charCodeAt(0)));
        onNewContents?.([content]);
    };

    // Disable left/right keys from navigation control.
    const rootRef = useRef<HTMLDivElement>(null);
    useHotkeys(rootRef, [
        [
            'ArrowLeft',
            (e) => {
                e.stopPropagation();
            },
        ],
        [
            'ArrowRight',
            (e) => {
                e.stopPropagation();
            },
        ],
    ]);

    return (
        <div className="file-preview-container" ref={rootRef}>
            {onNewContents ? (
                <textarea className="file-preview-text" value={value} onChange={handleChange} />
            ) : (
                <div className="file-preview-text">{value}</div>
            )}
        </div>
    );
};

export default TextPreview;
