import { useEffect, useState } from 'react';

import JSZip from 'jszip';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import clsx from '@proton/utils/clsx';

const extract = (files: typeof JSZip.files) =>
    Object.keys(files)
        .filter((name) => /\.(jpe?g|png)$/i.test(name)) // we can have some extra metadata files, we only care about images
        .sort(); // CBZ images are sorted by page number

const getExtractedImagesFromCBZ = async (cbz: Blob | Uint8Array<ArrayBuffer>[]) => {
    const zip = await JSZip.loadAsync(cbz instanceof Blob ? cbz : new Blob(cbz));
    return Promise.all(
        extract(zip.files).map(async (fileName) => {
            const blob = await zip.files[fileName].async('blob');
            return URL.createObjectURL(blob);
        })
    ).finally(() => {
        return [];
    });
};

export const getCBZCover = async (cbz: Blob) => {
    let file = undefined;
    const zip = await JSZip.loadAsync(cbz);
    const cover = extract(zip.files).at(0);
    if (cover) {
        file = await zip.files[cover].async('blob');
    }
    return {
        cover,
        file,
    };
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
