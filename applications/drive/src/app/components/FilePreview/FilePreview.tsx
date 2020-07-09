import React from 'react';
import { useKeyPress } from 'react-components';
import { c } from 'ttag';
import Header from './Header';
import ImagePreview from './ImagePreview';
import PreviewLoader from './PreviewLoader';
import TextPreview from './TextPreview';
import UnsupportedPreview from './UnsupportedPreview';
import NavigationControl from './NavigationControl';
import { LinkMeta } from '../../interfaces/link';
import PDFPreview from './PDFPreview';
import { isPreviewAvailable, isSupportedImage, isSupportedText, isPDF } from './helpers';

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
        if (!meta || !isPreviewAvailable(meta.MIMEType)) {
            return <UnsupportedPreview onSave={onSave} />;
        }

        if (!contents) {
            throw new Error(c('Error').t`File has no contents to preview`);
        }

        if (isSupportedImage(meta.MIMEType)) {
            return <ImagePreview contents={contents} mimeType={meta.MIMEType} onSave={onSave} />;
        }
        if (isSupportedText(meta.MIMEType)) {
            return <TextPreview contents={contents} />;
        }
        if (isPDF(meta.MIMEType)) {
            return <PDFPreview contents={contents} filename={meta.Name} />;
        }
    };

    return (
        <div className="pd-file-preview">
            <Header mimeType={meta?.MIMEType} name={meta?.Name} onClose={onClose} onSave={onSave}>
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
