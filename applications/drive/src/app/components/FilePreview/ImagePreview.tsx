import React, { useState, useMemo, useRef } from 'react';
import ZoomControl from './ZoomControl';

interface Props {
    mimeType: string;
    contents?: Uint8Array[];
}

const ImagePreview = ({ mimeType, contents }: Props) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const [scale, setScale] = useState(1);
    const imgSrc = useMemo(() => URL.createObjectURL(new Blob(contents, { type: mimeType })), [contents, mimeType]);

    const handleReset = () => setScale(1);
    const handleZoomOut = () => setScale((zoom) => (zoom ? zoom * 0.9 : 1));
    const handleZoomIn = () => setScale((zoom) => (zoom ? zoom * 1.1 : 1));
    const fitToContainer = () => {
        if (!containerRef.current || !imgRef.current) {
            return;
        }

        const img = imgRef.current;
        const containerBounds = containerRef.current.getBoundingClientRect();
        const heightRatio = containerBounds.height / img.naturalHeight;
        const widthRatio = containerBounds.width / img.naturalWidth;

        const scale = Math.min(1, heightRatio, widthRatio);

        setScale(scale);
    };

    return (
        <>
            <div ref={containerRef} className="pd-file-preview-container">
                <img
                    ref={imgRef}
                    onLoad={() => fitToContainer()}
                    style={{ transform: `translate(-50%, -50%) scale(${scale})` }}
                    className="pd-file-preview-image"
                    src={imgSrc}
                    alt="preview"
                />
            </div>
            <ZoomControl onReset={handleReset} scale={scale} onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} />
        </>
    );
};

export default ImagePreview;
