import React, { useState, useRef, useEffect } from 'react';
import loadImage, { MetaData, Exif } from 'blueimp-load-image';
import ZoomControl from './ZoomControl';

const calculateImagePosition = (scale: number, image?: HTMLImageElement | null, container?: HTMLDivElement | null) => {
    if (!image || !container) {
        return { x: 0, y: 0 };
    }

    const bounds = container.getBoundingClientRect();
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;

    const centerX = bounds.width / 2 - width / 2;
    const centerY = bounds.height / 2 - height / 2;

    return {
        x: width >= bounds.width ? '0px' : `${centerX}px`,
        y: height >= bounds.height ? '0px' : `${centerY}px`
    };
};

const parseRotation = (exifData?: Exif) => {
    if (!exifData) {
        return 0;
    }

    // Parse orientation metadata: https://sirv.com/help/resources/rotate-photos-to-be-upright/
    switch (exifData[0x0112]) {
        case 1:
        case 2:
            return 0;
        case 3:
        case 4:
            return 180;
        case 5:
        case 6:
            return 90;
        case 7:
        case 8:
            return 270;
        default:
            return 0;
    }
};

interface Props {
    mimeType: string;
    contents?: Uint8Array[];
}

const ImagePreview = ({ mimeType, contents }: Props) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const [scale, setScale] = useState(0);
    const [imageData, setImageData] = useState({
        src: '',
        rotation: 0
    });

    useEffect(() => {
        let canceled = false;
        const blob = new Blob(contents, { type: mimeType });
        loadImage.parseMetaData(blob, ({ exif }: MetaData) => {
            if (!canceled) {
                setImageData({
                    src: URL.createObjectURL(blob),
                    rotation: parseRotation(exif)
                });
            }
        });
        return () => {
            canceled = true;
            if (imageData.src) {
                URL.revokeObjectURL(imageData.src);
            }
        };
    }, [contents, mimeType]);

    const handleZoomOut = () => setScale((zoom) => (zoom ? zoom * 0.9 : 1));
    const handleZoomIn = () => setScale((zoom) => (zoom ? zoom * 1.1 : 1));
    const fitToContainer = () => {
        if (!imageRef.current || !containerRef.current) {
            return;
        }

        const containerBounds = containerRef.current.getBoundingClientRect();
        const heightRatio = containerBounds.height / imageRef.current.naturalHeight;
        const widthRatio = containerBounds.width / imageRef.current.naturalWidth;

        const scale = Math.min(1, heightRatio, widthRatio);

        setScale(scale);
    };

    const position = calculateImagePosition(scale, imageRef.current, containerRef.current);
    return (
        <>
            <div ref={containerRef} className="pd-file-preview-container">
                <img
                    ref={imageRef}
                    onLoad={() => fitToContainer()}
                    style={{
                        transform: `translate(${position.x}, ${position.y}) rotate(${imageData.rotation}deg)`,
                        height: imageRef.current ? imageRef.current.naturalHeight * scale : undefined,
                        width: imageRef.current ? imageRef.current.naturalWidth * scale : undefined
                    }}
                    className="pd-file-preview-image"
                    src={imageData.src}
                    alt="preview"
                />
            </div>
            <ZoomControl onReset={fitToContainer} scale={scale} onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} />
        </>
    );
};

export default ImagePreview;
