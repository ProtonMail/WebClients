import { useEffect, useState } from 'react';

import UnsupportedPreview from './UnsupportedPreview';

interface Props {
    mimeType: string;
    contents?: Uint8Array[];
    onDownload?: () => void;
}

const AudioPreview = ({ contents, mimeType, onDownload }: Props) => {
    const [url, setUrl] = useState<string>();
    const [error, setError] = useState(false);

    useEffect(() => {
        const newUrl = URL.createObjectURL(new Blob(contents, { type: mimeType }));
        setUrl(newUrl);
        return () => {
            if (newUrl) {
                URL.revokeObjectURL(newUrl);
            }
        };
    }, [contents]);

    const handleBrokenAudio = () => {
        setError(true);
    };

    if (error) {
        return (
            <div className="flex flex-item-fluid-auto relative">
                <UnsupportedPreview onDownload={onDownload} type="audio" />
            </div>
        );
    }
    return (
        <div className="flex w100 h100">
            <div className="mauto w50">
                <audio className="w100" onError={handleBrokenAudio} src={url} controls />
            </div>
        </div>
    );
};

export default AudioPreview;
