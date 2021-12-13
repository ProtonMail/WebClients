import DOMPurify from 'dompurify';
import { useState, useRef, useEffect } from 'react';
import { c } from 'ttag';

import { uint8ArrayToString, stringToUint8Array } from '@proton/shared/lib/helpers/encoding';
import { isSVG } from '@proton/shared/lib/helpers/mimetype';

import ZoomControl from './ZoomControl';
import useElementRect from '../../hooks/useElementRect';
import UnsupportedPreview from './UnsupportedPreview';

interface Props {
    mimeType: string;
    onSave?: () => void;
    contents?: Uint8Array[];
}

const FALLBACK_IMAGE_DIMENSION_VALUE = window.innerHeight / 2;

/*
 * Svg image dimension are 0 in Firefox. For these cases fallback values
 * will be used, so the image preview is visible.
 * https://bugzilla.mozilla.org/show_bug.cgi?id=1328124
 */
function getImageNaturalDimensions(imageElement: HTMLImageElement | null) {
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
 * miliseconds, bigger ones (MBs) under second. Only super huge ones takes even
 * 10 seconds on slow computer as is mine, but we talk about huge SVGs as 30 MB.
 * Because such SVG is more edge case, we can live with that.
 */
function sanitizeSVG(contents: Uint8Array[]): Uint8Array[] {
    const contentsString = contents.map(uint8ArrayToString).join('');
    const sanitzedSVG = DOMPurify.sanitize(contentsString);
    return [stringToUint8Array(sanitzedSVG)];
}

const ImagePreview = ({ mimeType, contents, onSave }: Props) => {
    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const containerBounds = useElementRect(containerRef);
    const [error, setError] = useState(false);
    const [scale, setScale] = useState(0);
    const [imageData, setImageData] = useState({
        src: '',
    });

    useEffect(() => {
        let src: string;

        if (error) {
            setError(false);
        }

        if (!contents) {
            setImageData({ src: '' });
            return;
        }

        const data = isSVG(mimeType) ? sanitizeSVG(contents) : contents;
        const blob = new Blob(data, { type: mimeType });
        setImageData({
            src: URL.createObjectURL(blob),
        });

        return () => {
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

        const dimensions = getImageNaturalDimensions(imageRef.current);
        const heightRatio = containerBounds.height / dimensions.height;
        const widthRatio = containerBounds.width / dimensions.width;

        const scale = Math.min(1, heightRatio, widthRatio);

        setScale(scale);
    };

    const handleBrokenImage = () => {
        if (!error) {
            setError(true);
        }
    };

    const dimensions = getImageNaturalDimensions(imageRef.current);
    const scaledDimensions = {
        height: dimensions.height * scale,
        width: dimensions.width * scale,
    };

    return (
        <>
            <div ref={containerRef} className="file-preview-container">
                {error ? (
                    <UnsupportedPreview onSave={onSave} type="image" />
                ) : (
                    imageData.src && (
                        <div className="flex-no-min-children mauto relative" style={scaledDimensions}>
                            <img
                                ref={imageRef}
                                onLoad={() => fitToContainer()}
                                onError={handleBrokenImage}
                                className="file-preview-image"
                                style={scaledDimensions}
                                src={imageData.src}
                                alt={c('Info').t`Preview`}
                            />
                        </div>
                    )
                )}
            </div>
            {!error && (
                <ZoomControl onReset={fitToContainer} scale={scale} onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} />
            )}
        </>
    );
};

export default ImagePreview;
