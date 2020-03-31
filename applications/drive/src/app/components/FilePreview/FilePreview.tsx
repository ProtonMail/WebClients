import React from 'react';
import { isSafari } from 'proton-shared/lib/helpers/browser';
import { c } from 'ttag';
import Header from './Header';
import ImagePreview from './ImagePreview';
import PreviewLoader from './PreviewLoader';
import TextPreview from './TextPreview';
import UnsupportedPreview from './UnsupportedPreview';
import NavigationControl from './NavigationControl';
import { LinkMeta } from '../../interfaces/link';
import useKeyPress from '../../hooks/useKeyPress';
import PDFPreview from './PDFPreview';

export const isSupportedImage = (mimeType: string) =>
    [
        'image/apng',
        'image/bmp',
        'image/gif',
        'image/x-icon',
        'image/vnd.microsoft.icon',
        'image/jpeg',
        'image/png',
        'image/svg+xml',
        !isSafari() && 'image/webp'
    ]
        .filter(Boolean)
        .includes(mimeType);

export const isSupportedText = (mimeType: string) => mimeType.startsWith('text/');
export const isPDF = (mimeType: string) => mimeType === 'application/pdf' || mimeType === 'x-pdf';

// Will include more rules in the future
export const isPreviewAvailable = (mimeType: string) =>
    isSupportedImage(mimeType) || isSupportedText(mimeType) || isPDF(mimeType);

interface Props {
    loading: boolean;
    meta?: LinkMeta;
    contents?: Uint8Array[];
    onClose?: () => void;
    onSave?: () => void;
    availableLinks?: LinkMeta[];
    onOpen?: (link: LinkMeta) => void;
}

const FilePreview = ({ contents, meta, loading, availableLinks = [], onOpen, onClose, onSave }: Props) => {
    const totalAvailable = availableLinks.length;
    const linkId = meta?.LinkID;
    const currentOpenIndex = availableLinks.findIndex(({ LinkID }) => LinkID === linkId);

    const handleNext = () => currentOpenIndex < totalAvailable - 1 && onOpen?.(availableLinks[currentOpenIndex + 1]);
    const handlePrev = () => currentOpenIndex > 0 && onOpen?.(availableLinks[currentOpenIndex - 1]);

    useKeyPress(
        (e) => {
            if (e.key === 'Escape') {
                onClose?.();
            } else if (currentOpenIndex !== -1 && e.key === 'ArrowLeft') {
                handlePrev();
            } else if (currentOpenIndex !== -1 && e.key === 'ArrowRight') {
                handleNext();
            }
        },
        [currentOpenIndex]
    );

    const renderPreview = () => {
        if (!meta || !isPreviewAvailable(meta.MimeType)) {
            return <UnsupportedPreview onSave={onSave} />;
        }

        if (!contents) {
            throw new Error(c('Error').t`File has not contents to preview`);
        }

        if (isSupportedImage(meta.MimeType)) {
            return <ImagePreview contents={contents} mimeType={meta.MimeType} onSave={onSave} />;
        } else if (isSupportedText(meta.MimeType)) {
            return <TextPreview contents={contents} />;
        } else if (isPDF(meta.MimeType)) {
            return <PDFPreview contents={contents} filename={meta.Name} />;
        }
    };

    return (
        <div className="pd-file-preview">
            <Header name={meta?.Name} onClose={onClose} onSave={onSave}>
                {totalAvailable > 0 && onOpen && currentOpenIndex !== -1 && (
                    <NavigationControl
                        current={currentOpenIndex + 1}
                        total={totalAvailable}
                        onPrev={handlePrev}
                        onNext={handleNext}
                    />
                )}
            </Header>
            {loading ? <PreviewLoader /> : renderPreview()}
        </div>
    );
};

export default FilePreview;
