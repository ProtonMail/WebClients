import { useEffect, useState } from 'react';

import JSZip from 'jszip';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import clsx from '@proton/utils/clsx';

import useActiveBreakpoint from '../../hooks/useActiveBreakpoint';

const IMAGE_SIGNATURES = [
    { mimeType: 'image/png', signature: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
    { mimeType: 'image/jpeg', signature: [0xff, 0xd8, 0xff] },
];

const extract = (files: typeof JSZip.files) =>
    Object.keys(files)
        .filter((name) => /\.(jpe?g|png)$/i.test(name)) // we can have some extra metadata files, we only care about images
        .sort(); // CBZ images are sorted by page number

/**
 * Archive entries are attacker-controlled: an empty-type Blob can be sniffed as HTML when opened in a new tab
 * and would run in the app origin, so only entries with a known image signature are kept, typed explicitly.
 */
const getImageBlobFromEntry = async (entry: JSZip.JSZipObject) => {
    const bytes = (await entry.async('uint8array')) as Uint8Array<ArrayBuffer>;
    const mimeType = IMAGE_SIGNATURES.find(({ signature }) =>
        signature.every((byte, index) => bytes[index] === byte)
    )?.mimeType;
    return mimeType ? new Blob([bytes], { type: mimeType }) : undefined;
};

export const getExtractedImagesFromCBZ = async (cbz: Blob | Uint8Array<ArrayBuffer>[]) => {
    const zip = await JSZip.loadAsync(cbz instanceof Blob ? cbz : new Blob(cbz));
    const blobs = await Promise.all(extract(zip.files).map((fileName) => getImageBlobFromEntry(zip.files[fileName])));
    return blobs.filter((blob) => blob !== undefined).map((blob) => URL.createObjectURL(blob));
};

export const getCBZCover = async (cbz: Blob) => {
    const zip = await JSZip.loadAsync(cbz);
    for (const cover of extract(zip.files)) {
        const file = await getImageBlobFromEntry(zip.files[cover]);
        if (file) {
            return { cover, file };
        }
    }
    return { cover: undefined, file: undefined };
};

const ComicBookPreview = ({
    contents,
    mimeType,
    isPublic,
}: {
    contents: Uint8Array<ArrayBuffer>[];
    mimeType: string;
    isPublic: boolean;
}) => {
    const [images, setImages] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const { viewportWidth } = useActiveBreakpoint();
    const increment = viewportWidth['<=small'] ? 1 : 2;
    useEffect(() => {
        const loadImages = async () => {
            const extractedImages = await getExtractedImagesFromCBZ(contents);
            setImages(extractedImages);
        };

        void loadImages();

        return () => {
            images.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [contents, mimeType]);

    const handleNext = () => {
        if (currentIndex + increment < images.length) {
            setCurrentIndex(currentIndex + increment);
        }
    };

    const handlePrevious = () => {
        if (currentIndex - increment >= 0) {
            setCurrentIndex(currentIndex - increment);
        }
    };

    return (
        <div className="comic-book-preview flex flex-nowrap flex-1 flex-column">
            <div className={clsx('pages flex flex-nowrap flex-1 justify-center items-center gap-4')}>
                {images[currentIndex] && (
                    <img
                        className="max-w-[45%] max-h-full object-contain shadow-md shadow-norm"
                        src={images[currentIndex]}
                        alt={`Page ${currentIndex + 1}`}
                    />
                )}
                {!viewportWidth['<=small'] && images[currentIndex + 1] && (
                    <img
                        className="max-w-[45%] max-h-full object-contain shadow-md shadow-norm"
                        src={images[currentIndex + 1]}
                        alt={`Page ${currentIndex + 2}`}
                    />
                )}
            </div>
            <div
                className={clsx(
                    'navigation flex flex-nowrap justify-center gap-4 p-8 sm:py-8',
                    isPublic ? 'pt-2 pb-2' : 'pt-4 pb-4'
                )}
            >
                <Button
                    className="min-w-custom"
                    style={{ '--min-w-custom': '150px' }}
                    color="norm"
                    shape="outline"
                    size="medium"
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                >
                    {c('Action').t`Previous page`}
                </Button>
                <Button
                    className="min-w-custom"
                    style={{ '--min-w-custom': '150px' }}
                    color="norm"
                    shape="outline"
                    size="medium"
                    onClick={handleNext}
                    disabled={currentIndex + (viewportWidth['<=small'] ? 1 : 2) >= images.length}
                >
                    {c('Action').t`Next page`}
                </Button>
            </div>
        </div>
    );
};

export default ComicBookPreview;
