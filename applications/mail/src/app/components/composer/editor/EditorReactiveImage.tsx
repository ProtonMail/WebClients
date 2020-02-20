import React, { useEffect, ImgHTMLAttributes, useRef, useState, useCallback } from 'react';
import { debounce } from 'proton-shared/lib/helpers/function';

interface Props extends ImgHTMLAttributes<HTMLImageElement> {
    onLoading: () => void;
    onSuccess: () => void;
    onError: () => void;
}

const EditorReactiveImage = ({ src: inputSrc, onLoading, onSuccess, onError }: Props) => {
    const ref = useRef<HTMLImageElement>(null);
    const [src, setSrc] = useState<string>();
    const [valid, setValid] = useState(false);

    const handleChangeDebounced = useCallback(
        debounce(async (inputSrc: string | undefined) => {
            if (inputSrc !== undefined) {
                setSrc(inputSrc);
                setValid(false);
                onLoading();
            }
        }, 500),
        []
    );

    useEffect(() => handleChangeDebounced(inputSrc), [inputSrc]);

    useEffect(() => {
        const handleLoad = () => {
            setValid(true);
            onSuccess();
        };
        const handleError = () => {
            setValid(false);
            onError();
        };

        ref.current?.addEventListener('load', handleLoad);
        ref.current?.addEventListener('error', handleError);

        return () => {
            ref.current?.removeEventListener('load', handleLoad);
            ref.current?.removeEventListener('error', handleError);
        };
    }, []);

    return <img src={src} ref={ref} style={{ display: valid ? 'block' : 'none' }} />;
};

export default EditorReactiveImage;
