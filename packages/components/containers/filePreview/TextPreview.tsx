import { mergeUint8Arrays } from '@proton/utils/array';

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
