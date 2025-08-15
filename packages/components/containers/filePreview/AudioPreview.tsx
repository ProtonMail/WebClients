import { useEffect, useState } from 'react';

import { CircleLoader } from '@proton/atoms';

import UnsupportedPreview from './UnsupportedPreview';

interface Props {
    mimeType: string;
    contents?: Uint8Array<ArrayBuffer>[];
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
            <div className="flex flex-auto relative">
                <UnsupportedPreview onDownload={onDownload} type="audio" />
            </div>
        );
    }
    return (
        <div className="flex w-full h-full">
            <div className="m-auto w-1/2">
                {url ? <audio className="w-full" onError={handleBrokenAudio} src={url} controls /> : <CircleLoader />}
            </div>
        </div>
    );
};

export default AudioPreview;
