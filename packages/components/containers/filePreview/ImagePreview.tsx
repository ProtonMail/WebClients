import React, { useState, useRef, useEffect } from 'react';
import loadImage, { MetaData, Exif } from 'blueimp-load-image';
import brokenImageSvg from 'design-system/assets/img/shared/broken-image.svg';
import { c } from 'ttag';
import ZoomControl from './ZoomControl';
import { PrimaryButton } from '../../components/button';
import useElementRect from '../../hooks/useElementRect';

const calculateImagePosition = (scale: number, image?: HTMLImageElement | null, bounds?: DOMRect) => {
    if (!image || !bounds) {
        return { x: 0, y: 0 };
    }

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
    onSave?: () => void;
    contents?: Uint8Array[];
}

const ImagePreview = ({ mimeType, contents, onSave }: Props) => {
    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const containerBounds = useElementRect(containerRef);
    const [error, setError] = useState(false);
    const [scale, setScale] = useState(0);
    const [imageData, setImageData] = useState({
        src: '',
        rotation: 0
    });

    useEffect(() => {
        let src: string;
        let canceled = false;

        if (error) {
            setError(false);
        }

        const blob = new Blob(contents, { type: mimeType });
        loadImage.parseMetaData(blob, ({ exif }: MetaData) => {
            if (!canceled) {
                src = URL.createObjectURL(blob);
                setImageData({
                    src,
                    rotation: parseRotation(exif)
                });
            }
        });
        return () => {
            canceled = true;
            if (src) {
                URL.revokeObjectURL(src);
            }
        };
    }, [contents, mimeType]);

    const handleZoomOut = () => setScale((zoom) => (zoom ? zoom * 0.9 : 1));
    const handleZoomIn = () => setScale((zoom) => (zoom ? zoom * 1.1 : 1));
    const fitToContainer = () => {
        if (!imageRef.current || !containerBounds) {
            return;
        }

        const heightRatio = containerBounds.height / imageRef.current.naturalHeight;
        const widthRatio = containerBounds.width / imageRef.current.naturalWidth;

        const scale = Math.min(1, heightRatio, widthRatio);

        setScale(scale);
    };

    const handleBrokenImage = () => {
        if (!error) {
            setError(true);
        }
    };

    const position = calculateImagePosition(scale, imageRef.current, containerBounds);
    return (
        <>
            <div ref={containerRef} className="pd-file-preview-container">
                <div>
                    {error ? (
                        <div className="centered-absolute aligncenter">
                            <img className="mb0-5" src={brokenImageSvg} alt={c('Info').t`Corrupted file`} />
                            <div className="p0-25">{c('Info').t`No preview available`}</div>
                            {onSave && (
                                <PrimaryButton onClick={onSave} className="mt2">{c('Action')
                                    .t`Download`}</PrimaryButton>
                            )}
                        </div>
                    ) : (
                        imageData.src && (
                            <img
                                ref={imageRef}
                                onLoad={() => fitToContainer()}
                                onError={handleBrokenImage}
                                className="pd-file-preview-image"
                                style={{
                                    transform: `translate(${position.x}, ${position.y}) rotate(${imageData.rotation}deg)`,
                                    height: imageRef.current ? imageRef.current.naturalHeight * scale : undefined,
                                    width: imageRef.current ? imageRef.current.naturalWidth * scale : undefined
                                }}
                                src={imageData.src}
                                alt={c('Info').t`Preview`}
                            />
                        )
                    )}
                </div>
            </div>
            {!error && (
                <ZoomControl onReset={fitToContainer} scale={scale} onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} />
            )}
        </>
    );
};

export default ImagePreview;
