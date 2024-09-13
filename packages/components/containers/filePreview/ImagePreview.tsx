import { useEffect, useRef, useState } from 'react';

import DOMPurify from 'dompurify';
import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms';
import { useDragToScroll, useElementRect } from '@proton/components/hooks';
import { isFirefox } from '@proton/shared/lib/helpers/browser';
import { stringToUint8Array, uint8ArrayToString } from '@proton/shared/lib/helpers/encoding';
import { isSVG } from '@proton/shared/lib/helpers/mimetype';
import clsx from '@proton/utils/clsx';

import UnsupportedPreview from './UnsupportedPreview';
import ZoomControl from './ZoomControl';

interface Props {
    mimeType: string;
    fileName?: string;
    onDownload?: () => void;
    contents?: Uint8Array[];
    placeholderSrc?: string;
    isLoading: boolean;
    isZoomEnabled?: boolean;
}

type ElementDimensions = {
    height: number;
    width: number;
};

const FALLBACK_IMAGE_DIMENSION_VALUE = window.innerHeight / 2;

// These are just arbitrary numbers to keep image reasonable size
// on giant screens when we don't have information about image
// dimensions
const DEFAULT_IMAGE_DIMENSION_LIMIT_WIDTH = 2400;
const DEFAULT_IMAGE_DIMENSION_LIMIT_HEIGHT = 1400;

/*
 * Svg image dimension are 0 in Firefox. For these cases fallback values
 * will be used, so the image preview is visible.
 * https://bugzilla.mozilla.org/show_bug.cgi?id=1328124
 */
function getImageDimensions(imageElement: HTMLImageElement | null): ElementDimensions {
    return {
        height: imageElement?.naturalHeight || FALLBACK_IMAGE_DIMENSION_VALUE,
        width: imageElement?.naturalWidth || FALLBACK_IMAGE_DIMENSION_VALUE,
    };
}

/**
 * SVG can contain nasty scripts. We do have security headers set but attacker
 * can overcome it by asking user to open the previewed image in the new tab,
 * where browsers don't check headers and allow scripts from the SVG.
 * One option would be to render it as PNG, but zooming or rescaling the window
 * would mean to redraw. Better to keep SVG then. Sanitizing small SVGs takes
 * milliseconds, bigger ones (MBs) under second. Only super huge ones takes even
 * 10 seconds on slow computer as is mine, but we talk about huge SVGs as 30 MB.
 * Because such SVG is more edge case, we can live with that.
 */
function sanitizeSVG(contents: Uint8Array[]): Uint8Array[] {
    const contentsString = contents.map(uint8ArrayToString).join('');
    const sanitzedSVG = DOMPurify.sanitize(contentsString);
    return [stringToUint8Array(sanitzedSVG)];
}

function calcImageScaleToFitContainer(imageDimensions: ElementDimensions, containerDimensions: DOMRect) {
    const heightLimit = Math.min(containerDimensions.height, DEFAULT_IMAGE_DIMENSION_LIMIT_HEIGHT);
    const widthLimit = Math.min(containerDimensions.width, DEFAULT_IMAGE_DIMENSION_LIMIT_WIDTH);

    const heightRatio = heightLimit / imageDimensions.height;
    const widthRatio = widthLimit / imageDimensions.width;

    const scale = Math.min(heightRatio, widthRatio);

    return scale;
}

const scaleDimensions = (dimensions: ElementDimensions, scale: number) => {
    return {
        height: dimensions.height * scale,
        width: dimensions.width * scale,
    };
};

const ImagePreview = ({
    isLoading = false,
    isZoomEnabled = true,
    mimeType,
    contents,
    onDownload,
    placeholderSrc,
    fileName,
}: Props) => {
    const imageLowResRef = useRef<HTMLImageElement>(null);
    const imageHiResRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const containerBounds = useElementRect(containerRef);

    const [imageData, setImageData] = useState({ src: '' });
    const [error, setError] = useState(false);
    const [imageScale, setImageScale] = useState(0);
    const [isHiResImageRendered, setIsHiResImageRendered] = useState(false);
    const [isLowResImageHidden, setIsLowResImageHidden] = useState(false);
    const [imageStyles, setImageStyles] = useState({});
    const [fullImageDimensions, setFullImageDimensions] = useState<{ width: number; height: number } | null>(null);

    const timeoutId = useRef<ReturnType<typeof setTimeout>>();

    const handleZoomOut = () => setImageScale((zoom) => (zoom ? zoom * 0.9 : 1));

    const handleZoomIn = () => setImageScale((zoom) => (zoom ? zoom * 1.1 : 1));

    const { onMouseDown } = useDragToScroll(containerRef);

    useEffect(() => {
        if (!fullImageDimensions) {
            return;
        }
        setImageStyles(scaleDimensions(fullImageDimensions, imageScale));
    }, [fullImageDimensions, imageScale]);

    const fitImageToContainer = (imageElement: HTMLImageElement | null) => {
        if (!containerBounds || !imageElement) {
            return;
        }

        // There is issue with svg since during zoom they change their size, so we used the original savedSize
        const dimensions = fullImageDimensions ? fullImageDimensions : getImageDimensions(imageElement);

        const scale = calcImageScaleToFitContainer(dimensions, containerBounds);
        if (scale) {
            setImageScale(scale);
            setImageStyles(scaleDimensions(dimensions, scale));
        }
    };

    const handleBrokenImage = () => {
        if (!error) {
            setError(true);
        }
    };

    const handleFullImageLoaded = () => {
        if (isFirefox()) {
            // Setting the flag with arbitrary timeout value to hide thumbnail image with a delay.
            // Firefox tends to insert bigger images slowly, which lead to flickering.
            // Example:
            // 1. Data of full-size image loads
            // 2. We hide the thumbnail
            // 3. Before the full image is properly inserted into DOM, we see preview overlay background
            setTimeout(() => setIsHiResImageRendered(true), 200);
        } else {
            setIsHiResImageRendered(true);
        }

        fitImageToContainer(imageHiResRef.current);
        setFullImageDimensions(getImageDimensions(imageHiResRef.current));
    };

    useEffect(() => {
        if (error) {
            setError(false);
        }

        if (!contents) {
            setImageData({ src: '' });
            return;
        }

        const data = isSVG(mimeType) ? sanitizeSVG(contents) : contents;
        const blob = new Blob(data, { type: mimeType });
        const srcUrl = URL.createObjectURL(blob);

        setImageData({
            src: srcUrl,
        });

        // Load image before rendering
        const buffer = new Image();
        buffer.src = srcUrl;

        return () => {
            if (srcUrl) {
                URL.revokeObjectURL(srcUrl);
            }
        };
    }, [contents, mimeType]);

    useEffect(() => {
        return () => {
            clearTimeout(timeoutId.current);
        };
    }, []);

    return (
        <>
            <div ref={containerRef} className={'file-preview-container'} onMouseDown={onMouseDown}>
                {error ? (
                    <UnsupportedPreview onDownload={onDownload} type="image" />
                ) : (
                    <div
                        className="flex *:min-size-auto m-auto relative"
                        style={{
                            ...imageStyles,
                            overflow: !isLowResImageHidden && placeholderSrc ? 'hidden' : 'initial',
                        }}
                    >
                        {!isLoading && (
                            <div
                                className={clsx('file-preview-image file-preview-image-full-size')}
                                style={{
                                    ...imageStyles,
                                    background: 'repeating-conic-gradient(#606060 0% 25%, transparent 0% 50%)',
                                    backgroundSize: '40px 40px',
                                    transform: 'scale(0.99)',
                                }}
                            />
                        )}
                        {!isLoading && (
                            <img
                                ref={imageHiResRef}
                                onLoad={handleFullImageLoaded}
                                onError={handleBrokenImage}
                                className={clsx(['file-preview-image file-preview-image-full-size'])}
                                style={imageStyles}
                                src={imageData.src}
                                alt={c('Info').t`${fileName}: full-size image`}
                            />
                        )}
                        {!isLowResImageHidden && placeholderSrc && (
                            <img
                                ref={imageLowResRef}
                                onLoad={() => fitImageToContainer(imageLowResRef.current)}
                                onError={handleBrokenImage}
                                className={clsx([
                                    'file-preview-image',
                                    isHiResImageRendered && 'file-preview-image-out',
                                ])}
                                style={{
                                    ...imageStyles,
                                    // Blurring an image this way leads to its edges to become transparent.
                                    // To compensate this, we apply scale transformation.
                                    filter: 'blur(3px)',
                                    transform: 'scale(1.03)',
                                }}
                                src={placeholderSrc}
                                alt={c('Info').t`${fileName}: low-resolution preview`}
                                onAnimationEnd={(e) => {
                                    if (e.animationName === 'anime-image-preview-out') {
                                        setIsLowResImageHidden(isHiResImageRendered);
                                    }
                                }}
                            />
                        )}
                    </div>
                )}
            </div>
            {!isHiResImageRendered && !error && (
                <div className="file-preview-loading w-full mb-8 flex justify-center items-center">
                    <CircleLoader />
                    <span className="ml-4">{c('Info').t`Loading...`}</span>
                </div>
            )}
            {isZoomEnabled && !error && (
                <ZoomControl
                    className={isHiResImageRendered ? '' : 'visibility-hidden'}
                    onReset={() => fitImageToContainer(imageHiResRef.current)}
                    scale={imageScale}
                    onZoomIn={handleZoomIn}
                    onZoomOut={handleZoomOut}
                />
            )}
        </>
    );
};

export default ImagePreview;
